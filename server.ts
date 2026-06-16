import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  evaluateModelPerformance, 
  predictOctaneValue, 
  retrainXGBoostModel, 
  runNSGA2Optimizer, 
  runDifferentialEvolutionOptimizer,
  modelHistory, 
  getActiveCoefficients 
} from "./src/utils/ml";
import { RefineryDataset } from "./src/data/RefineryDataset";
import { DCSState, OptimSimulation, EmpiricalRun, AlarmItem, UserSession } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent state simulated in memory / temporary server-side storage
let activeUser: UserSession | null = null;

// Seed DCS state based on final historical point
let currentBaseTemps = {
  r1Inlet: 106.2,
  r2Inlet: 108.5
};

let currentBaseFlow = 110.0; // Combined feed
let currentBaseH2 = 2650.0; // Hydrogen recycle flow
let currentBasePressure = 33.9; // bar
let catalystAgeMonths = 31.8; // Age of catalyst bed in months
let isRetraining = false;

// Mock database for saved simulations and empirical run logs
let savedSimulations: OptimSimulation[] = [
  {
    id: "SIM-20260610-01",
    timestamp: "2026-06-10T14:32:00Z",
    operatorName: "v.khalzone",
    status: "saved",
    catalystAge: 31.5,
    targetRon: 96.0,
    currentTemps: { r1Inlet: 106.0, r2Inlet: 108.0 },
    currentPredictedRon: 86.8,
    recommendedTemps: { r1Inlet: 138.5, r2Inlet: 139.2 },
    recommendedPredictedRon: 95.8,
    expectedGain: 9.0,
    energyImpact: 35.8, // in kW equivalent
    riskIndicator: "Low",
    confidenceScore: 94.5,
    notes: "Baseline calibration simulation for high RON operation"
  },
  {
    id: "SIM-20260614-04",
    timestamp: "2026-06-14T09:15:30Z",
    operatorName: "v.khalzone",
    status: "applied",
    catalystAge: 31.7,
    targetRon: 88.0,
    currentTemps: { r1Inlet: 101.5, r2Inlet: 103.2 },
    currentPredictedRon: 86.0,
    recommendedTemps: { r1Inlet: 106.2, r2Inlet: 108.5 },
    recommendedPredictedRon: 88.1,
    expectedGain: 2.1,
    energyImpact: 8.5,
    riskIndicator: "Low",
    confidenceScore: 98.2,
    notes: "Calibrated on shift 2 - aligned product to standard gasoline RON"
  }
];

let empiricalRuns: EmpiricalRun[] = [
  {
    id: "EXP-20260601-10",
    timestamp: "2026-06-01T22:15:00Z",
    operatorName: "Operator.Kamal",
    r1BedAvg: 111.0,
    r2BedAvg: 122.5,
    pressure: 33.5,
    flowCharge: 108.2,
    actualOctane: 88.0,
    catalystAge: 31.2,
    status: "Approved",
    approvedDate: "2026-06-02T08:12:00Z",
    approvedBy: "v.khalzone"
  },
  {
    id: "EXP-20260612-14",
    timestamp: "2026-06-12T16:45:00Z",
    operatorName: "Operator.Djamel",
    r1BedAvg: 118.5,
    r2BedAvg: 125.6,
    pressure: 33.8,
    flowCharge: 110.0,
    actualOctane: 88.2,
    catalystAge: 31.5,
    status: "Approved",
    approvedDate: "2026-06-13T10:00:00Z",
    approvedBy: "v.khalzone"
  },
  {
    id: "EXP-238",
    timestamp: "2026-06-15T23:30:00Z",
    operatorName: "Operator.Djamel",
    r1BedAvg: 122.2,
    r2BedAvg: 128.5,
    pressure: 34.0,
    flowCharge: 110.1,
    actualOctane: 87.0, // Low Octane anomalously
    catalystAge: 31.7,
    status: "Pending"
  }
];

let alarms: AlarmItem[] = [];

