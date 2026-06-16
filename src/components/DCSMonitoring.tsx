import React from "react";
import { DCSState } from "../types";
import { Thermometer, Activity, ShieldAlert, Cpu } from "lucide-react";

interface DCSMonitoringProps {
  dcsState: DCSState;
  onRefresh: () => void;
}

export const DCSMonitoring: React.FC<DCSMonitoringProps> = ({ dcsState, onRefresh }) => {
  // Color configuration based on industrial ranges
  const getDCSColor = (temp: number) => {
    if (temp >= 135) return { accent: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", badge: "CRITICAL HIGH" };
    if (temp >= 120) return { accent: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", badge: "WARNING HIGH" };
    return { accent: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", badge: "NORMAL STATE" };
  };

  const r1Styles = getDCSColor(dcsState.r1InletTemp);
  const r2Styles = getDCSColor(dcsState.r2InletTemp);

  return (
    <div id="dcs-monitoring-simplified" className="space-y-6">
      {/* DCS Control Room Header */}
      <div className="flex justify-between items-center bg-[#151921] border border-[#2D333D] rounded-lg p-4">
        <div>
          <h3 className="text-sm font-display font-medium text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
            SONATRACH Live DCS Monitor
          </h3>
          <p className="text-xs text-gray-500">Continuous telemetry feed representing temperature sensors of main reactors</p>
        </div>
        <button
          onClick={onRefresh}
          className="bg-[#21262D] border border-[#2D333D] text-gray-300 hover:text-white px-3 py-1.5 rounded text-xs font-semibold font-mono tracking-wider transition-all"
        >
          RE-POLL SCADA
        </button>
      </div>

      {/* Main Dual Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* REACTOR R1 INLET */}
        <div className="bg-[#151921] border border-[#2D333D] rounded-lg p-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
          {/* Status color background band glow under indicator */}
          <div className={`absolute top-0 inset-x-0 h-1.5 ${r1Styles.accent === "text-red-500" ? "bg-red-500" : r1Styles.accent === "text-orange-500" ? "bg-orange-500" : "bg-emerald-500"}`} />

          <div className="space-y-1 w-full flex justify-between items-start">
            <div className="text-left">
              <span className="text-[10px] text-gray-500 font-mono tracking-widest block">VESSEL ID: R-001</span>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mt-0.5">Reactor R1 Inlet Temp</h4>
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 ${r1Styles.bg} ${r1Styles.border} ${r1Styles.accent}`}>
              {r1Styles.badge}
            </span>
          </div>

          {/* Interactive Industrial Dial Graphic */}
          <div className="my-6 relative w-48 h-48 flex items-center justify-center">
            {/* SVG circle gauge */}
            <svg className="w-full h-full transform -rotate-90">
              {/* Outer dial guide */}
              <circle cx="96" cy="96" r="76" stroke="#1D2430" strokeWidth="8" fill="transparent" className="opacity-40" />
              {/* Segmented limit lines */}
              {/* Warning zone curve */}
              <circle cx="96" cy="96" r="76" stroke="#F47A20" strokeWidth="8" strokeDasharray="30 200" strokeDashoffset="-70" fill="transparent" className="opacity-30" />
              {/* Critical zone curve */}
              <circle cx="96" cy="96" r="76" stroke="#EF4444" strokeWidth="8" strokeDasharray="40 200" strokeDashoffset="-120" fill="transparent" className="opacity-30" />
              {/* Active value value arc, representing current temperature proportional to 180C max scale */}
              <circle 
                cx="96" 
                cy="96" 
                r="76" 
                stroke={r1Styles.accent === "text-red-500" ? "#EF4444" : r1Styles.accent === "text-orange-500" ? "#F47A20" : "#10B981"} 
                strokeWidth="10" 
                strokeDasharray="477" 
                strokeDashoffset={477 - (477 * Math.min(1.0, dcsState.r1InletTemp / 180.0))} 
                strokeLinecap="round"
                fill="transparent" 
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            {/* Inside details text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
              <Thermometer className={`w-6 h-6 ${r1Styles.accent}`} />
              <span className="text-3xl font-mono font-bold text-white tracking-tighter">
                {dcsState.r1InletTemp.toFixed(1)}°C
              </span>
              <span className="text-[10px] text-gray-500 font-mono">SCALE 0 - 180°C</span>
            </div>
          </div>

          {/* Core process metrics sub bar */}
          <div className="grid grid-cols-2 gap-4 w-full bg-black/20 p-3 rounded border border-[#2D333D] text-xs font-mono">
            <div className="text-left">
              <span className="text-[10px] text-gray-500 block">R1 FLOW RATE</span>
              <span className="font-bold text-gray-300 mt-1 block">{dcsState.debitCharge} m³/h</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 block">R1 PRESSURE</span>
              <span className="font-bold text-gray-300 mt-1 block">{dcsState.r1Pressure.toFixed(2)} bar</span>
            </div>
          </div>
        </div>

        {/* REACTOR R2 INLET */}
        <div className="bg-[#151921] border border-[#2D333D] rounded-lg p-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className={`absolute top-0 inset-x-0 h-1.5 ${r2Styles.accent === "text-red-500" ? "bg-red-500" : r2Styles.accent === "text-orange-500" ? "bg-orange-500" : "bg-emerald-500"}`} />

          <div className="space-y-1 w-full flex justify-between items-start">
            <div className="text-left">
              <span className="text-[10px] text-gray-500 font-mono tracking-widest block">VESSEL ID: R-002</span>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mt-0.5">Reactor R2 Inlet Temp</h4>
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 ${r2Styles.bg} ${r2Styles.border} ${r2Styles.accent}`}>
              {r2Styles.badge}
            </span>
          </div>

          {/* Interactive Industrial Dial Graphic */}
          <div className="my-6 relative w-48 h-48 flex items-center justify-center">
            {/* SVG circle gauge */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="76" stroke="#1D2430" strokeWidth="8" fill="transparent" className="opacity-40" />
              <circle cx="96" cy="96" r="76" stroke="#F47A20" strokeWidth="8" strokeDasharray="30 200" strokeDashoffset="-70" fill="transparent" className="opacity-30" />
              <circle cx="96" cy="96" r="76" stroke="#EF4444" strokeWidth="8" strokeDasharray="40 200" strokeDashoffset="-120" fill="transparent" className="opacity-30" />
              <circle 
                cx="96" 
                cy="96" 
                r="76" 
                stroke={r2Styles.accent === "text-red-500" ? "#EF4444" : r2Styles.accent === "text-orange-500" ? "#F47A20" : "#10B981"} 
                strokeWidth="10" 
                strokeDasharray="477" 
                strokeDashoffset={477 - (477 * Math.min(1.0, dcsState.r2InletTemp / 180.0))} 
                strokeLinecap="round"
                fill="transparent" 
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            {/* Inside details text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
              <Thermometer className={`w-6 h-6 ${r2Styles.accent}`} />
              <span className="text-3xl font-mono font-bold text-white tracking-tighter">
                {dcsState.r2InletTemp.toFixed(1)}°C
              </span>
              <span className="text-[10px] text-gray-500 font-mono">SCALE 0 - 180°C</span>
            </div>
          </div>

          {/* Core process metrics sub bar */}
          <div className="grid grid-cols-2 gap-4 w-full bg-black/20 p-3 rounded border border-[#2D333D] text-xs font-mono">
            <div className="text-left">
              <span className="text-[10px] text-gray-500 block">R2 FLOW RATE</span>
              <span className="font-bold text-gray-300 mt-1 block">{dcsState.debitCharge} m³/h</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 block">R2 EXP OCTANE</span>
              <span className="font-bold text-orange-500 mt-1 block">{dcsState.predictedOctane.toFixed(1)} RON</span>
            </div>
          </div>
        </div>

      </div>

      {/* Safety Interlock Protocol Card */}
      <div className="p-4 bg-black/35 border border-[#2D333D] rounded-lg flex items-start gap-4">
        <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">SONATRACH Safety & Automation Compliance</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Automatic interlocks trip and engage emergency vents when reactors reach 140°C. Temperature setpoints above 135°C are strictly governed and trigger localized alerts within the Alarm Center. Run Differential Evolution Optimizer simulations to return safer operating recipes.
          </p>
        </div>
      </div>
    </div>
  );
};
