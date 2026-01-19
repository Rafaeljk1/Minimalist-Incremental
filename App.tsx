import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState } from './types.ts';
import { UPGRADES, INITIAL_STATE, SAVE_KEY } from './constants.ts';
import Stats, { formatNumber } from './components/Stats.tsx';
import Orb from './components/Orb.tsx';
import UpgradeCard from './components/UpgradeCard.tsx';

interface FloatingNumber {
  id: number;
  x: number;
  y: number;
  val: number;
  rotation: number;
  driftX: number;
}

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

  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const nextId = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Helper to ensure AudioContext is ready
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }, []);

  // Softer, smoother click sound synthesis
  const playClickSound = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Smooth Sine wave for a rounded "pop"
    osc.type = 'sine';
    const baseFreq = 440 + (Math.random() * 40 - 20);
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    // Subtle low-pass filtered noise for a "tactile" but soft feel
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1200, now);

    osc.connect(noiseFilter);
    noiseFilter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }, [getAudioContext]);

  // Rewarding upgrade sound synthesis
  const playUpgradeSound = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // A two-note harmonic rising sound
    const createNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + duration);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    createNote(440, now, 0.4); // A4
    createNote(659.25, now + 0.05, 0.5); // E5
  }, [getAudioContext]);

  // Calculate Rates
  const aps = UPGRADES
    .filter(u => u.type === 'auto')
    .reduce((acc, u) => acc + (gameState.upgrades[u.id] || 0) * u.power, 0);

  const apc = 1 + UPGRADES
    .filter(u => u.type === 'click')
    .reduce((acc, u) => acc + (gameState.upgrades[u.id] || 0) * u.power, 0);

  // Dynamic Intensity based on total upgrades purchased
  const totalUpgrades = useMemo(() => 
    (Object.values(gameState.upgrades) as number[]).reduce((a: number, b: number) => a + b, 0),
    [gameState.upgrades]
  );
  
  // Normalized 0-1 value for orb evolution visuals
  const evolutionIntensity = Math.min(1, totalUpgrades / 300);

  // Initial Offline Check
  useEffect(() => {
    const lastSave = gameState.lastSave;
    const now = Date.now();
    const diffInSeconds = (now - lastSave) / 1000;
    
    if (diffInSeconds > 10 && aps > 0) {
      const earned = Math.floor(diffInSeconds * aps);
      setGameState(prev => ({
        ...prev,
        aether: prev.aether + earned,
        totalAetherEarned: prev.totalAetherEarned + earned,
        lastSave: now
      }));
      setOfflineMessage(`Welcome back. The system generated ${formatNumber(earned)} Aether while you were offline.`);
      setTimeout(() => setOfflineMessage(null), 8000);
    }
  }, []);

  // Core Game Loop (Aether Generation)
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

  // Auto-Save Interval (Every 30 seconds)
  useEffect(() => {
    const saveInterval = setInterval(() => {
      setGameState(prev => {
        const stateToSave = { ...prev, lastSave: Date.now() };
        localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
        return stateToSave;
      });
      
      // Trigger visual feedback
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    }, 30000);
    
    return () => clearInterval(saveInterval);
  }, []);

  const handleManualClick = useCallback((e: React.MouseEvent) => {
    playClickSound();

    setGameState(prev => {
      const newState = {
        ...prev,
        aether: prev.aether + apc,
        totalAetherEarned: prev.totalAetherEarned + apc,
        clickCount: prev.clickCount + 1,
        lastSave: Date.now()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(newState));
      return newState;
    });

    const id = nextId.current++;
    const x = e.clientX;
    const y = e.clientY;
    const rotation = (Math.random() * 30) - 15;
    const driftX = (Math.random() * 60) - 30;
    
    setFloatingNumbers(prev => [...prev, { id, x, y, val: apc, rotation, driftX }]);
    setTimeout(() => {
      setFloatingNumbers(prev => prev.filter(f => f.id !== id));
    }, 1200);
  }, [apc, playClickSound]);

  const handlePurchase = useCallback((upgradeId: string) => {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const currentLevel = gameState.upgrades[upgradeId] || 0;
    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));

    if (gameState.aether >= cost) {
      // Play upgrade sound
      playUpgradeSound();

      setGameState(prev => {
        const newState = {
          ...prev,
          aether: prev.aether - cost,
          upgrades: {
            ...prev.upgrades,
            [upgradeId]: (prev.upgrades[upgradeId] || 0) + 1,
          },
          lastSave: Date.now()
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(newState));
        return newState;
      });
    }
  }, [gameState.aether, gameState.upgrades, playUpgradeSound]);

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#030305] text-zinc-100 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] bg-blue-600/[0.03] rounded-full blur-[160px] animate-pulse" />
          <div className="absolute bottom-[0%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/[0.03] rounded-full blur-[140px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
      </div>

      {/* Floating Particle Container - Global & High Z-Index */}
      <div className="fixed inset-0 pointer-events-none z-[100]">
        {floatingNumbers.map(f => (
          <div
            key={f.id}
            className="floating-number text-2xl tracking-tighter"
            style={{ 
              left: f.x, 
              top: f.y,
              '--rotation': f.rotation.toFixed(2),
              '--drift-x': f.driftX.toFixed(2)
            } as any}
          >
            <span>
              <span className="opacity-60 text-sm mr-0.5 font-light">+</span>{formatNumber(f.val)}
            </span>
          </div>
        ))}
      </div>

      {/* Auto-Save Toast */}
      {showSaveToast && (
        <div className="fixed bottom-6 left-6 z-[60] glass px-4 py-2 rounded-lg border border-white/5 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-500 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-400">Sync Complete</span>
        </div>
      )}

      {/* Notification Toast (Offline Gains) */}
      {offlineMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 glass px-6 py-3 rounded-full border border-blue-500/20 shadow-2xl animate-in slide-in-from-top-full duration-700 w-[90%] md:w-auto text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-blue-400">
            {offlineMessage}
          </p>
        </div>
      )}

      {/* Main Interaction Hub */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 min-h-[60vh] md:min-h-screen">
        <Stats aether={gameState.aether} aps={aps} apc={apc} />
        
        <Orb onClick={handleManualClick} intensity={evolutionIntensity} />

        <div className="mt-12 md:mt-20 flex flex-col items-center gap-3 opacity-30 group cursor-help">
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold transition-all group-hover:tracking-[0.6em]">Aether Stream Sync</span>
            <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 h-1.5 rounded-full bg-blue-400/50 animate-pulse" 
                      style={{ animationDelay: `${i * 0.15}s` }} 
                    />
                ))}
            </div>
        </div>
      </main>

      {/* Sidebar: Optimization Interface */}
      <aside className="w-full md:w-[460px] glass md:border-l border-white/[0.05] flex flex-col h-[60vh] md:h-screen relative z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="p-6 md:p-10 border-b border-white/[0.03] bg-white/[0.01]">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl md:text-2xl font-extralight tracking-tight text-white/90">Optimization</h2>
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/10">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-black">Link Active</span>
                </div>
            </div>
            <p className="text-[11px] text-zinc-500 font-bold tracking-widest uppercase opacity-70">Enhance the energy extraction matrix</p>
        </div>

        <div className="flex-1 relative min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth touch-pan-y" style={{ touchAction: 'pan-y' }}>
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
            
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10 opacity-60 md:opacity-40" />
        </div>

        <div className="p-6 md:p-10 border-t border-white/[0.03] bg-black/60 backdrop-blur-3xl">
            <div className="mb-6 md:mb-8 group">
                <div className="flex justify-between text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-4 font-black group-hover:text-zinc-400 transition-colors">
                    <span>System Maturity Index</span>
                    <span className="text-zinc-400">{Math.min(100, (gameState.totalAetherEarned / 10000000) * 100).toFixed(2)}%</span>
                </div>
                <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-600 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                        style={{ width: `${Math.min(100, (gameState.totalAetherEarned / 10000000) * 100)}%` }}
                    />
                </div>
            </div>
            
            <div className="flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
                 <button 
                    onClick={() => {
                        if(confirm('TERMINATION PROTOCOL: This will permanently wipe all neural links and reset the Aether pool. Proceed?')) {
                            localStorage.removeItem(SAVE_KEY);
                            window.location.reload();
                        }
                    }}
                    className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-zinc-600 hover:text-red-500 transition-all duration-300 font-black"
                >
                    Reset Connection
                </button>
                <div className="text-[10px] text-zinc-800 font-mono font-black tracking-widest">
                    AETHER.v1.0.8.OS
                </div>
            </div>
        </div>
      </aside>
    </div>
  );
};

export default App;