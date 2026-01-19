
import React from 'react';
import { Upgrade } from '../types.ts';
import { formatNumber } from './Stats.tsx';

interface UpgradeCardProps {
  upgrade: Upgrade;
  level: number;
  currentAether: number;
  onPurchase: (id: string) => void;
}

const getTierMetadata = (id: string) => {
  const meta: Record<string, { color: string; icon: string; glow: string }> = {
    resonance: { color: 'text-cyan-400', icon: '∿', glow: 'from-cyan-500/10' },
    collector: { color: 'text-blue-400', icon: '⊕', glow: 'from-blue-500/10' },
    harvester: { color: 'text-indigo-400', icon: '◈', glow: 'from-indigo-500/10' },
    refinery: { color: 'text-purple-400', icon: '▵', glow: 'from-purple-500/10' },
    conduit: { color: 'text-fuchsia-400', icon: 'Ξ', glow: 'from-fuchsia-500/10' },
    forge: { color: 'text-amber-400', icon: 'Ω', glow: 'from-amber-500/10' },
    void_engine: { color: 'text-rose-400', icon: '∅', glow: 'from-rose-500/10' },
    aether_array: { color: 'text-emerald-400', icon: '⚝', glow: 'from-emerald-500/10' },
    chronos_core: { color: 'text-white', icon: '∞', glow: 'from-white/10' },
  };
  return meta[id] || { color: 'text-zinc-400', icon: '•', glow: 'from-zinc-500/10' };
};

const UpgradeCard: React.FC<UpgradeCardProps> = ({ upgrade, level, currentAether, onPurchase }) => {
  const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
  const canAfford = currentAether >= cost;
  const meta = getTierMetadata(upgrade.id);

  // Intensity of visual effects based on level
  const intensity = Math.min(1, level / 50);
  const borderOpacity = 0.08 + (intensity * 0.12);
  const bgOpacity = 0.03 + (intensity * 0.05);

  return (
    <button
      onClick={() => onPurchase(upgrade.id)}
      disabled={!canAfford}
      className={`group relative w-full text-left p-5 rounded-2xl transition-all duration-500 overflow-hidden
        ${canAfford 
          ? 'glass hover:bg-white/[0.08] cursor-pointer hover:translate-x-1' 
          : 'bg-white/[0.01] border border-white/5 opacity-40 grayscale cursor-not-allowed'}
      `}
      style={{
        borderColor: canAfford ? `rgba(255, 255, 255, ${borderOpacity})` : undefined,
        backgroundColor: canAfford ? `rgba(255, 255, 255, ${bgOpacity})` : undefined
      }}
    >
      {/* Dynamic Background Gradient based on Level */}
      {canAfford && level > 0 && (
        <div 
          className={`absolute inset-0 bg-gradient-to-r ${meta.glow} to-transparent opacity-40 pointer-events-none transition-opacity`}
          style={{ opacity: 0.2 + (intensity * 0.4) }}
        />
      )}

      {/* Visual background indicator of affordability */}
      {canAfford && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${meta.color.replace('text-', 'bg-')}/30 group-hover:opacity-100 transition-opacity`} />
      )}

      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="flex gap-3">
          {/* Tier Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-light border border-white/5 bg-white/[0.02] ${meta.color} transition-transform group-hover:scale-110 group-active:scale-95 shadow-lg`}>
            {meta.icon}
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors tracking-tight">
              {upgrade.name}
            </h3>
            <span className={`text-[10px] uppercase tracking-widest font-bold ${level > 0 ? meta.color : 'text-zinc-500'}`}>
              Lv. {level} <span className="opacity-40 font-normal ml-1">Rank {Math.floor(level/10) + 1}</span>
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold mb-0.5">Authorize</div>
          <span className={`text-sm font-mono font-medium ${canAfford ? meta.color : 'text-zinc-600'}`}>
            {formatNumber(cost)}
          </span>
        </div>
      </div>
      
      <p className="text-[11px] text-zinc-500 mb-5 leading-relaxed group-hover:text-zinc-400 transition-colors pl-[52px] relative z-10">
        {upgrade.description}
      </p>

      <div className="flex justify-between items-end border-t border-white/[0.03] pt-4 pl-[52px] relative z-10">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold">Extraction Gain</span>
          <span className="text-xs font-mono text-zinc-300">
            +{formatNumber(upgrade.power)} <span className="text-[9px] opacity-50 uppercase">{upgrade.type === 'click' ? 'APC' : 'APS'}</span>
          </span>
        </div>
        
        {canAfford && (
          <div className={`text-[10px] ${meta.color} opacity-40 group-hover:opacity-100 font-bold uppercase tracking-tighter transition-all translate-x-1 group-hover:translate-x-0`}>
            Link →
          </div>
        )}
      </div>
    </button>
  );
};

export default UpgradeCard;
