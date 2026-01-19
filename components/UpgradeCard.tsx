
import React from 'react';
import { Upgrade } from '../types.ts';
import { formatNumber } from './Stats.tsx';

interface UpgradeCardProps {
  upgrade: Upgrade;
  level: number;
  currentAether: number;
  onPurchase: (id: string) => void;
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({ upgrade, level, currentAether, onPurchase }) => {
  const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
  const canAfford = currentAether >= cost;

  return (
    <button
      onClick={() => onPurchase(upgrade.id)}
      disabled={!canAfford}
      className={`group relative w-full text-left p-5 rounded-2xl transition-all duration-500 overflow-hidden
        ${canAfford 
          ? 'glass hover:bg-white/[0.06] cursor-pointer hover:translate-x-1' 
          : 'bg-white/[0.01] border border-white/5 opacity-40 grayscale cursor-not-allowed'}
      `}
    >
      {/* Visual background indicator of affordability */}
      {canAfford && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/30 group-hover:bg-blue-500/60 transition-colors" />
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors tracking-tight">
            {upgrade.name}
          </h3>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
            Efficiency Level {level}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold mb-0.5">Cost</div>
          <span className={`text-sm font-mono font-medium ${canAfford ? 'text-blue-400' : 'text-zinc-600'}`}>
            {formatNumber(cost)}
          </span>
        </div>
      </div>
      
      <p className="text-[11px] text-zinc-500 mb-5 leading-relaxed group-hover:text-zinc-400 transition-colors">
        {upgrade.description}
      </p>

      <div className="flex justify-between items-end border-t border-white/[0.03] pt-4">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold">Output Increase</span>
          <span className="text-xs font-mono text-zinc-300">
            +{formatNumber(upgrade.power)} <span className="text-[9px] opacity-50">{upgrade.type === 'click' ? 'APC' : 'APS'}</span>
          </span>
        </div>
        
        {canAfford && (
          <div className="text-[10px] text-blue-400/50 group-hover:text-blue-400 font-bold uppercase tracking-tighter transition-colors">
            Authorize Upgrade →
          </div>
        )}
      </div>
    </button>
  );
};

export default UpgradeCard;
