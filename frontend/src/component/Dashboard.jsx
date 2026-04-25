import React, { useEffect, useState, useCallback } from "react";
import dangerSound from "../assets/danger.mp3";
import {
  Radar, Eye, Sun, Activity, Wind, Lightbulb,
  Terminal, AlertTriangle, Cpu, HardDrive, MousePointer2,
  Power, ShieldAlert, Zap
} from "lucide-react";

const SensorCard = ({ title, status, icon: Icon, colorClass, isActive, value, subtext, progress = 0 }) => {
  const modId = title.toUpperCase().replace(/\s+/g, '_') + "-" + Math.floor(Math.random() * 9000 + 1000);
  
  return (
    <div className={`vanta-panel p-6 relative overflow-hidden group transition-all duration-700 ${isActive ? `border-${colorClass}/40 ${colorClass === 'vanta-red' ? 'neon-glow-red animate-danger-pulse hatch-pattern shadow-lg' : 'neon-glow-green border-vanta-green/30 shadow-md'}` : 'opacity-30 grayscale-[1]'}`}>
      {/* Module Header */}
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-none ${isActive ? `bg-${colorClass} shadow-[0_0_8px_currentColor]` : 'bg-vanta-slate'}`} />
            <span className={`text-[8px] font-black tracking-[0.2em] font-mono ${isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
              MOD_ID::{modId}
            </span>
          </div>
          <h3 className={`text-sm font-black italic tracking-widest uppercase vanta-hover-text ${isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>{title}</h3>
        </div>
        <div className={`p-3 border-2 transition-all duration-500 ${isActive ? `bg-black/40 border-${colorClass}/40 text-${colorClass}` : 'bg-transparent border-vanta-slate text-[var(--text-muted)]'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Module Value Area */}
      <div className="relative mb-8 text-center py-6 bg-black/40 border-y border-white/5">
        <div className="absolute top-2 left-4 text-[7px] font-bold text-[var(--text-muted)] tracking-widest opacity-50">LIVE_TELEMETRY</div>
        <div className={`text-5xl font-black font-mono tracking-tighter ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`}>
          {value}
        </div>
        <div className="absolute bottom-2 right-4 text-[7px] font-bold text-[var(--text-muted)] tracking-widest opacity-50">{subtext}</div>
      </div>

      {/* Industrial LED Progress */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-[8px] font-black tracking-widest font-mono text-[var(--text-muted)]">
          <span>MODULE_CAPACITY_LOAD</span>
          <span>{progress}%</span>
        </div>
        <div className="led-progress">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className={`led-segment ${isActive && (i / 11) * 100 <= progress ? (colorClass === 'vanta-red' ? 'led-segment-active-red' : 'led-segment-active-green') : ''}`} 
            />
          ))}
        </div>
        <div className="flex justify-between items-center text-[7px] font-bold text-[var(--text-muted)] opacity-30">
          <span>LEVEL_MIN</span>
          <span>LEVEL_MAX</span>
        </div>
      </div>
      
      {/* Hardware Bolt Details */}
      <div className="absolute top-2 left-2 w-1.5 h-1.5 border border-white/10 rounded-full" />
      <div className="absolute top-2 right-2 w-1.5 h-1.5 border border-white/10 rounded-full" />
      <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border border-white/10 rounded-full" />
      <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border border-white/10 rounded-full" />
    </div>
  );
};

