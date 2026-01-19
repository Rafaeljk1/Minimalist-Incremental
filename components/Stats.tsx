
import React from 'react';

interface StatsProps {
  aether: number;
  aps: number; // Aether Per Second
  apc: number; // Aether Per Click
}

const Stats: React.FC<StatsProps> = ({ aether, aps, apc }) => {
  const formatFull = (num: number) => {
    return Math.floor(num).toLocaleString('en-US');
  };

  return (
    <div className="flex flex-col items-center gap-2 mb-12">
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-medium mb-1">Total Energy</span>
        <h1 className="text-5xl sm:text-6xl font-light tracking-tight text-white text-gradient">
          {formatFull(aether)}
        </h1>
      </div>
      
      <div className="flex gap-8 mt-4">
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">Generation</span>
          <span className="text-sm text-zinc-300 font-medium">+{aps.toFixed(1)} /s</span>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">Resonance</span>
          <span className="text-sm text-zinc-300 font-medium">+{apc} /click</span>
        </div>
      </div>
    </div>
  );
};

export default Stats;
