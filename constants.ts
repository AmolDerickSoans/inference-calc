import { LlmGpuData, LlmModel, IvGpuData, ImageModelData, VideoModelData, CompetitorData } from './types';

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
    'SDXL': { 
      fal_price: 0.015,
      tps_h100: 1200, 
      tps_l40s: 1200, 
      tps_a100: 1000,
      sec_per_image: 3
    },
    'FLUX.1': { 
      fal_price: 0.025,
      tps_h100: 900, 
      tps_l40s: 900, 
      tps_a100: 800,
      sec_per_image: 4
    },
    'Fast (Turbo)': { 
      fal_price: 0.015,
      tps_h100: 2400, 
      tps_l40s: 2400, 
      tps_a100: 2000,
      sec_per_image: 1.5
    },
    'Ideogram Turbo': { 
      fal_price: 0.025,
      tps_h100: 2400, 
      tps_l40s: 2400, 
      tps_a100: 2000,
      sec_per_image: 1.5
    },
    'Recraft V3': { 
      fal_price: 0.04,
      tps_h100: 1029, 
      tps_l40s: 1029, 
      tps_a100: 900,
      sec_per_image: 3.5
    }
};

export const VIDEO_MODELS: VideoModelData = {
    'SVD (Stable Video)': { 
      fal_price: 0.40,
      sec_per_video: 6.5,
      duration_sec: 4
    },
    'AnimateDiff': { 
      fal_price: 0.15,
      sec_per_video: 9,
      duration_sec: 2
    }
};

export const COMPETITORS: CompetitorData = {
    'Fal.ai': { sdxl: 0.015, flux: 0.025, turbo: 0.025, svd: 0.40, animatediff: 0.15 },
    'Replicate': { sdxl: 0.0025, flux: 0.008, turbo: 0.0016, svd: 0.30, animatediff: 0.10 },
    'Runway': { sdxl: 0.05, flux: 0.08, turbo: 0.05, svd: 0.60, animatediff: 0.25 }
};