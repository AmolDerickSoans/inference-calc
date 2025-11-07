import React, { useState, useEffect, useMemo } from 'react';
import { LLM_GPU_DATA, LLM_MODELS, IV_GPU_DATA, IMAGE_MODELS, VIDEO_MODELS, VOICE_MODELS } from './constants';
import { LlmCalculationResult, LlmModel, IvCalculationResult, IvGpuData, ImageModelData, VideoModelData, VoiceModel, VoiceCalculationResult } from './types';
import ProfitabilityGraph from './components/ProfitabilityGraph';

// --- HELPER COMPONENTS ---

const InfoTooltip = ({ text }: { text: string }) => (
  <div className="relative flex items-center group ml-1.5">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div className="absolute bottom-full mb-2 w-72 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
      {text}
    </div>
  </div>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

// --- UTILITY FUNCTIONS ---
const calculateLlmResult = (
  gpu: string, modelName: string, utilization: number, markup: number,
  inputCostOverride: number | null, outputCostOverride: number | null
): LlmCalculationResult | null => {
  const gpuInfo = LLM_GPU_DATA[gpu];
  const model = LLM_MODELS.find((m: LlmModel) => m.name === modelName);
  if (!gpuInfo || !model) return null;

  const utilFactor = utilization / 100;
  const tps = model.tps[gpu];
  const effectiveInputBaseCost = inputCostOverride ?? model.input;
  const effectiveOutputBaseCost = outputCostOverride ?? model.output;
  const inputPrice = effectiveInputBaseCost * markup;
  const outputPrice = effectiveOutputBaseCost * markup;
  
  // Calculations at 100% utilization
  const tokensPerHour = tps * 3600;
  // Assume 50/50 split between input/output for revenue calculation
  const revenuePerHour = ((tokensPerHour / 2 * inputPrice / 1e6) + (tokensPerHour / 2 * outputPrice / 1e6));
  const profitLossPerHour = revenuePerHour - gpuInfo.cost;
  const profitLossPerMonth = profitLossPerHour * 24 * 30 * utilFactor;
  
  // FIX: Added utilization and markup to the returned object to match the updated LlmCalculationResult type.
  return {
    gpu, modelName, vram: gpuInfo.vram, hourlyCost: gpuInfo.cost, inputPrice, outputPrice, tps,
    tokensPerHour, revenuePerHour, profitLossPerHour, profitLossPerMonth, utilization, markup
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
): IvCalculationResult => {
    const gpuCost = getIvGpuCost(gpu, provider, IV_GPU_DATA);
    const throughput = getIvThroughput(gpu, modelName, modelType, IMAGE_MODELS, VIDEO_MODELS);
    
    if (throughput === 0 || gpuCost === 0) return { isProfitable: false } as IvCalculationResult;

    const utilFactor = utilization / 100;
    const costPerUnit = gpuCost / throughput;
    const yourPrice = costPerUnit * markup;
    const profitPerUnit = yourPrice - costPerUnit;
    const marginPct = yourPrice > 0 ? (profitPerUnit / yourPrice) * 100 : 0;
    
    // Hourly metrics at 100% utilization
    const unitsPerHour = throughput;
    const revenuePerHour = unitsPerHour * yourPrice;
    const profitPerHour = revenuePerHour - gpuCost;

    // Monthly profit uses utilization
    const profitPerMonth = profitPerHour * 24 * 30 * utilFactor;

    return {
        gpuCost, throughput, costPerUnit, yourPrice, profitPerUnit, marginPct, unitsPerHour,
        revenuePerHour, profitPerHour, profitPerMonth, isProfitable: profitPerMonth > 0
    };
};

const calculateVoiceResult = (
  gpu: string,
  model: VoiceModel,
  utilization: number,
  markup: number
): VoiceCalculationResult | null => {
  const gpuInfo = LLM_GPU_DATA[gpu as keyof typeof LLM_GPU_DATA];
  const jobsPerHour = model.jobsPerHour[gpu];

  if (!gpuInfo || !jobsPerHour) return null;

  const gpuCostPerHour = gpuInfo.cost;
  const costPerJob = gpuCostPerHour / jobsPerHour;
  const yourPricePerJob = costPerJob * markup;
  const profitPerJob = yourPricePerJob - costPerJob;
  const profitPerHour = profitPerJob * jobsPerHour;
  const utilFactor = utilization / 100;
  const monthlyProfit = profitPerHour * 24 * 30 * utilFactor;
  
  const revenuePerHour = yourPricePerJob * jobsPerHour;
  const monthlyRevenue = revenuePerHour * 24 * 30 * utilFactor;

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
    profitPerHour,
    monthlyProfit,
    revenuePerHour,
    monthlyRevenue,
  };
};

const App: React.FC = () => {
  const [mode, setMode] = useState<'imageVideo' | 'llm' | 'voice'>('imageVideo');

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

  // Reset model selection when model type changes
  useEffect(() => {
    // future logic if selected model needs reset
  }, [modelType]);
  
  const llmConfigs = useMemo(() => {
    const configs: LlmCalculationResult[] = [];
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
      data.push({
        utilization: i,
        monthlyProfit: topConfig.profitLossPerHour * 24 * 30 * (i / 100),
      });
    }
    return data;
  }, [llmConfigs]);

  const ivConfigs = useMemo(() => {
    const configs: any[] = [];
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
                    if (result.throughput > 0) {
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
      data.push({
        utilization: i,
        monthlyProfit: topConfig.profitPerHour * 24 * 30 * (i / 100),
      });
    }
    return data;
  }, [ivConfigs]);

  const voiceConfigs = useMemo(() => {
    const configs: VoiceCalculationResult[] = [];
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
      data.push({
        utilization: i,
        monthlyProfit: topConfig.profitPerHour * 24 * 30 * (i / 100),
      });
    }
    return data;
  }, [voiceConfigs]);

  const renderForm = () => {
    const isIvMode = mode === 'imageVideo';
    const isLlmMode = mode === 'llm';
    const utilization = isIvMode ? ivUtilization : isLlmMode ? llmUtilization : voiceUtilization;
    const setUtilization = isIvMode ? setIvUtilization : isLlmMode ? setLlmUtilization : setVoiceUtilization;
    const markup = isIvMode ? ivMarkup : isLlmMode ? llmMarkup : voiceMarkup;
    const setMarkup = isIvMode ? setIvMarkup : isLlmMode ? setLlmMarkup : setVoiceMarkup;
    
    return (
      <Card>
        <div className="space-y-6">
          {isIvMode && (
            <div>
              <label htmlFor="modelType" className="block text-sm font-medium text-gray-700">Model Type</label>
              <select id="modelType" value={modelType} onChange={(e) => setModelType(e.target.value as 'image' | 'video')} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
          )}
          <div>
            <label htmlFor="utilization" className="block text-sm font-medium text-gray-700">Utilization</label>
            <input type="range" id="utilization" min="1" max="100" value={utilization} onChange={(e) => setUtilization(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2" />
            <div className="text-center text-sm text-gray-600">{utilization}%</div>
          </div>
          <div>
            <label htmlFor="markup" className="block text-sm font-medium text-gray-700">Price Markup</label>
            <input type="range" id="markup" min="1" max="5" step="0.1" value={markup} onChange={(e) => setMarkup(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2" />
            <div className="text-center text-sm text-gray-600">{markup.toFixed(1)}x</div>
          </div>
        </div>
      </Card>
    );
  };

  const renderIvCalculator = () => {
      const unit = modelType === 'image' ? 'Image' : 'Video';
      const tableHeaders = [
          { key: 'gpu', label: 'GPU' },
          { key: 'model', label: 'Model' },
          { key: 'provider', label: 'Provider', tooltip: "The cloud company providing the GPU. Different providers have different hourly rates, which affects your costs." },
          { key: 'throughput', label: `${unit}s/Hr`, tooltip: `Number of ${unit.toLowerCase()}s this GPU can generate per hour at 100% utilization. This is a measure of raw performance.` },
          { key: 'costPerUnit', label: `Cost/${unit}`, tooltip: `Your cost to generate one ${unit.toLowerCase()} = (GPU Cost per Hour / ${unit}s per Hour).` },
          { key: 'yourPrice', label: `Your Price/${unit}`, tooltip: `Your selling price per ${unit.toLowerCase()} = (Cost per ${unit.toLowerCase()}) * Markup.` },
          { key: 'profitPerHour', label: 'Profit/Hr', tooltip: "Hourly profit at 100% utilization. This shows the maximum potential profit before accounting for utilization." },
          { key: 'profitPerMonth', label: 'Monthly Profit', tooltip: `Estimated monthly profit = (Profit per Hour) * 24 * 30 * (Your Utilization % / 100). This is your realistic projected earning.` },
      ];
      const topConfig = ivConfigs[0];

      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={topConfig?.isProfitable ? 'bg-green-50' : 'bg-red-50'}>
                  <p className="text-sm text-gray-500">Top Monthly Profit (GPU)</p>
                  <p className="text-2xl font-bold text-gray-800">{topConfig?.gpu || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{topConfig?.model || 'N/A'}</p>
              </Card>
              <Card>
                  <p className="text-sm text-gray-500">Top Monthly Profit (Est.)</p>
                  <p className="text-4xl font-bold text-blue-600">${topConfig?.profitPerMonth?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '0'}</p>
              </Card>
          </div>
          
          {ivGraphData.length > 0 && (
              <Card>
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
              </Card>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-1 w-full overflow-x-auto shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 my-4 px-4">All {modelType === 'image' ? 'Image' : 'Video'} Model Configurations</h3>
              <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                          {tableHeaders.map(h => (
                              <th key={h.key} scope="col" className="px-4 py-3 font-medium text-gray-500 uppercase tracking-wider">
                                  <div className="flex items-center">{h.label}{h.tooltip && <InfoTooltip text={h.tooltip} />}</div>
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {ivConfigs.map((config, index) => (
                          <tr key={index} className={index < 5 ? 'bg-green-50' : ''}>
                              <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{config.gpu}</td>
                              <td className="px-4 py-3 text-gray-600">{config.model}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500 capitalize">{config.provider.replace('_', ' ')}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-right">{Math.round(config.throughput)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-right">${config.costPerUnit.toFixed(5)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-right">${config.yourPrice.toFixed(5)}</td>
                              <td className={`px-4 py-3 whitespace-nowrap font-semibold text-right ${config.profitPerHour >= 0 ? 'text-green-600' : 'text-red-600'}`}>${config.profitPerHour.toFixed(2)}</td>
                              <td className={`px-4 py-3 whitespace-nowrap font-bold text-right ${config.profitPerMonth >= 0 ? 'text-green-700' : 'text-red-700'}`}>${config.profitPerMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
        </>
      );
  };
  
  const renderLlmCalculator = () => {
    const tableHeaders = [
        { key: 'gpu', label: 'GPU' },
        { key: 'modelName', label: 'Model' },
        { key: 'tps', label: 'Tokens/Sec', tooltip: "Tokens per second at 100% utilization." },
        { key: 'hourlyCost', label: 'GPU Cost/Hr' },
        { key: 'inputPrice', label: 'Your In/1M', tooltip: "Your selling price for 1 million input tokens = (Base Cost) * Markup." },
        { key: 'outputPrice', label: 'Your Out/1M', tooltip: "Your selling price for 1 million output tokens = (Base Cost) * Markup." },
        { key: 'profitLossPerHour', label: 'Profit/Hr', tooltip: "Hourly profit at 100% utilization." },
        { key: 'profitLossPerMonth', label: 'Monthly Profit', tooltip: "Estimated monthly profit = (Profit per Hour) * 24 * 30 * (Utilization % / 100)." },
    ];
    const topConfig = llmConfigs[0];
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={topConfig?.profitLossPerMonth > 0 ? 'bg-green-50' : 'bg-red-50'}>
                <p className="text-sm text-gray-500">Top Monthly Profit (GPU)</p>
                <p className="text-2xl font-bold text-gray-800">{topConfig?.gpu || 'N/A'}</p>
                <p className="text-sm text-gray-600">{topConfig?.modelName || 'N/A'}</p>
            </Card>
            <Card>
                <p className="text-sm text-gray-500">Top Monthly Profit (Est.)</p>
                <p className="text-4xl font-bold text-blue-600">${topConfig?.profitLossPerMonth?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '0'}</p>
            </Card>
        </div>
        
        {llmGraphData.length > 0 && (
            <Card>
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
            </Card>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-1 w-full overflow-x-auto shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 my-4 px-4">All Language Model Configurations</h3>
              <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                          {tableHeaders.map(h => (
                              <th key={h.key} scope="col" className="px-4 py-3 font-medium text-gray-500 uppercase tracking-wider">
                                  <div className="flex items-center">{h.label}{h.tooltip && <InfoTooltip text={h.tooltip} />}</div>
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {llmConfigs.map((config, index) => (
                          <tr key={index} className={index < 5 ? 'bg-green-50' : ''}>
                              <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{config.gpu}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-600">{config.modelName}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-right">{config.tps}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-right">${config.hourlyCost.toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-right">${config.inputPrice.toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-right">${config.outputPrice.toFixed(2)}</td>
                              <td className={`px-4 py-3 whitespace-nowrap font-semibold text-right ${config.profitLossPerHour >= 0 ? 'text-green-600' : 'text-red-600'}`}>${config.profitLossPerHour.toFixed(2)}</td>
                              <td className={`px-4 py-3 whitespace-nowrap font-bold text-right ${config.profitLossPerMonth >= 0 ? 'text-green-700' : 'text-red-700'}`}>${config.profitLossPerMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </>
    );
  };
  
  const renderVoiceCalculator = () => {
    const tableHeaders = [
      { key: 'gpu', label: 'GPU' },
      { key: 'category', label: 'Category' },
      { key: 'modelName', label: 'Model' },
      { key: 'jobsPerHour', label: 'Jobs/hr', tooltip: "Number of jobs (e.g., transcriptions, generations) this GPU can complete per hour at 100% utilization." },
      { key: 'costPerJob', label: 'Cost/Job', tooltip: "Your cost to complete one job = (GPU Cost per Hour / Jobs per Hour)." },
      { key: 'yourPricePerJob', label: 'Your Price/Job', tooltip: "Your selling price per job = (Cost per Job) * Markup." },
      { key: 'profitPerHour', label: 'Profit/Hr', tooltip: "Hourly profit at 100% utilization. = (Your Price/Job - Cost/Job) * Jobs/hr." },
      { key: 'monthlyProfit', label: 'Monthly Profit', tooltip: "Estimated monthly profit = (Profit per Hour) * 24 * 30 * (Your Utilization %)." },
      { key: 'monthlyRevenue', label: 'Monthly Revenue', tooltip: "Estimated monthly revenue = (Revenue per Hour) * 24 * 30 * (Your Utilization %)." },
    ];
    const topConfig = voiceConfigs[0];
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={topConfig?.monthlyProfit > 0 ? 'bg-green-50' : 'bg-red-50'}>
                <p className="text-sm text-gray-500">Top Monthly Profit (GPU)</p>
                <p className="text-2xl font-bold text-gray-800">{topConfig?.gpu || 'N/A'}</p>
                <p className="text-sm text-gray-600">{topConfig?.modelName || 'N/A'}</p>
            </Card>
            <Card>
                <p className="text-sm text-gray-500">Top Monthly Profit (Est.)</p>
                <p className="text-4xl font-bold text-blue-600">${topConfig?.monthlyProfit?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '0'}</p>
            </Card>
        </div>
        
        {voiceGraphData.length > 0 && (
            <Card>
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
            </Card>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-1 w-full overflow-x-auto shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 my-4 px-4">All Voice Model Configurations</h3>
              <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                          {tableHeaders.map(h => (
                              <th key={h.key} scope="col" className="px-4 py-3 font-medium text-gray-500 uppercase tracking-wider">
                                  <div className="flex items-center">{h.label}{h.tooltip && <InfoTooltip text={h.tooltip} />}</div>
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {voiceConfigs.map((config, index) => (
                          <tr key={index} className={index < 5 ? 'bg-green-50' : ''}>
                              <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{config.gpu}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-600">{config.category}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-600">{config.modelName}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-right">{Math.round(config.jobsPerHour)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-right">${config.costPerJob.toFixed(5)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-right">${config.yourPricePerJob.toFixed(5)}</td>
                              <td className={`px-4 py-3 whitespace-nowrap font-semibold text-right ${config.profitPerHour >= 0 ? 'text-green-600' : 'text-red-600'}`}>${config.profitPerHour.toFixed(2)}</td>
                              <td className={`px-4 py-3 whitespace-nowrap font-bold text-right ${config.monthlyProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>${config.monthlyProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-right">${config.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">GPU Profitability Calculator</h1>
          <p className="text-gray-500 mt-2">Analyze profitability for Language, Image, Video, and Voice models.</p>
        </header>
        
        <div className="flex justify-center mb-8">
            <div className="bg-gray-200/80 border border-gray-300 p-1 rounded-full flex items-center space-x-1">
                 <button onClick={() => setMode('imageVideo')} className={`px-5 py-2 rounded-full text-sm font-semibold transition ${mode === 'imageVideo' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-300/50'}`}>Image & Video</button>
                 <button onClick={() => setMode('llm')} className={`px-5 py-2 rounded-full text-sm font-semibold transition ${mode === 'llm' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-300/50'}`}>Language</button>
                 <button onClick={() => setMode('voice')} className={`px-5 py-2 rounded-full text-sm font-semibold transition ${mode === 'voice' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-300/50'}`}>Voice</button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-1/3 lg:max-w-sm flex-shrink-0">
             <div className="lg:sticky lg:top-8 space-y-6">
                {renderForm()}
              </div>
          </div>
          <div className="flex-grow space-y-6 mt-8 lg:mt-0 w-full lg:w-2/3">
             {mode === 'llm' && renderLlmCalculator()}
             {mode === 'imageVideo' && renderIvCalculator()}
             {mode === 'voice' && renderVoiceCalculator()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
