import React, { useState, useEffect, useMemo } from 'react';
import { LLM_GPU_DATA, LLM_MODELS, IV_GPU_DATA, IMAGE_MODELS, VIDEO_MODELS, VOICE_MODELS, COMPETITORS } from './constants';
import { LlmCalculationResult, LlmModel, IvCalculationResult, IvGpuData, ImageModelData, VideoModelData, VoiceModel, VoiceCalculationResult } from './types';
import ProfitabilityGraph from './components/ProfitabilityGraph';
import CalculatorForm from './components/CalculatorForm';
import ProfitableConfigurations, { Column } from './components/ProfitableConfigurations';
import GpuEstimator from './components/GpuEstimator';

// --- UTILITY FUNCTIONS ---
const calculateLlmResult = (
  gpu: string, modelName: string, utilization: number, markup: number,
  inputCostOverride: number | null, outputCostOverride: number | null
): LlmCalculationResult & { maxRevenuePerHour: number, fixedCostPerHour: number } | null => {
  const gpuInfo = LLM_GPU_DATA[gpu];
  const model = LLM_MODELS.find((m: LlmModel) => m.name === modelName);
  if (!gpuInfo || !model) return null;

  const utilFactor = utilization / 100;
  const tps = model.tps[gpu];
  const effectiveInputBaseCost = inputCostOverride ?? model.input;
  const effectiveOutputBaseCost = outputCostOverride ?? model.output;
  const inputPrice = effectiveInputBaseCost * markup;
  const outputPrice = effectiveOutputBaseCost * markup;
  
  // Calculations
  const tokensPerHour = tps * 3600;
  // Assume 50/50 split between input/output for revenue calculation
  const maxRevenuePerHour = ((tokensPerHour / 2 * inputPrice / 1e6) + (tokensPerHour / 2 * outputPrice / 1e6));
  
  const currentRevenuePerHour = maxRevenuePerHour * utilFactor;
  const fixedCostPerHour = gpuInfo.cost; // Rental is fixed cost
  
  const profitLossPerHour = currentRevenuePerHour - fixedCostPerHour;
  const profitLossPerMonth = profitLossPerHour * 24 * 30;
  const monthlyRevenue = currentRevenuePerHour * 24 * 30;
  
  return {
    gpu, modelName, vram: gpuInfo.vram, hourlyCost: gpuInfo.cost, inputPrice, outputPrice, tps,
    tokensPerHour, 
    revenuePerHour: currentRevenuePerHour, 
    profitLossPerHour, 
    profitLossPerMonth, 
    monthlyRevenue, 
    utilization, 
    markup,
    maxRevenuePerHour,
    fixedCostPerHour
  };
};

const getIvGpuCost = (gpu: string, provider: string, gpuData: IvGpuData): number => {
    const gpuInfo = gpuData[gpu];
    if (!gpuInfo) return 0;
    if (provider === 'cudo' && gpuInfo.cudo) return gpuInfo.cudo;
    if (provider === 'runpod' && gpuInfo.runpod) return gpuInfo.runpod;
    if (provider === 'runpod_serverless' && gpuInfo.runpod_serverless) return gpuInfo.runpod_serverless * 3600;
    return gpuInfo.cudo || gpuInfo.runpod || 0;
};

const getIvThroughput = (gpu: string, modelName: string, modelType: 'image' | 'video', imageModels: ImageModelData, videoModels: VideoModelData): number => {
    if (modelType === 'image') {
        const model = imageModels[modelName];
        if (!model) return 0;
        if (gpu.includes('H100')) return model.tps_h100;
        if (gpu === 'L40S') return model.tps_l40s;
        if (gpu === 'A100') return model.tps_a100;
        return model.tps_l40s; // Default for others like RTX 4090
    } else {
        const model = videoModels[modelName];
        return model ? 3600 / model.sec_per_video : 0;
    }
};