// Fluctuating state generator (DCS feel)
function getDCSState(): DCSState {
  const noise = (min: number, max: number) => min + Math.random() * (max - min);

  // Fluctuations on flow and recycle
  const liveCharge = currentBaseFlow + noise(-0.4, 0.4);
  const liveTce = 8.91 + noise(-0.1, 0.1);
  const liveH2 = currentBaseH2 + noise(-12, 12);
  const livePressure = currentBasePressure + noise(-0.15, 0.15);

  // Calculate bed temperatures distribution based on inlet
  const tIn1 = currentBaseTemps.r1Inlet + noise(-0.2, 0.2);
  const r1BedTemps = {
    ti0025: tIn1 + 1.85 + noise(-0.1, 0.1),
    ti0026: tIn1 + 10.45 + noise(-0.2, 0.2),
    ti0027: tIn1 + 15.13 + noise(-0.1, 0.1),
    ti0028: tIn1 + 14.28 + noise(-0.15, 0.15),
    ti0029: tIn1 + 14.89 + noise(-0.1, 0.15),
    ti0030: tIn1 + 21.68 + noise(-0.3, 0.3), // Outlet temperature
  };
  const r1Avg = (r1BedTemps.ti0025 + r1BedTemps.ti0026 + r1BedTemps.ti0027 + r1BedTemps.ti0028 + r1BedTemps.ti0029 + r1BedTemps.ti0030) / 6;

  const tIn2 = currentBaseTemps.r2Inlet + noise(-0.2, 0.2);
  const r2BedTemps = {
    ti0031: tIn2 + 2.15 + noise(-0.1, 0.1),
    ti0032: tIn2 + 3.12 + noise(-0.2, 0.2),
    ti0033: tIn2 + 2.08 + noise(-0.15, 0.15),
    ti0034: tIn2 + 10.45 + noise(-0.2, 0.2),
    ti0035: tIn2 + 12.18 + noise(-0.3, 0.3),
    ti0036: tIn2 + 12.91 + noise(-0.25, 0.25),
  };
  const r2Avg = (r2BedTemps.ti0031 + r2BedTemps.ti0032 + r2BedTemps.ti0033 + r2BedTemps.ti0034 + r2BedTemps.ti0035 + r2BedTemps.ti0036) / 6;

  // Catalyst Fouling Analysis
  // Catalyst deactivates over time, requiring higher temperatures to maintain same delta T conversion
  const designR1Delta = 21.0;
  const currentR1Delta = r1BedTemps.ti0030 - tIn1;
  const deactivationFactor = Math.max(0.65, 1 - (catalystAgeMonths * 0.008)); // degradation curve
  const catalystEfficiency = parseFloat((deactivationFactor * 100).toFixed(1));
  const catalystRemainingLife = Math.max(30, Math.floor(730 - (catalystAgeMonths * 21)));

  // Lab analysis predicted Octane is computed live on current bed averages
  const predictedOctane = predictOctaneValue(
    r1Avg,
    r2Avg,
    liveCharge,
    catalystAgeMonths,
    liveH2
  );

  const state: DCSState = {
    timestamp: new Date().toISOString(),
    debitTce: parseFloat(liveTce.toFixed(2)),
    debitCharge: parseFloat(liveCharge.toFixed(2)),
    debitH2: parseFloat(liveH2.toFixed(1)),
    recycleRatio: parseFloat((liveH2 / liveCharge).toFixed(2)),
    
    r1InletTemp: parseFloat(tIn1.toFixed(1)),
    r1BedTemps: {
      ti0025: parseFloat(r1BedTemps.ti0025.toFixed(1)),
      ti0026: parseFloat(r1BedTemps.ti0026.toFixed(1)),
      ti0027: parseFloat(r1BedTemps.ti0027.toFixed(1)),
      ti0028: parseFloat(r1BedTemps.ti0028.toFixed(1)),
      ti0029: parseFloat(r1BedTemps.ti0029.toFixed(1)),
      ti0030: parseFloat(r1BedTemps.ti0030.toFixed(1))
    },
    r1OutletTemp: parseFloat(r1BedTemps.ti0030.toFixed(1)),
    r1Pressure: parseFloat(livePressure.toFixed(2)),
    r1DeltaT: parseFloat(currentR1Delta.toFixed(1)),

    r2InletTemp: parseFloat(tIn2.toFixed(1)),
    r2BedTemps: {
      ti0031: parseFloat(r2BedTemps.ti0031.toFixed(1)),
      ti0032: parseFloat(r2BedTemps.ti0032.toFixed(1)),
      ti0033: parseFloat(r2BedTemps.ti0033.toFixed(1)),
      ti0034: parseFloat(r2BedTemps.ti0034.toFixed(1)),
      ti0035: parseFloat(r2BedTemps.ti0035.toFixed(1)),
      ti0036: parseFloat(r2BedTemps.ti0036.toFixed(1))
    },
    r2OutletTemp: parseFloat(r2BedTemps.ti0036.toFixed(1)),
    r2Pressure: parseFloat((livePressure - 0.65).toFixed(2)), // Pressure drop
    r2DeltaT: parseFloat((r2BedTemps.ti0036 - tIn2).toFixed(1)),

    catalystAge: parseFloat(catalystAgeMonths.toFixed(1)),
    catalystEfficiency,
    catalystRemainingLife,
    predictedOctane,
    actualOctane: 87.2 // Updated periodically by lab logs
  };

  // Automated Alarm Checks
  checkAlarmThresholds(state);

  return state;
}

