import React, { useEffect, useState, useRef } from 'react';

interface StatsProps {
  aether: number;
  aps: number;
  apc: number;
  clickTrigger: number;
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

const Stats: React.FC<StatsProps> = ({ aether, aps, apc, clickTrigger }) => {
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (clickTrigger > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 80);
      return () => clearTimeout(timer);
    }
  }, [clickTrigger]);

  // Calculate a "flow intensity" for the APS indicator pulse
  const flowIntensity = Math.min(1, aps / 1000000); 
  const flowPulseDuration = Math.max(0.5, 3 - flowIntensity * 2.5); 

  return (
    <div className="flex flex-col items-center gap-2 mb-16 select-none animate-in fade-in duration-1000">
      <div className="flex flex-col items-center relative">
        <div 
          className={`absolute inset-0 bg-blue-500/10 blur-[60px] rounded-full transition-opacity duration-300 ${isPulsing ? 'opacity-100 scale-125' : 'opacity-0 scale-100'}`} 
        />
        
        <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mb-3 opacity-60 relative z-10">
          Neural Energy Reserve
        </span>
        
        <h1 
          className={`text-6xl sm:text-8xl font-extralight tracking-tighter text-white text-gradient relative z-10 transition-all duration-75 ease-out
            ${isPulsing ? 'scale-[1.015] brightness-125 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'scale-100 brightness-100'}
          `}
        >
          {formatNumber(aether)}
        </h1>
      </div>
      
      <div className="flex gap-16 mt-8 relative">
        <div className="flex flex-col items-center group relative">
          <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 mb-1 font-bold group-hover:text-blue-400/50 transition-colors">Flow Rate</span>
          <div className="relative">
             <span className="text-lg text-blue-400 font-light font-mono relative z-10">
              +{formatNumber(aps)}<span className="text-[10px] ml-1 opacity-40">/S</span>
            </span>
            <div 
              className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full animate-pulse pointer-events-none"
              style={{ animationDuration: `${flowPulseDuration}s` }}
            />
          </div>
        </div>

        <div className="w-px h-12 bg-white/5 self-center rotate-12" />

        <div className="flex flex-col items-center group">
          <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 mb-1 font-bold group-hover:text-zinc-400 transition-colors">Resonance</span>
          <span className={`text-lg transition-all duration-150 font-light font-mono ${isPulsing ? 'text-white' : 'text-zinc-300'}`}>
            +{formatNumber(apc)}<span className="text-[10px] ml-1 opacity-40">/C</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Stats;