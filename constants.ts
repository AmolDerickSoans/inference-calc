
import { LlmGpuData, LlmModel, IvGpuData, ImageModelData, VideoModelData, CompetitorData, VoiceModel, EstimatorGpu, EstimatorModel } from './types';

// Constants for LLM Calculator
export const LLM_GPU_DATA: LlmGpuData = {
  "H100 NVL":    {vram:94,  cost:2.47, provider: "CUDO"},
  "H100 SXM":    {vram:80,  cost:2.25, provider: "CUDO"},
  "RTX 6000 Pro":{vram:96,  cost:1.7,  provider: "CUDO"},
  "L40S":        {vram:48,  cost:0.87, provider: "CUDO"},
  "A100":        {vram:80,  cost:1.35, provider: "CUDO"}
};

export const LLM_MODELS: LlmModel[] = [
  {
    name:"DeepSeek V3.2-Exp", input:0.28, output:0.42,
    tps:{"H100 NVL":35, "H100 SXM":35, "RTX 6000 Pro":18, "L40S":14, "A100":11},
    context: "128K", notes: "Cache hit: $0.028"
  },
  {
    name:"Qwen 3 Coder 480B", input:0.22, output:0.95,
    tps:{"H100 NVL":250, "H100 SXM":250, "RTX 6000 Pro":125, "L40S":100, "A100":75},
    context: "256K", notes: "Coding, MoE architecture"
  },
  {
    name:"Qwen 3 235B", input:0.08, output:0.32,
    tps:{"H100 NVL":120, "H100 SXM":120, "RTX 6000 Pro":60, "L40S":48, "A100":36},
    context: "128K", notes: "Most cost efficient"
  },
  {
    name:"Mistral Large", input:0.27, output:0.81,
    tps:{"H100 NVL":80, "H100 SXM":80, "RTX 6000 Pro":40, "L40S":32, "A100":25},
    context: "32K", notes: "Good all-rounder, open source"
  }
];

// Constants for Image/Video Calculator
export const IV_GPU_DATA: IvGpuData = {
    'H100 NVL': { vram: 94, cudo: 2.47, runpod: 2.39, runpod_serverless: 0.00116 },
    'H100 SXM': { vram: 80, cudo: 2.25, runpod: 2.69, runpod_serverless: null },
    'L40S': { vram: 48, cudo: 0.87, runpod: 0.86, runpod_serverless: 0.00053 },
    'A100': { vram: 80, cudo: 1.35, runpod: 1.64, runpod_serverless: 0.00076 },
    'RTX 4090': { vram: 24, cudo: null, runpod: 0.69, runpod_serverless: 0.00031 }
};

export const IMAGE_MODELS: ImageModelData = {
    'SDXL': { fal_price: 0.015, tps_h100: 1200, tps_l40s: 1200, tps_a100: 1000, sec_per_image: 3 },
    'FLUX.1': { fal_price: 0.025, tps_h100: 900, tps_l40s: 900, tps_a100: 800, sec_per_image: 4 },
    'Fast (Turbo)': { fal_price: 0.015, tps_h100: 2400, tps_l40s: 2400, tps_a100: 2000, sec_per_image: 1.5 },
    'Ideogram Turbo': { fal_price: 0.025, tps_h100: 2400, tps_l40s: 2400, tps_a100: 2000, sec_per_image: 1.5 },
    'Recraft V3': { fal_price: 0.04, tps_h100: 1029, tps_l40s: 1029, tps_a100: 900, sec_per_image: 3.5 }
};

export const VIDEO_MODELS: VideoModelData = {
    'SVD (Stable Video)': { fal_price: 0.40, sec_per_video: 6.5, duration_sec: 4 },
    'AnimateDiff': { fal_price: 0.15, sec_per_video: 9, duration_sec: 2 }
};

export const COMPETITORS: CompetitorData = {
    'Fal.ai': { sdxl: 0.015, flux: 0.025, turbo: 0.025, svd: 0.40, animatediff: 0.15 },
    'Replicate': { sdxl: 0.0025, flux: 0.008, turbo: 0.0016, svd: 0.30, animatediff: 0.10 },
    'Runway': { sdxl: 0.05, flux: 0.08, turbo: 0.05, svd: 0.60, animatediff: 0.25 }
};

export const VOICE_MODELS: VoiceModel[] = [
  { name: 'Whisper-v3 (OpenAI)', category: 'STT / Transcription', competitorPrice: 0.15, jobsPerHour: { "H100 NVL": 300, "H100 SXM": 200, "L40S": 133, "A100": 150 } },
  { name: 'XTTS-v2 (Coqui AI)', category: 'Voice-Clone / TTS', competitorPrice: 0.18, jobsPerHour: { "H100 NVL": 120, "H100 SXM": 100, "L40S": 75, "A100": 90 } },
  { name: 'Stable Audio Open 1.0 (Stability AI)', category: 'Sound Effects / Music', competitorPrice: 0.25, jobsPerHour: { "H100 NVL": 60, "H100 SXM": 20, "L40S": 10, "A100": 15 } }
];

