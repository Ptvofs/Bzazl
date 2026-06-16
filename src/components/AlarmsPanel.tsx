import React from "react";
import { AlarmItem } from "../types";
import { AlertOctagon, CheckSquare, ShieldAlert, Award } from "lucide-react";

interface AlarmsPanelProps {
  alarms: AlarmItem[];
  onAcknowledgeAlarm: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}

export const AlarmsPanel: React.FC<AlarmsPanelProps> = ({ 
  alarms, 
  onAcknowledgeAlarm,
  onClearAll
}) => {
  const activeAlarms = alarms.filter((a) => a.status === "active");
  const acknowledgedAlarms = alarms.filter((a) => a.status === "acknowledged");

  return (
    <div id="alarm-matrix-panel" className="bg-industrial-panel border border-industrial-border rounded-lg p-5">
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-industrial-border/60">
        <div>
          <h3 className="text-sm font-display font-medium text-gray-200 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-dcs-red indicator-pulse" />
            Alarm Matrix Control Console
          </h3>
          <p className="text-xs text-slate-500">Active Tag triggers, pressure thresholds, and thermodynamic anomaly alerts</p>
        </div>
        <button
          onClick={onClearAll}
          className="text-xs font-display font-medium text-dcs-blue h-7 hover:underline flex items-center gap-1 uppercase tracking-wider bg-dcs-blue/10 border border-dcs-blue/20 px-3 rounded hover:bg-dcs-blue/20"
        >
          Acknowledge & Calibrate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Alarms */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 font-display mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-dcs-red indicator-pulse" />
            Active Alarms ({activeAlarms.length})
          </h4>

          {activeAlarms.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 bg-black/20 border border-dashed border-industrial-border rounded flex flex-col items-center justify-center space-y-2">
              <Award className="w-8 h-8 text-dcs-green" />
              <span>DCS loop values are perfectly stable. Zero active alerts.</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto no-scrollbar">
              {activeAlarms.map((a) => (
                <div
                  key={a.id}
                  className={`p-3 rounded border text-xs font-mono flex items-center justify-between transition-all ${
                    a.severity === "critical"
                      ? "bg-dcs-red/10 border-dcs-red/30 text-dcs-red"
                      : "bg-dcs-amber/10 border-dcs-amber/30 text-dcs-amber"
                  }`}
                >
                  <div className="flex gap-3 items-center">
                    <ShieldAlert className="w-5 h-5 shrink-0 indicator-pulse" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{a.tag}</span>
                        <span className="text-[10px] bg-black/40 px-1 rounded uppercase">{a.severity}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{a.description}</div>
                      <div className="text-[10px] mt-1 text-gray-400">Value: {a.value} &bull; Limit: {a.limit}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onAcknowledgeAlarm(a.id)}
                    className="p-1 px-2.5 rounded text-[10px] font-bold uppercase transition-all bg-black/40 hover:bg-black/60 border border-white/10"
                  >
                    Ack
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History Acknowledged */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 font-display mb-3">
            <CheckSquare className="w-4 h-4 text-dcs-blue" />
            Acknowledged / Calibrated Alerts ({acknowledgedAlarms.length})
          </h4>

          {acknowledgedAlarms.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-black/20 border border-dashed border-industrial-border rounded-lg italic">
              No acknowledged alarm entries in current loop session.
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto no-scrollbar">
              {acknowledgedAlarms.map((a) => (
                <div
                  key={a.id}
                  className="p-3 bg-white/5 border border-industrial-border rounded text-xs font-mono flex justify-between items-center text-gray-400"
                >
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{a.tag}</span>
                      <span className="text-[10px] bg-black/40 text-gray-500 px-1 rounded uppercase">ACKNOWLEDGED</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{a.description}</div>
                    <div className="text-[10px] mt-1">Value: {a.value} &bull; Limit: {a.limit}</div>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
