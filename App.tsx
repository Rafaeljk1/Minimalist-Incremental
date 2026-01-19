
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from './types.ts';
import { UPGRADES, INITIAL_STATE, SAVE_KEY } from './constants.ts';
import Stats from './components/Stats.tsx';
import Orb from './components/Orb.tsx';
import UpgradeCard from './components/UpgradeCard.tsx';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load save state:", e);
    }
    return INITIAL_STATE;
  });

  const [floatingNumbers, setFloatingNumbers] = useState<{ id: number; x: number; y: number; val: number }[]>([]);
  const nextId = useRef(0);

  // Calculate Aether Per Second (APS)
  const aps = UPGRADES
    .filter(u => u.type === 'auto')
    .reduce((acc, u) => acc + (gameState.upgrades[u.id] || 0) * u.power, 0);

  // Calculate Aether Per Click (APC)
  const apc = 1 + UPGRADES
    .filter(u => u.type === 'click')
    .reduce((acc, u) => acc + (gameState.upgrades[u.id] || 0) * u.power, 0);

  // Game Loop (Every 100ms for smoothness)
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        const delta = aps / 10;
        return {
          ...prev,
          aether: prev.aether + delta,
          totalAetherEarned: prev.totalAetherEarned + delta,
        };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [aps]);

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...gameState, lastSave: Date.now() }));
    }, 10000);
    return () => clearInterval(interval);
  }, [gameState]);

  const handleManualClick = useCallback((e: React.MouseEvent) => {
    setGameState(prev => ({
      ...prev,
      aether: prev.aether + apc,
      totalAetherEarned: prev.totalAetherEarned + apc,
      clickCount: prev.clickCount + 1,
    }));

    // Floating number effect
    const id = nextId.current++;
    const newFloat = { id, x: e.clientX, y: e.clientY, val: apc };
    setFloatingNumbers(prev => [...prev, newFloat]);
    setTimeout(() => {
      setFloatingNumbers(prev => prev.filter(f => f.id !== id));
    }, 1000);
  }, [apc]);

  const handlePurchase = useCallback((upgradeId: string) => {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const currentLevel = gameState.upgrades[upgradeId] || 0;
    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));

    if (gameState.aether >= cost) {
      setGameState(prev => ({
        ...prev,
        aether: prev.aether - cost,
        upgrades: {
          ...prev.upgrades,
          [upgradeId]: (prev.upgrades[upgradeId] || 0) + 1,
        }
      }));
    }
  }, [gameState.aether, gameState.upgrades]);

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#050505] text-zinc-100 selection:bg-blue-500/30">
      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
        </div>

        <Stats aether={gameState.aether} aps={aps} apc={apc} />
        
        <Orb onClick={handleManualClick} />

        {/* Floating Numbers Container */}
        <div className="fixed inset-0 pointer-events-none">
          {floatingNumbers.map(f => (
            <div
              key={f.id}
              className="floating-number text-lg"
              style={{ left: f.x, top: f.y }}
            >
              +{f.val}
            </div>
          ))}
        </div>

        <div className="mt-12 text-zinc-600 text-[10px] uppercase tracking-widest font-medium text-center">
            Click the Core to resonate with the Aether stream
        </div>
      </main>

      {/* Sidebar: Upgrades Panel */}
      <aside className="w-full md:w-96 glass md:border-l border-white/5 flex flex-col p-6 overflow-y-auto h-[60vh] md:h-screen">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-lg font-medium text-white/90">Evolutions</h2>
                <p className="text-xs text-zinc-500">Enhance your collection capabilities</p>
            </div>
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            </div>
        </div>

        <div className="flex flex-col gap-3">
          {UPGRADES.map(upgrade => (
            <UpgradeCard
              key={upgrade.id}
              upgrade={upgrade}
              level={gameState.upgrades[upgrade.id] || 0}
              currentAether={gameState.aether}
              onPurchase={handlePurchase}
            />
          ))}
        </div>

        <div className="mt-auto pt-8 flex flex-col gap-4">
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
                    <span>Progress to Next Tier</span>
                    <span>{Math.min(100, (gameState.totalAetherEarned / 10000) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-500/50 transition-all duration-500" 
                        style={{ width: `${Math.min(100, (gameState.totalAetherEarned / 10000) * 100)}%` }}
                    />
                </div>
            </div>
            <div className="flex justify-center">
                 <button 
                    onClick={() => {
                        if(confirm('Are you sure you want to reset all progress?')) {
                            localStorage.removeItem(SAVE_KEY);
                            window.location.reload();
                        }
                    }}
                    className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-colors"
                >
                    Reset System
                </button>
            </div>
        </div>
      </aside>
    </div>
  );
};

export default App;
