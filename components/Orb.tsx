import React, { useState } from 'react';

interface OrbProps {
  onClick: (event: React.MouseEvent) => void;
  intensity: number; // Normalized 0 to 1 based on game progress
}

const Orb: React.FC<OrbProps> = ({ onClick, intensity }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  // Dynamic values based on intensity
  const glowSize = 350 + (intensity * 300); // Grow glow from 350px to 650px
  const glowBlur = 60 + (intensity * 140); // More blur as power grows
  const pulseSpeed = 4 - (intensity * 3.2); // Faster pulse as it evolves (4s down to 0.8s)
  
  // Calculate dynamic colors
  const glowColor = intensity > 0.8 ? 'bg-white' : intensity > 0.4 ? 'bg-cyan-400' : 'bg-blue-600';
  // Increased range for direct scaling feel
  const glowOpacity = 0.08 + (intensity * 0.32);

  return (
    <div className="relative flex items-center justify-center">
      {/* Evolution Glow Layers */}
      <div 
        className={`absolute rounded-full transition-all duration-1000 ${glowColor} animate-pulse`} 
        style={{ 
          width: `${glowSize}px`, 
          height: `${glowSize}px`, 
          filter: `blur(${glowBlur}px)`,
          animationDuration: `${pulseSpeed}s`,
          opacity: glowOpacity
        }} 
      />
      
      <div 
        className={`absolute rounded-full blur-3xl transition-all duration-300 bg-blue-400 ${isPressed ? 'opacity-70 scale-150' : 'opacity-15 scale-100'}`}
        style={{ 
            width: `${280 + (intensity * 120)}px`, 
            height: `${280 + (intensity * 120)}px`,
            filter: `blur(${40 + intensity * 80}px)`
        }}
      />
      
      {/* The Core Orb */}
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        className={`relative z-10 w-56 h-56 sm:w-72 sm:h-72 rounded-full flex items-center justify-center transition-all duration-150 ease-out
          ${isPressed ? 'scale-[0.82] brightness-150' : 'scale-100 hover:scale-[1.03]'}
          bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800
          border border-white/10 overflow-hidden shadow-2xl
        `}
        style={{
            boxShadow: isPressed 
                ? `inset 0 0 60px rgba(255, 255, 255, ${0.2 + intensity * 0.3}), 0 0 ${40 + intensity * 100}px rgba(59, 130, 246, ${0.4 + intensity * 0.5})`
                : `0 0 ${10 + intensity * 50}px rgba(59, 130, 246, ${0.1 + intensity * 0.2})`
        }}
      >
        {/* Evolutionary Internal Textures */}
        <div 
            className="absolute inset-0 transition-colors duration-1000 pointer-events-none" 
            style={{ 
                background: `radial-gradient(circle at center, ${intensity > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(59,130,246,0.08)'} 0%, transparent 70%)`
            }}
        />
        
        {/* Shine Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.1] to-transparent pointer-events-none" />
        
        {/* Geometric Core Detail */}
        <div className={`transition-all duration-500 rounded-full flex items-center justify-center border border-white/[0.08]
            ${isPressed ? 'bg-white/[0.1] scale-110' : 'bg-white/[0.03]'}
        `}
        style={{
            width: `${80 + intensity * 60}px`,
            height: `${80 + intensity * 60}px`
        }}>
            <div className={`rounded-full transition-all duration-300 ${isPressed ? 'scale-150 blur-2xl' : 'scale-100 blur-md'}`}
                style={{
                    width: `${40 + intensity * 30}px`,
                    height: `${40 + intensity * 30}px`,
                    backgroundColor: intensity > 0.8 ? 'white' : intensity > 0.4 ? '#22d3ee' : '#3b82f6',
                    opacity: 0.25 + (intensity * 0.7)
                }}
            />
        </div>
        
        {/* Dynamic Decorative Rings */}
        <div 
            className="absolute border border-white/[0.05] rounded-full pointer-events-none transition-all duration-700" 
            style={{ inset: `${20 - intensity * 12}px`, opacity: 0.15 + intensity * 0.45 }}
        />
        <div 
            className="absolute border border-white/[0.02] rounded-full pointer-events-none transition-all duration-1000" 
            style={{ inset: `${40 - intensity * 24}px`, transform: `rotate(${intensity * 180}deg)` }}
        />

        {/* Energy Arcs (Only at high intensity) */}
        {intensity > 0.6 && (
            <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 w-1 h-full bg-white/30 blur-sm -rotate-45 animate-pulse" />
                <div className="absolute top-0 left-1/2 w-1 h-full bg-white/30 blur-sm rotate-45 animate-pulse" />
            </div>
        )}
      </button>
    </div>
  );
};

export default Orb;