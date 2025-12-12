import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SessionConfig, FeedbackData } from '../types';
import { useMediaStream } from '../hooks/useMediaStream';
import { useLiveConnection } from '../hooks/useLiveConnection';
import { Visualizer } from '../components/Visualizer';
import { FeedbackCard } from '../components/FeedbackCard';
import { GoogleGenAI, Type } from '@google/genai';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Loader2 } from 'lucide-react';

const API_KEY = "AIzaSyAxRTFS8GNCtAR7Jdj25bgaOUW9koHRbRs";

export const LiveSession: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const config = (location.state as { config: SessionConfig })?.config;
  
  const { stream, videoRef, error: mediaError } = useMediaStream();
  const { 
    connect, 
    disconnect, 
    isConnected, 
    isConnecting, 
    error: connError, 
    volume,
    transcripts 
  } = useLiveConnection({ sessionConfig: config, stream });

  const [sessionEnded, setSessionEnded] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);

  useEffect(() => {
    if (!config) {
      navigate('/');
      return;
    }
    // Auto-connect when stream is ready
    if (stream && !isConnected && !isConnecting && !sessionEnded && !connError) {
      connect();
    }
  }, [stream, config, navigate, connect, isConnected, isConnecting, sessionEnded, connError]);

  const handleEndSession = async () => {
    // 1. Disconnect Live Session
    disconnect();
    setSessionEnded(true);
    setIsGeneratingFeedback(true);

    // 2. Generate Feedback using standard Gemini Flash
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      // Construct transcript string
      const fullTranscript = transcripts.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n');
      const language = config.details.language || 'English';
      
      const prompt = `
        Analyze the following transcript of a ${config.mode} session.
        Context: ${JSON.stringify(config.details)}
        Language: ${language}
        
        TRANSCRIPT:
        ${fullTranscript}
        
        Provide a structured evaluation in JSON format with:
        - visualScore (0-100, estimate based on implicit context or default to 85 if not mentioned)
        - verbalScore (0-100 based on clarity, fillers)
        - contentScore (0-100 based on argument strength)
        - keyImprovements (Array of strings, max 3, in ${language})
        - summary (Short paragraph in ${language})
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visualScore: { type: Type.INTEGER },
              verbalScore: { type: Type.INTEGER },
              contentScore: { type: Type.INTEGER },
              keyImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING }
            }
          }
        }
      });

      const jsonText = response.text;
      if (jsonText) {
        setFeedback(JSON.parse(jsonText));
      } else {
        throw new Error("No feedback generated");
      }

    } catch (e) {
      console.error("Feedback generation failed", e);
      // Fallback data
      setFeedback({
        visualScore: 0,
        verbalScore: 0,
        contentScore: 0,
        keyImprovements: ["Could not generate specific feedback due to an error."],
        summary: "Session ended, but detailed analysis failed."
      });
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  if (!config) return null;

  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        {isGeneratingFeedback ? (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800">Generating Session Analysis...</h2>
            <p className="text-slate-500 mt-2">Our AI is reviewing your performance.</p>
          </div>
        ) : feedback ? (
          <FeedbackCard data={feedback} onRestart={() => navigate('/')} />
        ) : (
          <div className="text-center text-red-500">Something went wrong.</div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800 z-0"></div>

      {/* Main Visualizer Area */}
      <div className="z-10 flex flex-col items-center w-full max-w-4xl px-4">
        {isConnecting ? (
          <div className="text-white flex flex-col items-center animate-pulse">
            <Loader2 className="w-10 h-10 mb-4 animate-spin" />
            <p className="text-lg font-light tracking-wide">Connecting to AI Coach ({config.details.language})...</p>
          </div>
        ) : (
          <>
            <Visualizer volume={volume} isActive={isConnected} />
            <div className="mt-8 text-center">
              <h2 className="text-2xl font-light text-white mb-2">
                {config.mode === 'interview' ? 'Interviewer' : 'Debate Opponent'}
              </h2>
              <p className="text-slate-400 text-sm">
                {isConnected ? 'Listening & Observing...' : 'Disconnected'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Controls Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 bg-slate-800/80 backdrop-blur-md px-6 py-4 rounded-full border border-slate-700 flex items-center gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white">
            <Mic className="w-5 h-5" />
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white">
            <VideoIcon className="w-5 h-5" />
          </div>
        </div>
        <div className="h-8 w-px bg-slate-600"></div>
        <button 
          onClick={handleEndSession}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-medium transition flex items-center gap-2"
        >
          <PhoneOff className="w-4 h-4" /> End Session
        </button>
      </div>

      {/* Draggable User Preview (Fixed Position for simplicity in this demo) */}
      <div className="fixed top-6 right-6 z-30 w-48 aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-slate-700 transform hover:scale-105 transition-transform cursor-move">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover transform -scale-x-100" 
        />
        <div className="absolute bottom-2 left-2 flex gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      </div>

      {/* Errors */}
      {(mediaError || connError) && (
        <div className="fixed top-6 left-6 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm max-w-sm">
          {mediaError?.message || connError}
        </div>
      )}
    </div>
  );
};