// --- NEW GPU ESTIMATOR CONSTANTS ---
export const ESTIMATOR_GPUS: EstimatorGpu[] = [
  // RTX PRO 6000 Blackwell Server (96GB GDDR7 ECC, up to 600W)
  // hourlyRate = $1.10 (user-specified offering price)
  { name: 'RTX PRO 6000 Blackwell Server', vram: 96, bandwidth: 1.597, fp4: 4000, price: 13500, hourlyRate: 1.10 },

  // hourlyRate = 5-year CapEx amortization (price / 43800hrs) + estimated power & overhead
  { name: 'RTX 4090', vram: 24, bandwidth: 1.0, fp16: 83, price: 1600, hourlyRate: 0.09 },
  { name: 'A100 80GB', vram: 80, bandwidth: 2.04, fp16: 312, price: 15000, hourlyRate: 0.40 },
  { name: 'H100 80GB', vram: 80, bandwidth: 3.35, fp16: 989, fp8: 1979, price: 30000, hourlyRate: 0.79 },
  { name: 'H200 141GB', vram: 141, bandwidth: 4.8, fp16: 989, fp8: 1979, price: 45000, hourlyRate: 1.14 },
  { name: 'B200 192GB', vram: 192, bandwidth: 8.0, fp16: 2250, fp8: 4500, fp4: 9000, price: 50000, hourlyRate: 1.29 },
  { name: 'B300 288GB', vram: 288, bandwidth: 8.0, fp16: 2250, fp8: 4500, fp4: 14000, price: 55000, hourlyRate: 1.41 },
];

export const ESTIMATOR_MODELS: EstimatorModel[] = [
  // Added (official: 1T total params, 32B activated params)
  { name: 'Kimi K2.5 (Thinking)', params: 1000, activeParams: 32, tps: { 'RTX PRO 6000 Blackwell Server': 8, 'H100 80GB': 15, 'H200 141GB': 25, 'B200 192GB': 40, 'B300 288GB': 50 } },

  { name: 'Kimi K2 (Thinking)', params: 1000, activeParams: 32, tps: { 'RTX PRO 6000 Blackwell Server': 8, 'H100 80GB': 15, 'H200 141GB': 25, 'B200 192GB': 40, 'B300 288GB': 50 } },
  { name: 'DeepSeek R1 (Full)', params: 671, activeParams: 671, tps: { 'RTX PRO 6000 Blackwell Server': 0, 'H100 80GB': 12, 'H200 141GB': 25, 'B200 192GB': 45, 'B300 288GB': 55 } },
  { name: 'DeepSeek V3', params: 671, activeParams: 37, tps: { 'RTX PRO 6000 Blackwell Server': 0, 'H100 80GB': 15, 'H200 141GB': 30, 'B200 192GB': 50, 'B300 288GB': 65 } },
  { name: 'Qwen3-235B-A22B', params: 235, activeParams: 22, tps: { 'RTX PRO 6000 Blackwell Server': 6, 'H100 80GB': 40, 'H200 141GB': 50, 'B200 192GB': 75, 'B300 288GB': 90 } },
  { name: 'Qwen2.5-72B', params: 72, activeParams: 72, tps: { 'RTX PRO 6000 Blackwell Server': 18, 'H100 80GB': 55, 'H200 141GB': 55, 'B200 192GB': 80, 'B300 288GB': 100 } },
  { name: 'Llama 3 8B', params: 8, activeParams: 8, tps: { 'RTX PRO 6000 Blackwell Server': 150, 'H100 80GB': 90, 'H200 141GB': 110, 'B200 192GB': 150, 'B300 288GB': 180 } },
  { name: 'Llama 3.3 70B', params: 70, activeParams: 70, tps: { 'RTX PRO 6000 Blackwell Server': 22, 'H100 80GB': 25, 'H200 141GB': 35, 'B200 192GB': 50, 'B300 288GB': 65 } },
  { name: 'Llama 3.1 405B', params: 405, activeParams: 405, tps: { 'RTX PRO 6000 Blackwell Server': 0, 'H100 80GB': 10, 'H200 141GB': 18, 'B200 192GB': 30, 'B300 288GB': 40 } },
  { name: 'Mistral Large 3', params: 123, activeParams: 123, tps: { 'RTX PRO 6000 Blackwell Server': 10, 'H100 80GB': 20, 'H200 141GB': 30, 'B200 192GB': 45, 'B300 288GB': 55 } },
];