const calculateIvResult = (
    gpu: string, modelName: string, provider: string, modelType: 'image' | 'video',
    utilization: number, markup: number
): (IvCalculationResult & { isServerless: boolean, maxRevenuePerHour: number, maxCostPerHour: number }) | null => {
    const gpuCost = getIvGpuCost(gpu, provider, IV_GPU_DATA);
    const throughput = getIvThroughput(gpu, modelName, modelType, IMAGE_MODELS, VIDEO_MODELS);
    
    if (throughput === 0 || gpuCost === 0) return null;

    const utilFactor = utilization / 100;
    const costPerUnitMax = gpuCost / throughput;
    const yourPrice = costPerUnitMax * markup;
    const profitPerUnit = yourPrice - costPerUnitMax; // This is profit per unit at 100% util/serverless
    const marginPct = yourPrice > 0 ? (profitPerUnit / yourPrice) * 100 : 0;
    
    const isServerless = provider === 'runpod_serverless';

    // Hourly metrics
    const unitsPerHourMax = throughput;
    const maxRevenuePerHour = unitsPerHourMax * yourPrice;
    const currentRevenuePerHour = maxRevenuePerHour * utilFactor;
    
    // For serverless, cost scales with utilization. For rental, cost is fixed.
    const maxCostPerHour = gpuCost;
    const currentCostPerHour = isServerless ? (maxCostPerHour * utilFactor) : maxCostPerHour;

    const profitPerHour = currentRevenuePerHour - currentCostPerHour;

    // Monthly
    const profitPerMonth = profitPerHour * 24 * 30;
    const monthlyRevenue = currentRevenuePerHour * 24 * 30;

    return {
        gpuCost, throughput, 
        costPerUnit: costPerUnitMax, 
        yourPrice, 
        profitPerUnit, 
        marginPct, 
        unitsPerHour: unitsPerHourMax,
        revenuePerHour: currentRevenuePerHour, 
        profitPerHour, 
        profitPerMonth, 
        monthlyRevenue, 
        isProfitable: profitPerMonth > 0,
        isServerless,
        maxRevenuePerHour,
        maxCostPerHour
    };
};

const calculateVoiceResult = (
  gpu: string,
  model: VoiceModel,
  utilization: number,
  markup: number
): VoiceCalculationResult & { maxRevenuePerHour: number, fixedCostPerHour: number } | null => {
  const gpuInfo = LLM_GPU_DATA[gpu as keyof typeof LLM_GPU_DATA];
  const jobsPerHour = model.jobsPerHour[gpu];

  if (!gpuInfo || !jobsPerHour) return null;

  const gpuCostPerHour = gpuInfo.cost;
  const costPerJob = gpuCostPerHour / jobsPerHour;
  const yourPricePerJob = costPerJob * markup;
  const profitPerJob = yourPricePerJob - costPerJob;
  
  const utilFactor = utilization / 100;
  
  const maxRevenuePerHour = yourPricePerJob * jobsPerHour;
  const currentRevenuePerHour = maxRevenuePerHour * utilFactor;
  
  // Rental cost is fixed
  const currentProfitPerHour = currentRevenuePerHour - gpuCostPerHour;
  
  const monthlyProfit = currentProfitPerHour * 24 * 30;
  const monthlyRevenue = currentRevenuePerHour * 24 * 30;

  return {
    gpu,
    modelName: model.name,
    category: model.category,
    jobsPerHour,
    gpuCostPerHour,
    costPerJob,
    competitorPrice: model.competitorPrice,
    yourPricePerJob,
    profitPerJob,
    profitPerHour: currentProfitPerHour,
    monthlyProfit,
    revenuePerHour: currentRevenuePerHour,
    monthlyRevenue,
    maxRevenuePerHour,
    fixedCostPerHour: gpuCostPerHour
  };
};

