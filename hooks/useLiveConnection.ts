import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import {
  PCM_SAMPLE_RATE,
  OUTPUT_SAMPLE_RATE,
  createPcmBlob,
  decodeAudioData,
  base64ToUint8Array,
  blobToBase64,
} from '../utils/audio-processor';
import { SessionConfig, TranscriptionItem } from '../types';

interface UseLiveConnectionProps {
  sessionConfig: SessionConfig;
  stream: MediaStream | null;
}

const API_KEY = "AIzaSyAxRTFS8GNCtAR7Jdj25bgaOUW9koHRbRs";

export function useLiveConnection({ sessionConfig, stream }: UseLiveConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  // Audio Contexts
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Connection & Session
  // Use a ref for the session promise so we can access the *current* session in callbacks without closure staleness
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const closeSessionRef = useRef<(() => void) | null>(null);

  // Video
  const videoIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Data accumulation
  const transcriptionHistoryRef = useRef<TranscriptionItem[]>([]);
  const currentInputTransRef = useRef('');
  const currentOutputTransRef = useRef('');

  // Helper to build system instruction
  const getSystemInstruction = (config: SessionConfig) => {
    const language = config.details.language || 'English';
    const langInstruction = `You must speak exclusively in ${language}.`;

    if (config.mode === 'interview') {
      return `${langInstruction} You are a strict, professional recruiter for ${config.details.company || 'a top-tier tech company'}. 
      The candidate is applying for the role of ${config.details.role || 'Software Engineer'}.
      Conduct a realistic screening interview. 
      Do NOT be a "yes-man". Challenge weak answers. 
      Observe their non-verbal cues (posture, eye contact) via the video feed and verbally note if they seem nervous or distracted, but only if it's significant.
      Keep your responses concise and conversational. Interrupt politely if they ramble.`;
    } else {
      return `${langInstruction} You are a skilled debater arguing the ${config.details.stance === 'Pro' ? 'CON' : 'PRO'} side of the topic: "${config.details.topic}".
      The user is arguing the ${config.details.stance || 'Pro'} side.
      Your goal is to dismantle their arguments with logic and facts. 
      Be respectful but firm and competitive. 
      Observe their body language via the video feed; if they look unsure, point it out as a sign of weakness in their argument.
      Keep your responses sharp and engaging.`;
    }
  };

  const connect = useCallback(async () => {
    if (!API_KEY) {
      setError('API Key is missing');
      return;
    }
    if (!stream) {
      setError('Media stream is not ready');
      return;
    }

    setIsConnecting(true);
    setError(null);
    transcriptionHistoryRef.current = [];

    try {
      // 1. Setup Audio Contexts
      // We must explicitly resume contexts to prevent them from starting in 'suspended' state
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: PCM_SAMPLE_RATE,
      });
      await inputContextRef.current.resume();

      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });
      await outputContextRef.current.resume();

      // 2. Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      
      // 3. Define Callbacks
      const callbacks = {
        onopen: () => {
          console.log('Gemini Live Connection Opened');
          setIsConnected(true);
          setIsConnecting(false);

          // Start Audio Input Streaming
          if (inputContextRef.current && stream) {
            const source = inputContextRef.current.createMediaStreamSource(stream);
            inputSourceRef.current = source;
            
            // Buffer size 4096 is a balance between latency and stability for ScriptProcessor
            const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            inputProcessorRef.current = processor;

            // CRITICAL FIX: To prevent audio graph from sleeping (stopping execution) in some browsers,
            // the node must be connected to destination. However, to prevent feedback loop (user hearing themselves),
            // we connect via a GainNode with 0 gain.
            const silenceGain = inputContextRef.current.createGain();
            silenceGain.gain.value = 0;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Calculate volume for visualizer
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(rms);

              const pcmBlob = createPcmBlob(inputData);
              
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                }).catch(err => console.error('Error sending audio:', err));
              }
            };

            source.connect(processor);
            processor.connect(silenceGain);
            silenceGain.connect(inputContextRef.current.destination);
          }

          // Start Video Streaming
          startVideoStreaming();
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle Audio Output
          const audioStr = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioStr && outputContextRef.current) {
            try {
              const ctx = outputContextRef.current;
              // Ensure audio playback timing
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioData = base64ToUint8Array(audioStr);
              const audioBuffer = await decodeAudioData(audioData, ctx, OUTPUT_SAMPLE_RATE);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              
              source.addEventListener('ended', () => {
                scheduledSourcesRef.current.delete(source);
              });
              scheduledSourcesRef.current.add(source);
            } catch (err) {
              console.error('Error processing audio output:', err);
            }
          }

          // Handle Interruption
          if (message.serverContent?.interrupted) {
             scheduledSourcesRef.current.forEach(s => s.stop());
             scheduledSourcesRef.current.clear();
             nextStartTimeRef.current = 0;
             currentOutputTransRef.current = '';
          }

          // Handle Transcription
          if (message.serverContent?.inputTranscription) {
            currentInputTransRef.current += message.serverContent.inputTranscription.text;
          }
          if (message.serverContent?.outputTranscription) {
             currentOutputTransRef.current += message.serverContent.outputTranscription.text;
          }
          if (message.serverContent?.turnComplete) {
             if (currentInputTransRef.current.trim()) {
                 transcriptionHistoryRef.current.push({ role: 'user', text: currentInputTransRef.current });
                 currentInputTransRef.current = '';
             }
             if (currentOutputTransRef.current.trim()) {
                 transcriptionHistoryRef.current.push({ role: 'model', text: currentOutputTransRef.current });
                 currentOutputTransRef.current = '';
             }
          }
        },
        onclose: () => {
          console.log('Gemini Live Connection Closed');
          setIsConnected(false);
        },
        onerror: (err: any) => {
          console.error('Gemini Live Error:', err);
          setError('Connection error occurred.');
          setIsConnected(false);
          setIsConnecting(false);
        }
      };

      // 4. Connect
      const sessionPromise = ai.live.connect({ 
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          systemInstruction: getSystemInstruction(sessionConfig),
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }, 
        callbacks 
      });
      sessionPromiseRef.current = sessionPromise;

      // Extract close method wrapper
      closeSessionRef.current = async () => {
         const session = await sessionPromise;
         // Ensure we capture any pending partial transcriptions before closing
         if (currentInputTransRef.current.trim()) {
            transcriptionHistoryRef.current.push({ role: 'user', text: currentInputTransRef.current });
         }
         if (currentOutputTransRef.current.trim()) {
             transcriptionHistoryRef.current.push({ role: 'model', text: currentOutputTransRef.current });
         }
         
         // Cleanup
         (session as any).disconnect?.();
         (session as any).close?.();
      };

    } catch (err: any) {
      console.error('Setup failed', err);
      setError(err.message || 'Failed to start session');
      setIsConnecting(false);
    }
  }, [sessionConfig, stream]);

  const startVideoStreaming = () => {
    // We need a video element source. Since we passed stream, let's create an offscreen video element
    const videoEl = document.createElement('video');
    videoEl.srcObject = stream;
    videoEl.muted = true;
    videoEl.play().catch(e => console.warn("Video play failed", e)); 

    canvasRef.current = document.createElement('canvas');
    const ctx = canvasRef.current.getContext('2d');

    // Send frame every 500ms
    videoIntervalRef.current = window.setInterval(async () => {
      if (!ctx || !canvasRef.current || !sessionPromiseRef.current) return;
      
      const width = 640;
      const height = 480;
      
      if (videoEl.videoWidth === 0) return; // Not ready

      canvasRef.current.width = width;
      canvasRef.current.height = height;
      ctx.drawImage(videoEl, 0, 0, width, height);

      try {
        canvasRef.current.toBlob(async (blob) => {
          if (blob) {
            const base64 = await blobToBase64(blob);
             sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({
                  media: { mimeType: 'image/jpeg', data: base64 }
                });
             });
          }
        }, 'image/jpeg', 0.6); // 0.6 quality to save bandwidth
      } catch (e) {
        console.error("Frame send error", e);
      }
    }, 500);
  };

  const disconnect = useCallback(() => {
    // Stop video loop
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }

    // Stop audio input
    if (inputProcessorRef.current) {
      inputProcessorRef.current.disconnect();
      inputProcessorRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }

    // Stop audio output
    scheduledSourcesRef.current.forEach(s => s.stop());
    scheduledSourcesRef.current.clear();
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }

    // Close Gemini Session
    if (closeSessionRef.current) {
      closeSessionRef.current();
      closeSessionRef.current = null;
    }

    setIsConnected(false);
    sessionPromiseRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    error,
    volume,
    transcripts: transcriptionHistoryRef.current
  };
}