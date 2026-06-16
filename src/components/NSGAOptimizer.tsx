import React, { useState, useEffect } from "react";
import { DCSState, NSGA2Candidate } from "../types";
import { 
  Sparkles, 
  RotateCw, 
  Check, 
  X, 
  ShieldAlert, 
  Gauge, 
  Droplet, 
  Lightbulb, 
  Save, 
  Zap, 
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Sliders
} from "lucide-react";

interface NSGAOptimizerProps {
  dcsState: DCSState;
  onApplySetpoints: (r1Inlet: number, r2Inlet: number) => Promise<boolean>;
  onSaveSimulation: (simData: any) => Promise<void>;
}

export const NSGAOptimizer: React.FC<NSGAOptimizerProps> = ({ 
  dcsState, 
  onApplySetpoints, 
  onSaveSimulation 
}) => {
  const [catalystAge, setCatalystAge] = useState<number>(dcsState.catalystAge);
  const [loading, setLoading] = useState<boolean>(false);
  const [candidates, setCandidates] = useState<NSGA2Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<NSGA2Candidate | null>(null);

  const [decisionApplied, setDecisionApplied] = useState<boolean>(false);
  const [decisionRejected, setDecisionRejected] = useState<boolean>(false);
  const [decisionSaved, setDecisionSaved] = useState<boolean>(false);

  // Run the Differential Evolution optimization immediately on mount
  useEffect(() => {
    triggerDEOptimization();
  }, [catalystAge]);

  const triggerDEOptimization = async () => {
    setLoading(true);
    setDecisionApplied(false);
    setDecisionRejected(false);
    setDecisionSaved(false);

    try {
      const response = await fetch("/api/optimizer/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          catalystAge 
        })
      });
      const data = await response.json();
      
      // Simulate industrial SCADA solver latency
      setTimeout(() => {
        if (data.options && data.options.length > 0) {
          setCandidates(data.options);
          // Auto-select the top Pareto-optimal candidate
          setSelectedCandidate(data.options[0]);
        }
        setLoading(false);
      }, 1200);
    } catch (err) {
      console.error("Differential Evolution trigger failed", err);
      setLoading(false);
    }
  };

  const handleApplyToDcs = async () => {
    if (!selectedCandidate) return;
    const success = await onApplySetpoints(selectedCandidate.r1Temp, selectedCandidate.r2Temp);
    if (success) {
      setDecisionApplied(true);
      
      // Post to simulations database as "applied"
      await onSaveSimulation({
        status: "applied",
        catalystAge,
        targetRon: selectedCandidate.predictedRon,
        currentTemps: { r1Inlet: dcsState.r1InletTemp, r2Inlet: dcsState.r2InletTemp },
        currentPredictedRon: dcsState.predictedOctane,
        recommendedTemps: { r1Inlet: selectedCandidate.r1Temp, r2Inlet: selectedCandidate.r2Temp },
        recommendedPredictedRon: selectedCandidate.predictedRon,
        expectedGain: selectedCandidate.predictedRon - dcsState.predictedOctane,
        energyImpact: selectedCandidate.energyCost,
        riskIndicator: selectedCandidate.catalystDegradation > 10 ? "High" : selectedCandidate.catalystDegradation > 4 ? "Medium" : "Low",
        confidenceScore: 98.4,
        notes: `Applied Differential Evolution optimal setpoint on running refinery stream.`
      });
    }
  };

  const handleRejectSimulation = () => {
    setDecisionRejected(true);
    triggerDEOptimization(); // re-init solver
  };

  const handleSaveSimulationOnly = async () => {
    if (!selectedCandidate) return;
    setDecisionSaved(true);
    await onSaveSimulation({
      status: "saved",
      catalystAge,
      targetRon: selectedCandidate.predictedRon,
      currentTemps: { r1Inlet: dcsState.r1InletTemp, r2Inlet: dcsState.r2InletTemp },
      currentPredictedRon: dcsState.predictedOctane,
      recommendedTemps: { r1Inlet: selectedCandidate.r1Temp, r2Inlet: selectedCandidate.r2Temp },
      recommendedPredictedRon: selectedCandidate.predictedRon,
      expectedGain: selectedCandidate.predictedRon - dcsState.predictedOctane,
      energyImpact: selectedCandidate.energyCost,
      riskIndicator: selectedCandidate.catalystDegradation > 10 ? "High" : selectedCandidate.catalystDegradation > 4 ? "Medium" : "Low",
      confidenceScore: 98.4,
      notes: `Saved Differential Evolution parameters to historical simulation databases.`
    });
  };

  // Convert risk score to word
  const getRiskLabel = (degradation: number) => {
    if (degradation > 10) return { label: "High Thermal Stress", color: "text-red-500" };
    if (degradation > 4) return { label: "Moderate Wear", color: "text-orange-500" };
    return { label: "Safe / Optimal Range", color: "text-emerald-500" };
  };

  return (
    <div id="de-optimizer-panel" className="bg-[#151921] border border-[#2D333D] rounded-lg p-6">
      {/* Enterprise Title Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-[#2D333D]">
        <div>
          <h3 className="text-base font-display font-medium text-white flex items-center gap-2 uppercase tracking-wide">
            <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
            Differential Evolution Optimization Solver
          </h3>
          <p className="text-xs text-gray-500">Dual-reactor thermal path optimization maximizing octane yield and minimizing energy consumption</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-orange-500/10 border border-orange-500/30 text-orange-500 px-3 py-1 rounded font-mono font-bold tracking-wider uppercase">
            SOLVER V4.0 DE
          </span>
        </div>
      </div>

      {/* Grid of Current Conditions & Age Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* DCS Loader Panel */}
        <div className="lg:col-span-4 bg-black/30 p-4 rounded border border-[#2D333D] space-y-4">
          <div className="flex items-center gap-2 text-white font-display text-xs uppercase tracking-wider font-bold">
            <Sliders className="w-4 h-4 text-orange-500" />
            Loaded DCS Snapshot
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 bg-[#151921] rounded border border-[#2D333D]">
              <span className="text-gray-500">R1 Inlet Temp:</span>
              <span className="text-white font-bold">{dcsState.r1InletTemp.toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between p-2 bg-[#151921] rounded border border-[#2D333D]">
              <span className="text-gray-500">R2 Inlet Temp:</span>
              <span className="text-white font-bold">{dcsState.r2InletTemp.toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between p-2 bg-[#151921] rounded border border-[#2D333D]">
              <span className="text-gray-500">Current Yield:</span>
              <span className="text-orange-500 font-bold">{dcsState.predictedOctane.toFixed(1)} RON</span>
            </div>
            <div className="flex justify-between p-2 bg-[#151921] rounded border border-[#2D333D]">
              <span className="text-gray-500">Recycle Gas:</span>
              <span className="text-white font-bold">{dcsState.debitH2} Nm³/h</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#2D333D]">
            <label className="block text-[10px] text-gray-500 uppercase font-mono mb-2">
              Catalyst Age Matrix Calibration:
            </label>
            <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
              <span>Age of Bed:</span>
              <span className="text-orange-500 font-bold">{catalystAge.toFixed(1)} Months</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="50"
              step="0.5"
              value={catalystAge}
              onChange={(e) => setCatalystAge(parseFloat(e.target.value))}
              className="w-full accent-orange-500 bg-[#151921] h-1.5 rounded-lg appearance-none cursor-pointer border border-[#2D333D]"
            />
          </div>
        </div>

        {/* Optimizing results display area */}
        <div className="lg:col-span-8 bg-black/20 p-4 rounded border border-[#2D333D] min-h-[250px] flex flex-col justify-between">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-3">
              <RotateCw className="w-8 h-8 text-orange-500 animate-spin" />
              <div className="text-center">
                <span className="text-xs text-white font-semibold block">Computing Differential Evolution Frontiers...</span>
                <p className="text-[10px] text-gray-500 mt-0.5 font-mono">Iterating 20 generations • Mutation rate 0.8 • Crossover rate 0.9</p>
              </div>
            </div>
          ) : selectedCandidate ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#2D333D]">
                <span className="text-xs font-bold text-[#FF8533] flex items-center gap-1.5 uppercase font-display">
                  <Lightbulb className="w-4 h-4 text-orange-500" />
                  Solutions Recommended by DE Optimizer
                </span>
                <span className="text-[10px] text-gray-400">Select parameter route:</span>
              </div>

              {/* Selector tabs of solutions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {candidates.slice(0, 3).map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCandidate(item)}
                    className={`cursor-pointer p-2.5 rounded border text-xs font-mono text-left transition-all flex flex-col justify-between ${
                      selectedCandidate === item
                        ? "bg-orange-500/10 border-orange-500 shadow-md text-orange-500"
                        : "bg-[#151921] border-[#2D333D] text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex justify-between w-full font-bold">
                      <span>DE Option #{idx + 1}</span>
                      <span className="text-orange-500">{item.predictedRon.toFixed(1)} RON</span>
                    </div>
                    <div className="mt-1.5 text-[10px] text-gray-500 space-y-0.5">
                      <div>R1: {item.r1Temp}°C | R2: {item.r2Temp}°C</div>
                      <div>Energy cost: {item.energyCost} kW</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* In-depth parameters comparing current and recommended */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/45 p-3 rounded border border-[#2D333D] text-xs">
                {/* Temperatures change panel */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-display">
                    Temperature Setpoint Shifts
                  </span>
                  <div className="font-mono text-gray-300 space-y-1.5">
                    <div className="bg-[#151921] p-1.5 rounded border border-[#2D333D] flex justify-between items-center">
                      <span>R1 Inlet Temp:</span>
                      <span className="font-bold text-white">
                        {dcsState.r1InletTemp.toFixed(1)}°C &rarr; 
                        <span className="text-orange-500 ml-1">{selectedCandidate.r1Temp}°C</span>
                      </span>
                    </div>
                    <div className="text-[10px] text-orange-500 px-1">
                      Delta: {parseFloat((selectedCandidate.r1Temp - dcsState.r1InletTemp).toFixed(1))} °C
                    </div>
                    
                    <div className="bg-[#151921] p-1.5 rounded border border-[#2D333D] flex justify-between items-center">
                      <span>R2 Inlet Temp:</span>
                      <span className="font-bold text-white">
                        {dcsState.r2InletTemp.toFixed(1)}°C &rarr; 
                        <span className="text-orange-500 ml-1">{selectedCandidate.r2Temp}°C</span>
                      </span>
                    </div>
                    <div className="text-[10px] text-orange-500 px-1">
                      Delta: {parseFloat((selectedCandidate.r2Temp - dcsState.r2InletTemp).toFixed(1))} °C
                    </div>
                  </div>
                </div>

                {/* Metrics evaluation panel */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-display">
                    Predicted Gains & Impact margins
                  </span>
                  
                  <div className="space-y-1 bg-[#151921] p-2 rounded border border-[#2D333D] font-mono text-[11px] text-gray-300">
                    <div className="flex justify-between py-1 border-b border-[#2D333D]/60">
                      <span>Expected Octane:</span>
                      <span className="text-orange-500 font-bold">{selectedCandidate.predictedRon.toFixed(2)} RON</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#2D333D]/60 text-emerald-500">
                      <span>Expected Gains:</span>
                      <span className="font-bold">+{parseFloat((selectedCandidate.predictedRon - dcsState.predictedOctane).toFixed(2))} RON</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#2D333D]/60">
                      <span>Fouling Risk:</span>
                      <span className={`font-bold ${getRiskLabel(selectedCandidate.catalystDegradation).color}`}>
                        {getRiskLabel(selectedCandidate.catalystDegradation).label}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Heating Fuel Duty:</span>
                      <span className="text-orange-400 font-bold flex items-center gap-0.5">
                        <Zap className="w-3.5 h-3.5" />
                        {selectedCandidate.energyCost} kW
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-12 text-xs text-gray-500 uppercase font-mono">
              Ready to compute Differential Evolution solver
            </div>
          )}
        </div>
      </div>

      {/* DECISION MANDATE PANEL */}
      {selectedCandidate && (
        <div className="space-y-4">
          <div className="p-4 bg-black/40 border border-orange-500/20 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-500 animate-pulse shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-gray-200 uppercase font-display tracking-wider">SONATRACH Safety Integrity Level (SIL) Mandate</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Enterprise guidelines require human operator verification prior to adjusting furnace setpoints. Dual-loop telemetry changes will never be committed autonomously.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 self-stretch md:self-auto justify-end shrink-0">
              <button
                type="button"
                onClick={handleRejectSimulation}
                className="border border-red-500/50 hover:bg-red-500/10 text-red-500 py-2 px-4 rounded text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
              <button
                type="button"
                onClick={handleSaveSimulationOnly}
                disabled={decisionSaved}
                className={`border text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 py-2 px-4 rounded transition-all ${
                  decisionSaved 
                    ? "border-emerald-500 text-emerald-500 bg-emerald-500/5" 
                    : "border-[#2D333D] text-gray-300 hover:bg-white/5"
                }`}
              >
                <Save className="w-4 h-4" />
                {decisionSaved ? "Saved" : "Save Simulation"}
              </button>
              <button
                type="button"
                onClick={handleApplyToDcs}
                disabled={decisionApplied}
                className={`py-2 px-5 rounded text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 transition-all text-white ${
                  decisionApplied 
                    ? "bg-emerald-500 shadow-md cursor-not-allowed" 
                    : "bg-orange-600 hover:bg-orange-500 shadow"
                }`}
              >
                <Check className="w-4 h-4" />
                {decisionApplied ? "Applied to DCS" : "Apply to DCS"}
              </button>
            </div>
          </div>

          {/* User Feedback lines */}
          {decisionApplied && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium text-center rounded">
              ✔ SONATRACH DCS telemetry updated successfully! Catalyst bed temperature loop will settle dynamically.
            </div>
          )}
          {decisionSaved && !decisionApplied && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-medium text-center rounded">
              ✔ Simulation parameters recorded in database for subsequent verification.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
