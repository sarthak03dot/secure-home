import React, { useState, useEffect } from 'react';
import Dashboard from './component/Dashboard';
import theme from './theme';
import { 
  Sun, Moon, Shield, Settings, 
  Wifi, WifiOff, Activity, Bell
} from 'lucide-react';

function App() {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('theme') || 'dark');
  const [espIp, setEspIp] = useState(() => localStorage.getItem('espIp') || '');
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(!espIp);
  const [ipInput, setIpInput] = useState(espIp);

  useEffect(() => {
    document.documentElement.className = themeMode;
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  const saveIp = (ip) => {
    setEspIp(ip);
    localStorage.setItem('espIp', ip);
    setShowSettings(false);
  };

  return (
    <div className={`min-h-screen selection:bg-vanta-green/30 selection:text-white relative overflow-hidden transition-colors duration-500 ${themeMode}`}>
      {/* Dynamic Background Layers */}
      <div className="absolute inset-0 z-[-1]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vanta-green/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-vanta-red/5 blur-[120px] animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[radial-gradient(var(--panel-border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-4 sm:py-8 relative z-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 sm:mb-12 vanta-panel p-6 sm:px-10 sm:py-6 border-b border-white/5 relative group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-vanta-green/30 to-transparent" />
          <div className="flex items-center gap-5 sm:gap-6 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-vanta-black border border-vanta-green/30 rounded-xl flex items-center justify-center shadow-lg shadow-vanta-green/10 group-hover:border-vanta-green transition-all duration-500 relative overflow-hidden">
               <div className="absolute inset-0 bg-vanta-green/5 animate-pulse" />
               <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-vanta-green relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black tracking-tighter italic uppercase vanta-hover-text">
                  MAKE MY <span className="text-vanta-green">HOME</span><span className="text-[var(--text-main)] transition-colors">SAFE</span>
                </h1>
                <div className="hidden xs:flex h-2 w-2 rounded-full bg-vanta-green animate-pulse" />
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[8px] font-black tracking-[0.5em] text-vanta-green/40 uppercase font-mono italic">SYS_INTEGRITY_INDEX</span>
                <div className="led-progress w-24">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="led-segment led-segment-active-green" />
                  ))}
                </div>
                <span className="text-[9px] font-black font-mono text-vanta-green group-hover:animate-pulse">100.0%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end bg-black/40 p-3 border-2 border-white/5 relative">
            {/* Machined Bracket Details */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-vanta-green/30" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-vanta-green/30" />
            
            <div className={`px-5 py-3 border-2 flex items-center gap-4 transition-all duration-1000 ${isConnected ? 'bg-vanta-green/5 border-vanta-green text-vanta-green shadow-[0_0_20px_rgba(0,255,65,0.1)]' : 'bg-vanta-red/5 border-vanta-red text-vanta-red shadow-[0_0_20px_rgba(255,49,49,0.1)]'}`}>
              <div className={`w-2 h-2 ${isConnected ? 'bg-vanta-green animate-pulse shadow-[0_0_10px_#00ff41]' : 'bg-vanta-red animate-[ping_1.5s_infinite] shadow-[0_0_10px_#ff3131]'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono italic">
                {isConnected ? 'LINK_SECURED' : 'LINK_FAILURE'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-vanta-black border border-vanta-green/10 hover:border-vanta-green hover:shadow-[0_0_20px_rgba(0,255,65,0.2)] transition-all group active:scale-95"
                title="Toggle Theme"
              >
                {themeMode === 'dark' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-vanta-green group-hover:scale-110 transition-transform" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-vanta-green group-hover:scale-110 transition-transform" />}
              </button>
              
              <button 
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-vanta-black border border-vanta-green/10 hover:border-vanta-green hover:shadow-[0_0_20px_rgba(0,255,65,0.2)] transition-all group active:scale-95"
                title="Settings"
                id="settings-trigger"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-vanta-green group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard */}
        <Dashboard espIp={espIp} isConnected={isConnected} setIsConnected={setIsConnected} />
      </div>

      {/* Settings Modal - System Access Portal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="vanta-panel max-w-md w-full p-8 sm:p-12 border-vanta-green/40 relative overflow-hidden neon-glow-green">
            <div className="absolute top-0 left-0 w-full h-1 bg-vanta-green animate-pulse" />
            
            <h2 className="text-2xl sm:text-3xl font-black italic tracking-[0.2em] uppercase mb-10 flex items-center gap-5">
              <Shield className="w-8 h-8 text-vanta-green" />
              ACCESS_GRANT
            </h2>
            
            <div className="space-y-10">
              <div className="relative">
                <label className="block text-[9px] font-black text-vanta-green uppercase tracking-[0.5em] mb-4 font-mono italic">NODE_ENDPOINT_PROTOCOL</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={ipInput}
                    onChange={(e) => setIpInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveIp(ipInput)}
                    placeholder="192.168.1.XX"
                    className="w-full bg-vanta-black border-2 border-vanta-green/20 rounded-lg px-8 py-5 text-vanta-green font-mono text-sm focus:outline-none focus:border-vanta-green focus:shadow-[0_0_30px_rgba(0,255,65,0.2)] transition-all uppercase placeholder:opacity-30"
                    autoFocus
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-mono text-vanta-green opacity-40">IPv4</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="py-4 border border-vanta-red/30 text-vanta-red font-black uppercase text-[10px] tracking-widest rounded-lg hover:bg-vanta-red/10 transition-all font-mono italic"
                >
                  ABORT
                </button>
                <button 
                  onClick={() => saveIp(ipInput)}
                  className="py-4 bg-vanta-green text-black font-black uppercase text-[10px] tracking-widest rounded-lg shadow-lg shadow-vanta-green/20 hover:shadow-vanta-green/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 font-mono italic"
                >
                  ESTABLISH_LINK
                </button>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/5">
              <p className="text-[7px] text-[var(--text-muted)] font-mono uppercase tracking-[0.3em] leading-relaxed">
                Caution: Establish connection only with authorized Perimeter Shield devices. All traffic is monitored.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="scanline-overlay" />
    </div>
  );
}

export default App;