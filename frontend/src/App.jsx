import React, { useState, useEffect } from 'react';
import Dashboard from './component/Dashboard';
import { Settings, Zap, Shield, Wifi, WifiOff, X, Activity } from 'lucide-react';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [espIp, setEspIp] = useState(() => localStorage.getItem('esp_ip') || 'http://secure-home.local');
  const [isConnected, setIsConnected] = useState(false);

  const saveIp = (newIp) => {
    let formattedIp = newIp;
    if (!formattedIp.startsWith('http')) formattedIp = `http://${formattedIp}`;
    setEspIp(formattedIp);
    localStorage.setItem('esp_ip', formattedIp);
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen selection:bg-vanta-violet/30 Selection:text-white relative overflow-hidden">
      {/* Dynamic Background Layers */}
      <div className="absolute inset-0 z-[-1]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vanta-violet/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-vanta-emerald/5 blur-[120px] animate-pulse [animation-delay:2s]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,0.01)_1.5px,transparent_1.5px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="scanline-overlay" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 transition-all duration-500">
        {/* Top Telemetry Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-12 p-5 sm:p-6 vanta-panel vanta-panel-tactical border-white/10 gap-6 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-center sm:text-left">
            <div className="relative">
              <div className="absolute -inset-1 bg-vanta-violet/30 blur-lg rounded-lg animate-pulse" />
              <div className="relative p-3 bg-vanta-slate border border-vanta-violet/40 rounded-lg">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.5px]" />
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 tracking-[0.4em] uppercase leading-none mb-1">
                  MAKE MY
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase leading-none flex items-center">
                  HOME<span className="text-vanta-violet ml-1">SAFE</span>
                </h1>
              </div>
              
              <div className="hidden lg:flex flex-col border-l border-white/10 pl-6 h-8 justify-center">
                <span className="text-[7px] font-bold text-vanta-violet/60 uppercase tracking-[0.2em] mb-0.5">System Integrity</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-3 bg-vanta-violet/40 rounded-full" />)}
                  </div>
                  <span className="text-[9px] font-bold text-white font-mono">100%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0">
            <div className={`flex-1 sm:flex-initial flex items-center justify-center gap-3 px-4 sm:px-5 py-2.5 sm:py-2 rounded-lg border transition-all duration-700 ${isConnected ? 'bg-vanta-emerald/5 border-vanta-emerald/30 neon-glow-emerald' : 'bg-vanta-ruby/5 border-vanta-ruby/30'}`}>
              <div className="relative flex items-center justify-center shrink-0">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-vanta-emerald animate-pulse' : 'bg-vanta-ruby'}`} />
                {isConnected && <div className="absolute w-4 h-4 rounded-full border border-vanta-emerald animate-pulse-ring" />}
              </div>
              <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${isConnected ? 'text-vanta-emerald' : 'text-vanta-ruby'} whitespace-nowrap`}>
                {isConnected ? 'NODE_ACTIVE' : 'LINK_TERMINATED'}
              </span>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="p-3 vanta-button group shrink-0"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-vanta-violet group-hover:rotate-90 transition-all duration-500" />
            </button>
          </div>
        </header>

        {/* Dashboard */}
        <Dashboard espIp={espIp} setIsConnected={setIsConnected} />
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-vanta-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="vanta-panel w-full max-w-md p-10 neon-glow-violet animate-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-vanta-violet" />
                <h2 className="text-xl font-black text-white italic tracking-widest">NODE_CONFIG_ENTRY</h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400 text-xs mb-8 leading-relaxed font-mono">
              Initialize connection to Secure Home unit by providing valid mDNS hostname or IPv4 address.
            </p>

            <div className="space-y-8">
              <div className="relative group">
                <label className="text-[9px] font-bold text-vanta-violet uppercase tracking-[0.3em] mb-3 block opacity-70 group-focus-within:opacity-100 transition-opacity">Access Endpoint</label>
                <input
                  type="text"
                  defaultValue={espIp}
                  onKeyDown={(e) => e.key === 'Enter' && saveIp(e.target.value)}
                  placeholder="e.g. 192.168.1.10"
                  className="w-full bg-vanta-black/60 border border-white/10 rounded-lg px-6 py-4 text-white font-mono text-xs focus:outline-none focus:border-vanta-violet/50 focus:bg-vanta-black transition-all"
                  id="ip-input"
                />
              </div>

              <button
                onClick={() => saveIp(document.getElementById('ip-input').value)}
                className="w-full py-5 bg-vanta-violet text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-lg shadow-xl shadow-vanta-violet/20 hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-vanta-violet/90"
              >
                Sync with Perimeter Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;