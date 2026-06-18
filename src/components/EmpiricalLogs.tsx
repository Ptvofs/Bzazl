import React, { useState } from "react";
import { DCSState, EmpiricalRun } from "../types";
import { PlusCircle, Database, Check, RefreshCw, AlertCircle } from "lucide-react";

interface EmpiricalLogsProps {
  dcsState: DCSState;
  experiments: EmpiricalRun[];
  onAddExperiment: (logData: any) => Promise<boolean>;
}

export const EmpiricalLogs: React.FC<EmpiricalLogsProps> = ({ 
  dcsState, 
  experiments, 
  onAddExperiment 
}) => {
  // Input fields state
  const [r1BedAvg, setR1BedAvg] = useState<string>((dcsState.r1OutletTemp - 5).toFixed(1));
  const [r2BedAvg, setR2BedAvg] = useState<string>((dcsState.r2OutletTemp - 4).toFixed(1));
  const [pressure, setPressure] = useState<string>(dcsState.r1Pressure.toFixed(2));
  const [flowCharge, setFlowCharge] = useState<string>(dcsState.debitCharge.toFixed(1));
  const [actualOctane, setActualOctane] = useState<string>("87.5");
  const [catalystAge, setCatalystAge] = useState<string>(dcsState.catalystAge.toString());

  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setErrorMsg("");

    const octNum = parseFloat(actualOctane);
    if (isNaN(octNum) || 80 > octNum || octNum > 105) {
      setSaving(false);
      setErrorMsg("Actual laboratory Octane must be a realistic number between 80.0 and 105.0 RON");
      return;
    }

    const ageNum = parseInt(catalystAge, 10);
    if (isNaN(ageNum) || ageNum < 0) {
      setSaving(false);
      setErrorMsg("Catalyst age must be a positive integer in days.");
      return;
    }

    const added = await onAddExperiment({
      r1BedAvg: parseFloat(r1BedAvg),
      r2BedAvg: parseFloat(r2BedAvg),
      pressure: parseFloat(pressure),
      flowCharge: parseFloat(flowCharge),
      actualOctane: octNum,
      catalystAge: ageNum
    });

    if (added) {
      setSuccess(true);
      // Reset only Octane field to prompt for subsequent entries later
      setActualOctane("");
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setErrorMsg("Server error trying to save empirical run record.");
    }
    setSaving(false);
  };

  const loadCurrentDcsValues = () => {
    setR1BedAvg((dcsState.r1OutletTemp - 5).toFixed(1));
    setR2BedAvg((dcsState.r2OutletTemp - 4).toFixed(1));
    setPressure(dcsState.r1Pressure.toFixed(2));
    setFlowCharge(dcsState.debitCharge.toFixed(1));
    setCatalystAge(dcsState.catalystAge.toString());
  };

  return (
    <div id="empirical-logs-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Log creation form */}
      <div className="lg:col-span-5 bg-industrial-panel border border-industrial-border rounded-lg p-5">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-industrial-border/60">
          <h3 className="text-sm font-display font-medium text-gray-200 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-dcs-blue" />
            Establish Empirical Run Entry
          </h3>
          <button
            type="button"
            onClick={loadCurrentDcsValues}
            className="text-[10px] text-dcs-blue font-medium hover:underline flex items-center gap-1 uppercase tracking-wider"
          >
            <RefreshCw className="w-3 h-3" />
            Sync DCS
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Bed Temperatures */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-1">R-001 Bed Avg Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                required
                value={r1BedAvg}
                onChange={(e) => setR1BedAvg(e.target.value)}
                className="w-full bg-black/40 border border-industrial-border rounded px-3 py-2 text-sm font-mono text-gray-300 focus:outline-none focus:border-dcs-blue"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">R-002 Bed Avg Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                required
                value={r2BedAvg}
                onChange={(e) => setR2BedAvg(e.target.value)}
                className="w-full bg-black/40 border border-industrial-border rounded px-3 py-2 text-sm font-mono text-gray-300 focus:outline-none focus:border-dcs-blue"
              />
            </div>
          </div>

          {/* Pressure & Flow charge */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-1">Inlet Pressure (bar)</label>
              <input
                type="number"
                step="0.01"
                required
                value={pressure}
                onChange={(e) => setPressure(e.target.value)}
                className="w-full bg-black/40 border border-industrial-border rounded px-3 py-2 text-sm font-mono text-gray-300 focus:outline-none focus:border-dcs-blue"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Combined Charge flow (m3/h)</label>
              <input
                type="number"
                step="0.1"
                required
                value={flowCharge}
                onChange={(e) => setFlowCharge(e.target.value)}
                className="w-full bg-black/40 border border-industrial-border rounded px-3 py-2 text-sm font-mono text-gray-300 focus:outline-none focus:border-dcs-blue"
              />
            </div>
          </div>

          {/* Actual Lab measured Octane and Catalyst age */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-dcs-green font-medium mb-1 uppercase tracking-wider text-[10px]">
                Lab Octane Result (RON)*
              </label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="e.g. 96.1"
                value={actualOctane}
                onChange={(e) => setActualOctane(e.target.value)}
                className="w-full bg-black/50 border border-dcs-green/50 rounded px-3 py-2 text-sm font-mono text-dcs-green font-bold focus:outline-none focus:border-dcs-green"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Catalyst Age (Days)</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={catalystAge}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setCatalystAge(isNaN(val) ? "" : Math.max(0, val).toString());
                }}
                className="w-full bg-black/40 border border-industrial-border rounded px-3 py-2 text-sm font-mono text-gray-300 focus:outline-none focus:border-dcs-blue"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-dcs-red/10 border border-dcs-red/30 rounded text-dcs-red flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 bg-dcs-green/10 border border-dcs-green/30 rounded text-dcs-green flex items-center gap-1.5">
              <Check className="w-4 h-4 shrink-0" />
              <span>Experiment preserved! Mark: Pending Retraining.</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-dcs-blue hover:bg-dcs-blue/90 text-white font-display font-medium text-xs uppercase tracking-wider py-2.5 rounded flex justify-center items-center gap-1.5 shadow"
            >
              {saving ? "Registering..." : "Append to Experiment Database"}
            </button>
          </div>
        </form>
      </div>

      {/* Database View list */}
      <div className="lg:col-span-7 bg-industrial-panel border border-industrial-border rounded-lg p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-display font-medium text-gray-200 mb-4 flex items-center gap-2 pb-3 border-b border-industrial-border/60">
            <Database className="w-4 h-4 text-dcs-blue" />
            Empirical Run Logs Archive (Lab Verifications)
          </h3>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-xs text-left font-mono">
              <thead>
                <tr className="bg-black/35 text-gray-500 text-[10px] uppercase border-b border-industrial-border">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-2">Timestamp</th>
                  <th className="py-2.5 px-2 text-center">Reactor Avg (°C)</th>
                  <th className="py-2.5 px-2 text-right">Lab Target</th>
                  <th className="py-2.5 px-3 text-right">Age (Days)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-industrial-border/40 text-gray-300">
                {experiments.slice(0, 7).map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-bold text-dcs-blue">{item.id}</td>
                    <td className="py-3 px-2 text-gray-400">{new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-3 px-2 text-center">
                      R1: {item.r1BedAvg.toFixed(1)} / R2: {item.r2BedAvg.toFixed(1)}
                    </td>
                    <td className="py-3 px-2 text-right text-dcs-green font-bold">{item.actualOctane.toFixed(1)} RON</td>
                    <td className="py-3 px-3 text-right text-gray-400">{item.catalystAge} d</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        item.status === "Approved" 
                          ? "bg-dcs-green/10 text-dcs-green border border-dcs-green/20" 
                          : item.status === "Rejected"
                            ? "bg-dcs-red/10 text-dcs-red border border-dcs-red/20"
                            : "bg-dcs-amber/10 text-dcs-amber border border-dcs-amber/20 indicator-pulse"
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-industrial-border/60 flex justify-between items-center text-[10px] text-gray-500">
          <span>Displaying latest {Math.min(7, experiments.length)} lab calibrations</span>
          <span>Status Pending notifies Systems Engineer Dashboard for Retraining Inclusion</span>
        </div>
      </div>
    </div>
  );
};
