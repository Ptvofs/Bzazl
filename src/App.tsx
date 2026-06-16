import { useState, useEffect } from "react";
import { DCSState, OptimSimulation, EmpiricalRun, AlarmItem, UserSession, UserRole } from "./types";
import { DCSMonitoring } from "./components/DCSMonitoring";
import { NSGAOptimizer } from "./components/NSGAOptimizer";
import { EmpiricalLogs } from "./components/EmpiricalLogs";
import { SystemsEngineerDashboard } from "./components/SystemsEngineerDashboard";
import { AlarmsPanel } from "./components/AlarmsPanel";
import { ReportsCenter } from "./components/ReportsCenter";
import { LoginPage } from "./components/LoginPage";
import { 
  Building2, 
  Activity, 
  Sparkles, 
  Database, 
  AlertOctagon, 
  FileText, 
  UserCheck, 
  Clock, 
  LogOut,
  LayoutDashboard,
  Gauge,
  Cpu,
  RotateCw,
  ShieldCheck,
  Layers,
  Table
} from "lucide-react";

export default function App() {
  // Navigation tabs state
  const [activeModule, setActiveModule] = useState<"overview" | "dcs" | "optimizer" | "logs" | "systems" | "alarms" | "reports">("overview");
  
  // Real-time DCS and model states
  const [dcsState, setDcsState] = useState<DCSState | null>(null);
  const [simulations, setSimulations] = useState<OptimSimulation[]>([]);
  const [experiments, setExperiments] = useState<EmpiricalRun[]>([]);
  const [modelPerf, setModelPerformance] = useState<any>(null);
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [aiDashboardTab, setAiDashboardTab] = useState<"performance" | "retrain" | "history" | "db">("performance");

  // Status variables
  const [roleSelectOpen, setRoleSelectOpen] = useState<boolean>(false);
  const [timestamp, setTimestamp] = useState<string>("");

  // Sync / Ingestion loader
  useEffect(() => {
    fetchSession();
    fetchDcsData();
    fetchSimulations();
    fetchExperiments();
    fetchActiveModel();
    fetchAlarms();

    // Fluctuating DCS state poller (every 4 seconds)
    const dcsInterval = setInterval(() => {
      fetchDcsData();
      fetchAlarms();
    }, 4000);

    // Live display clock
    const clockInterval = setInterval(() => {
      const now = new Date();
      setTimestamp(now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " (GMT+1)");
    }, 1000);

    return () => {
      clearInterval(dcsInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/session");
      const data = await res.json();
      setUserSession(data.session);
    } catch (err) {
      console.error("Session fetch failed", err);
    }
  };

  const handRoleSwitch = async (role: UserRole) => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: "queen yamina difllah", 
          role 
        })
      });
      const data = await res.json();
      setUserSession(data.session);
      setRoleSelectOpen(false);
    } catch (err) {
      console.error("Login switch failed", err);
    }
  };

  const fetchDcsData = async () => {
    try {
      const res = await fetch("/api/dcs/state");
      const data = await res.json();
      setDcsState(data);
    } catch (err) {
      console.error("DCS fetch fail", err);
    }
  };

  const fetchSimulations = async () => {
    try {
      const res = await fetch("/api/simulations");
      const data = await res.json();
      setSimulations(data.simulations);
    } catch (err) {
      console.error("Simulations fetch fail", err);
    }
  };

  const fetchExperiments = async () => {
    try {
      const res = await fetch("/api/experiments");
      const data = await res.json();
      setExperiments(data.experiments);
    } catch (err) {
      console.error("Experiments fetch fail", err);
    }
  };

  const fetchActiveModel = async () => {
    try {
      const res = await fetch("/api/models/active");
      const data = await res.json();
      setModelPerformance(data);
    } catch (err) {
      console.error("Model fetch fail", err);
    }
  };

  const fetchAlarms = async () => {
    try {
      const res = await fetch("/api/alarms");
      const data = await res.json();
      setAlarms(data.alarms);
    } catch (err) {
      console.error("Alarms fetch fail", err);
    }
  };

  // Setpoint applied callback
  const handleApplySetpoints = async (r1Inlet: number, r2Inlet: number): Promise<boolean> => {
    try {
      const res = await fetch("/api/dcs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r1Inlet, r2Inlet })
      });
      if (res.ok) {
        await fetchDcsData();
        return true;
      }
    } catch (err) {
      console.error("Failed to commit setpoints", err);
    }
    return false;
  };

  // Add experiment manual log
  const handleAddExperiment = async (logData: any): Promise<boolean> => {
    try {
      const res = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData)
      });
      if (res.ok) {
        await fetchExperiments();
        return true;
      }
    } catch (err) {
      console.error("Failed to save log", err);
    }
    return false;
  };

  // Save Optimizer simulation run
  const handleSaveSimulation = async (simData: any): Promise<void> => {
    try {
      const res = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simData)
      });
      if (res.ok) {
        await fetchSimulations();
      }
    } catch (err) {
      console.error("Failed to save simulation", err);
    }
  };

  // Systems Engineer approvals
  const handleApproveExperiment = async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/experiments/${id}/approve`, { method: "POST" });
      if (res.ok) {
        await fetchExperiments();
      }
    } catch (err) {
      console.error("Approval fail", err);
    }
  };

  const handleRejectExperiment = async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/experiments/${id}/reject`, { method: "POST" });
      if (res.ok) {
        await fetchExperiments();
      }
    } catch (err) {
      console.error("Rejection fail", err);
    }
  };

  const handleTriggerModelRetrain = async (): Promise<void> => {
    try {
      const res = await fetch("/api/models/retrain", { method: "POST" });
      if (res.ok) {
        await fetchActiveModel();
        await fetchExperiments(); // refresh approved to now shown as trained
      }
    } catch (err) {
      console.error("Retrain trigger fail", err);
    }
  };

  const handleAcknowledgeAlarm = async (id: string): Promise<void> => {
    try {
      const res = await fetch("/api/alarms/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await fetchAlarms();
      }
    } catch (err) {
      console.error("Acknowledge fail", err);
    }
  };

  const handleClearAlarms = async (): Promise<void> => {
    try {
      const res = await fetch("/api/alarms/clearAll", { method: "POST" });
      if (res.ok) {
        await fetchAlarms();
      }
    } catch (err) {
      console.error("Acknowledge total fail", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      setUserSession(null);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleLoginSuccess = async (username: string, role: UserRole) => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, role })
      });
      const data = await res.json();
      setUserSession(data.session);
      if (role === "AI Engineer") {
        setActiveModule("systems");
        setAiDashboardTab("performance");
      } else {
        setActiveModule("overview");
      }
    } catch (err) {
      console.error("Login handshake failed", err);
    }
  };

  if (!userSession) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (!dcsState || !modelPerf) {
    return (
      <div className="min-h-screen bg-[#080A0F] flex flex-col items-center justify-center space-y-3 font-mono text-xs text-orange-500">
        <RotateCw className="w-8 h-8 animate-spin text-orange-500" />
        <span className="tracking-widest uppercase">ESTABLISHING SECURE GATEWAY TO SONATRACH...</span>
      </div>
    );
  }

  const activeAlarms = alarms.filter((a) => a.status === "active");

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#E0E0E0] font-sans flex flex-col select-none selection:bg-orange-500/30">
      
      {/* Top SCADA Control Header Row */}
      <header className="no-print h-14 bg-[#131722] border-b border-[#232C3A] flex items-center justify-between px-6 shrink-0">
        
        {/* Brand details */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-orange-500 font-bold tracking-[0.2em] text-[15px] uppercase leading-none font-display">SONATRACH</span>
            <span className="text-[9px] font-mono tracking-wider text-gray-500 leading-tight">ADVANCED MULTIVARIABLE PROCESS OPTIMIZER</span>
          </div>
          <div className="h-6 w-[1px] bg-[#232C3A] mx-2 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider text-gray-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            SCADA CHANNEL: ON-STREAM
          </div>
        </div>

        {/* Operational Context: Role-login, date, and loop state indicators */}
        <div className="flex items-center gap-6">
          {/* Display Clock */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-gray-400 bg-black/30 px-3 py-1.5 rounded border border-[#232C3A]">
            <Clock className="w-3.5 h-3.5 text-orange-500" />
            <span>{timestamp || "Connecting SCADA..."}</span>
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest leading-none">{userSession.role}</span>
            <span className="text-xs font-bold text-white tracking-tight">{userSession.username}</span>
          </div>

          {/* Logout trigger */}
          <div className="relative">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded bg-black/25 text-xs text-gray-400 hover:text-white border border-[#232C3A] hover:border-red-500/40 transition-all flex items-center gap-1.5 font-display uppercase tracking-widest font-bold"
              title="Logout session Clear clearances"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Left synoptic module rail */}
        <nav className="no-print lg:col-span-2 bg-[#131722] border-r border-[#232C3A] p-4 flex flex-col gap-1.5">
          <div className="mb-4 text-[10px] text-gray-500 font-mono tracking-widest uppercase px-3">
            Navigation Rail
          </div>

          {userSession.role === "Operator" ? (
            <>
              {/* Operator Nav Options */}
              <button
                onClick={() => setActiveModule("overview")}
                className={`w-full text-xs font-display font-medium py-2.5 px-3 rounded flex items-center gap-2.5 transition-all text-left border ${
                  activeModule === "overview"
                    ? "bg-orange-500/10 text-orange-500 border-orange-500/30 font-bold shadow-[0_0_12px_rgba(255,107,0,0.05)]"
                    : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-orange-500" />
                Control Main Overview
              </button>

              <button
                onClick={() => setActiveModule("dcs")}
                className={`w-full text-xs font-display font-medium py-2.5 px-3 rounded flex items-center justify-between transition-all text-left border ${
                  activeModule === "dcs"
                    ? "bg-orange-500/10 text-orange-500 border-orange-500/30 font-bold shadow-[0_0_12px_rgba(255,107,0,0.05)]"
                    : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-orange-500" />
                  Live DCS Synoptic
                </div>
                {activeAlarms.length > 0 && (
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                )}
              </button>

              <button
                onClick={() => setActiveModule("optimizer")}
                className={`w-full text-xs font-display font-medium py-2.5 px-3 rounded flex items-center gap-2.5 transition-all text-left border ${
                  activeModule === "optimizer"
                    ? "bg-orange-500/10 text-orange-500 border-orange-500/30 font-bold shadow-[0_0_12px_rgba(255,107,0,0.05)]"
                    : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <Sparkles className="w-4 h-4 text-orange-500" />
                Simulation Optimizer
              </button>

              <button
                onClick={() => setActiveModule("logs")}
                className={`w-full text-xs font-display font-medium py-2.5 px-3 rounded flex items-center justify-between transition-all text-left border ${
                  activeModule === "logs"
                    ? "bg-orange-500/10 text-orange-500 border-orange-500/30 font-bold shadow-[0_0_12px_rgba(255,107,0,0.05)]"
                    : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-orange-500" />
                  Real Experiments
                </div>
              </button>

              <button
                onClick={() => setActiveModule("alarms")}
                className={`w-full text-xs font-display font-medium py-2.5 px-3 rounded flex items-center justify-between transition-all text-left border ${
                  activeModule === "alarms"
                    ? "bg-orange-500/10 text-orange-500 border-orange-500/30 font-bold shadow-[0_0_12px_rgba(255,107,0,0.05)]"
                    : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlertOctagon className="w-4 h-4 text-orange-500" />
                  Alarm Matrix (Center)
                </div>
                {activeAlarms.length > 0 && (
                  <span className="text-[10px] text-red-500 font-mono font-bold bg-red-500/10 px-1.5 rounded animate-pulse">
                    {activeAlarms.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveModule("reports")}
                className={`w-full text-xs font-display font-medium py-2.5 px-3 rounded flex items-center gap-2.5 transition-all text-left border ${
                  activeModule === "reports"
                    ? "bg-orange-500/10 text-orange-500 border-orange-500/30 font-bold shadow-[0_0_12px_rgba(255,107,0,0.05)]"
                    : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <FileText className="w-4 h-4 text-orange-500" />
                Reports & History
              </button>
            </>
          ) : (
            <>
              {/* AI Engineer Nav Options */}
              <button
                onClick={() => {
                  setActiveModule("systems");
                  setAiDashboardTab("performance");
                }}
                className={`w-full text-xs font-display font-medium py-2.5 px-3 rounded flex items-center gap-2.5 transition-all text-left border ${
                  activeModule === "systems" && aiDashboardTab === "performance"
                    ? "bg-orange-500/10 text-orange-500 border-orange-500/30 font-bold shadow-[0_0_12px_rgba(255,107,0,0.05)]"
                    : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <Cpu className="w-4 h-4 text-orange-500" />
                Model Performance
              </button>

              <button
                onClick={() => {
                  setActiveModule("systems");
                  setAiDashboardTab("retrain");
                }}
                className={`w-full text-xs font-display font-medium py-2.5 px-3 rounded flex items-center justify-between transition-all text-left border ${
                  activeModule === "systems" && aiDashboardTab === "retrain"
                    ? "bg-orange-500/10 text-orange-500 border-orange-500/30 font-bold shadow-[0_0_12px_rgba(255,107,0,0.05)]"
                    : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-orange-500" />
                  Retrain Center
                </div>
                {experiments.filter((e) => e.status === "Pending").length > 0 && (
                  <span className="text-[10px] text-orange-500 font-mono font-bold bg-orange-500/10 px-1.5 rounded animate-pulse">
                    {experiments.filter((e) => e.status === "Pending").length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveModule("systems");
                  setAiDashboardTab("history");
                }}
                className={`w-full text-xs font-display font-medium py-2.5 px-3 rounded flex items-center gap-2.5 transition-all text-left border ${
                  activeModule === "systems" && aiDashboardTab === "history"
                    ? "bg-orange-500/10 text-orange-500 border-orange-500/30 font-bold shadow-[0_0_12px_rgba(255,107,0,0.05)]"
                    : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <Table className="w-4 h-4 text-orange-500" />
                Training History
              </button>

              <button
                onClick={() => {
                  setActiveModule("systems");
                  setAiDashboardTab("db");
                }}
                className={`w-full text-xs font-display font-medium py-2.5 px-3 rounded flex items-center gap-2.5 transition-all text-left border ${
                  activeModule === "systems" && aiDashboardTab === "db"
                    ? "bg-orange-500/10 text-orange-500 border-orange-500/30 font-bold shadow-[0_0_12px_rgba(255,107,0,0.05)]"
                    : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <Database className="w-4 h-4 text-orange-500" />
                Database Settings
              </button>
            </>
          )}
        </nav>

        {/* Core module dashboard wrapper */}
        <main className="lg:col-span-10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
          
          {activeModule === "overview" && (
            <div id="executive-overview" className="space-y-6">
              {/* SONATRACH Welcome Call */}
              <div className="bg-black/30 border border-[#232C3A] p-6 rounded-lg">
                <h2 className="text-lg font-display text-gray-200 font-medium">Welcome back, {userSession.username} &bull; SONATRACH Operations Desk</h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  The SONATRACH Multivariable Optimization Console analyzes real-time loops of light naphtha isomerization. It optimizes the Reactor R1 and R2 inlet temperatures using our high-fidelity Differential Evolution Solver to maximize research octane number (RON) and catalyst performance.
                </p>
              </div>

              {/* Executive Bento Grid Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Octane twin index */}
                <div className="bg-[#131722] border border-[#232C3A] rounded-lg p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-gray-500 font-mono block">DCS AVERAGE RON</span>
                  <span className="text-2xl font-mono font-bold text-orange-500 mt-2 block">{dcsState.predictedOctane.toFixed(1)}</span>
                  <span className="text-[10px] text-gray-400 mt-2 block">Isomeric saturation fitment ratio</span>
                </div>

                {/* Alarm active state count */}
                <div className="bg-[#131722] border border-[#232C3A] rounded-lg p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-gray-500 font-mono block">DCS ACTIVE ALARMS</span>
                  <span className={`text-2xl font-mono font-bold mt-2 block ${activeAlarms.length > 0 ? "text-red-500 animate-pulse" : "text-gray-300"}`}>
                    {activeAlarms.length}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-2 block">DCS Loop warning thresholds tripped</span>
                </div>

                {/* Active simulations saved count */}
                <div className="bg-[#131722] border border-[#232C3A] rounded-lg p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-gray-500 font-mono block">SOLVER SIMULATIONS</span>
                  <span className="text-2xl font-mono font-bold text-orange-500 mt-2 block">{simulations.length} runs</span>
                  <span className="text-[10px] text-gray-400 mt-2 block">Differential Evolution optimized profiles</span>
                </div>

                {/* Retraining operator runs */}
                <div className="bg-[#131722] border border-[#232C3A] rounded-lg p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-gray-500 font-mono block">PENDING MODEL ASSESS</span>
                  <span className="text-2xl font-mono font-bold text-amber-500 mt-2 block">
                    {experiments.filter((e) => e.status === "Pending").length} Logs
                  </span>
                  <span className="text-[10px] text-gray-400 mt-2 block">Lab calibrations queued for retraining</span>
                </div>
              </div>

              {/* Status block row for current digital twin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#131722] border border-[#232C3A] rounded-lg p-5">
                <div>
                  <h3 className="text-sm font-display text-gray-300 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-500" />
                    Refinery Loop Diagnostics
                  </h3>
                  <div className="space-y-2 text-xs pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Furnace F-101 Thermal state:</span>
                      <span className="font-mono text-gray-350">{dcsState.r1InletTemp.toFixed(1)} °C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Recycle Loop compressor pressure:</span>
                      <span className="font-mono text-gray-350">{dcsState.r1Pressure.toFixed(2)} bar</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Unified Isomerization Feed Rate:</span>
                      <span className="font-mono text-gray-350">{dcsState.debitCharge} m³/h</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-display text-gray-300 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-orange-500" />
                    Model Calibration State (XGBoost)
                  </h3>
                  <div className="space-y-2 text-xs pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Active Model version context:</span>
                      <span className="font-mono text-orange-500 font-bold">{modelPerf.performance.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Coefficient of Determination (R²):</span>
                      <span className="font-mono text-emerald-500 font-bold">{modelPerf.performance.r2.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Model predicted margin error (RMSE):</span>
                      <span className="font-mono text-gray-350">± {modelPerf.performance.rmse.toFixed(3)} RON</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Launchpad buttons */}
              {userSession.role === "Operator" && (
                <div className="flex flex-wrap gap-4 pt-1 justify-center">
                  <button
                    onClick={() => setActiveModule("dcs")}
                    className="bg-orange-600 text-white px-5 py-3 rounded text-xs font-bold font-display uppercase tracking-wider hover:bg-orange-500 transition-all cursor-pointer"
                  >
                    Inspect P&ID DCS mimic
                  </button>
                  <button
                    onClick={() => setActiveModule("optimizer")}
                    className="bg-orange-600 text-white px-5 py-3 rounded text-xs font-bold font-display uppercase tracking-wider hover:bg-orange-500 transition-all cursor-pointer"
                  >
                    Configure Optimizer Setpoints
                  </button>
                </div>
              )}
            </div>
          )}

          {activeModule === "dcs" && (
            <div className="space-y-6">
              <DCSMonitoring dcsState={dcsState} onRefresh={fetchDcsData} />
            </div>
          )}

          {activeModule === "optimizer" && (
            <div className="space-y-6">
              <NSGAOptimizer 
                dcsState={dcsState} 
                onApplySetpoints={handleApplySetpoints} 
                onSaveSimulation={handleSaveSimulation} 
              />
            </div>
          )}

          {activeModule === "logs" && (
            <div className="space-y-6">
              <EmpiricalLogs 
                dcsState={dcsState} 
                experiments={experiments} 
                onAddExperiment={handleAddExperiment} 
              />
            </div>
          )}

          {activeModule === "systems" && (
            <div className="space-y-6">
              {userSession.role === "AI Engineer" ? (
                <SystemsEngineerDashboard 
                  performance={modelPerf.performance} 
                  history={modelPerf.history}
                  experiments={experiments}
                  isRetraining={modelPerf.isRetraining}
                  onApproveExperiment={handleApproveExperiment}
                  onRejectExperiment={handleRejectExperiment}
                  onTriggerRetrain={handleTriggerModelRetrain}
                  activeTab={aiDashboardTab}
                  onTabChange={setAiDashboardTab}
                />
              ) : (
                <div className="p-8 text-center text-xs bg-black/40 border border-[#232C3A] rounded-lg">
                  <h3 className="font-bold text-red-500 uppercase font-display flex items-center justify-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-red-500 animate-pulse" />
                    Authorization Boundary Error
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Engine parameter modeling is restricted strictly to authorized <strong>AI Engineers</strong>. Let your system administrator elevate your clearance tags.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeModule === "alarms" && (
            <div className="space-y-6">
              <AlarmsPanel 
                alarms={alarms} 
                onAcknowledgeAlarm={handleAcknowledgeAlarm} 
                onClearAll={handleClearAlarms} 
              />
            </div>
          )}

          {activeModule === "reports" && (
            <div className="space-y-6">
              <ReportsCenter 
                simulations={simulations} 
                experiments={experiments} 
                alarms={alarms} 
              />
            </div>
          )}
        </main>
      </div>

      {/* Footer bar */}
      <footer className="no-print bg-[#131722] border-t border-[#232C3A] px-6 py-3.5 text-center text-[10px] text-gray-500 font-mono uppercase tracking-wider">
        SONATRACH CORE PROCESS OPTIMIZATION SOFTWARE &bull; Developed by: Yaminaa Difllah &bull; ADVANCED MODEL ENGINE
      </footer>
    </div>
  );
}
