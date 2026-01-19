
import React from 'react';

interface StatsProps {
  aether: number;
  aps: number;
  apc: number;
}

export const formatNumber = (num: number): string => {
  if (num < 1000) return Math.floor(num).toString();
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  const suffixNum = Math.floor(("" + Math.floor(num)).length / 3);
  let shortValue: string | number = parseFloat((suffixNum !== 0 ? (num / Math.pow(1000, suffixNum)) : num).toPrecision(3));
  if (shortValue % 1 !== 0) {
    shortValue = shortValue.toFixed(2);
  }
  return shortValue + suffixes[suffixNum];
};

const Stats: React.FC<StatsProps> = ({ aether, aps, apc }) => {
  return (
    <div className="flex flex-col items-center gap-2 mb-16 select-none animate-in fade-in duration-1000">
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mb-3 opacity-60">
          Neural Energy Reserve
        </span>
        <h1 className="text-6xl sm:text-8xl font-extralight tracking-tighter text-white text-gradient">
          {formatNumber(aether)}
        </h1>
      </div>
      
      <div className="flex gap-16 mt-8">
        <div className="flex flex-col items-center group">
          <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 mb-1 font-bold group-hover:text-blue-400/50 transition-colors">Flow Rate</span>
          <span className="text-lg text-blue-400 font-light font-mono">
            +{formatNumber(aps)}<span className="text-[10px] ml-1 opacity-40">/S</span>
          </span>
        </div>
        <div className="w-px h-12 bg-white/5 self-center rotate-12" />
        <div className="flex flex-col items-center group">
          <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 mb-1 font-bold group-hover:text-zinc-400 transition-colors">Resonance</span>
          <span className="text-lg text-zinc-300 font-light font-mono">
            +{formatNumber(apc)}<span className="text-[10px] ml-1 opacity-40">/C</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Stats;
