
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
  profitLossPerHour: number;
  profitLossPerMonth: number;
  monthlyRevenue: number;
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
  profitPerHour: number;
  profitPerMonth: number;
  monthlyRevenue: number;
  isProfitable: boolean;
}

// Types for Voice Calculator
export interface VoiceModel {
  name: string;
  category: string;
  competitorPrice: number;
  jobsPerHour: {
    [gpuName: string]: number;
  };
}

export interface VoiceCalculationResult {
  gpu: string;
  modelName: string;
  category: string;
  jobsPerHour: number;
  gpuCostPerHour: number;
  costPerJob: number;
  competitorPrice: number;
  yourPricePerJob: number;
  profitPerJob: number;
  profitPerHour: number;
  monthlyProfit: number;
  revenuePerHour: number;
  monthlyRevenue: number;
}

// --- NEW GPU ESTIMATOR TYPES ---
export interface EstimatorGpu {
  name: string;
  vram: number;
  bandwidth: number;
  fp16?: number;
  fp8?: number;
  fp4?: number;
  price: number;
  hourlyRate: number;
}

export interface EstimatorModel {
  name: string;
  params: number;
  activeParams?: number;
  tps: {
    [gpuName: string]: number;
  };
}

export interface EstimatorResult {
  dailyTokens: number;
  peakToks: number;
  modelMemory: number;
  numGpusMem: number;
  numGpusThroughput: number;
  finalGpuCount: number;
  scalingEfficiency: number;
  estimatedClusterCost: number;
  costPerMTok: number;
  constraintType: 'Memory' | 'Throughput';
}