// --- REFERENCE VIEW COMPONENT ---
const ReferenceView = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    
    {/* Competitor Pricing */}
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Competitor Pricing Benchmark (Per Generation)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
            <tr>
              <th className="px-6 py-3 font-medium">Provider</th>
              <th className="px-6 py-3 font-medium text-right">SDXL</th>
              <th className="px-6 py-3 font-medium text-right">Flux.1</th>
              <th className="px-6 py-3 font-medium text-right">Turbo</th>
              <th className="px-6 py-3 font-medium text-right">SVD (Video)</th>
              <th className="px-6 py-3 font-medium text-right">AnimateDiff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Object.entries(COMPETITORS).map(([provider, prices]) => (
              <tr key={provider} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{provider}</td>
                <td className="px-6 py-4 text-right text-gray-600">${prices.sdxl}</td>
                <td className="px-6 py-4 text-right text-gray-600">${prices.flux}</td>
                <td className="px-6 py-4 text-right text-gray-600">${prices.turbo}</td>
                <td className="px-6 py-4 text-right text-gray-600">${prices.svd}</td>
                <td className="px-6 py-4 text-right text-gray-600">${prices.animatediff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LLM GPU Data */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">LLM GPU Specifications</h3>
            </div>
            <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                    <tr>
                        <th className="px-4 py-3 font-medium">GPU</th>
                        <th className="px-4 py-3 font-medium">VRAM</th>
                        <th className="px-4 py-3 font-medium text-right">Cost/Hr</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {Object.entries(LLM_GPU_DATA).map(([key, val]) => (
                        <tr key={key}>
                            <td className="px-4 py-3 font-medium text-gray-900">{key}</td>
                            <td className="px-4 py-3 text-gray-600">{val.vram} GB</td>
                            <td className="px-4 py-3 text-right text-gray-600">${val.cost}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Image/Video GPU Data */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">Image/Video GPU Costs</h3>
            </div>
            <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                    <tr>
                        <th className="px-4 py-3 font-medium">GPU</th>
                        <th className="px-4 py-3 font-medium text-right">Cudo</th>
                        <th className="px-4 py-3 font-medium text-right">RunPod</th>
                        <th className="px-4 py-3 font-medium text-right">Serverless/sec</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {Object.entries(IV_GPU_DATA).map(([key, val]) => (
                        <tr key={key}>
                            <td className="px-4 py-3 font-medium text-gray-900">{key}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{val.cudo ? `$${val.cudo}` : '-'}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{val.runpod ? `$${val.runpod}` : '-'}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{val.runpod_serverless ? `$${val.runpod_serverless}` : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>

    {/* Voice Models */}
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Voice Models</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
            <tr>
              <th className="px-6 py-3 font-medium">Model</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium text-right">Competitor Price</th>
              <th className="px-6 py-3 font-medium text-right">H100 NVL Speed (Jobs/hr)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {VOICE_MODELS.map((m) => (
              <tr key={m.name} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{m.name}</td>
                <td className="px-6 py-4 text-gray-600">{m.category}</td>
                <td className="px-6 py-4 text-right text-gray-600">${m.competitorPrice}</td>
                <td className="px-6 py-4 text-right text-gray-600">{m.jobsPerHour["H100 NVL"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [mode, setMode] = useState<'imageVideo' | 'llm' | 'voice' | 'gpuEstimator' | 'reference'>('gpuEstimator');

  // --- LLM State ---
  const [llmUtilization, setLlmUtilization] = useState<number>(80);
  const [llmMarkup, setLlmMarkup] = useState<number>(3);

  // --- Image/Video State ---
  const [modelType, setModelType] = useState<'image' | 'video'>('image');
  const [ivUtilization, setIvUtilization] = useState(70);
  const [ivMarkup, setIvMarkup] = useState(1.5);

  // --- Voice State ---
  const [voiceUtilization, setVoiceUtilization] = useState(70);
  const [voiceMarkup, setVoiceMarkup] = useState(2.5);

  const llmConfigs = useMemo(() => {
    const configs: (LlmCalculationResult & { maxRevenuePerHour: number, fixedCostPerHour: number })[] = [];
    Object.keys(LLM_GPU_DATA).forEach(gpuKey => {
      LLM_MODELS.forEach(model => {
        const result = calculateLlmResult(gpuKey, model.name, llmUtilization, llmMarkup, null, null);
        if (result) configs.push(result);
      });
    });
    return configs.sort((a,b) => b.profitLossPerMonth - a.profitLossPerMonth);
  }, [llmUtilization, llmMarkup]);
  
  const llmGraphData = useMemo(() => {
    if (!llmConfigs || llmConfigs.length === 0) return [];
    const topConfig = llmConfigs[0];
    if (!topConfig) return [];
    
    const data = [];
    for (let i = 1; i <= 100; i++) {
      const util = i / 100;
      const revenue = topConfig.maxRevenuePerHour * util;
      const cost = topConfig.fixedCostPerHour;
      const profit = revenue - cost;
      data.push({
        utilization: i,
        monthlyProfit: profit * 24 * 30,
      });
    }
    return data;
  }, [llmConfigs]);

  const ivConfigs = useMemo(() => {
    const configs: (IvCalculationResult & { gpu: string, model: string, provider: string, maxRevenuePerHour: number, maxCostPerHour: number, isServerless: boolean })[] = [];
    const gpus = Object.keys(IV_GPU_DATA);
    const models = modelType === 'image' ? Object.keys(IMAGE_MODELS) : Object.keys(VIDEO_MODELS);
    gpus.forEach(gpu => {
        models.forEach(model => {
            const providers = ['cudo', 'runpod', 'runpod_serverless'];
            providers.forEach(provider => {
                const gpuInfo = IV_GPU_DATA[gpu as keyof typeof IV_GPU_DATA];
                const hasPrice = (provider === 'cudo' && gpuInfo.cudo) ||
                                 (provider === 'runpod' && gpuInfo.runpod) ||
                                 (provider === 'runpod_serverless' && gpuInfo.runpod_serverless);
                if (hasPrice) {
                    const result = calculateIvResult(gpu, model, provider, modelType, ivUtilization, ivMarkup);
                    if (result) {
                      configs.push({ gpu, model, provider, ...result });
                    }
                }
            });
        });
    });
    return configs.sort((a, b) => b.profitPerMonth - a.profitPerMonth);
  }, [ivUtilization, ivMarkup, modelType]);

  const ivGraphData = useMemo(() => {
    if (!ivConfigs || ivConfigs.length === 0) return [];
    const topConfig = ivConfigs[0];
    if (!topConfig) return [];

    const data = [];
    for (let i = 1; i <= 100; i++) {
      const util = i / 100;
      const revenue = topConfig.maxRevenuePerHour * util;
      const cost = topConfig.isServerless ? (topConfig.maxCostPerHour * util) : topConfig.maxCostPerHour;
      const profit = revenue - cost;
      
      data.push({
        utilization: i,
        monthlyProfit: profit * 24 * 30,
      });
    }
    return data;
  }, [ivConfigs]);

  const voiceConfigs = useMemo(() => {
    const configs: (VoiceCalculationResult & { maxRevenuePerHour: number, fixedCostPerHour: number })[] = [];
    Object.keys(LLM_GPU_DATA).forEach(gpuKey => {
      VOICE_MODELS.forEach(model => {
        if (model.jobsPerHour[gpuKey]) { // Ensure GPU is compatible with model
          const result = calculateVoiceResult(gpuKey, model, voiceUtilization, voiceMarkup);
          if (result) configs.push(result);
        }
      });
    });
    return configs.sort((a, b) => b.monthlyProfit - a.monthlyProfit);
  }, [voiceUtilization, voiceMarkup]);

  const voiceGraphData = useMemo(() => {
    if (!voiceConfigs || voiceConfigs.length === 0) return [];
    const topConfig = voiceConfigs[0];
    if (!topConfig) return [];

    const data = [];
    for (let i = 1; i <= 100; i++) {
        const util = i / 100;
        const revenue = topConfig.maxRevenuePerHour * util;
        const cost = topConfig.fixedCostPerHour;
        const profit = revenue - cost;
        data.push({
            utilization: i,
            monthlyProfit: profit * 24 * 30,
        });
    }
    return data;
  }, [voiceConfigs]);

  // Define Columns
  const ivColumns: Column<typeof ivConfigs[0]>[] = [
    { key: 'gpu', label: 'GPU', className: 'font-medium text-gray-900' },
    { key: 'model', label: 'Model', className: 'text-gray-600' },
    { key: 'provider', label: 'Provider', tooltip: "The cloud company providing the GPU.", render: (r) => <span className="capitalize">{r.provider.replace('_', ' ')}</span>, className: 'text-gray-500' },
    { key: 'throughput', label: `${modelType === 'image' ? 'Image' : 'Video'}s/Hr`, tooltip: "Units per hour at 100% utilization.", align: 'right', className: 'text-gray-500', render: (r) => Math.round(r.throughput) },
    { key: 'costPerUnit', label: `Cost/Unit`, tooltip: "Your cost to generate one unit.", align: 'right', className: 'text-gray-500', render: (r) => `$${r.costPerUnit.toFixed(5)}` },
    { key: 'yourPrice', label: `Price/Unit`, tooltip: "Your selling price per unit.", align: 'right', className: 'text-gray-500', render: (r) => `$${r.yourPrice.toFixed(5)}` },
    { key: 'profitPerHour', label: 'Profit/Hr', tooltip: "Hourly profit at current utilization.", align: 'right', className: 'font-semibold', render: (r) => <span className={r.profitPerHour >= 0 ? 'text-green-600' : 'text-red-600'}>${r.profitPerHour.toFixed(2)}</span> },
    { key: 'profitPerMonth', label: 'Monthly Profit', tooltip: "Estimated monthly profit at current utilization.", align: 'right', className: 'font-bold', render: (r) => <span className={r.profitPerMonth >= 0 ? 'text-green-700' : 'text-red-700'}>${r.profitPerMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> },
    { key: 'monthlyRevenue', label: 'Monthly Rev', tooltip: "Estimated monthly revenue at current utilization.", align: 'right', className: 'text-gray-500', render: (r) => `$${r.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
  ];

  const llmColumns: Column<LlmCalculationResult>[] = [
    { key: 'gpu', label: 'GPU', className: 'font-medium text-gray-900' },
    { key: 'modelName', label: 'Model', className: 'text-gray-600' },
    { key: 'tps', label: 'Tokens/Sec', tooltip: "Tokens per second at 100% utilization.", align: 'right', className: 'text-gray-500' },
    { key: 'hourlyCost', label: 'GPU Cost/Hr', align: 'right', className: 'text-gray-500', render: (r) => `$${r.hourlyCost.toFixed(2)}` },
    { key: 'inputPrice', label: 'In/1M', tooltip: "Selling price for 1M input tokens.", align: 'right', className: 'text-gray-500', render: (r) => `$${r.inputPrice.toFixed(2)}` },
    { key: 'outputPrice', label: 'Out/1M', tooltip: "Selling price for 1M output tokens.", align: 'right', className: 'text-gray-500', render: (r) => `$${r.outputPrice.toFixed(2)}` },
    { key: 'profitLossPerHour', label: 'Profit/Hr', tooltip: "Hourly profit at current utilization.", align: 'right', className: 'font-semibold', render: (r) => <span className={r.profitLossPerHour >= 0 ? 'text-green-600' : 'text-red-600'}>${r.profitLossPerHour.toFixed(2)}</span> },
    { key: 'profitLossPerMonth', label: 'Monthly Profit', tooltip: "Estimated monthly profit at current utilization.", align: 'right', className: 'font-bold', render: (r) => <span className={r.profitLossPerMonth >= 0 ? 'text-green-700' : 'text-red-700'}>${r.profitLossPerMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> },
    { key: 'monthlyRevenue', label: 'Monthly Rev', tooltip: "Estimated monthly revenue at current utilization.", align: 'right', className: 'text-gray-500', render: (r) => `$${r.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
  ];

  const voiceColumns: Column<VoiceCalculationResult>[] = [
    { key: 'gpu', label: 'GPU', className: 'font-medium text-gray-900' },
    { key: 'category', label: 'Category', className: 'text-gray-600' },
    { key: 'modelName', label: 'Model', className: 'text-gray-600' },
    { key: 'jobsPerHour', label: 'Jobs/hr', tooltip: "Jobs per hour at 100% utilization.", align: 'right', className: 'text-gray-500', render: (r) => Math.round(r.jobsPerHour) },
    { key: 'costPerJob', label: 'Cost/Job', tooltip: "Cost per job.", align: 'right', className: 'text-gray-500', render: (r) => `$${r.costPerJob.toFixed(5)}` },
    { key: 'yourPricePerJob', label: 'Price/Job', tooltip: "Selling price per job.", align: 'right', className: 'text-gray-500', render: (r) => `$${r.yourPricePerJob.toFixed(5)}` },
    { key: 'profitPerHour', label: 'Profit/Hr', tooltip: "Hourly profit at current utilization.", align: 'right', className: 'font-semibold', render: (r) => <span className={r.profitPerHour >= 0 ? 'text-green-600' : 'text-red-600'}>${r.profitPerHour.toFixed(2)}</span> },
    { key: 'monthlyProfit', label: 'Monthly Profit', tooltip: "Estimated monthly profit at current utilization.", align: 'right', className: 'font-bold', render: (r) => <span className={r.monthlyProfit >= 0 ? 'text-green-700' : 'text-red-700'}>${r.monthlyProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> },
    { key: 'monthlyRevenue', label: 'Monthly Rev', tooltip: "Estimated monthly revenue at current utilization.", align: 'right', className: 'text-gray-500', render: (r) => `$${r.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">AI Infrastructure Calculator</h1>
          <p className="text-gray-500 mt-2">Analyze ROI for Private Cloud clusters or Rental GPUs.</p>
        </header>
        
        <div className="flex justify-center mb-8 overflow-x-auto">
            <div className="bg-gray-200/80 border border-gray-300 p-1 rounded-full flex items-center space-x-1 whitespace-nowrap">
                 <button onClick={() => setMode('gpuEstimator')} className={`px-5 py-2 rounded-full text-sm font-bold transition ${mode === 'gpuEstimator' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-300/50'}`}>GPU Estimator</button>
                 <button onClick={() => setMode('llm')} className={`px-5 py-2 rounded-full text-sm font-semibold transition ${mode === 'llm' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-300/50'}`}>Language</button>
                 <button onClick={() => setMode('imageVideo')} className={`px-5 py-2 rounded-full text-sm font-semibold transition ${mode === 'imageVideo' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-300/50'}`}>Image & Video</button>
                 <button onClick={() => setMode('voice')} className={`px-5 py-2 rounded-full text-sm font-semibold transition ${mode === 'voice' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-300/50'}`}>Voice</button>
                 <button onClick={() => setMode('reference')} className={`px-5 py-2 rounded-full text-sm font-semibold transition ${mode === 'reference' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-300/50'}`}>Reference Data</button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {mode !== 'reference' && mode !== 'gpuEstimator' && (
            <div className="w-full lg:w-1/3 lg:max-w-sm flex-shrink-0">
               <div className="lg:sticky lg:top-8 space-y-6">
                  {mode === 'imageVideo' && (
                    <CalculatorForm 
                      mode="imageVideo"
                      modelType={modelType}
                      setModelType={setModelType}
                      utilization={ivUtilization}
                      setUtilization={setIvUtilization}
                      markup={ivMarkup}
                      setMarkup={setIvMarkup}
                    />
                  )}
                  {mode === 'llm' && (
                    <CalculatorForm 
                      mode="llm"
                      utilization={llmUtilization}
                      setUtilization={setLlmUtilization}
                      markup={llmMarkup}
                      setMarkup={setLlmMarkup}
                    />
                  )}
                  {mode === 'voice' && (
                    <CalculatorForm 
                      mode="voice"
                      utilization={voiceUtilization}
                      setUtilization={setVoiceUtilization}
                      markup={voiceMarkup}
                      setMarkup={setVoiceMarkup}
                    />
                  )}
                </div>
            </div>
          )}
          <div className={`flex-grow space-y-6 mt-8 lg:mt-0 w-full ${mode === 'reference' || mode === 'gpuEstimator' ? '' : 'lg:w-2/3'}`}>
             {mode === 'reference' ? (
                <ReferenceView />
             ) : mode === 'gpuEstimator' ? (
                <GpuEstimator />
             ) : (
                <>
                   {mode === 'imageVideo' && ivConfigs.length > 0 && (
                     <ProfitableConfigurations 
                       title={`All ${modelType === 'image' ? 'Image' : 'Video'} Model Configurations`}
                       data={ivConfigs}
                       columns={ivColumns}
                       topConfig={ivConfigs[0] ? {
                         gpu: ivConfigs[0].gpu,
                         model: ivConfigs[0].model,
                         monthlyProfit: ivConfigs[0].profitPerMonth
                       } : undefined}
                     >
                       {ivGraphData.length > 0 && (
                         <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <ProfitabilityGraph
                              title={`Profit vs. Utilization for: ${ivConfigs[0].gpu} - ${ivConfigs[0].model}`}
                              data={ivGraphData}
                              xKey="utilization"
                              yKey="monthlyProfit"
                              xLabel="Utilization"
                              yLabel="Monthly Profit"
                              currentXValue={ivUtilization}
                              xUnit="%"
                          />
                         </div>
                       )}
                     </ProfitableConfigurations>
                   )}
                   
                   {mode === 'llm' && llmConfigs.length > 0 && (
                     <ProfitableConfigurations 
                       title="All Language Model Configurations"
                       data={llmConfigs}
                       columns={llmColumns}
                       topConfig={llmConfigs[0] ? {
                         gpu: llmConfigs[0].gpu,
                         model: llmConfigs[0].modelName,
                         monthlyProfit: llmConfigs[0].profitLossPerMonth
                       } : undefined}
                     >
                       {llmGraphData.length > 0 && (
                         <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <ProfitabilityGraph
                              title={`Profit vs. Utilization for: ${llmConfigs[0].gpu} - ${llmConfigs[0].modelName}`}
                              data={llmGraphData}
                              xKey="utilization"
                              yKey="monthlyProfit"
                              xLabel="Utilization"
                              yLabel="Monthly Profit"
                              currentXValue={llmUtilization}
                              xUnit="%"
                          />
                         </div>
                       )}
                     </ProfitableConfigurations>
                   )}

                   {mode === 'voice' && voiceConfigs.length > 0 && (
                     <ProfitableConfigurations 
                       title="All Voice Model Configurations"
                       data={voiceConfigs}
                       columns={voiceColumns}
                       topConfig={voiceConfigs[0] ? {
                         gpu: voiceConfigs[0].gpu,
                         model: voiceConfigs[0].modelName,
                         monthlyProfit: voiceConfigs[0].monthlyProfit
                       } : undefined}
                     >
                       {voiceGraphData.length > 0 && (
                         <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <ProfitabilityGraph
                              title={`Profit vs. Utilization for: ${voiceConfigs[0].gpu} - ${voiceConfigs[0].modelName}`}
                              data={voiceGraphData}
                              xKey="utilization"
                              yKey="monthlyProfit"
                              xLabel="Utilization"
                              yLabel="Monthly Profit"
                              currentXValue={voiceUtilization}
                              xUnit="%"
                          />
                         </div>
                       )}
                     </ProfitableConfigurations>
                   )}
                </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;