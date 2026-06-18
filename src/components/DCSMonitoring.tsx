import React, { useState, useEffect } from "react";
import { DCSState } from "../types";
import { Thermometer, Activity, ShieldAlert, Cpu, RefreshCw, Zap, Flame, Wind, Sliders } from "lucide-react";

interface DCSMonitoringProps {
  dcsState: DCSState;
  onRefresh: () => void;
}

export const DCSMonitoring: React.FC<DCSMonitoringProps> = ({ dcsState, onRefresh }) => {
  // Live local micro-fluctuations to provide the "alive in real time" industrial feel
  const [fluct, setFluct] = useState({
    r1Temp: 0,
    r2Temp: 0,
    pressure: 0,
    flow: 0,
    octane: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setFluct({
        r1Temp: (Math.random() - 0.5) * 0.38,
        r2Temp: (Math.random() - 0.5) * 0.28,
        pressure: (Math.random() - 0.5) * 0.04,
        flow: (Math.random() - 0.5) * 1.2,
        octane: (Math.random() - 0.5) * 0.08
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const r1FinalTemp = dcsState.r1InletTemp + fluct.r1Temp;
  const r2FinalTemp = dcsState.r2InletTemp + fluct.r2Temp;
  const livePressure = dcsState.r1Pressure + fluct.pressure;
  const liveFlow = dcsState.debitCharge + fluct.flow;
  const liveOctane = dcsState.predictedOctane + fluct.octane;

  // Color configurations based on industrial specs
  const getDCSColor = (temp: number) => {
    if (temp >= 135) return { accent: "text-red-500", rawHex: "#EF4444", bg: "bg-red-500/10", border: "border-red-500/30", badge: "CRITICAL HIGH" };
    if (temp >= 120) return { accent: "text-orange-500", rawHex: "#F97316", bg: "bg-orange-500/10", border: "border-orange-500/30", badge: "WARNING HIGH" };
    return { accent: "text-emerald-500", rawHex: "#10B981", bg: "bg-emerald-500/10", border: "border-emerald-500/30", badge: "NORMAL TEMP" };
  };

  const r1Styles = getDCSColor(r1FinalTemp);
  const r2Styles = getDCSColor(r2FinalTemp);

  return (
    <div id="dcs-monitoring-p-id" className="space-y-6">
      {/* Stylesheet inline for custom keyframes animations */}
      <style>{`
        @keyframes dcs-flow-dash {
          to {
            stroke-dashoffset: -40;
          }
        }
        @keyframes dcs-gas-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes dcs-needle-wobble {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1deg); }
        }
        .animate-dcs-flow {
          stroke-dasharray: 8 6;
          animation: dcs-flow-dash 1.8s linear infinite;
        }
        .animate-dcs-flow-fast {
          stroke-dasharray: 6 4;
          animation: dcs-flow-dash 1.0s linear infinite;
        }
        .animate-gas-pulse {
          animation: dcs-gas-pulse 3s ease-in-out infinite;
        }
        .needle-rotate {
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      {/* DCS Control Room Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#131722] border border-[#232C3A] rounded-lg p-4 gap-4">
        <div>
          <h3 className="text-sm font-display font-medium text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
            Sonatrak project Live DCS Monitor
          </h3>
          <p className="text-xs text-gray-500">Continuous telemetry feed representing active SCADA sensors & closed-loop thermal paths</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 hover:text-orange-400 border border-orange-500/20 hover:border-orange-500/40 px-4 py-2 rounded text-xs font-semibold font-mono tracking-wider transition-all self-stretch sm:self-auto justify-center"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
          RE-POLL SCADA LOOPS
        </button>
      </div>

      {/* Interactive Process Flow Diagrams & Mimics (P&ID) */}
      <div className="bg-[#0D1017] border border-[#232C3A] rounded-xl p-4 sm:p-6 overflow-hidden relative">
        <div className="absolute top-2 right-2 flex items-center gap-2 text-[9px] font-mono text-gray-600">
          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></span>
          <span>ONLINE SCADA CORE v2.8</span>
        </div>
        
        <h4 className="text-[10px] font-mono font-bold tracking-widest text-gray-500 uppercase mb-4 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-orange-500" />
          Closed Loop Isomerization Synoptic Mimic
        </h4>

        {/* SVG Reactor Flow Diagram */}
        <div className="w-full overflow-x-auto select-none no-scrollbar">
          <div className="min-w-[760px] h-[250px] relative">
            <svg viewBox="0 0 800 240" className="w-full h-full font-mono">
              {/* Context Blueprint Grid Background */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#232C3A" strokeWidth="0.5" className="opacity-30" />
                </pattern>
                <linearGradient id="furnaceGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EA580C" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#7C2D12" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="reactorGlowR1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={r1Styles.rawHex} stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1E293B" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="reactorGlowR2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={r2Styles.rawHex} stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1E293B" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* 1. PIPING PATHWAYS (Background tubes) */}
              {/* Path: Feed -> Furnace */}
              <path d="M 30,120 L 110,120" stroke="#1F2937" strokeWidth="10" strokeLinecap="round" fill="none" />
              {/* Path: Furnace -> R1 */}
              <path d="M 170,120 L 230,120 L 230,60 L 260,60" stroke="#1F2937" strokeWidth="10" strokeLinecap="round" fill="none" />
              {/* Path: R1 -> R2 */}
              <path d="M 320,180 L 320,205 L 410,205 L 410,60 L 440,60" stroke="#1F2937" strokeWidth="10" strokeLinecap="round" fill="none" />
              {/* Path: R2 -> Separator */}
              <path d="M 500,180 L 500,205 L 590,205 L 590,120 L 630,120" stroke="#1F2937" strokeWidth="10" strokeLinecap="round" fill="none" />
              {/* Path: Recycle compressor loop (Separator bottom back to furnace) */}
              <path d="M 660,160 L 660,225 L 140,225 L 140,150" stroke="#1F2937" strokeWidth="8" strokeLinecap="round" fill="none" />

              {/* 2. INNER LIQUID/GAS STREAMS (Fluid visual) */}
              <path d="M 30,120 L 110,120" stroke="#374151" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M 170,120 L 230,120 L 230,60 L 260,60" stroke="#374151" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M 320,180 L 320,205 L 410,205 L 410,60 L 440,60" stroke="#374151" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M 500,180 L 500,205 L 590,205 L 590,120 L 630,120" stroke="#374151" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M 660,160 L 660,225 L 140,225 L 140,150" stroke="#2D3748" strokeWidth="4" strokeLinecap="round" fill="none" />

              {/* 3. DYNAMIC PROCESS ANIMATED FLOW DASHES (Light indicators moving in pipes) */}
              {/* Feed flow */}
              <path d="M 30,120 L 110,120" stroke="#38BDF8" strokeWidth="2.5" fill="none" className="animate-dcs-flow" />
              {/* Reactor 1 hot fluid */}
              <path d="M 170,120 L 230,120 L 230,60 L 260,60" stroke="#F97316" strokeWidth="2.5" fill="none" className="animate-dcs-flow-fast" />
              {/* Reactor 1 to Reactor 2 transfer stream */}
              <path d="M 320,180 L 320,205 L 410,205 L 410,60 L 440,60" stroke="#EA580C" strokeWidth="2.5" fill="none" className="animate-dcs-flow" />
              {/* Reactor 2 dynamic feed stream to separator */}
              <path d="M 500,180 L 500,205 L 590,205 L 590,120 L 630,120" stroke="#F97316" strokeWidth="2.5" fill="none" className="animate-dcs-flow-fast" />
              {/* Compressor recycle gas */}
              <path d="M 660,160 L 660,225 L 140,225 L 140,150" stroke="#10B981" strokeWidth="2.0" fill="none" className="animate-dcs-flow opacity-60" />

              {/* 4. PROCESS EQUIPMENT / VESSEL ELEMENTS */}
              
              {/* FURNACE F-101 */}
              <g transform="translate(100, 80)">
                <rect width="80" height="80" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                <rect width="70" height="70" x="5" y="5" fill="url(#furnaceGlow)" rx="6" />
                {/* Fire Animation Indicator */}
                <g transform="translate(40, 48)" className="animate-gas-pulse">
                  <path d="M -12,12 Q -22,-5 0,-15 Q 22,-5 12,12 Z" fill="#FF5500" />
                  <path d="M -6,12 Q -12,2 0,-8 Q 12,2 6,12 Z" fill="#FFAA00" />
                  <circle cx="0" cy="10" r="3" fill="#FFF" />
                </g>
                <text x="40" y="24" fill="#E2E8F0" fontSize="9" fontWeight="bold" textAnchor="middle">F-101</text>
                <text x="40" y="34" fill="#94A3B8" fontSize="7" textAnchor="middle">INLET HEATER</text>
              </g>

              {/* REACTOR R-001 COLUMN */}
              <g transform="translate(260, 30)">
                <rect width="60" height="150" rx="20" fill="#111827" stroke={r1Styles.rawHex} strokeWidth="2" className="transition-all duration-1000" />
                <rect width="52" height="142" x="4" y="4" fill="url(#reactorGlowR1)" rx="16" />
                {/* Catalyst Bed Lines */}
                <line x1="8" y1="65" x2="52" y2="65" stroke="#334155" strokeWidth="5" strokeDasharray="2 2" />
                <line x1="8" y1="110" x2="52" y2="110" stroke="#334155" strokeWidth="5" strokeDasharray="2 2" />
                {/* Text readouts inside vessel */}
                <text x="30" y="28" fill="#F8FAFC" fontSize="11" fontWeight="bold" textAnchor="middle">R-001</text>
                <text x="30" y="85" fill="#E2E8F0" fontSize="10" fontWeight="bold" textAnchor="middle">{r1FinalTemp.toFixed(1)}°C</text>
                <text x="30" y="130" fill="#64748B" fontSize="7.5" textAnchor="middle">{livePressure.toFixed(2)} BAR</text>
                {/* Active heat light indicator */}
                <circle cx="30" cy="40" r="4.5" fill={r1Styles.rawHex} className="animate-pulse" />
              </g>

              {/* REACTOR R-002 COLUMN */}
              <g transform="translate(440, 30)">
                <rect width="60" height="150" rx="20" fill="#111827" stroke={r2Styles.rawHex} strokeWidth="2" className="transition-all duration-1000" />
                <rect width="52" height="142" x="4" y="4" fill="url(#reactorGlowR2)" rx="16" />
                <line x1="8" y1="65" x2="52" y2="65" stroke="#334155" strokeWidth="5" strokeDasharray="2 2" />
                <line x1="8" y1="110" x2="52" y2="110" stroke="#334155" strokeWidth="5" strokeDasharray="2 2" />
                <text x="30" y="28" fill="#F8FAFC" fontSize="11" fontWeight="bold" textAnchor="middle">R-002</text>
                <text x="30" y="85" fill="#E2E8F0" fontSize="10" fontWeight="bold" textAnchor="middle">{r2FinalTemp.toFixed(1)}°C</text>
                <text x="30" y="130" fill="#64748B" fontSize="7.5" textAnchor="middle">{(livePressure * 0.95).toFixed(2)} BAR</text>
                <circle cx="30" cy="40" r="4.5" fill={r2Styles.rawHex} className="animate-pulse" />
              </g>

              {/* WATER SEPARATOR & CONDENSER */}
              <g transform="translate(630, 85)">
                <rect width="80" height="70" rx="10" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                <ellipse cx="40" cy="18" rx="25" ry="10" fill="#0F172A" stroke="#334155" />
                <text x="40" y="44" fill="#E2E8F0" fontSize="9" fontWeight="bold" textAnchor="middle">V-102</text>
                <text x="40" y="54" fill="#94A3B8" fontSize="7" textAnchor="middle">SEPARATOR</text>
                {/* Moving droplet animation indicator to look extremely alive */}
                <path d="M 40,24 c.5,0,1,.5,1,1.5 c0,.7-.5,1.2-1,1.5 c-.5-.3-1-.8-1-1.5 C 39,24.5,39.5,24,40,24 z" fill="#38BDF8" className="animate-bounce" style={{ animationDuration: "2s" }} />
              </g>

              {/* FEED INLET ARROW LABEL */}
              <g transform="translate(10, 100)">
                <polygon points="12,12 2,17 2,7" fill="#38BDF8" className="animate-pulse" />
                <text x="15" y="8" fill="#64748B" fontSize="7" fontWeight="bold">NAPHTHA FEED</text>
              </g>

              {/* LIGHT PRODUCT GAS ARROW LABEL */}
              <g transform="translate(715, 110)">
                <polygon points="14,10 4,15 4,5" fill="#10B981" />
                <text x="14" y="32" fill="#50C878" fontSize="7" fontWeight="bold">ISOMERATE</text>
                <text x="14" y="42" fill="#10B981" fontSize="9.5" fontWeight="bold">{liveOctane.toFixed(1)} RON</text>
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Main Dual Gauges Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* REACTOR R1 INLET GAUGE */}
        <div className="bg-[#131722] border border-[#232C3A] rounded-lg p-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
          {/* Status color background band glow under indicator */}
          <div className={`absolute top-0 inset-x-0 h-1.5 ${r1Styles.accent === "text-red-500" ? "bg-red-500" : r1Styles.accent === "text-orange-500" ? "bg-orange-500" : "bg-emerald-500"}`} />

          <div className="space-y-1 w-full flex justify-between items-start">
            <div className="text-left">
              <span className="text-[10px] text-gray-500 font-mono tracking-widest block">VESSEL TAG: R-001-TI</span>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mt-0.5">Reactor R1 Inlet</h4>
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 ${r1Styles.bg} ${r1Styles.border} ${r1Styles.accent}`}>
              {r1Styles.badge}
            </span>
          </div>

          {/* Interactive Industrial Dial Graphic */}
          <div className="my-6 relative w-48 h-48 flex items-center justify-center">
            {/* SVG circle gauge */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="76" stroke="#1D2430" strokeWidth="8" fill="transparent" className="opacity-40" />
              <circle cx="96" cy="96" r="76" stroke="#EA580C" strokeWidth="8" strokeDasharray="30 200" strokeDashoffset="-70" fill="transparent" className="opacity-20" />
              <circle cx="96" cy="96" r="76" stroke="#EF4444" strokeWidth="8" strokeDasharray="40 200" strokeDashoffset="-120" fill="transparent" className="opacity-20" />
              <circle 
                cx="96" 
                cy="96" 
                r="76" 
                stroke={r1Styles.accent === "text-red-500" ? "#EF4444" : r1Styles.accent === "text-orange-500" ? "#EA580C" : "#10B981"} 
                strokeWidth="10" 
                strokeDasharray="477" 
                strokeDashoffset={477 - (477 * Math.min(1.0, r1FinalTemp / 180.0))} 
                strokeLinecap="round"
                fill="transparent" 
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            {/* Inside details text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
              <Thermometer className={`w-6 h-6 ${r1Styles.accent} animate-bounce`} style={{ animationDuration: "3s" }} />
              <span className="text-3xl font-mono font-bold text-white tracking-tighter">
                {r1FinalTemp.toFixed(1)}°C
              </span>
              <span className="text-[10px] text-gray-500 font-mono">SCALE 0 - 180°C</span>
            </div>
          </div>

          {/* Core process metrics sub bar */}
          <div className="grid grid-cols-2 gap-4 w-full bg-black/20 p-3 rounded border border-[#232C3A] text-xs font-mono">
            <div className="text-left">
              <span className="text-[10px] text-gray-500 block">R1 FLOW RATE</span>
              <span className="font-bold text-gray-300 mt-1 block">{liveFlow.toFixed(1)} m³/h</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 block">R1 PRESSURE</span>
              <span className="font-bold text-gray-300 mt-1 block">{livePressure.toFixed(2)} bar</span>
            </div>
          </div>
        </div>

        {/* REACTOR R2 INLET GAUGE */}
        <div className="bg-[#131722] border border-[#232C3A] rounded-lg p-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className={`absolute top-0 inset-x-0 h-1.5 ${r2Styles.accent === "text-red-500" ? "bg-red-500" : r2Styles.accent === "text-orange-500" ? "bg-orange-500" : "bg-emerald-500"}`} />

          <div className="space-y-1 w-full flex justify-between items-start">
            <div className="text-left">
              <span className="text-[10px] text-gray-500 font-mono tracking-widest block">VESSEL TAG: R-002-TI</span>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mt-0.5">Reactor R2 Inlet</h4>
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 ${r2Styles.bg} ${r2Styles.border} ${r2Styles.accent}`}>
              {r2Styles.badge}
            </span>
          </div>

          {/* Double Dynamic Gauge Dial */}
          <div className="my-6 relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="76" stroke="#1D2430" strokeWidth="8" fill="transparent" className="opacity-40" />
              <circle cx="96" cy="96" r="76" stroke="#EA580C" strokeWidth="8" strokeDasharray="30 200" strokeDashoffset="-70" fill="transparent" className="opacity-20" />
              <circle cx="96" cy="96" r="76" stroke="#EF4444" strokeWidth="8" strokeDasharray="40 200" strokeDashoffset="-120" fill="transparent" className="opacity-20" />
              <circle 
                cx="96" 
                cy="96" 
                r="76" 
                stroke={r2Styles.accent === "text-red-500" ? "#EF4444" : r2Styles.accent === "text-orange-500" ? "#EA580C" : "#10B981"} 
                strokeWidth="10" 
                strokeDasharray="477" 
                strokeDashoffset={477 - (477 * Math.min(1.0, r2FinalTemp / 180.0))} 
                strokeLinecap="round"
                fill="transparent" 
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
              <Thermometer className={`w-6 h-6 ${r2Styles.accent} animate-bounce`} style={{ animationDuration: "3.5s" }} />
              <span className="text-3xl font-mono font-bold text-white tracking-tighter">
                {r2FinalTemp.toFixed(1)}°C
              </span>
              <span className="text-[10px] text-gray-500 font-mono">SCALE 0 - 180°C</span>
            </div>
          </div>

          {/* Core process metrics sub bar */}
          <div className="grid grid-cols-2 gap-4 w-full bg-black/20 p-3 rounded border border-[#232C3A] text-xs font-mono">
            <div className="text-left">
              <span className="text-[10px] text-gray-500 block">R2 EXP YIELD</span>
              <span className="font-bold text-orange-500 mt-1 block">{liveOctane.toFixed(2)} RON</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 block">CATALYST BED</span>
              <span className="font-bold text-gray-300 mt-1 block">{dcsState.catalystAge} days</span>
            </div>
          </div>
        </div>

      </div>

      {/* Compliance / Safety Panel */}
      <div className="p-4 bg-black/35 border border-[#232C3A] rounded-lg flex items-start gap-4">
        <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Sonatrak project Safety & Automation Compliance</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Emergency alarms lock furnace setpoints if vessels rise above 135°C. Telemetry is evaluated dynamically by our high-fidelity predictive neural engines. Use the step-by-step Differential Evolution solver to optimize closed loop controls.
          </p>
        </div>
      </div>
    </div>
  );
};
