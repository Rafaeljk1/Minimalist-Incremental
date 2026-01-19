import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, Upgrade } from './types.ts';
import { UPGRADES, INITIAL_STATE, SAVE_KEY } from './constants.ts';
import Stats, { formatNumber } from './components/Stats.tsx';
import Orb from './components/Orb.tsx';
import UpgradeCard from './components/UpgradeCard.tsx';

// --- CONFIGURAÇÃO GOOGLE ---
const GOOGLE_CLIENT_ID = "715718812593-n2g27o8bg5ogcg4tt26fis5hifelp3dp.apps.googleusercontent.com";

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  type: 'google' | 'local';
}

interface LocalAccount {
  email: string;
  password: string;
  name: string;
}

interface FloatingNumber {
  id: number;
  x: number;
  y: number;
  val: number;
  rotation: number;
  driftX: number;
}

interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning';
}

// Memoized background to prevent flickering on re-renders
const Background = React.memo(() => (
  <div className="fixed inset-0 pointer-events-none z-0">
    <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] bg-blue-600/[0.03] rounded-full blur-[160px] animate-pulse" />
    <div className="absolute bottom-[0%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/[0.03] rounded-full blur-[140px]" />
  </div>
));

const App: React.FC = () => {
  // Auth States
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'core' | 'sync' | 'achievements' | 'settings' | 'log'>('core');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [clickTrigger, setClickTrigger] = useState(0);

  // Game States
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  
  const nextId = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      message,
      type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const getUserSaveKey = (userEmail: string) => `${SAVE_KEY}_${userEmail}`;

  const loadGameForUser = (userEmail: string) => {
    try {
      const saved = localStorage.getItem(getUserSaveKey(userEmail));
      if (saved) {
        setGameState(JSON.parse(saved));
        addLog("Neural connection restored. Data sync successful.", "success");
      } else {
        setGameState(INITIAL_STATE);
        addLog("New neural profile initialized.", "info");
      }
    } catch (e) {
      setGameState(INITIAL_STATE);
    }
  };

  const handleLocalRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password || !name) {
      setError("All fields are required");
      return;
    }

    const accounts: LocalAccount[] = JSON.parse(localStorage.getItem('multiclick_accounts') || '[]');
    if (accounts.find(a => a.email === email)) {
      setError("Email already registered");
      return;
    }

    const newAccount = { email, password, name };
    accounts.push(newAccount);
    localStorage.setItem('multiclick_accounts', JSON.stringify(accounts));

    const userData: GoogleUser = { 
      email, 
      name, 
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`, 
      type: 'local' 
    };
    setUser(userData);
    localStorage.setItem('multiclick_user', JSON.stringify(userData));
    loadGameForUser(email);
  };

  const handleLocalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const accounts: LocalAccount[] = JSON.parse(localStorage.getItem('multiclick_accounts') || '[]');
    const account = accounts.find(a => a.email === email && a.password === password);

    if (account) {
      const userData: GoogleUser = { 
        email: account.email, 
        name: account.name, 
        picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${account.email}`, 
        type: 'local' 
      };
      setUser(userData);
      localStorage.setItem('multiclick_user', JSON.stringify(userData));
      loadGameForUser(account.email);
    } else {
      setError("Invalid email or password");
    }
  };

  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) { return null; }
  };

  const handleCredentialResponse = (response: any) => {
    const data = decodeJwt(response.credential);
    if (data) {
      const userData: GoogleUser = {
        name: data.name,
        email: data.email,
        picture: data.picture,
        type: 'google'
      };
      setUser(userData);
      localStorage.setItem('multiclick_user', JSON.stringify(userData));
      loadGameForUser(data.email);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('multiclick_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      loadGameForUser(parsed.email);
    }

    const initGoogle = () => {
      const g = (window as any).google;
      if (g && g.accounts) {
        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: true
        });

        const btnContainer = document.getElementById('google-btn-container');
        if (btnContainer) {
          g.accounts.id.renderButton(btnContainer, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            width: 320
          });
        }
      } else {
        setTimeout(initGoogle, 100);
      }
    };

    initGoogle();
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('multiclick_user');
    const g = (window as any).google;
    if (g && g.accounts) g.accounts.id.disableAutoSelect();
    addLog("Neural connection severed.", "warning");
  };

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }, []);

  const playClickSound = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 440 + (Math.random() * 40 - 20);
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.08);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }, [getAudioContext]);

  const playUpgradeSound = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.2);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }, [getAudioContext]);

  const aps = useMemo(() => {
    return UPGRADES
      .filter((u: Upgrade) => u.type === 'auto')
      .reduce((acc: number, u: Upgrade) => acc + (gameState.upgrades[u.id] || 0) * u.power, 0);
  }, [gameState.upgrades]);

  const apc = useMemo(() => {
    return 1 + UPGRADES
      .filter((u: Upgrade) => u.type === 'click')
      .reduce((acc: number, u: Upgrade) => acc + (gameState.upgrades[u.id] || 0) * u.power, 0);
  }, [gameState.upgrades]);

  const totalUpgrades = useMemo(() => {
    return Object.values(gameState.upgrades).reduce((a: number, b: number) => a + b, 0);
  }, [gameState.upgrades]);
  
  const evolutionIntensity = Math.min(1, totalUpgrades / 300);

  // Use fixed time interval for idle gains (100ms)
  useEffect(() => {
    if (!user || aps <= 0) return;
    const interval = setInterval(() => {
      setGameState((prev: GameState) => ({
        ...prev,
        aether: prev.aether + (aps / 10),
        totalAetherEarned: prev.totalAetherEarned + (aps / 10),
      }));
    }, 100);
    return () => clearInterval(interval);
  }, [aps, user]);

  useEffect(() => {
    if (!user) return;
    const lastSave = gameState.lastSave;
    const now = Date.now();
    const diffInSeconds = (now - lastSave) / 1000;
    if (diffInSeconds > 10 && aps > 0) {
      const earned = Math.floor(diffInSeconds * aps);
      setGameState((prev) => ({
        ...prev,
        aether: prev.aether + earned,
        totalAetherEarned: prev.totalAetherEarned + earned,
        lastSave: now
      }));
      setOfflineMessage(`Neural synchronization complete. Captured ${formatNumber(earned)} Aether while detached.`);
      addLog(`Detached synchronization recovered ${formatNumber(earned)} Aether.`, "success");
      setTimeout(() => setOfflineMessage(null), 8000);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const saveInterval = setInterval(() => {
      setGameState((prev) => {
        const stateToSave = { ...prev, lastSave: Date.now() };
        localStorage.setItem(getUserSaveKey(user.email), JSON.stringify(stateToSave));
        return stateToSave;
      });
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    }, 30000);
    return () => clearInterval(saveInterval);
  }, [user]);

  const handleManualClick = useCallback((e: React.MouseEvent) => {
    playClickSound();
    setClickTrigger(t => t + 1); // Only triggers manual pulse
    setGameState((prev: GameState) => {
      const newState = {
        ...prev,
        aether: prev.aether + apc,
        totalAetherEarned: prev.totalAetherEarned + apc,
        clickCount: prev.clickCount + 1,
        lastSave: Date.now()
      };
      if (user) {
        localStorage.setItem(getUserSaveKey(user.email), JSON.stringify(newState));
      }
      return newState;
    });
    
    const id = nextId.current++;
    const newFloat = { 
      id, 
      x: e.clientX, 
      y: e.clientY, 
      val: apc, 
      rotation: (Math.random() * 30) - 15, 
      driftX: (Math.random() * 60) - 30 
    };
    setFloatingNumbers((prev) => [...prev, newFloat]);
    setTimeout(() => {
      setFloatingNumbers((prev) => prev.filter((f) => f.id !== id));
    }, 1200);
  }, [apc, playClickSound, user]);

  const handlePurchase = useCallback((upgradeId: string) => {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade || !user) return;
    const currentLevel = gameState.upgrades[upgradeId] || 0;
    const actualCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    if (gameState.aether >= actualCost) {
      playUpgradeSound();
      setGameState((prev: GameState) => {
        const newState = {
          ...prev,
          aether: prev.aether - actualCost,
          upgrades: { ...prev.upgrades, [upgradeId]: (prev.upgrades[upgradeId] || 0) + 1 },
          lastSave: Date.now()
        };
        localStorage.setItem(getUserSaveKey(user.email), JSON.stringify(newState));
        return newState;
      });
      addLog(`Optimization linked: ${upgrade.name} (Lv. ${currentLevel + 1})`, "success");
    }
  }, [gameState.aether, gameState.upgrades, playUpgradeSound, user]);

  const handleResetGame = () => {
    if (confirm("Warning: This will terminate current neural matrix and reset all progress. Proceed?")) {
      setGameState(INITIAL_STATE);
      if (user) localStorage.setItem(getUserSaveKey(user.email), JSON.stringify(INITIAL_STATE));
      addLog("System initialized. Neural matrix wiped.", "warning");
      setActiveSection('core');
      setIsSidebarOpen(false);
    }
  };

  const handleSaveGame = () => {
    if (user) {
      localStorage.setItem(getUserSaveKey(user.email), JSON.stringify({ ...gameState, lastSave: Date.now() }));
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
      addLog("Manual stream synchronization completed.", "info");
    }
  };

  const achievements = [
    { id: '1k', label: 'Fragmented Origin', desc: 'Earned 1,000 Total Aether', condition: () => gameState.totalAetherEarned >= 1000 },
    { id: '1m', label: 'Core Maturity', desc: 'Earned 1,000,000 Total Aether', condition: () => gameState.totalAetherEarned >= 1000000 },
    { id: '1b', label: 'Stellar Extraction', desc: 'Earned 1,000,000,000 Total Aether', condition: () => gameState.totalAetherEarned >= 1000000000 },
    { id: 'clicks', label: 'Neural Persistence', desc: 'Clicked the orb 1,000 times', condition: () => gameState.clickCount >= 1000 },
    { id: 'upgrades', label: 'Master Architect', desc: 'Purchased 100 optimizations', condition: () => totalUpgrades >= 100 }
  ];

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#030305] text-white relative overflow-hidden p-6">
        <Background />
        
        <div className="glass p-8 md:p-12 rounded-[40px] max-w-lg w-full flex flex-col items-center relative z-10 border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
            <span className="text-2xl">∿</span>
          </div>
          <h1 className="text-3xl font-extralight tracking-tighter mb-1 text-gradient">Multiclick OS</h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-bold mb-8">Authorization Protocol</p>
          <form className="w-full flex flex-col gap-4 mb-8" onSubmit={authMode === 'login' ? handleLocalLogin : handleLocalRegister}>
            {authMode === 'register' && (
              <input 
                type="text" placeholder="Operational Name" 
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            )}
            <input 
              type="email" placeholder="Neural Identifier (Email)" 
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password" placeholder="Security Key" 
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest text-center mt-2 animate-pulse">{error}</p>}
            <button type="submit" className="mt-2 bg-white text-black font-bold text-xs uppercase tracking-widest py-4 rounded-2xl hover:bg-zinc-200 active:scale-[0.98] transition-all">
              {authMode === 'login' ? 'Establish Connection' : 'Register Identifier'}
            </button>
          </form>
          <div className="w-full flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Or Neural Link</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div id="google-btn-container" className="mb-8 overflow-hidden rounded-full"></div>
          <div className="flex gap-4">
            <button 
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(null); }} 
              className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest font-bold transition-colors"
            >
              {authMode === 'login' ? 'Need an Identifier?' : 'Have an Account?'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'core':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Stats aether={gameState.aether} aps={aps} apc={apc} clickTrigger={clickTrigger} />
            <Orb onClick={handleManualClick} intensity={evolutionIntensity} />
          </div>
        );
      case 'sync':
        return (
          <div className="flex-1 p-8 md:p-16 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto">
             <h2 className="text-4xl font-extralight tracking-tight mb-2 text-gradient">Synchronizations</h2>
             <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-12">Matrix Energy Flow Analysis</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-8 rounded-3xl border-white/5">
                   <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-4 block">Total Potential Output</span>
                   <div className="text-3xl font-light text-blue-400">+{formatNumber(aps)} <span className="text-sm opacity-40">A/s</span></div>
                   <p className="mt-4 text-xs text-zinc-500 leading-relaxed">Ambient harvest from active drones and harvesters operating within the primary neural matrix.</p>
                </div>
                <div className="glass p-8 rounded-3xl border-white/5">
                   <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-4 block">Resonance Efficiency</span>
                   <div className="text-3xl font-light text-indigo-400">+{formatNumber(apc)} <span className="text-sm opacity-40">A/c</span></div>
                   <p className="mt-4 text-xs text-zinc-500 leading-relaxed">Direct synchronization efficiency during manual extraction protocols.</p>
                </div>
             </div>

             <div className="mt-12 glass p-8 rounded-3xl border-white/5">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-white/80">Active Streams</h3>
                <div className="space-y-4">
                   {UPGRADES.filter(u => u.type === 'auto' && (gameState.upgrades[u.id] || 0) > 0).map(u => (
                     <div key={u.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-4">
                           <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                           <span className="text-sm font-light text-zinc-300">{u.name}</span>
                        </div>
                        <span className="text-xs font-mono text-zinc-500">+{formatNumber((gameState.upgrades[u.id] || 0) * u.power)}/s</span>
                     </div>
                   ))}
                   {UPGRADES.filter(u => u.type === 'auto' && (gameState.upgrades[u.id] || 0) === 0).length === UPGRADES.filter(u => u.type === 'auto').length && (
                     <p className="text-zinc-600 text-xs text-center py-4 italic">No active automated streams detected.</p>
                   )}
                </div>
             </div>
          </div>
        );
      case 'achievements':
        return (
          <div className="flex-1 p-8 md:p-16 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto">
             <h2 className="text-4xl font-extralight tracking-tight mb-2 text-gradient">Achievements</h2>
             <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-12">Neural Milestones Reached</p>
             
             <div className="grid grid-cols-1 gap-4">
                {achievements.map(ach => (
                  <div key={ach.id} className={`glass p-6 rounded-2xl border flex items-center gap-6 transition-all ${ach.condition() ? 'border-blue-500/20 bg-blue-500/5' : 'border-white/5 opacity-50 grayscale'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${ach.condition() ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-zinc-600'}`}>
                      {ach.condition() ? '★' : '☆'}
                    </div>
                    <div>
                      <h3 className={`text-sm font-semibold mb-0.5 ${ach.condition() ? 'text-white' : 'text-zinc-500'}`}>{ach.label}</h3>
                      <p className="text-xs text-zinc-500">{ach.desc}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        );
      case 'settings':
        return (
          <div className="flex-1 p-8 md:p-16 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto">
             <h2 className="text-4xl font-extralight tracking-tight mb-2 text-gradient">Neural Settings</h2>
             <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-12">Session and Data Management</p>
             
             <div className="space-y-8">
                <section>
                   <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4">Account Metadata</h3>
                   <div className="glass p-8 rounded-3xl border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src={user.picture} className="w-12 h-12 rounded-full border border-white/10" alt="" />
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                      <button onClick={handleLogout} className="px-5 py-2 rounded-xl border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 transition-colors">Detach Profile</button>
                   </div>
                </section>

                <section>
                   <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4">Stream Synchronization</h3>
                   <div className="glass p-8 rounded-3xl border-white/5 space-y-6">
                      <div className="flex items-center justify-between">
                         <div>
                            <p className="text-sm text-zinc-300">Manual Neural Sync</p>
                            <p className="text-xs text-zinc-600">Force immediate data transmission to neural storage.</p>
                         </div>
                         <button onClick={handleSaveGame} className="px-5 py-2 rounded-xl bg-blue-500 text-black text-[10px] uppercase tracking-widest font-bold hover:bg-blue-400 transition-colors">Sync Now</button>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div className="flex items-center justify-between">
                         <div>
                            <p className="text-sm text-rose-400">Terminate Matrix</p>
                            <p className="text-xs text-zinc-600">Irreversibly delete all neural progress in current session.</p>
                         </div>
                         <button onClick={handleResetGame} className="px-5 py-2 rounded-xl border border-rose-500/20 text-rose-500 text-[10px] uppercase tracking-widest font-bold hover:bg-rose-500/5 transition-colors">Wipe Data</button>
                      </div>
                   </div>
                </section>
             </div>
          </div>
        );
      case 'log':
        return (
          <div className="flex-1 p-8 md:p-16 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden flex flex-col">
             <h2 className="text-4xl font-extralight tracking-tight mb-2 text-gradient">Network Log</h2>
             <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-12">Real-time Session Activity</p>
             
             <div className="flex-1 glass p-6 rounded-3xl border-white/5 font-mono text-[11px] overflow-y-auto space-y-2 bg-black/20">
                {logs.length === 0 ? (
                  <p className="text-zinc-700 italic">Listening for neural fluctuations...</p>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="flex gap-4 group">
                      <span className="text-zinc-700 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className={`
                        ${log.type === 'success' ? 'text-emerald-500' : ''}
                        ${log.type === 'warning' ? 'text-rose-500' : ''}
                        ${log.type === 'info' ? 'text-blue-400' : ''}
                      `}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#030305] text-zinc-100 selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] transition-opacity duration-500 animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Navigation Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-[280px] sm:w-[320px] glass z-[80] shadow-2xl transition-transform duration-500 ease-out border-r border-white/5 flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <span className="text-lg">∿</span>
              </div>
              <span className="text-lg font-extralight tracking-tighter text-white">Multiclick OS</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {[
            { id: 'core', label: 'Neural Core', icon: '◈' },
            { id: 'sync', label: 'Synchronizations', icon: 'Ξ' },
            { id: 'achievements', label: 'Achievements', icon: '★' },
            { id: 'settings', label: 'Neural Settings', icon: '⚙' },
            { id: 'log', label: 'Network Log', icon: '▤' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => {
                setActiveSection(item.id as any);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left group
                ${activeSection === item.id ? 'bg-blue-500/10 border border-blue-500/10' : 'hover:bg-white/5 border border-transparent'}
              `}
            >
              <span className={`text-lg transition-colors ${activeSection === item.id ? 'text-blue-400' : 'text-zinc-600 group-hover:text-blue-400'}`}>{item.icon}</span>
              <span className={`text-sm font-light tracking-wide transition-colors ${activeSection === item.id ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <img src={user.picture} alt="Avatar" className="w-10 h-10 rounded-full border border-white/10" />
            <div className="flex flex-col">
              <span className="text-xs text-white font-medium tracking-tight">{user.name}</span>
              <span className="text-[10px] text-zinc-500 truncate max-w-[160px]">{user.email}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-3 rounded-xl border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 text-zinc-500 hover:text-red-400 text-[10px] uppercase tracking-widest font-bold transition-all"
          >
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Hamburger Menu Icon (Top Left) */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-6 left-6 z-[60] w-12 h-12 glass rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-white/10 active:scale-95 transition-all group"
        aria-label="Open Menu"
      >
        <span className="w-5 h-0.5 bg-zinc-400 group-hover:bg-white transition-colors rounded-full" />
        <span className="w-3 h-0.5 bg-zinc-400 group-hover:bg-blue-400 transition-colors rounded-full self-start ml-3.5" />
        <span className="w-5 h-0.5 bg-zinc-400 group-hover:bg-white transition-colors rounded-full" />
      </button>

      {/* Profile Shortcut (Top Right) */}
      <div className="fixed top-6 right-6 z-[60] flex items-center glass p-1 rounded-full border-white/5 shadow-xl group cursor-pointer" onClick={() => setActiveSection('settings')}>
        <img src={user.picture} alt="Avatar" className="w-10 h-10 rounded-full border border-white/10 bg-zinc-900 group-hover:border-blue-500/50 transition-colors" />
      </div>

      <Background />

      <div className="fixed inset-0 pointer-events-none z-[100]">
        {floatingNumbers.map((f) => (
          <div key={f.id} className="floating-number text-2xl tracking-tighter" style={{ left: f.x, top: f.y, '--rotation': f.rotation.toFixed(2), '--drift-x': f.driftX.toFixed(2) } as any}>
            <span><span className="opacity-60 text-sm mr-0.5 font-light">+</span>{formatNumber(f.val)}</span>
          </div>
        ))}
      </div>

      {showSaveToast && (
        <div className="fixed bottom-6 left-6 z-[60] glass px-4 py-2 rounded-lg border border-white/5 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-500 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-400">Stream Sync</span>
        </div>
      )}

      {offlineMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 glass px-6 py-3 rounded-full border border-blue-500/20 shadow-2xl animate-in slide-in-from-top-full duration-700 w-[90%] md:w-auto text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-blue-400">{offlineMessage}</p>
        </div>
      )}

      <main className="flex-1 flex flex-col relative z-10 min-h-screen">
        {renderSection()}
      </main>

      {/* Upgrades panel is only shown when on the main Neural Core section */}
      {activeSection === 'core' && (
        <aside className="w-full md:w-[460px] glass md:border-l border-white/[0.05] flex flex-col h-[60vh] md:h-screen relative z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-500">
          <div className="p-6 md:p-10 border-b border-white/[0.03] bg-white/[0.01]">
              <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl md:text-2xl font-extralight tracking-tight text-white/90">Optimizations</h2>
                  <div className="px-3 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/10">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-black">Matrix Live</span>
                  </div>
              </div>
              <p className="text-[11px] text-zinc-500 font-bold tracking-widest uppercase opacity-70">Expand your extraction capabilities</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {UPGRADES.map((upgrade) => (
                  <UpgradeCard key={upgrade.id} upgrade={upgrade} level={gameState.upgrades[upgrade.id] || 0} currentAether={gameState.aether} onPurchase={handlePurchase} />
              ))}
          </div>
          <div className="p-6 md:p-10 border-t border-white/[0.03] bg-black/60 backdrop-blur-3xl">
              <div className="mb-6 group">
                  <div className="flex justify-between text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-4 font-black">
                      <span>Maturity Index</span>
                      <span className="text-zinc-400">{Math.min(100, (gameState.totalAetherEarned / 10000000) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-700 to-indigo-600 transition-all duration-1000" style={{ width: `${Math.min(100, (gameState.totalAetherEarned / 10000000) * 100)}%` }} />
                  </div>
              </div>
              <div className="text-[10px] text-zinc-800 font-mono font-black tracking-widest text-center">MULTICLICK.v1.0.8.HYBRID</div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default App;