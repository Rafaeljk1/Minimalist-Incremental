
import React, { useState } from 'react';

interface OrbProps {
  onClick: (event: React.MouseEvent) => void;
}

const Orb: React.FC<OrbProps> = ({ onClick }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Glow */}
      <div className={`absolute w-80 h-80 rounded-full blur-3xl transition-opacity duration-500 bg-blue-500/10 ${isPressed ? 'opacity-40' : 'opacity-20'}`} />
      
      {/* The Core Orb */}
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        className={`relative z-10 w-48 h-48 sm:w-64 sm:h-64 rounded-full flex items-center justify-center transition-all duration-150 ease-out
          ${isPressed ? 'scale-95 shadow-inner' : 'scale-100 hover:scale-[1.02] shadow-2xl shadow-blue-500/20'}
          bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-700
          border border-white/10 overflow-hidden
        `}
      >
        {/* Shine Layer */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        
        {/* Core Detail */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${isPressed ? 'bg-white/40 blur-md' : 'bg-white/20 blur-sm'}`} />
        </div>
        
        {/* Subtle Ring */}
        <div className="absolute inset-4 border border-white/5 rounded-full pointer-events-none" />
      </button>
    </div>
  );
};

export default Orb;