// Alarm checking engine
function checkAlarmThresholds(state: DCSState) {
  const currentAlarms: AlarmItem[] = [];

  // 1. High temperature in any R-001 bed (> 145 C)
  const maxR1Temp = Math.max(...Object.values(state.r1BedTemps));
  if (maxR1Temp > 145.0) {
    currentAlarms.push({
      id: `ALM-T1-${Date.now()}`,
      timestamp: new Date().toISOString(),
      tag: "510.TI0030_MAX",
      description: "Reactor R-001 Bed High Temperature Alarm",
      value: `${maxR1Temp.toFixed(1)} °C`,
      limit: "145.0 °C",
      severity: "critical",
      status: "active"
    });
  }

  // 2. High temperature in any R-002 bed (> 145 C)
  const maxR2Temp = Math.max(...Object.values(state.r2BedTemps));
  if (maxR2Temp > 145.0) {
    currentAlarms.push({
      id: `ALM-T2-${Date.now()}`,
      timestamp: new Date().toISOString(),
      tag: "510.TI0036_MAX",
      description: "Reactor R-002 Bed High Temperature Alarm",
      value: `${maxR2Temp.toFixed(1)} °C`,
      limit: "145.0 °C",
      severity: "critical",
      status: "active"
    });
  }

  // 3. High pressure (> 35 bar)
  if (state.r1Pressure > 35.0) {
    currentAlarms.push({
      id: `ALM-P1-${Date.now()}`,
      timestamp: new Date().toISOString(),
      tag: "510.PI0035",
      description: "Reactor R-001 Inlet High Pressure Warning",
      value: `${state.r1Pressure.toFixed(2)} bar`,
      limit: "35.00 bar",
      severity: "warning",
      status: "active"
    });
  }

  // 4. Low predicted octane (< 84 RON is off-specs)
  if (state.predictedOctane < 84.0) {
    currentAlarms.push({
      id: `ALM-RON-${Date.now()}`,
      timestamp: new Date().toISOString(),
      tag: "DCS.PredictedRon",
      description: "Product Octane Below Performance Boundary Limit",
      value: `${state.predictedOctane.toFixed(1)} RON`,
      limit: "84.0 RON",
      severity: "warning",
      status: "active"
    });
  }

  // Sync alarms (keep active ones and persist older ones logged)
  // Ensure we don't spam multiple of same type
  currentAlarms.forEach((act) => {
    const exists = alarms.some((exist) => exist.tag === act.tag && exist.status === "active");
    if (!exists) {
      alarms.unshift(act);
    }
  });
}

