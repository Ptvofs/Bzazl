export type UserRole = "Operator" | "AI Engineer";

export interface UserSession {
  username: string;
  role: UserRole;
  email: string;
  company: string;
}

export interface DCSState {
  timestamp: string;
  // Flow rates
  debitTce: number;          // FI0017 (TCE flow in kg/h)
  debitCharge: number;       // FIC0003 (Combined feed flow in m3/h)
  debitH2: number;           // FI0008 (H2 flow in Nm3/h)
  recycleRatio: number;      // Calculated recycle ratio
  
  // Reactor R-001 bed temps & pressure
  r1InletTemp: number;       // TIC0024 (Inlet Temp)
  r1BedTemps: {
    ti0025: number;
    ti0026: number;
    ti0027: number;
    ti0028: number;
    ti0029: number;
    ti0030: number;
  };
  r1OutletTemp: number;      // Average outlet or TI0030
  r1Pressure: number;        // PI0035 (Inlet pressure in bar or kg/cm2)
  r1DeltaT: number;          // Calculated temperature difference

  // Reactor R-002 bed temps & pressure
  r2InletTemp: number;       // Inferred from R-001 outlet or sensor
  r2BedTemps: {
    ti0031: number;
    ti0032: number;
    ti0033: number;
    ti0034: number;
    ti0035: number;
    ti0036: number;
  };
  r2OutletTemp: number;
  r2Pressure: number;
  r2DeltaT: number;

  // Catalyst parameters
  catalystAge: number;       // In days
  catalystEfficiency: number;// % health based on delta T vs Temp curve
  catalystRemainingLife: number; // In days

  // Decoded target
  predictedOctane: number;   // ML-predicted RON
  actualOctane: number | null; // Lab/analytical validation if any
}

export interface OptimSimulation {
  id: string;
  timestamp: string;
  operatorName: string;
  status: "applied" | "rejected" | "saved";
  catalystAge: number;
  targetRon: number;
  
  // Before optimization
  currentTemps: {
    r1Inlet: number;
    r2Inlet: number;
  };
  currentPredictedRon: number;

  // Recommendations
  recommendedTemps: {
    r1Inlet: number;
    r2Inlet: number;
  };
  recommendedPredictedRon: number;
  
  expectedGain: number;       // Gain in RON
  energyImpact: number;       // kW/h or Fuel savings %
  riskIndicator: "Low" | "Medium" | "High";
  confidenceScore: number;    // % probability
  notes?: string;
}

export interface EmpiricalRun {
  id: string;
  timestamp: string;
  operatorName: string;
  r1BedAvg: number;
  r2BedAvg: number;
  pressure: number;
  flowCharge: number;
  actualOctane: number;       // Lab analysis
  catalystAge: number;
  status: "Pending" | "Approved" | "Rejected";
  approvedDate?: string;
  approvedBy?: string;
}

export interface ModelPerformance {
  algorithm: string;
  version: string;
  trainingDate: string;
  datasetVersion: string;
  datasetSize: number;
  r2: number;
  rmse: number;
  mae: number;
  mape: number;
  featureImportance: { name: string; value: number }[];
  predictedVsActual: { actual: number; predicted: number; date: string }[];
  residuals: { predicted: number; residual: number }[];
}

export interface ModelHistoryItem {
  version: string;
  algorithm: string;
  r2: number;
  rmse: number;
  mae: number;
  trainingDate: string;
  datasetSize: number;
  isActive: boolean;
}

export interface AlarmItem {
  id: string;
  timestamp: string;
  tag: string;
  description: string;
  value: string;
  limit: string;
  severity: "warning" | "critical";
  status: "active" | "acknowledged" | "resolved";
}

export interface OptimizationReport {
  id: string;
  createdAt: string;
  simulationId: string;
  author: string;
  summary: string;
  energyChange: number;
  gainChange: number;
}

export interface NSGA2Candidate {
  r1Temp: number; // gene 1: Temp R1 inlet
  r2Temp: number; // gene 2: Temp R2 inlet
  predictedRon: number;
  energyCost: number;
  catalystDegradation: number;
  rank: number;
  crowdingDistance: number;
  fitness?: number;
  objectives: {
    ronError: number;              // Minimize |Predicted_RON - Target_RON|
    energy: number;                // Minimize Energy use
    catalystRisk: number;          // Minimize catalyst risk
    ronGain?: number;
  };
}
