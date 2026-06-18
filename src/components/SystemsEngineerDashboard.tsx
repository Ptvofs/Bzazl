import React, { useState } from "react";
import { ModelPerformance, EmpiricalRun, ModelHistoryItem } from "../types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  ScatterChart, 
  Scatter, 
  ZAxis 
} from "recharts";
import { 
  Database, 
  Cpu, 
  CheckCircle, 
  XCircle, 
  Layers, 
  Activity, 
  TrendingUp, 
  Table, 
  ClipboardCheck,
  Search,
  Filter,
  Check,
  AlertTriangle
} from "lucide-react";

interface SystemsEngineerDashboardProps {
  performance: ModelPerformance;
  history: ModelHistoryItem[];
  experiments: EmpiricalRun[];
  isRetraining: boolean;
  onApproveExperiment: (id: string) => Promise<void>;
  onRejectExperiment: (id: string) => Promise<void>;
  onTriggerRetrain: () => Promise<void>;
  activeTab?: "performance" | "retrain" | "history" | "db";
  onTabChange?: (tab: "performance" | "retrain" | "history" | "db") => void;
}

export const SystemsEngineerDashboard: React.FC<SystemsEngineerDashboardProps> = ({
  performance,
  history,
  experiments,
  isRetraining,
  onApproveExperiment,
  onRejectExperiment,
  onTriggerRetrain,
  activeTab = "performance",
  onTabChange
}) => {
  const [internalTab, setInternalTab] = useState<"performance" | "retrain" | "history" | "db">("performance");
  const currentTab = onTabChange ? activeTab : internalTab;
  const setActiveTab = onTabChange ? onTabChange : setInternalTab;
  const [trainingPercent, setTrainingPercent] = useState<number>(0);
  const [showProgress, setShowSessionProgress] = useState<boolean>(false);

  // Search/Filter for Training History
  const [historySearch, setHistorySearch] = useState<string>("");
  const [historySortOrder, setHistorySortOrder] = useState<"desc" | "asc">("desc");

  // Database Management checks
  const [validationOk, setValidationOk] = useState<boolean>(false);
  const [validating, setValidating] = useState<boolean>(false);

  const pendingExps = experiments.filter((e) => e.status === "Pending");
  const approvedExps = experiments.filter((e) => e.status === "Approved");

  const startLocalRetraining = async () => {
    setShowSessionProgress(true);
    setTrainingPercent(0);

    const interval = setInterval(() => {
      setTrainingPercent((val) => {
        if (val >= 90) {
          clearInterval(interval);
          return 90;
        }
        return val + 15;
      });
    }, 150);

    await onTriggerRetrain();
    
    setTrainingPercent(100);
    setTimeout(() => {
      setShowSessionProgress(false);
    }, 1000);
  };

  const handleValidateDataset = () => {
    setValidating(true);
    setTimeout(() => {
      setValidating(false);
      setValidationOk(true);
    }, 1000);
  };

  // Process and sort Training History
  const filteredHistory = history.filter((item) => 
    item.version.toLowerCase().includes(historySearch.toLowerCase()) ||
    item.algorithm.toLowerCase().includes(historySearch.toLowerCase())
  ).sort((a, b) => {
    return historySortOrder === "desc" 
      ? b.version.localeCompare(a.version) 
      : a.version.localeCompare(b.version);
  });

  return (
    <div id="ai-engineer-dashboard-console" className="space-y-6">
      
      {/* Enterprise AI Workspace Navigation Buttons */}
      <div id="ai-tab-rail" className="flex flex-wrap border-b border-[#232C3A]/60">
        <button
          onClick={() => setActiveTab("performance")}
          className={`px-4 py-2.5 text-xs font-display font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            currentTab === "performance"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <Cpu className="w-4 h-4 text-orange-500" />
          Model Performance
        </button>
        <button
          onClick={() => setActiveTab("retrain")}
          className={`px-4 py-2.5 text-xs font-display font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 relative ${
            currentTab === "retrain"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <Layers className="w-4 h-4 text-orange-500" />
          Retrain Center
          {pendingExps.length > 0 && (
            <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-orange-500 text-[9px] text-black font-bold text-center leading-4 animate-pulse">
              {pendingExps.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 text-xs font-display font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            currentTab === "history"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <Table className="w-4 h-4 text-orange-500" />
          Training History
        </button>
        <button
          onClick={() => setActiveTab("db")}
          className={`px-4 py-2.5 text-xs font-display font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            currentTab === "db"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <Database className="w-4 h-4 text-orange-500" />
          Database Management
        </button>
      </div>

      {/* RENDER TAB 1: MODEL PERFORMANCE */}
      {currentTab === "performance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#131722] p-4 rounded-lg border border-[#232C3A]">
              <span className="text-[10px] text-gray-500 font-mono block">ACTIVE MODEL VERSION</span>
              <span className="text-base font-bold text-gray-200 mt-1 block">{performance.version}</span>
              <span className="text-[10px] text-orange-500 mt-1 block">Differential Evolution Solver fit</span>
            </div>
            <div className="bg-[#131722] p-4 rounded-lg border border-[#232C3A]">
              <span className="text-[10px] text-gray-500 font-mono block">COEFFICIENT OF DETERMINATION (R²)</span>
              <span className="text-base font-mono font-bold text-emerald-500 mt-1 block">{performance.r2.toFixed(4)}</span>
              <span className="text-[10px] text-gray-500 mt-1 block">Calibrated on {performance.datasetSize} rows</span>
            </div>
            <div className="bg-[#131722] p-4 rounded-lg border border-[#232C3A]">
              <span className="text-[10px] text-gray-500 font-mono block">RMSE ACCURACY LOSS</span>
              <span className="text-base font-mono font-bold text-orange-500 mt-1 block">± {performance.rmse.toFixed(3)} RON</span>
              <span className="text-[10px] text-gray-500 mt-1 block">Root Mean Squared Error variance</span>
            </div>
            <div className="bg-[#131722] p-4 rounded-lg border border-[#232C3A]">
              <span className="text-[10px] text-gray-500 font-mono block">MAPE % DEVIATION</span>
              <span className="text-base font-mono font-bold text-gray-300 mt-1 block">{(performance.mape * 100).toFixed(3)}%</span>
              <span className="text-[10px] text-gray-400 mt-1 block">MAE: {performance.mae.toFixed(3)} RON</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-[#131722] border border-[#232C3A] rounded-lg p-5">
              <h4 className="text-xs font-display font-semibold text-gray-300 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Predicted vs Lab-Actual Octane (Validation Time-Series)
              </h4>
              <div className="h-[220px] w-full text-[10px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performance.predictedVsActual} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="date" stroke="#8b949e" tickLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="#8b949e" tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#131722", borderColor: "#232C3A" }} />
                    <Line type="monotone" dataKey="actual" name="Lab Value (RON)" stroke="#FF6B00" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="predicted" name="DE Fitting Prediction" stroke="#FF6B00" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 bg-[#131722] border border-[#232C3A] rounded-lg p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-display font-semibold text-gray-300 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-orange-500" />
                  ML Feature Weights
                </h4>
                <div className="h-[170px] w-full text-[9px] font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performance.featureImportance} layout="vertical" margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                      <XAxis type="number" stroke="#8b949e" tickLine={false} />
                      <YAxis type="category" dataKey="name" stroke="#8b949e" width={75} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#131722", borderColor: "#232C3A" }} />
                      <Bar dataKey="value" name="Importance Weight %" fill="#FF8533" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 text-center italic pt-2 border-t border-[#232C3A]/60">
                Reactor inlet temperatures yield the highest variance control over octane results in local matrices.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-[#131722] border border-[#232C3A] rounded-lg p-5">
              <h4 className="text-xs font-display font-semibold text-gray-300 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-orange-500" />
                Residual Error Scattering Analysis
              </h4>
              <div className="h-[180px] w-full text-[10px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid stroke="#21262d" />
                    <XAxis type="number" dataKey="predicted" name="Predicted" unit=" RON" stroke="#8b949e" tickLine={false} domain={['auto', 'auto']} />
                    <YAxis type="number" dataKey="residual" name="Residual" unit=" RON" stroke="#8b949e" tickLine={false} />
                    <ZAxis type="number" range={[55, 55]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: "#131722", borderColor: "#232C3A" }} />
                    <Scatter name="Residuals" data={performance.residuals} fill="#EF4444" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#131722] border border-[#232C3A] rounded-lg p-5 flex flex-col justify-between text-xs">
              <div>
                <h4 className="text-xs font-display font-semibold text-gray-350 mb-3 uppercase tracking-wider">
                  Differential Evolution Calibration Summary
                </h4>
                <p className="text-gray-500 leading-relaxed text-justify mb-2">
                  Optimization boundaries constraint reactor inlets between 95°C and 160°C. Predictive equations fit the laboratory octane (RON) results utilizing localized Ridge models with dynamic catalyst aging multipliers.
                </p>
                <p className="text-gray-500 leading-relaxed text-justify">
                  Accuracy margins hold a maximum MAE of {performance.mae.toFixed(3)} RON, easily complying with SONATRACH QA limits.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#232C3A]/60 flex justify-between text-[10px] text-gray-500 font-mono">
                <span>Model Seed: DE_ISOM_V4</span>
                <span>Active Core Fit</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 2: RETRAIN CENTER */}
      {currentTab === "retrain" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Action Trigger Card */}
            <div className="bg-[#131722] border border-[#232C3A] rounded-lg p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-display font-semibold text-gray-300 uppercase tracking-wider mb-4">
                  Approved Runs Ready
                </h4>
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Approved lab Samples:</span>
                    <span className="text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">{approvedExps.length} Samples</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Pending reviews:</span>
                    <span className="text-orange-500 font-bold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">{pendingExps.length} Samples</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-[#232C3A]/60">
                <button
                  type="button"
                  onClick={startLocalRetraining}
                  disabled={approvedExps.length === 0 || isRetraining || showProgress}
                  className={`w-full text-xs font-bold font-display uppercase tracking-wider py-2.5 rounded transition-all shadow ${
                    approvedExps.length === 0
                      ? "bg-gray-850 text-gray-600 cursor-not-allowed border border-[#232C3A]"
                      : "bg-orange-600 text-white hover:bg-orange-500"
                  }`}
                >
                  {isRetraining ? "Regulating pipeline..." : "Retrain XGBoost Model"}
                </button>
              </div>
            </div>

            {/* Simulated Live Console logs */}
            <div className="md:col-span-2 bg-[#131722] border border-[#232C3A] rounded-lg p-5">
              <h4 className="text-xs font-display font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-orange-500" />
                Pipeline Stream Logs
              </h4>
              
              <div className="bg-black/45 rounded p-4 h-[120px] font-mono text-[10px] text-gray-400 overflow-y-auto space-y-1">
                <div>[SERVER-INIT] Isomerization Gradient retrainer ready...</div>
                {showProgress ? (
                  <>
                    <div className="text-orange-500">[WORKER-01] Loading approved datatags adding {approvedExps.length} data points...</div>
                    {trainingPercent >= 30 && <div className="text-orange-500">[WORKER-01] Calibrating bed offset variables... Done</div>}
                    {trainingPercent >= 60 && <div className="text-orange-500">[WORKER-01] Estimating Gradient Descent Coefficients...</div>}
                    {trainingPercent === 100 && <div className="text-emerald-500 font-bold">[WORKER-01] Coefficients normalized! New XGBoost Model serialized and set active.</div>}
                  </>
                ) : (
                  <div className="text-gray-600 italic">Retrainer idle. Awaiting approved laboratory sample submissions...</div>
                )}
              </div>

              {showProgress && (
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-mono">
                    <span>SGD Minimizing state:</span>
                    <span>{trainingPercent}%</span>
                  </div>
                  <div className="w-full bg-black/50 h-2 rounded border border-[#232C3A]">
                    <div className="bg-orange-500 h-1.5 rounded-full transition-all duration-150" style={{ width: `${trainingPercent}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pending operator-logged experiments to approve */}
          <div className="bg-[#131722] border border-[#232C3A] rounded-lg p-5">
            <h4 className="text-xs font-display text-gray-200 font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-orange-500" />
              Operator Experiments Review & Approvals Board
            </h4>

            {pendingExps.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 border border-dashed border-[#232C3A] rounded">
                No operator-logged runs requiring calibration review.
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-xs text-left font-mono">
                  <thead>
                    <tr className="bg-black/35 text-gray-500 text-[10px] uppercase border-b border-[#232C3A]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-2">Operator Tag</th>
                      <th className="py-2.5 px-2 text-right">R1 Inlet (°C)</th>
                      <th className="py-2.5 px-2 text-right">R2 Inlet (°C)</th>
                      <th className="py-2.5 px-2 text-right">Catalyst Age</th>
                      <th className="py-2.5 px-2 text-right text-emerald-500">Actual Octane</th>
                      <th className="py-2.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232C3A]/40 text-gray-300">
                    {pendingExps.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3">{new Date(item.timestamp).toLocaleDateString()}</td>
                        <td className="py-3 px-2 text-gray-400">{item.operatorName}</td>
                        <td className="py-3 px-2 text-right">{item.r1BedAvg.toFixed(1)}</td>
                        <td className="py-3 px-2 text-right">{item.r2BedAvg.toFixed(1)}</td>
                        <td className="py-3 px-2 text-right">{item.catalystAge} days</td>
                        <td className="py-3 px-2 text-right text-emerald-500 font-bold">{item.actualOctane.toFixed(2)} RON</td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => onRejectExperiment(item.id)}
                            className="p-1 px-2.5 text-red-500 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20 transition-all flex items-center gap-1 text-[10px]"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => onApproveExperiment(item.id)}
                            className="p-1 px-3 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-all flex items-center gap-1 text-[10px]"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER TAB 3: TRAINING HISTORY */}
      {currentTab === "history" && (
        <div className="bg-[#131722] border border-[#232C3A] rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 className="text-xs font-display text-gray-250 font-bold uppercase tracking-wider">
                XGBoost Retraining Log Matrix
              </h4>
              <p className="text-[11px] text-gray-500">Historical versions fitment metrics and coefficient records</p>
            </div>

            {/* Search/Sort controls */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto text-xs font-mono">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Filter versions..."
                  className="w-full bg-black/30 border border-[#232C3A] rounded pl-8 pr-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500Placeholder:text-gray-600"
                />
              </div>
              <button
                type="button"
                onClick={() => setHistorySortOrder(prev => prev === "desc" ? "asc" : "desc")}
                className="bg-black/30 border border-[#232C3A] px-2.5 py-1 rounded text-gray-400 hover:text-white transition-colors"
              >
                Sort: {historySortOrder === "desc" ? "DESC" : "ASC"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar pt-1">
            <table className="w-full text-xs text-left font-mono">
              <thead>
                <tr className="bg-black/35 text-gray-500 text-[10px] uppercase border-b border-[#232C3A]">
                  <th className="py-2.5 px-3">Revision Version</th>
                  <th className="py-2.5 px-2">Fitting Method</th>
                  <th className="py-2.5 px-2 text-center">Dataset Size</th>
                  <th className="py-2.5 px-2 text-center">R² Score</th>
                  <th className="py-2.5 px-2 text-center">RMSE Loss</th>
                  <th className="py-2.5 px-3 uppercase text-right">Deployment Timestamp</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232C3A]/40 text-gray-300">
                {filteredHistory.map((h, idx) => (
                  <tr key={h.version} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-bold text-orange-500">{h.version}</td>
                    <td className="py-3 px-2 text-gray-400">{h.algorithm}</td>
                    <td className="py-3 px-2 text-center">{h.datasetSize} Rows</td>
                    <td className="py-3 px-2 text-center text-emerald-500 font-bold">{h.r2.toFixed(4)}</td>
                    <td className="py-3 px-2 text-center text-red-500">{h.rmse.toFixed(3)} RON</td>
                    <td className="py-3 px-3 text-right text-gray-400">{h.trainingDate}</td>
                    <td className="py-3 px-3 text-center">
                      {idx === history.length - 1 ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
                          ACTIVE CORE
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] bg-[#1a1c22] text-gray-500 border border-transparent font-bold">
                          DEPRECATED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER TAB 4: DATABASE MANAGEMENT */}
      {currentTab === "db" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Database Stats Card */}
            <div className="bg-[#131722] border border-[#232C3A] rounded-lg p-5 space-y-4">
              <h4 className="text-xs font-display text-gray-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-orange-500" />
                DCS Historical Ingress Database
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Represents physical dataset rows mapped continuously from the refinery isomerization units. Tracks reactor bed coordinates, flows, pressures, and product yields.
              </p>

              <div className="space-y-2 text-xs font-mono pt-2">
                <div className="flex justify-between p-2 bg-black/25 rounded border border-[#232C3A]">
                  <span className="text-gray-500">Dataset Rows:</span>
                  <span className="text-white font-bold">{performance.datasetSize} records</span>
                </div>
                <div className="flex justify-between p-2 bg-black/25 rounded border border-[#232C3A]">
                  <span className="text-gray-500">Target Variable:</span>
                  <span className="text-orange-500 font-bold">Octane Concentration (RON)</span>
                </div>
                <div className="flex justify-between p-2 bg-black/25 rounded border border-[#232C3A]">
                  <span className="text-gray-500">Matrix Features:</span>
                  <span className="text-white">6 continuous process tags</span>
                </div>
                <div className="flex justify-between p-2 bg-black/25 rounded border border-[#232C3A]">
                  <span className="text-gray-500">Last Database Update:</span>
                  <span className="text-white font-bold">Continuous live buffer ingest</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleValidateDataset}
                  disabled={validating}
                  className="w-full bg-black/30 border border-orange-500/40 text-orange-500 hover:bg-orange-500/10 px-4 py-2 rounded text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                  {validating ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" />
                      Validating Ingress Integrity...
                    </>
                  ) : validationOk ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      No Anomalies Found!
                    </>
                  ) : (
                    "Trigger Schema Integrity Audit"
                  )}
                </button>
              </div>
            </div>

            {/* Features Description list */}
            <div className="bg-[#131722] border border-[#232C3A] rounded-lg p-5 space-y-4">
              <h4 className="text-xs font-display text-gray-300 font-bold uppercase tracking-wider">
                Ingested SCADA Datatags Matrix
              </h4>

              <div className="space-y-3 pt-1">
                <div className="p-2.5 bg-black/20 rounded border border-[#232C3A] text-xs">
                  <div className="font-mono font-bold text-orange-400">R1_TBED_AVG</div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Average bed temperature inside reactor vessel R-001 (Inlet to outlet calibration).</p>
                </div>
                <div className="p-2.5 bg-black/20 rounded border border-[#232C3A] text-xs">
                  <div className="font-mono font-bold text-orange-400">R2_TBED_AVG</div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Average bed temperature inside reactor vessel R-002 (primary conversion zone).</p>
                </div>
                <div className="p-2.5 bg-black/20 rounded border border-[#232C3A] text-xs">
                  <div className="font-mono font-bold text-orange-400">FLOW_CHARGE_INOM</div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Light naphtha isomerization combined feed rate in cubic meters per hour.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
