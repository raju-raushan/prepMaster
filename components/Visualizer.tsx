import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  volume: number; // 0 to 1 ideally, but likely small RMS values
  isActive: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ volume, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let currentRadius = 50;
    
    // Smooth the volume transition
    let smoothedVol = 0;

    const render = () => {
      // Amplify volume for visual effect
      const targetVol = Math.min(volume * 5, 1); 
      smoothedVol += (targetVol - smoothedVol) * 0.2;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Base breathing
      const time = Date.now() / 1000;
      const breathing = Math.sin(time * 2) * 5;
      
      const baseRadius = 60 + breathing;
      const dynamicRadius = baseRadius + (smoothedVol * 100);

      // Clear
      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        // Resting state
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
        ctx.fillStyle = '#94a3b8'; // Slate 400
        ctx.fill();
        animationId = requestAnimationFrame(render);
        return;
      }

      // Active Orb
      const gradient = ctx.createRadialGradient(centerX, centerY, dynamicRadius * 0.2, centerX, centerY, dynamicRadius);
      gradient.addColorStop(0, '#60a5fa'); // Blue 400
      gradient.addColorStop(0.5, '#3b82f6'); // Blue 500
      gradient.addColorStop(1, 'rgba(37, 99, 235, 0)'); // Blue 600 transparent

      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#eff6ff'; // Blue 50
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [volume, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={400} 
      className="w-full max-w-[400px] h-auto aspect-square"
    />
  );
};
