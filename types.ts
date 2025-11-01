// Types for LLM Calculator
export interface LlmGpuInfo {
  vram: number;
  cost: number; // Hourly cost in $
  provider: string;
}

export interface LlmGpuData {
  [key: string]: LlmGpuInfo;
}

export interface ModelTps {
  [gpuName: string]: number; // Tokens per second for a specific GPU
}

export interface LlmModel {
  name: string;
  input: number; // Input cost per 1M tokens in $
  output: number; // Output cost per 1M tokens in $
  tps: ModelTps;
  context: string;
  notes: string;
}

export interface LlmCalculationResult {
  gpu: string;
  modelName: string;
  vram: number;
  hourlyCost: number;
  inputPrice: number;
  outputPrice: number;
  tps: number;
  tokensPerHour: number;
  revenuePerHour: number;
  profitLossPerHour: number; // Note: This is calculated at 100% utilization
  profitLossPerMonth: number;
  // FIX: Added utilization and markup to fix errors in ResultTable.tsx
  utilization: number;
  markup: number;
}

// Types for Image/Video Calculator
export interface IvGpuInfo {
  vram: number;
  cudo: number | null;
  runpod: number | null;
  runpod_serverless: number | null;
}

export interface IvGpuData {
  [key: string]: IvGpuInfo;
}

export interface ImageModel {
  fal_price: number;
  tps_h100: number;
  tps_l40s: number;
  tps_a100: number;
  sec_per_image: number;
}

export interface ImageModelData {
  [key: string]: ImageModel;
}

export interface VideoModel {
  fal_price: number;
  sec_per_video: number;
  duration_sec: number;
}

export interface VideoModelData {
  [key: string]: VideoModel;
}

export interface CompetitorPrices {
  sdxl: number;
  flux: number;
  turbo: number;
  svd: number;
  animatediff: number;
}

export interface CompetitorData {
  [key: string]: CompetitorPrices;
}

export interface IvCalculationResult {
  gpuCost: number;
  throughput: number;
  costPerUnit: number;
  yourPrice: number;
  profitPerUnit: number;
  marginPct: number;
  unitsPerHour: number;
  revenuePerHour: number;
  profitPerHour: number; // Note: This is calculated at 100% utilization
  profitPerMonth: number;
  isProfitable: boolean;
}

export interface TopConfig {
  gpu: string;
  model: string;
  profitPerMonth: number;
  profitPerHour: number;
  costPerUnit: number;
  yourPrice: number;
  throughput: number;
}