// REST APIs
app.get("/api/session", (req, res) => {
  res.json({ session: activeUser });
});

app.post("/api/login", (req, res) => {
  const { username, role } = req.body;
  if (!role) {
    return res.status(400).json({ error: "Role is required" });
  }
  activeUser = {
    username: username || "Yaminaa Difllah",
    role: role as any,
    email: username && username.includes("@") ? username : "yaminaa.difllah@sonatrach.dz",
    company: "SONATRACH"
  };
  res.json({ session: activeUser });
});

app.post("/api/logout", (req, res) => {
  activeUser = null;
  res.json({ success: true });
});

// DCS live telemetry loop
app.get("/api/dcs/state", (req, res) => {
  res.json(getDCSState());
});

// Admin triggers changes to DCS (setpoints applied)
app.post("/api/dcs/apply", (req, res) => {
  const { r1Inlet, r2Inlet } = req.body;
  if (typeof r1Inlet !== "number" || typeof r2Inlet !== "number") {
    return res.status(400).json({ error: "Invalid temperatures provided" });
  }

  // Apply setpoint changes
  currentBaseTemps.r1Inlet = r1Inlet;
  currentBaseTemps.r2Inlet = r2Inlet;

  // Let fuel consumption change dcs parameters
  res.json({ success: true, message: `Reactor setpoints set R-001: ${r1Inlet}°C, R-002: ${r2Inlet}°C` });
});

// Get Optimizer runs and trigger Differential Evolution Solver
app.post("/api/optimizer/run", (req, res) => {
  const { catalystAge } = req.body;
  const dcs = getDCSState();
  const effAge = catalystAge !== undefined ? Number(catalystAge) : dcs.catalystAge;

  const options = runDifferentialEvolutionOptimizer(effAge, {
    debitTce: dcs.debitTce,
    debitCharge: dcs.debitCharge,
    debitH2: dcs.debitH2,
    pEntreeR1: dcs.r1Pressure,
    tEntreeR1: dcs.r1InletTemp,
    tEntreeR2: dcs.r2InletTemp
  });

  res.json({ options });
});

// Saved simulations history
app.get("/api/simulations", (req, res) => {
  res.json({ simulations: savedSimulations });
});

app.post("/api/simulations", (req, res) => {
  const sim: OptimSimulation = {
    id: `SIM-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    operatorName: activeUser ? activeUser.username : "Yaminaa Difllah",
    ...req.body
  };
  savedSimulations.unshift(sim);
  res.json({ success: true, simulation: sim });
});

// Empirical Run logs endpoints
app.get("/api/experiments", (req, res) => {
  res.json({ experiments: empiricalRuns });
});

app.post("/api/experiments", (req, res) => {
  const { r1BedAvg, r2BedAvg, pressure, flowCharge, actualOctane, catalystAge } = req.body;
  if (!r1BedAvg || !r2BedAvg || !actualOctane) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  const newLog: EmpiricalRun = {
    id: `EXP-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    operatorName: activeUser ? activeUser.username : "Yaminaa Difllah",
    r1BedAvg: parseFloat(r1BedAvg),
    r2BedAvg: parseFloat(r2BedAvg),
    pressure: parseFloat(pressure || 33.8),
    flowCharge: parseFloat(flowCharge || 110.0),
    actualOctane: parseFloat(actualOctane),
    catalystAge: parseFloat(catalystAge || catalystAgeMonths),
    status: "Pending"
  };

  empiricalRuns.unshift(newLog);
  res.json({ success: true, record: newLog });
});

app.post("/api/experiments/:id/approve", (req, res) => {
  const { id } = req.params;
  const exp = empiricalRuns.find((e) => e.id === id);
  if (!exp) return res.status(404).json({ error: "Experiment not found" });

  exp.status = "Approved";
  exp.approvedDate = new Date().toISOString();
  exp.approvedBy = activeUser ? activeUser.username : "AI Engineer";

  res.json({ success: true, experiment: exp });
});

