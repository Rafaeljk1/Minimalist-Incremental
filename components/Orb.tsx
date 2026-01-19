
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
      {/* Dynamic Glow Layers */}
      <div className={`absolute w-[450px] h-[450px] rounded-full blur-[100px] transition-all duration-700 bg-blue-600/5 orb-pulse`} />
      <div className={`absolute w-80 h-80 rounded-full blur-3xl transition-opacity duration-300 bg-blue-500/10 ${isPressed ? 'opacity-60 scale-110' : 'opacity-20 scale-100'}`} />
      
      {/* The Core Orb */}
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        className={`relative z-10 w-56 h-56 sm:w-72 sm:h-72 rounded-full flex items-center justify-center transition-all duration-150 ease-[cubic-bezier(0.23, 1, 0.32, 1)]
          ${isPressed ? 'scale-95 brightness-110 shadow-inner' : 'scale-100 hover:scale-[1.03] shadow-2xl shadow-blue-500/10'}
          bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800
          border border-white/10 overflow-hidden
        `}
      >
        {/* Internal Textures */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Shine Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent pointer-events-none" />
        
        {/* Geometric Core Detail */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-500 ${isPressed ? 'bg-white/40 blur-xl scale-125' : 'bg-white/10 blur-md scale-100'}`} />
        </div>
        
        {/* Decorative Ring */}
        <div className="absolute inset-6 border border-white/[0.03] rounded-full pointer-events-none" />
        <div className="absolute inset-12 border border-white/[0.01] rounded-full pointer-events-none" />
      </button>
    </div>
  );
};

export default Orb;