export default function Dashboard({ espIp, isConnected, setIsConnected }) {
  const [data, setData] = useState({
    motion: false,
    light: 0,
    distance: 0,
    relay_light: false,
    relay_fan: false,
    mode: "off",
    uptime: 0
  });

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const audioRef = React.useRef(null);

  // Initialize Alarm System
  useEffect(() => {
    audioRef.current = new Audio(dangerSound);
    audioRef.current.loop = true;
    audioRef.current.volume = 1.0;
  }, []);

  // Alarm Trigger Logic
  useEffect(() => {
    const isTriggered = (
      ((data.mode === 'pir' || data.mode === 'both') && data.motion) ||
      ((data.mode === 'ultra' || data.mode === 'both') && data.distance > 0 && data.distance < 40)
    );

    if (isTriggered && audioRef.current) {
      audioRef.current.play().catch(e => console.warn("Audio autoplay blocked - interaction required"));
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [data.motion, data.distance, data.mode]);

  const addLog = useCallback((type, value) => {
    setLogs(prev => {
      const newLog = {
        id: Math.random(),
        type,
        value,
        timestamp: new Date().toLocaleTimeString()
      };
      return [newLog, ...prev].slice(0, 15);
    });
  }, []);

  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Normalize URL
    let baseUrl = espIp.trim();
    if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}`;
    baseUrl = baseUrl.replace(/\/+$/, "");

    try {
      const res = await fetch(`${baseUrl}/data`, { signal: controller.signal });
      const json = await res.json();
      clearTimeout(timeoutId);

      // Support for both wrapped {status, data} and direct root-level data
      let newData = json.status === "success" ? json.data : 
                     (json.motion !== undefined ? json : null);

      if (newData) {
        // FIX: Invert relay_light because firmware sends it inverted
        if (newData.relay_light !== undefined) {
          newData.relay_light = !newData.relay_light;
        }

        setData(prev => {
          if (newData.motion !== prev.motion) addLog("MOTION", newData.motion ? "DETECTED" : "CLEAR");
          if (Math.abs(newData.distance - prev.distance) > 5) addLog("RANGE", `${newData.distance}cm`);
          if (newData.relay_light !== prev.relay_light) addLog("LIGHT_RELAY", newData.relay_light ? "ON" : "OFF");
          if (newData.relay_fan !== prev.relay_fan) addLog("FAN_RELAY", newData.relay_fan ? "ON" : "OFF");
          return { ...prev, ...newData };
        });

        setIsConnected(true);
        setError(null);
      } else {
        setIsConnected(false);
        setError("INVALID_FORMAT");
      }
    } catch (err) {
      if (err.name === 'AbortError') console.warn("Fetch timed out");
      setIsConnected(false);
      setError("SYNC_FAIL");
    } finally {
      setLoading(false);
    }
  }, [espIp, setIsConnected, addLog]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 1500);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleDevice = async (device, state) => {
    try {
      await fetch(`${espIp}/relay?${device}=${state}`);
      fetchData();
    } catch (err) {
      console.error("Control failed");
    }
  };

  const setMode = async (type) => {
    try {
      await fetch(`${espIp}/mode?type=${type}`);
      fetchData();
    } catch (err) {
      console.error("Mode change failed");
    }
  };

  const isProximityAlert = data.distance > 0 && data.distance < 40;

  // Manual Color Mapping for Hacker Theme
  const getMotionColor = () => data.motion ? 'vanta-red' : 'vanta-slate';
  const getProxColor = () => isProximityAlert ? 'vanta-red' : 'vanta-slate';
  const isLightPresent = data.light < 1500;
  const getLightColor = () => isLightPresent ? 'vanta-green' : 'vanta-slate';

  // Radar Proximity Mapping: Only show if within Trigger Zone (<40cm)
  const getRadarProximityPos = () => {
    if (!isProximityAlert) return null;
    const radius = 112; 
    const factor = data.distance / 200;
    return {
        bottom: `${25 + (factor * 50)}%`,
        left: `${25 + (factor * 50)}%`
    };
  };

  const proxPos = getRadarProximityPos();

  return (
    <div className="grid grid-cols-12 gap-4 sm:gap-8">
      {/* Sidebar: Radar & Logs */}
      <div className="col-span-12 xl:col-span-3 space-y-4 sm:space-y-8 order-2 xl:order-1">
            <div className={`vanta-panel p-6 sm:p-8 flex flex-col items-center justify-center min-h-[380px] sm:min-h-[420px] transition-all duration-700 relative overflow-hidden ${ (data.motion || isProximityAlert) ? 'animate-danger-pulse border-vanta-red/50 hatch-pattern shadow-[inset_0_0_50px_rgba(255,49,49,0.2)]' : 'border-[var(--panel-border)] border-4' }`}>
            {/* Tactical Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
            
            <div className="w-full flex justify-between items-center mb-10 relative z-10 border-b border-white/10 pb-4">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 border transition-colors ${ (data.motion || isProximityAlert) ? 'bg-vanta-red animate-pulse' : 'bg-vanta-green/30' }`} />
                <h3 className={`text-xs font-black uppercase tracking-[0.6em] font-mono transition-colors vanta-hover-text ${(data.motion || isProximityAlert) ? 'text-vanta-red' : 'text-vanta-green'}`}>
                  {(data.motion || isProximityAlert) ? 'ALERT::INTRUSION' : 'SCAN::PERIMETER'}
                </h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-bold text-[var(--text-muted)] font-mono">SYS_COORD::34.22</span>
                <span className="text-[9px] font-black font-mono text-vanta-green italic">LIVE_FEED</span>
              </div>
            </div>

            <div className="relative group cursor-crosshair scale-90 sm:scale-100 flex items-center justify-center">
              {/* Tactical Compass Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                 <div className="w-[120%] h-[120%] border border-vanta-green rounded-full opacity-20" />
                 <div className="w-[150%] h-[150%] border border-vanta-green rounded-full opacity-10" />
              </div>

              <div className={`w-48 h-48 sm:w-64 sm:h-64 border-4 rounded-full flex items-center justify-center relative overflow-hidden bg-black/60 transition-all duration-700 ${(data.motion || isProximityAlert) ? 'border-vanta-red shadow-[0_0_50px_rgba(255,49,49,0.3)]' : 'border-vanta-green/40'}`}>
                 {/* Degree Markers */}
                 {[...Array(12)].map((_, i) => (
                   <div key={i} className="absolute w-1 h-3 bg-vanta-green/30" style={{ transform: `rotate(${i * 30}deg) translateY(-110px)` }} />
                 ))}
                 
                 <div className={`absolute w-full h-full border-2 rounded-full transition-colors ${(data.motion || isProximityAlert) ? 'border-vanta-red/30' : 'border-vanta-green/20'}`} />
                 <div className={`absolute w-2/3 h-2/3 border rounded-full transition-colors ${(data.motion || isProximityAlert) ? 'border-vanta-red/20' : 'border-vanta-green/10'}`} />
                 <div className={`absolute w-1/3 h-1/3 border-dashed border-2 rounded-full transition-colors ${(data.motion || isProximityAlert) ? 'border-vanta-red/20' : 'border-vanta-green/10'}`} />

                 <div className={`w-4 h-4 rounded-none z-10 transition-all duration-500 ${(data.motion || isProximityAlert) ? 'bg-vanta-red shadow-[0_0_30px_#ff3131] rotate-45' : 'bg-vanta-green shadow-[0_0_30px_#00ff41]'}`} />
              </div>

              {/* Scope Crosshair */}
              <div className={`absolute w-full h-[2px] bg-vanta-green/20 ${(data.motion || isProximityAlert) ? 'bg-vanta-red/40' : ''}`} />
              <div className={`absolute h-full w-[2px] bg-vanta-green/20 ${(data.motion || isProximityAlert) ? 'bg-vanta-red/40' : ''}`} />

              <div className={`absolute top-0 left-0 w-full h-full animate-[spin_5s_linear_infinite] pointer-events-none transition-opacity duration-700 ${(data.motion || isProximityAlert) ? 'opacity-90' : 'opacity-40'}`}>
                <div className={`w-1/2 h-1/2 bg-gradient-to-tr border-t-4 rounded-tl-full origin-bottom-right transition-all duration-700 ${(data.motion || isProximityAlert) ? 'from-vanta-red/60 to-transparent border-vanta-red' : 'from-vanta-green/60 to-transparent border-vanta-green'}`} />
              </div>

              {((data.mode === 'pir' || data.mode === 'both') && data.motion) && (
                <div className="absolute top-[20%] right-[30%] w-5 h-5 bg-vanta-red animate-[ping_1.5s_infinite] z-20 font-black flex items-center justify-center text-[10px] text-white">!</div>
              )}
              
              {((data.mode === 'ultra' || data.mode === 'both') && proxPos) && (
                <div 
                  className="absolute w-5 h-5 bg-vanta-green shadow-[0_0_30px_#00ff41] animate-pulse z-20 transition-all duration-1000 border-4 border-white flex items-center justify-center text-[8px] font-black"
                  style={proxPos}
                >PROX</div>
              )}
            </div>

          <div className="mt-10 sm:mt-12 grid grid-cols-2 gap-3 sm:gap-4 w-full">
            <div className="bg-vanta-slate p-3 sm:p-4 rounded-lg border border-[var(--panel-border)] text-center group transition-all hover:border-vanta-green/30">
              <p className="text-[7px] text-[var(--text-muted)] uppercase font-bold tracking-[0.3em] mb-1 group-hover:text-vanta-green transition-colors">LATENCY</p>
              <p className="text-xs font-mono font-black italic">± 12ms</p>
            </div>
            <div className="bg-vanta-slate p-3 sm:p-4 rounded-lg border border-[var(--panel-border)] text-center transition-all hover:border-vanta-green/30">
              <p className="text-[7px] text-[var(--text-muted)] uppercase font-bold tracking-[0.3em] mb-1">UPTIME</p>
              <p className="text-xs font-mono font-black italic">{Math.floor(data.uptime / 60)}m</p>
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="vanta-panel h-[280px] sm:h-[340px] flex flex-col overflow-hidden">
          <div className="p-5 border-b border-[var(--panel-border)] border-b-4 flex justify-between items-center bg-vanta-slate">
            <div className="flex gap-4 items-center">
              <div className="w-2.5 h-2.5 bg-vanta-green shadow-[0_0_10px_#00ff41]" />
              <span className="text-xs font-black text-vanta-green uppercase tracking-[0.6em] font-mono italic whitespace-nowrap vanta-hover-text">ACCESS_LOG_STREAM</span>
            </div>
            <div className="flex gap-2">
              <div className="w-6 h-1.5 bg-vanta-green/20" />
              <div className="w-6 h-1.5 bg-vanta-green/40" />
              <div className="w-6 h-1.5 bg-vanta-green/60" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 font-mono text-[8px] sm:text-[9px]">
            {logs.length === 0 ? (
              <p className="text-[var(--text-muted)] italic animate-pulse">Syncing nodes...</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-4 border-l-2 border-vanta-green/30 pl-4 py-2 hover:bg-vanta-green/5 transition-all group">
                  <span className="text-[var(--text-muted)] shrink-0 font-bold opacity-60">[{log.timestamp}]</span>
                  <span className="text-vanta-green font-black uppercase tracking-tighter shrink-0">{log.type}</span>
                  <span className="text-[var(--text-main)] truncate opacity-90 group-hover:opacity-100 transition-opacity">:: {log.value}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="col-span-12 xl:col-span-9 space-y-4 sm:space-y-8 order-1 xl:order-2">
        {/* Interaction Hub */}
        <div className="vanta-panel p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-vanta-violet/5 blur-[120px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-vanta-green" />
                <h2 className="text-2xl sm:text-4xl font-black tracking-tighter italic vanta-hover-text block">SYSTEM CONTROLS</h2>
              </div>
              <p className="text-[var(--text-muted)] text-[9px] font-mono mt-1 sm:mt-2 tracking-[0.3em] uppercase">Manual Hardware Override</p>
            </div>

            <div className="flex bg-black border-4 border-vanta-slate p-2 w-full lg:w-auto overflow-x-auto shadow-inner">
              {['pir', 'ultra', 'both', 'off'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 sm:flex-initial px-8 py-4 text-[11px] font-black uppercase tracking-[0.3em] transition-all font-mono border-x border-white/5 relative group ${data.mode === m ? 'bg-vanta-green text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'}`}
                >
                  <div className={`absolute top-2 left-1/2 -translate-x-1/2 led-indicator ${data.mode === m ? 'led-green scale-125' : 'led-dim'}`} />
                  <span className="relative z-10">{m}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 relative z-10">
            {/* Lights */}
            <div className={`vanta-panel p-6 sm:p-8 group transition-all duration-700 border-2 ${data.relay_light ? 'border-vanta-green/60 bg-vanta-green/5 neon-glow-green' : 'border-[var(--panel-border)] hover:border-black/10'}`}>
              <div className="flex justify-between items-center mb-8 sm:mb-10 relative">
                <div className={`p-4 rounded-lg border transition-all duration-700 ${data.relay_light ? 'bg-vanta-green/20 border-vanta-green/40 text-vanta-green shadow-[0_0_20px_rgba(0,255,65,0.3)]' : 'bg-vanta-slate border-[var(--panel-border)] text-[var(--text-muted)]'}`}>
                  <Lightbulb className={`w-7 h-7 sm:w-8 sm:h-8 ${data.relay_light ? 'animate-pulse' : ''}`} />
                </div>
                <div className={`flex items-center gap-3 px-4 py-2 rounded-md border font-mono transition-all ${data.relay_light ? 'bg-vanta-green/10 border-vanta-green/30 text-vanta-green' : 'bg-vanta-black/20 border-[var(--panel-border)] text-[var(--text-muted)]'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${data.relay_light ? 'bg-vanta-green shadow-[0_0_10px_#00ff41]' : 'bg-[var(--text-muted)]/30'}`} />
                  <span className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase">{data.relay_light ? 'LIT' : 'IDLE'}</span>
                </div>
              </div>

              <div className="mb-8 sm:mb-10 relative">
                <h3 className="text-lg sm:text-xl font-black mb-1 uppercase italic tracking-widest">LIGHTS</h3>
                <p className="text-[var(--text-muted)] text-[9px] font-mono uppercase tracking-[0.2em]">Main Room Illumination</p>
              </div>

              <div className="grid grid-cols-2 gap-4 relative">
                <div className="flex gap-4">
                  <button
                    onClick={() => toggleDevice('light', 'on')}
                    className="flex-1 tactile-button group border-vanta-green/20"
                  >
                    <div className={`led-indicator ${data.relay_light ? 'led-green' : 'led-dim'}`} />
                    INIT_ON
                  </button>
                  <button
                    onClick={() => toggleDevice('light', 'off')}
                    className="flex-1 tactile-bu
                    tton group border-vanta-red/20 hatch-pattern"
                  >
                    <div className={`led-indicator ${!data.relay_light ? 'led-red' : 'led-dim'}`} />
                    HALT_SYS
                  </button>
                </div>
              </div>
            </div>

            {/* Fan */}
            <div className={`vanta-panel p-6 sm:p-8 group transition-all duration-700 border-2 ${data.relay_fan ? 'border-vanta-green/60 bg-vanta-green/5 neon-glow-green' : 'border-[var(--panel-border)] hover:border-black/10'}`}>
              <div className="flex justify-between items-center mb-8 sm:mb-10 relative">
                <div className={`p-4 rounded-lg border transition-all duration-700 ${data.relay_fan ? 'bg-vanta-green/20 border-vanta-green/40 text-vanta-green shadow-[0_0_20px_rgba(0,255,65,0.3)]' : 'bg-vanta-slate border-[var(--panel-border)] text-[var(--text-muted)]'}`}>
                  <Wind className={`w-7 h-7 sm:w-8 sm:h-8 ${data.relay_fan ? 'animate-[spin_1.5s_linear_infinite]' : ''}`} />
                </div>
                <div className={`flex items-center gap-3 px-4 py-2 rounded-md border font-mono transition-all ${data.relay_fan ? 'bg-vanta-green/10 border-vanta-green/30 text-vanta-green' : 'bg-vanta-black/20 border-[var(--panel-border)] text-[var(--text-muted)]'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${data.relay_fan ? 'bg-vanta-green shadow-[0_0_10px_#00ff41]' : 'bg-[var(--text-muted)]/30'}`} />
                  <span className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase">{data.relay_fan ? 'SPINNING' : 'IDLE'}</span>
                </div>
              </div>

              <div className="mb-8 sm:mb-10 relative">
                <h3 className="text-lg sm:text-xl font-black mb-1 uppercase italic tracking-widest">FAN</h3>
                <p className="text-[var(--text-muted)] text-[9px] font-mono uppercase tracking-[0.2em]">System Cooling Unit</p>
              </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => toggleDevice('fan', 'on')}
                    className="flex-1 tactile-button group border-vanta-green/20"
                  >
                    <div className={`led-indicator ${data.relay_fan ? 'led-green' : 'led-dim'}`} />
                    INIT_ON
                  </button>
                  <button
                    onClick={() => toggleDevice('fan', 'off')}
                    className="flex-1 tactile-button group border-vanta-red/20 hatch-pattern"
                  >
                    <div className={`led-indicator ${!data.relay_fan ? 'led-red' : 'led-dim'}`} />
                    HALT_SYS
                  </button>
                </div>
            </div>
          </div>
        </div>

        {/* Sensor Array */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SensorCard
            title="Perimeter"
            status={data.motion ? "Detecting intrusion" : "Monitoring sector"}
            icon={Radar}
            colorClass={getMotionColor()}
            isActive={data.motion}
            value={data.motion ? "ALARM" : "SECURE"}
            subtext="PIR_SR501"
            progress={data.motion ? 100 : 0}
          />
          <SensorCard
            title="Proximity"
            status={isProximityAlert ? "Contact Critical" : "Zone clear"}
            icon={Eye}
            colorClass={getProxColor()}
            isActive={isProximityAlert}
            value={`${data.distance}CM`}
            subtext="HC_SR04"
            progress={Math.max(0, (1 - data.distance / 200) * 100)}
          />
          <SensorCard
            title="Luminance"
            status="Photon Intensity"
            icon={Sun}
            colorClass={getLightColor()}
            isActive={isLightPresent}
            value={data.light}
            subtext="LDR_ANLG"
            progress={Math.min(100, (data.light / 4095) * 100)}
          />
          <SensorCard
            title="Heartbeat"
            status="System operational"
            icon={Activity}
            colorClass="vanta-green"
            isActive={!loading}
            value={isConnected ? "NOMINAL" : "SYNCING"}
            subtext="ESP32_PULSE"
            progress={100}
          />
        </div>
      </div>
    </div>
  );
}
