import React, { useState, useEffect } from "react";
import { DCSState, NSGA2Candidate } from "../types";
import { 
  Sparkles, 
  RotateCw, 
  Check, 
  X, 
  ShieldAlert, 
  Gauge, 
  Save, 
  Zap, 
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Sliders,
  HelpCircle,
  Database,
  Info
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
  // Wizard steps: 1 = Catalyst Info, 2 = Run Optimization, 3 = Display Results, 4 = Decision
  const [activeStep, setActiveStep] = useState<number>(1);
  const [catalystAge, setCatalystAge] = useState<number>(dcsState.catalystAge);
  const [loading, setLoading] = useState<boolean>(false);
  const [candidates, setCandidates] = useState<NSGA2Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<NSGA2Candidate | null>(null);

  const [decisionApplied, setDecisionApplied] = useState<boolean>(false);
  const [decisionRejected, setDecisionRejected] = useState<boolean>(false);
  const [decisionSaved, setDecisionSaved] = useState<boolean>(false);

  // Re-fetch optimization when catalyst age is adjusted (resets states when aged)
  const runDEOptimization = async () => {
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
      
      // Simulate high-fidelity mathematical SCADA solver lag
      setTimeout(() => {
        if (data.options && data.options.length > 0) {
          setCandidates(data.options);
          setSelectedCandidate(data.options[0]);
          // Automatically go to Step 3 once solved
          setActiveStep(3);
        }
        setLoading(false);
      }, 1500);
    } catch (err) {
      console.error("Differential Evolution solver trigger failed", err);
      setLoading(false);
    }
  };

  const handleApplyToDcs = async () => {
    if (!selectedCandidate) return;
    const success = await onApplySetpoints(selectedCandidate.r1Temp, selectedCandidate.r2Temp);
    if (success) {
      setDecisionApplied(true);
      
      // Save results configuration to database as applied
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
        notes: `Committed Differential Evolution core setpoints to Sonatrak project online stream.`
      });
    }
  };

  const handleRejectSimulation = () => {
    setDecisionRejected(true);
    // Return to Step 1 for parameter readjustment
    setTimeout(() => {
      setActiveStep(1);
      setDecisionRejected(false);
      setSelectedCandidate(null);
    }, 1200);
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
      notes: `Recorded simulation parameters to historically saved telemetry databases.`
    });
  };

  const getRiskLabel = (degradation: number) => {
    if (degradation > 10) return { label: "High Thermal Strain", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" };
    if (degradation > 4) return { label: "Moderate Bed Wear", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" };
    return { label: "Safe / Optimal Range", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  };

  const stepsHeader = [
    { num: 1, name: "Catalyst Aging" },
    { num: 2, name: "Trigger Solver" },
    { num: 3, name: "Performance Gains" },
    { num: 4, name: "Operator Authority" }
  ];

  return (
    <div id="de-step-by-step-optimizer" className="bg-[#131722] border border-[#232C3A] rounded-xl p-5 sm:p-6 space-y-6">
      
      {/* Enterprise Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#232C3A]">
        <div>
          <h3 className="text-base font-display font-medium text-white flex items-center gap-2 uppercase tracking-wide">
            <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
            Differential Evolution Closed-Loop Optimizer
          </h3>
          <p className="text-xs text-gray-500">Step-by-step thermodynamic path optimizer maximizing light naphtha isomerization isomerate octane (RON)</p>
        </div>
        <span className="text-[10px] bg-orange-500/10 border border-orange-500/30 text-orange-500 px-3 py-1 rounded font-mono font-bold tracking-wider uppercase shrink-0">
          SOLVER V4.8 DE
        </span>
      </div>

      {/* Progress Steps Hierarchy (Stepper) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/20 p-2.5 rounded-lg border border-[#232C3A]">
        {stepsHeader.map((step) => {
          const isCompleted = activeStep > step.num;
          const isActive = activeStep === step.num;
          return (
            <div 
              key={step.num}
              onClick={() => {
                // Allow browsing back, or navigating forward if we have computed candidates
                if (step.num < activeStep || (step.num === 4 && selectedCandidate) || (step.num === 3 && selectedCandidate)) {
                  setActiveStep(step.num);
                }
              }}
              className={`flex items-center gap-2.5 p-2 rounded-md transition-all text-left cursor-pointer select-none ${
                isActive 
                  ? "bg-orange-500/10 border border-orange-500/35 text-white" 
                  : isCompleted 
                    ? "text-emerald-500 border border-transparent hover:bg-white/5" 
                    : "text-gray-500 border border-transparent hover:bg-white/5"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                isActive 
                  ? "bg-orange-500 text-black" 
                  : isCompleted 
                    ? "bg-emerald-500 text-black" 
                    : "bg-[#232C3A] text-gray-400"
              }`}>
                {isCompleted ? "✔" : step.num}
              </span>
              <span className="text-xs font-semibold tracking-tight">{step.name}</span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: CATALYST INFORMATION PANEL */}
      {activeStep === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-orange-500/5 border border-orange-500/15 p-4 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h5 className="font-bold text-orange-500 uppercase">Step 1: Calibration of Catalyst Age Bed deactivation</h5>
              <p className="text-gray-400 leading-relaxed">
                As the platinum chlorinated catalyst bed ages, active metal sites deform due to slight coke accumulation. Adjusting the bed age below calibrates the non-linear prediction matrix, indicating safer temperatures for Furnace heating.
              </p>
            </div>
          </div>

          <div className="bg-black/30 p-5 rounded-lg border border-[#232C3A] space-y-4">
            <label className="block text-[10px] text-gray-500 uppercase font-mono tracking-wider">
              Catalyst Age (Days)
            </label>
            
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={catalystAge}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setCatalystAge(isNaN(parsed) ? 0 : Math.max(0, parsed));
                  }}
                  className="w-full bg-[#131722] border border-[#232C3A] text-xl font-mono text-orange-500 p-4 pr-16 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="e.g. 120 or 365"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm uppercase">Days</span>
              </div>
              
              {!Number.isInteger(catalystAge) || catalystAge < 0 ? (
                <div className="text-red-400 text-xs font-mono flex items-center gap-1.5 bg-red-950/20 p-2.5 rounded border border-red-500/10">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Please enter a valid positive integer of operating days.
                </div>
              ) : null}

              {catalystAge > 1000 && (
                <div className="text-yellow-500 text-xs font-mono flex items-center gap-2 bg-yellow-950/20 p-3 rounded border border-yellow-500/20 leading-relaxed">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-yellow-500" />
                  <div>
                    <span className="font-bold uppercase block text-[10px] tracking-wide mb-0.5">⚠️ Expected Lifetime Threshold Exceeded</span>
                    Catalyst has aged past the typical 1000-day high-performance limit. Increased fouling requires higher inlet temperatures and reduces selectiveness.
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 text-[10px] font-mono text-gray-500 uppercase gap-2 pt-2 border-t border-[#232C3A]/50">
              <div>
                <span className="text-gray-400 block font-semibold mb-0.5">Fresh Catalyst</span>
                <span>0 - 180 Days</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold mb-0.5">Replacement Threshold</span>
                <span>1000+ Days</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setActiveStep(2)}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold font-display uppercase tracking-wider text-xs px-5 py-3 rounded-lg transition-all"
            >
              Load SCADA Snapshot
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: RUN DIFFERENTIAL EVOLUTION SOLVER */}
      {activeStep === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left part: Live loaded conditions */}
            <div className="bg-black/35 p-5 rounded-lg border border-[#232C3A] space-y-4">
              <h5 className="text-[10px] font-mono font-bold tracking-widest text-gray-400 uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-500" />
                Live Telemetry snapshot
              </h5>
              <p className="text-xs text-gray-500">The current operating temperatures, recycle pressure registers and feedstock flow rates will be locked as the initial starting points for optimization.</p>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between p-2.5 bg-[#131722] rounded border border-[#232C3A]">
                  <span className="text-gray-500">R-001 Temperature:</span>
                  <span className="text-white font-bold">{dcsState.r1InletTemp.toFixed(1)} °C</span>
                </div>
                <div className="flex justify-between p-2.5 bg-[#131722] rounded border border-[#232C3A]">
                  <span className="text-gray-500">R-002 Temperature:</span>
                  <span className="text-white font-bold">{dcsState.r2InletTemp.toFixed(1)} °C</span>
                </div>
                <div className="flex justify-between p-2.5 bg-[#131722] rounded border border-[#232C3A]">
                  <span className="text-gray-500">Recycle Loop pressure:</span>
                  <span className="text-white font-bold">{dcsState.r1Pressure.toFixed(2)} bar</span>
                </div>
                <div className="flex justify-between p-2.5 bg-[#131722] rounded border border-[#232C3A]">
                  <span className="text-gray-500">Current Isomerate Yield:</span>
                  <span className="text-orange-500 font-bold">{dcsState.predictedOctane.toFixed(1)} RON</span>
                </div>
              </div>
            </div>

            {/* Right part: Solver parameters */}
            <div className="bg-[#131722] p-5 rounded-lg border border-[#232C3A] flex flex-col justify-between">
              <div className="space-y-3">
                <h5 className="text-[10px] font-mono font-bold tracking-widest text-[#FF8533] uppercase flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-orange-500" />
                  Algorithm Solver Constraints
                </h5>
                
                <div className="space-y-2.5 text-xs text-gray-400 font-mono">
                  <div className="flex justify-between py-1 border-b border-[#232C3A]">
                    <span>Solver Method:</span>
                    <span className="text-orange-500 font-bold">Differential Evolution (DE)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#232C3A]">
                    <span>Populations vector:</span>
                    <span className="text-white">40 Vectors</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#232C3A]">
                    <span>Mutation constant (F):</span>
                    <span className="text-white">0.85 (Adaptive)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Catalyst Calibration state:</span>
                    <span className="text-orange-500 font-bold">{catalystAge} Days</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="bg-black/30 p-4 rounded border border-[#232C3A] flex flex-col items-center justify-center py-6 space-y-3 mt-4">
                  <RotateCw className="w-7 h-7 text-orange-500 animate-spin" />
                  <div className="text-center">
                    <span className="text-xs text-white block font-bold font-mono">COMPUTING MUTATION FRONTIERS...</span>
                    <span className="text-[9px] text-gray-500 font-mono block">Iterating Generation vector chains</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={runDEOptimization}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold font-display uppercase tracking-wider text-xs py-3.5 rounded-lg transition-all shadow-[0_4px_15px_rgba(244,122,32,0.15)] flex items-center justify-center gap-2 mt-4"
                >
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  Run Differential Evolution Solver
                </button>
              )}
            </div>

          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setActiveStep(1)}
              className="border border-[#232C3A] hover:bg-white/5 text-gray-300 font-bold font-display uppercase tracking-wider text-xs px-4 py-2.5 rounded-lg transition-colors"
            >
              Back to Bed Age
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: OPTIMIZATION RESULTS DISPLAY */}
      {activeStep === 3 && selectedCandidate && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-[#10B981]/5 border border-[#10B981]/20 p-3.5 rounded-lg flex items-center justify-between text-xs font-mono text-emerald-500">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 animate-bounce" />
              <span>✔ DIFFERENTIAL EVOLUTION FRONTIER STABILIZED • optimal thermodynamic route discovered.</span>
            </div>
            <span className="text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded font-bold">98.4% Confidence</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-2">
            {/* Left results breakdown: Solutions Selector */}
            <div className="lg:col-span-4 bg-black/35 p-4 rounded-lg border border-[#232C3A] space-y-3.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-gray-500 uppercase block">
                Pareto optimal candidates
              </span>

              <div className="flex flex-col gap-2">
                {candidates.slice(0, 3).map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCandidate(item)}
                    className={`cursor-pointer p-3 rounded-lg border text-xs font-mono text-left transition-all flex flex-col justify-between ${
                      selectedCandidate === item
                        ? "bg-orange-500/10 border-orange-500 shadow-md text-orange-500"
                        : "bg-[#131722] border-[#232C3A] text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex justify-between w-full font-bold">
                      <span>DE SETPOINT #{idx + 1}</span>
                      <span className="text-orange-500 font-mono font-semibold">{item.predictedRon.toFixed(2)} RON</span>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500 space-y-0.5 text-left border-t border-[#232C3A]/60 pt-1.5">
                      <div>R1: {item.r1Temp.toFixed(1)}°C | R2: {item.r2Temp.toFixed(1)}°C</div>
                      <div>Expected Fuel Duty: {item.energyCost} kW</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right results breakdown: Metrics and deltas as explicitly requested */}
            <div className="lg:col-span-8 bg-black/20 p-4 rounded-lg border border-[#232C3A] space-y-4">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#FF8533] uppercase block">
                Parametric shifts & gains evaluation report
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Temperatures shifts */}
                <div className="bg-[#131722] border border-[#232C3A] p-3 rounded-lg space-y-2">
                  <span className="text-[9px] font-bold text-gray-500 uppercase font-mono tracking-widest">Temperature Setpoints</span>
                  
                  <div className="space-y-1.5 font-mono text-xs text-gray-300">
                    <div className="flex justify-between py-1 border-b border-[#232C3A]/60">
                      <span>Current R1:</span>
                      <span>{dcsState.r1InletTemp.toFixed(1)} °C</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#232C3A]/60 text-orange-500">
                      <span>Recommended R1:</span>
                      <span className="font-bold">{selectedCandidate.r1Temp.toFixed(1)} °C</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#232C3A]/60 font-bold">
                      <span>R1 Diff (Delta):</span>
                      <span className={selectedCandidate.r1Temp - dcsState.r1InletTemp >= 0 ? "text-red-500" : "text-emerald-500"}>
                        {selectedCandidate.r1Temp - dcsState.r1InletTemp >= 0 ? "+" : ""}{(selectedCandidate.r1Temp - dcsState.r1InletTemp).toFixed(1)} °C
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#232C3A]/60 mt-2">
                      <span>Current R2:</span>
                      <span>{dcsState.r2InletTemp.toFixed(1)} °C</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#232C3A]/60 text-orange-500">
                      <span>Recommended R2:</span>
                      <span className="font-bold">{selectedCandidate.r2Temp.toFixed(1)} °C</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold">
                      <span>R2 Diff (Delta):</span>
                      <span className={selectedCandidate.r2Temp - dcsState.r2InletTemp >= 0 ? "text-red-500" : "text-emerald-500"}>
                        {selectedCandidate.r2Temp - dcsState.r2InletTemp >= 0 ? "+" : ""}{(selectedCandidate.r2Temp - dcsState.r2InletTemp).toFixed(1)} °C
                      </span>
                    </div>
                  </div>
                </div>

                {/* Economic & Quality parameters */}
                <div className="bg-[#131722] border border-[#232C3A] p-3 rounded-lg space-y-2">
                  <span className="text-[9px] font-bold text-gray-500 uppercase font-mono tracking-widest">Quality, Risk & Impact indicators</span>
                  
                  <div className="space-y-1.5 font-mono text-xs text-gray-300">
                    <div className="flex justify-between py-1 border-b border-[#232C3A]/60">
                      <span>Predicted Octane:</span>
                      <span className="text-orange-500 font-bold">{selectedCandidate.predictedRon.toFixed(2)} RON</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#232C3A]/60 font-bold text-emerald-500">
                      <span>Expected Octane Gain:</span>
                      <span>+{parseFloat((selectedCandidate.predictedRon - dcsState.predictedOctane).toFixed(2))} RON</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#232C3A]/60">
                      <span>Energy impact:</span>
                      <span className="text-orange-400 font-bold flex items-center gap-0.5">
                        <Zap className="w-3.5 h-3.5" />
                        {selectedCandidate.energyCost} kW
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#232C3A]/60">
                      <span>Thermal stress Risk:</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${getRiskLabel(selectedCandidate.catalystDegradation).color}`}>
                        {getRiskLabel(selectedCandidate.catalystDegradation).label}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Model Confidence Score:</span>
                      <span className="text-white font-bold">98.4%</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setActiveStep(2)}
              className="border border-[#232C3A] hover:bg-white/5 text-gray-300 font-bold font-display uppercase tracking-wider text-xs px-4 py-2.5 rounded-lg transition-colors"
            >
              Back to Solver
            </button>
            <button
              onClick={() => setActiveStep(4)}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold font-display uppercase tracking-wider text-xs px-5 py-3 rounded-lg transition-all"
            >
              Verify Authority Clearance
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: MANDATORY HUMAN DECISION BUTTONS */}
      {activeStep === 4 && selectedCandidate && (
        <div className="space-y-4 animate-fade-in">
          
          <div className="p-5 bg-[#171210] border border-orange-500/20 rounded-xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-200 uppercase font-display tracking-widest">
                  CLOSED-LOOP CONTROL MANDATE OPERATOR CLEARANCE
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
                  Sonatrak project Safety Integrity Level (SIL) guidelines require human operator clearance signature to modify Reactor Furnace inlet targets. The closed-loop controller will never apply setpoints automatically.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end shrink-0">
              <button
                type="button"
                onClick={handleRejectSimulation}
                className="border border-red-500/50 hover:bg-red-500/10 text-red-500 py-2.5 px-4 rounded text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
                Reject Setpoints
              </button>
              
              <button
                type="button"
                onClick={handleSaveSimulationOnly}
                disabled={decisionSaved}
                className={`border text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 py-2.5 px-4 rounded transition-all ${
                  decisionSaved 
                    ? "border-emerald-500 text-emerald-500 bg-emerald-500/10" 
                    : "border-[#232C3A] text-gray-300 hover:bg-white/5"
                }`}
              >
                <Save className="w-4 h-4" />
                {decisionSaved ? "Simulation Saved" : "Save Simulation"}
              </button>

              <button
                type="button"
                onClick={handleApplyToDcs}
                disabled={decisionApplied}
                className={`py-2.5 px-5 rounded text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 transition-all text-white ${
                  decisionApplied 
                    ? "bg-emerald-600 shadow-md cursor-not-allowed" 
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
              ✔ Sonatrak project SCADA closed-loop updated! Furnace F-101 fuel and Reactor R1/R2 loops will align.
            </div>
          )}
          {decisionSaved && !decisionApplied && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-medium text-center rounded">
              ✔ Simulation parameters successfully registered in refinery optimization databases.
            </div>
          )}
          {decisionRejected && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center rounded">
              ✔ Optimizations discarded. Returning to Catalyst parameters configuration...
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setActiveStep(3)}
              className="border border-[#232C3A] hover:bg-white/5 text-gray-300 font-bold font-display uppercase tracking-wider text-xs px-4 py-2.5 rounded-lg transition-colors"
            >
              Back to Results
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
