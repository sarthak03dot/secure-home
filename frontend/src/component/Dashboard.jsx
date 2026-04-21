import React, { useEffect, useState, useCallback } from "react";
import dangerSound from "../assets/danger.mp3";
import {
  Radar, Eye, Sun, Activity, Wind, Lightbulb,
  Terminal, AlertTriangle, Cpu, HardDrive, MousePointer2,
  Power, ShieldAlert, Zap
} from "lucide-react";

const SensorCard = ({ title, status, icon: Icon, colorClass, isActive, value, subtext, progress = 0 }) => (
  <div className={`vanta-panel vanta-panel-tactical p-6 relative overflow-hidden group transition-all duration-700 ${isActive ? `border-${colorClass}/30 bg-${colorClass}/5 ${colorClass === 'vanta-ruby' ? 'neon-glow-ruby' : colorClass === 'vanta-emerald' ? 'neon-glow-emerald' : 'neon-glow-violet'}` : 'grayscale-[0.5] opacity-70'}`}>
    {isActive && (
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 opacity-20 blur-3xl rounded-full ${colorClass === 'vanta-ruby' ? 'bg-vanta-ruby' : colorClass === 'vanta-emerald' ? 'bg-vanta-emerald' : 'bg-vanta-violet'}`} />
    )}

    <div className="flex justify-between items-start mb-6">
      <div className={`p-3 rounded-lg border transition-all duration-500 ${isActive ? `bg-${colorClass}/10 border-${colorClass}/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]` : `bg-white/5 border-white/5 text-slate-500`}`}>
        <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
      </div>
      <div className="text-right">
        <p className="text-[8px] uppercase tracking-widest text-slate-500 font-extrabold mb-1 font-mono">Telemetry // Active</p>
        <div className="flex items-center gap-2 justify-end">
          <div className={`w-1 h-1 rounded-full ${isActive ? `bg-${colorClass} animate-ping` : `bg-slate-700`}`} />
          <span className={`text-[8px] font-black tracking-widest font-mono ${isActive ? `text-white` : 'text-slate-500'}`}>
            {isActive ? 'NOMINAL' : 'IDLE'}
          </span>
        </div>
      </div>
    </div>

    <h3 className="text-xs font-black text-white mb-0.5 uppercase tracking-widest italic">{title}</h3>
    <p className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-mono leading-none">{status}</p>

    <div className="mt-8 flex items-baseline justify-between pt-4 mb-3">
      <div className="text-3xl font-black text-white font-mono tracking-tighter">
        {value}
      </div>
      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
        {subtext}
      </div>
    </div>

    <div className="activity-bar">
      <div 
        className={`activity-bar-fill ${colorClass === 'vanta-ruby' ? 'bg-vanta-ruby' : colorClass === 'vanta-emerald' ? 'bg-vanta-emerald' : 'bg-vanta-violet'}`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);

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

  // Manual Color Mapping for Tailwind 4 class compatibility
  const getMotionColor = () => data.motion ? 'vanta-ruby' : 'vanta-slate';
  const getProxColor = () => isProximityAlert ? 'vanta-ruby' : 'vanta-slate';
  // Align with firmware threshold: Higher than 1500 is DARK (Inverted LDR)
  const isLightPresent = data.light < 1500;
  const getLightColor = () => isLightPresent ? 'vanta-emerald' : 'vanta-slate';

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
        <div className={`vanta-panel p-6 sm:p-8 flex flex-col items-center justify-center min-h-[380px] sm:min-h-[420px] transition-all duration-700 ${ (data.motion || isProximityAlert) ? 'animate-danger-pulse border-vanta-ruby/50' : 'border-white/5' }`}>
          <div className="w-full flex justify-between items-center mb-10">
            <h3 className={`text-[9px] font-black uppercase tracking-[0.4em] font-mono transition-colors ${(data.motion || isProximityAlert) ? 'text-vanta-ruby' : 'text-[var(--text-muted)]'}`}>
              {(data.motion || isProximityAlert) ? 'SECURITY ALERT' : 'RADAR'}
            </h3>
            <div className={`px-2 py-0.5 rounded border text-[8px] font-bold font-mono transition-colors ${ (data.motion || isProximityAlert) ? 'border-vanta-ruby/50 text-vanta-ruby bg-vanta-ruby/10' : (data.mode !== 'off' ? 'border-vanta-violet/50 text-vanta-violet bg-vanta-violet/5' : 'border-black/5 text-[var(--text-muted)]') }`}>
              {(data.motion || isProximityAlert) ? 'ALERT' : `MOD:${data.mode.toUpperCase()}`}
            </div>
          </div>

          <div className="relative group cursor-crosshair scale-90 sm:scale-100">
            <div className={`w-48 h-48 sm:w-56 sm:h-56 border rounded-full flex items-center justify-center relative overflow-hidden bg-black/5 transition-colors ${(data.motion || isProximityAlert) ? 'border-vanta-ruby/30' : 'border-black/5'}`}>
               {/* Radial Grid Lines */}
               <div className="absolute inset-0 bg-[radial-gradient(circle,var(--vanta-violet)_1px,transparent_1px)] bg-[size:20px_20px] opacity-10" />
               
               {/* Fixed Rings */}
               <div className={`absolute w-full h-full border rounded-full transition-colors ${(data.motion || isProximityAlert) ? 'border-vanta-ruby/20' : 'border-black/5'}`} />
               <div className={`absolute w-2/3 h-2/3 border rounded-full transition-colors ${(data.motion || isProximityAlert) ? 'border-vanta-ruby/20' : 'border-black/5'}`} />
               <div className={`absolute w-1/3 h-1/3 border rounded-full transition-colors ${(data.motion || isProximityAlert) ? 'border-vanta-ruby/20' : 'border-black/5'}`} />

               <div className={`w-2 h-2 rounded-full z-10 transition-all duration-500 ${(data.motion || isProximityAlert) ? 'bg-vanta-ruby shadow-[0_0_20px_#ef4444]' : 'bg-vanta-violet shadow-[0_0_20px_#8b5cf6]'}`} />
            </div>

            {/* Scanner Sweep */}
            <div className={`absolute top-0 left-0 w-full h-full animate-[spin_4s_linear_infinite] pointer-events-none transition-opacity duration-700 ${(data.motion || isProximityAlert) ? 'opacity-60' : 'opacity-30'}`}>
              <div className={`w-1/2 h-1/2 bg-gradient-to-tr border-t rounded-tl-full origin-bottom-right transition-all duration-700 ${(data.motion || isProximityAlert) ? 'from-vanta-ruby/40 to-transparent border-vanta-ruby/50' : 'from-vanta-violet/40 to-transparent border-vanta-violet/50'}`} />
            </div>

            {/* Dynamic Entity Markers */}
            {((data.mode === 'pir' || data.mode === 'both') && data.motion) && (
              <div className="absolute top-1/4 right-[20%] w-3 h-3 bg-vanta-ruby rounded-full shadow-[0_0_20px_#ef4444] animate-ping z-20" />
            )}
            
            {((data.mode === 'ultra' || data.mode === 'both') && proxPos) && (
              <div 
                className="absolute w-3 h-3 bg-vanta-emerald rounded-full shadow-[0_0_25px_#10b981] animate-pulse z-20 transition-all duration-1000"
                style={proxPos}
              />
            )}
          </div>

          <div className="mt-10 sm:mt-12 grid grid-cols-2 gap-3 sm:gap-4 w-full">
            <div className="bg-vanta-slate p-3 sm:p-4 rounded-lg border border-black/5 text-center group transition-all hover:border-vanta-violet/30">
              <p className="text-[7px] text-[var(--text-muted)] uppercase font-bold tracking-[0.3em] mb-1 group-hover:text-vanta-violet transition-colors">LATENCY</p>
              <p className="text-xs font-mono font-black italic">± 12ms</p>
            </div>
            <div className="bg-vanta-slate p-3 sm:p-4 rounded-lg border border-black/5 text-center transition-all hover:border-vanta-emerald/30">
              <p className="text-[7px] text-[var(--text-muted)] uppercase font-bold tracking-[0.3em] mb-1">UPTIME</p>
              <p className="text-xs font-mono font-black italic">{Math.floor(data.uptime / 60)}m</p>
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="vanta-panel h-[280px] sm:h-[340px] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-black/5 flex gap-3 items-center bg-vanta-violet/5">
            <Terminal className="w-3 h-3 text-vanta-violet" />
            <span className="text-[9px] font-black text-vanta-violet uppercase tracking-[0.4em] font-mono italic whitespace-nowrap">ACTIVITY LOGS</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 font-mono text-[8px] sm:text-[9px]">
            {logs.length === 0 ? (
              <p className="text-[var(--text-muted)] italic animate-pulse">Syncing nodes...</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-3 border-l-2 border-vanta-violet/20 pl-3 py-1.5 hover:border-vanta-violet/50 transition-colors">
                  <span className="text-[var(--text-muted)] shrink-0">[{log.timestamp}]</span>
                  <span className="text-vanta-violet font-bold uppercase tracking-tighter shrink-0">{log.type}</span>
                  <span className="text-[var(--text-main)] truncate opacity-80">{log.value}</span>
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
            <div>
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-vanta-violet" />
                <h2 className="text-xl sm:text-2xl font-black italic tracking-[0.1em] uppercase">SYSTEM CONTROLS</h2>
              </div>
              <p className="text-[var(--text-muted)] text-[9px] font-mono mt-1 sm:mt-2 tracking-[0.3em] uppercase">Manual Hardware Override</p>
            </div>

            <div className="grid grid-cols-2 sm:flex bg-vanta-black/20 p-1 rounded-lg border border-black/5 w-full lg:w-auto">
              {['pir', 'ultra', 'both', 'off'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 sm:px-6 py-3 sm:py-2.5 rounded-md text-[9px] font-black uppercase tracking-[0.2em] transition-all font-mono ${data.mode === m ? 'bg-vanta-violet text-white shadow-lg shadow-vanta-violet/30' : 'text-[var(--text-muted)] hover:text-vanta-violet'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 relative z-10">
            {/* Lights */}
            <div className={`vanta-panel p-6 sm:p-8 group transition-all duration-700 border-2 ${data.relay_light ? 'border-vanta-amber/60 bg-vanta-amber/5 neon-glow-amber' : 'border-black/5 hover:border-black/10'}`}>
              <div className="flex justify-between items-center mb-8 sm:mb-10 relative">
                <div className={`p-4 rounded-lg border transition-all duration-700 ${data.relay_light ? 'bg-vanta-amber/20 border-vanta-amber/40 text-vanta-amber shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-vanta-slate border-black/5 text-[var(--text-muted)]'}`}>
                  <Lightbulb className={`w-7 h-7 sm:w-8 sm:h-8 ${data.relay_light ? 'animate-pulse' : ''}`} />
                </div>
                <div className={`flex items-center gap-3 px-4 py-2 rounded-md border font-mono transition-all ${data.relay_light ? 'bg-vanta-amber/10 border-vanta-amber/30 text-vanta-amber' : 'bg-vanta-black/20 border-black/5 text-[var(--text-muted)]'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${data.relay_light ? 'bg-vanta-amber shadow-[0_0_10px_#f59e0b]' : 'bg-slate-800'}`} />
                  <span className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase">{data.relay_light ? 'LIT' : 'IDLE'}</span>
                </div>
              </div>

              <div className="mb-8 sm:mb-10 relative">
                <h3 className="text-lg sm:text-xl font-black mb-1 uppercase italic tracking-widest">LIGHTS</h3>
                <p className="text-[var(--text-muted)] text-[9px] font-mono uppercase tracking-[0.2em]">Main Room Illumination</p>
              </div>

              <div className="grid grid-cols-2 gap-4 relative">
                <button
                  onClick={() => toggleDevice('light', data.relay_light ? 'auto' : 'on')}
                  className={`py-4 rounded-md font-black uppercase text-[10px] tracking-widest transition-all font-mono border ${data.relay_light ? 'bg-vanta-amber text-white border-vanta-amber shadow-[0_0_25px_rgba(245,158,11,0.5)]' : 'vanta-button hover:text-vanta-amber hover:border-vanta-amber/30'}`}
                >
                  {data.relay_light ? 'AUTO_MODE' : 'FORCE_ON'}
                </button>
                <button
                  onClick={() => toggleDevice('light', 'off')}
                  className={`py-4 vanta-button font-mono text-[var(--text-muted)] hover:border-vanta-ruby/30 hover:text-vanta-ruby transition-all ${!data.relay_light ? 'opacity-30 cursor-not-allowed' : ''}`}
                  disabled={!data.relay_light}
                >
                  HALT
                </button>
              </div>
            </div>

            {/* Fan */}
            <div className={`vanta-panel p-6 sm:p-8 group transition-all duration-700 border-2 ${data.relay_fan ? 'border-vanta-emerald/60 bg-vanta-emerald/5 neon-glow-emerald' : 'border-black/5 hover:border-black/10'}`}>
              <div className="flex justify-between items-center mb-8 sm:mb-10 relative">
                <div className={`p-4 rounded-lg border transition-all duration-700 ${data.relay_fan ? 'bg-vanta-emerald/20 border-vanta-emerald/40 text-vanta-emerald shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-vanta-slate border-black/5 text-[var(--text-muted)]'}`}>
                  <Wind className={`w-7 h-7 sm:w-8 sm:h-8 ${data.relay_fan ? 'animate-[spin_1.5s_linear_infinite]' : ''}`} />
                </div>
                <div className={`flex items-center gap-3 px-4 py-2 rounded-md border font-mono transition-all ${data.relay_fan ? 'bg-vanta-emerald/10 border-vanta-emerald/30 text-vanta-emerald' : 'bg-vanta-black/20 border-black/5 text-[var(--text-muted)]'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${data.relay_fan ? 'bg-vanta-emerald shadow-[0_0_10px_#10b981]' : 'bg-slate-800'}`} />
                  <span className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase">{data.relay_fan ? 'SPINNING' : 'IDLE'}</span>
                </div>
              </div>

              <div className="mb-8 sm:mb-10 relative">
                <h3 className="text-lg sm:text-xl font-black mb-1 uppercase italic tracking-widest">FAN</h3>
                <p className="text-[var(--text-muted)] text-[9px] font-mono uppercase tracking-[0.2em]">System Cooling Unit</p>
              </div>

              <div className="grid grid-cols-2 gap-4 relative">
                <button
                  onClick={() => toggleDevice('fan', data.relay_fan ? 'auto' : 'on')}
                  className={`py-4 rounded-md font-black uppercase text-[10px] tracking-widest transition-all font-mono border ${data.relay_fan ? 'bg-vanta-emerald text-white border-vanta-emerald shadow-[0_0_25px_rgba(16,185,129,0.5)]' : 'vanta-button hover:text-vanta-emerald hover:border-vanta-emerald/30'}`}
                >
                  {data.relay_fan ? 'AUTO_MODE' : 'FORCE_ON'}
                </button>
                <button
                  onClick={() => toggleDevice('fan', 'off')}
                  className={`py-4 vanta-button font-mono text-[var(--text-muted)] hover:border-vanta-ruby/30 hover:text-vanta-ruby transition-all ${!data.relay_fan ? 'opacity-30 cursor-not-allowed' : ''}`}
                  disabled={!data.relay_fan}
                >
                  HALT
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
            colorClass="vanta-violet"
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