app.post("/api/experiments/:id/reject", (req, res) => {
  const { id } = req.params;
  const exp = empiricalRuns.find((e) => e.id === id);
  if (!exp) return res.status(404).json({ error: "Experiment not found" });

  exp.status = "Rejected";
  res.json({ success: true, experiment: exp });
});

// Systems Engineer Retraining endpoint
app.post("/api/models/retrain", (req, res) => {
  isRetraining = true;

  // Filter approved runs to integrate into model training
  const approvedRuns = empiricalRuns.filter((e) => e.status === "Approved");

  // Train the Linear Ridge of ML Model with new data points
  setTimeout(() => {
    try {
      const newModel = retrainXGBoostModel(
        approvedRuns.map((r) => ({
          r1BedAvg: r.r1BedAvg,
          r2BedAvg: r.r2BedAvg,
          pressure: r.pressure,
          flowCharge: r.flowCharge,
          actualOctane: r.actualOctane,
          catalystAge: r.catalystAge
        }))
      );
      isRetraining = false;
      res.json({ success: true, model: newModel });
    } catch (err: any) {
      isRetraining = false;
      res.status(500).json({ error: err.message });
    }
  }, 1500); // simulate some training latency
});

// Model definitions and performance criteria
app.get("/api/models/active", (req, res) => {
  const activeCoeffs = getActiveCoefficients();
  const evaluation = evaluateModelPerformance(RefineryDataset, activeCoeffs);

  // Compute mock feature importance based on actual Isomeric correlations
  const featureImportance = [
    { name: "Bed Temperatures R-002 (TI0031-36)", value: 38 },
    { name: "Bed Temperatures R-001 (TI0025-30)", value: 32 },
    { name: "Combined Feed Flow (FIC0003)", value: 15 },
    { name: "Catalyst Ageing Fouling", value: 11 },
    { name: "H2/HC Ratio Recycle", value: 4 }
  ];

  res.json({
    performance: {
      algorithm: "XGBoost Regressor Ensemble",
      version: modelHistory[modelHistory.length - 1].version,
      trainingDate: modelHistory[modelHistory.length - 1].trainingDate,
      datasetVersion: `NHBK-BABE-2026-v${modelHistory.length}`,
      datasetSize: modelHistory[modelHistory.length - 1].datasetSize,
      r2: modelHistory[modelHistory.length - 1].r2,
      rmse: modelHistory[modelHistory.length - 1].rmse,
      mae: modelHistory[modelHistory.length - 1].mae,
      mape: modelHistory[modelHistory.length - 1].mape,
      featureImportance,
      predictedVsActual: evaluation.predictedVsActual,
      residuals: evaluation.residuals
    },
    history: modelHistory,
    isRetraining
  });
});

// Alarms administration
app.get("/api/alarms", (req, res) => {
  res.json({ alarms });
});

app.post("/api/alarms/acknowledge", (req, res) => {
  const { id } = req.body;
  const alarm = alarms.find((a) => a.id === id);
  if (alarm) {
    alarm.status = "acknowledged";
  }
  res.json({ success: true, alarms });
});

app.post("/api/alarms/clearAll", (req, res) => {
  // Clear all acknowledged alarms and reset active ones (simulate sensor recalibration)
  alarms = alarms.filter(a => a.status === "active").map(a => {
    a.status = "resolved";
    return a;
  });
  res.json({ success: true, alarms });
});

// Dataset details
app.get("/api/dataset", (req, res) => {
  res.json({
    lastUpdate: "2026-06-12",
    rowCount: RefineryDataset.length,
    featureCount: 16,
    targetVariable: "Indice d'octane (RON)",
    firstDate: "2022-01-01",
    lastDate: "2026-05-19"
  });
});

// Build setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => { // Express v5 wildcard routing handles '*all' strictly
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NHBK BABE Process Optimization System running on port ${PORT}`);
  });
}

startServer();
