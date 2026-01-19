
import React from 'react';
import { Upgrade } from '../types.ts';

interface UpgradeCardProps {
  upgrade: Upgrade;
  level: number;
  currentAether: number;
  onPurchase: (id: string) => void;
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({ upgrade, level, currentAether, onPurchase }) => {
  const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
  const canAfford = currentAether >= cost;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <button
      onClick={() => onPurchase(upgrade.id)}
      disabled={!canAfford}
      className={`group w-full text-left p-4 rounded-xl transition-all duration-300 glass
        ${canAfford ? 'hover:bg-white/10 cursor-pointer' : 'opacity-40 grayscale cursor-not-allowed'}
      `}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-medium text-white/90 group-hover:text-white transition-colors">
          {upgrade.name}
        </h3>
        <span className="text-xs font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
          LVL {level}
        </span>
      </div>
      
      <p className="text-xs text-zinc-400 mb-4 line-clamp-1 group-hover:text-zinc-300">
        {upgrade.description}
      </p>

      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Output</span>
          <span className="text-sm font-semibold text-white/70">
            +{upgrade.power} {upgrade.type === 'click' ? 'per click' : 'per sec'}
          </span>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Cost</span>
          <span className={`text-sm font-mono font-semibold ${canAfford ? 'text-blue-400' : 'text-zinc-600'}`}>
            {formatNumber(cost)}
          </span>
        </div>
      </div>
    </button>
  );
};

export default UpgradeCard;
