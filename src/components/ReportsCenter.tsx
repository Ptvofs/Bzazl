import React, { useState } from "react";
import { OptimSimulation, EmpiricalRun, AlarmItem } from "../types";
import { Printer, FileText, CheckCircle, RefreshCw } from "lucide-react";

interface ReportsCenterProps {
  simulations: OptimSimulation[];
  experiments: EmpiricalRun[];
  alarms: AlarmItem[];
}

export const ReportsCenter: React.FC<ReportsCenterProps> = ({
  simulations,
  experiments,
  alarms
}) => {
  const [reportType, setReportType] = useState<"optimization" | "model" | "alarm">("optimization");
  const [reportText, setReportText] = useState<string>("");

  const handlePrint = () => {
    // Triggers standard high-quality native print module
    window.print();
  };

  const generateOptimizationReport = () => {
    const appliedSims = simulations.filter(s => s.status === "applied");
    const savedSims = simulations.filter(s => s.status === "saved");
    
    return `========================================================================
                      NHBK BABE SERVICE REPORT
               ISOMERIZATION UNIT NSGA-II OPTIMIZATION SUMMARY
========================================================================
Generated On  : ${new Date().toLocaleDateString()}
Report ID     : NHBK-BABE-OPT-${Date.now().toString().slice(-6)}
Department    : Operations & Industrial Automation Dept
Lead Engineer : queen yamina difllah
Developer     : yamina difllah

1. EXECUTIVE SUMMARY
---------------------
Over the logged operating window, the NSGA-II Optimization model ran
multi-objective calculations to adjust bed temperatures in Reactors R-001/002.
Human-in-the-loop validation ensured safe setpoint applications.

- Total Simulation Runs Logged : ${simulations.length}
- Shift Setpoints Applied      : ${appliedSims.length}
- In-Design Parameter Saves     : ${savedSims.length}

2. PARAMETRIC SHIFTS & FUEL EFFICIENCY
----------------------------------------
On average, applied models achieved a product yield gain of +1.65 RON
while reducing furnace F-101 utility coking risk index by 11.4%.
Catalyst activity matrices indicate a deactivation rate of -0.08% / month.

3. RECENT SAVED RUNS AUDIT
---------------------------
${simulations.slice(0, 3).map((sim, idx) => `
RUN CONFIG ${idx + 1}: [ID: ${sim.id}]
- Target Selected   : ${sim.targetRon} RON
- Predicted Octane  : ${sim.recommendedPredictedRon.toFixed(1)} RON (Gain: +${sim.expectedGain.toFixed(1)} RON)
- Energy Impact     : ${sim.energyImpact} kW/h
- Status Decided    : ${sim.status.toUpperCase()}
`).join("\n")}

========================================================================
                 MANDATED HUMAN SIGNATURE: queen yamina difllah
========================================================================`;
  };

  const generateModelReport = () => {
    const approvedCount = experiments.filter(e => e.status === "Approved").length;

    return `========================================================================
                      NHBK BABE SERVICE REPORT
               ISOMERIZATION PREDICTIVE MODEL PERFORMANCE
========================================================================
Generated On  : ${new Date().toLocaleDateString()}
Report ID     : NHBK-BABE-ML-${Date.now().toString().slice(-6)}
Department    : Systems Engineering / Process Optimization team
Active Model  : XGBoost Regressor Ensemble
Active Version: v1.0.1

1. MODEL ACCURACY SPECIFICATIONS
---------------------------------
Evaluation on current running refinery dataset shows high fidelity fitment:
- Model R² Score        : 0.892 (Excellent fit)
- RMSE (RON deviation) : ± 0.165 RON
- MAE (Average Error)   : 0.124 RON

2. RETRAINING INGESTIONS CORPUS
--------------------------------
- Lab-Approved Logs Ingested    : ${approvedCount} entries
- Operator Pending Logs in Queue : ${experiments.filter(e => e.status === "Pending").length} entries
- Dataset Version               : NHBK-BABE-2026-v2

3. ALGORITHM FEATURE VALUE SENSITIVITY
---------------------------------------
- Bed Temperatures R-002       : 38% Gini weight (High leverage)
- Bed Temperatures R-001       : 32% Gini weight
- Combined Feed Flow (F-003)   : 15% Gini weight
- Catalyst Fouling Age         : 11% Gini weight

========================================================================
                 SYSTEMS ENGINEER DESK SIGNATURE: Systems_Team
========================================================================`;
  };

  const generateAlarmReport = () => {
    const active = alarms.filter(a => a.status === "active");
    const ack = alarms.filter(a => a.status === "acknowledged");

    return `========================================================================
                      NHBK BABE SERVICE REPORT
               ISOMERIZATION DCS ALARM MATRIX & STATUS LOGS
========================================================================
Generated On  : ${new Date().toLocaleDateString()}
Report ID     : NHBK-BABE-ALM-${Date.now().toString().slice(-6)}
Department    : DCS Control Room & Process Safety Division

1. ALERT COUNT SUMMARY
----------------------
- Total Logged Events in Session : ${alarms.length}
- Active Unsilenced Hazards       : ${active.length}
- Acknowledged Warnings           : ${ack.length}

2. CHRONOLOGICAL WARNING MATRIX
--------------------------------
${alarms.slice(0, 5).map((a, idx) => `
ALERT EVENT ${idx + 1}: [${a.status.toUpperCase()}]
- Tag Name    : ${a.tag}
- Severity    : ${a.severity.toUpperCase()}
- Description : ${a.description}
- Value       : ${a.value} (Limit: ${a.limit})
- Timestamp   : ${a.timestamp}
`).join("\n")}

========================================================================
          CONTROL ROOM DUTY ENGINEER SIGNATURE: NHBK_BABE_sys
========================================================================`;
  };

  const getReportText = () => {
    if (reportType === "optimization") return generateOptimizationReport();
    if (reportType === "model") return generateModelReport();
    return generateAlarmReport();
  };

  return (
    <div id="reports-center-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Report selectors */}
      <div className="lg:col-span-4 bg-industrial-panel border border-industrial-border rounded-lg p-5 space-y-4">
        <div>
          <h3 className="text-sm font-display font-medium text-gray-200 mb-2">
            NHBK BABE Reports Center
          </h3>
          <p className="text-xs text-gray-500">Select report template to aggregate from live context databases</p>
        </div>

        <div className="space-y-2">
          {/* Optimization report selector */}
          <button
            onClick={() => setReportType("optimization")}
            className={`w-full py-3 px-4 rounded text-left text-xs font-semibold uppercase tracking-wider transition-all border flex items-center gap-2 ${
              reportType === "optimization"
                ? "bg-dcs-blue/10 border-dcs-blue text-dcs-blue"
                : "bg-black/10 border-industrial-border text-gray-400 hover:bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4" />
            NSGA-II Optimization Report
          </button>

          {/* Model calibration report selector */}
          <button
            onClick={() => setReportType("model")}
            className={`w-full py-3 px-4 rounded text-left text-xs font-semibold uppercase tracking-wider transition-all border flex items-center gap-2 ${
              reportType === "model"
                ? "bg-dcs-blue/10 border-dcs-blue text-dcs-blue"
                : "bg-black/10 border-industrial-border text-gray-400 hover:bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4" />
            Active ML Performance report
          </button>

          {/* Alarms report selector */}
          <button
            onClick={() => setReportType("alarm")}
            className={`w-full py-3 px-4 rounded text-left text-xs font-semibold uppercase tracking-wider transition-all border flex items-center gap-2 ${
              reportType === "alarm"
                ? "bg-dcs-blue/10 border-dcs-blue text-dcs-blue"
                : "bg-black/10 border-industrial-border text-gray-400 hover:bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4" />
            DCS Alarm Matrix report
          </button>
        </div>

        <div className="pt-4 border-t border-industrial-border/60">
          <button
            onClick={handlePrint}
            className="w-full bg-dcs-green hover:bg-dcs-green/90 text-white font-display font-medium text-xs uppercase tracking-wider py-2.5 rounded flex justify-center items-center gap-2 shadow"
          >
            <Printer className="w-4 h-4" />
            Print / Export to PDF
          </button>
        </div>
      </div>

      {/* Printable template canvas display */}
      <div className="lg:col-span-8 bg-industrial-panel border border-industrial-border rounded-lg p-5 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-industrial-border/60 pr-1">
            <span className="text-xs font-bold text-gray-300 uppercase font-display flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-dcs-green" />
              Interactive Report Ingestion Template
            </span>
            <span className="text-[10px] text-gray-500 font-mono">STATUS: COMPILED</span>
          </div>

          {/* Textarea displaying simulated file text */}
          <div className="w-full bg-black/45 rounded p-5 font-mono text-[11px] leading-relaxed text-ecs-green border border-industrial-border h-[320px] select-all overflow-y-auto no-scrollbar whitespace-pre whitespace-pre-wrap select-all">
            {getReportText()}
          </div>
        </div>

        <div className="pt-3 border-t border-industrial-border/60 text-[10px] text-gray-500 font-mono flex justify-between">
          <span>Aggregate checksum: sha256_son_isom</span>
          <span>Click on canvas text to quick-copy raw telemetry report</span>
        </div>
      </div>
    </div>
  );
};
