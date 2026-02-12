import React, { useState, useMemo } from 'react';
import { ESTIMATOR_GPUS, ESTIMATOR_MODELS } from '../constants';
import { EstimatorResult } from '../types';

const InfoTooltip = ({ text }: { text: string }) => (
  <div className="relative flex items-center group ml-1.5 inline-block">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none text-center">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

// Baked-in constants (not user-facing)
const WORK_HOURS = 8;
const PEAK_FACTOR = 3;

const GpuEstimator: React.FC = () => {
  const [employees, setEmployees] = useState(500);
  const [tokensPerUser, setTokensPerUser] = useState(15000);
  const [modelIdx, setModelIdx] = useState(6); // Llama 3.3 70B
  const [gpuIdx, setGpuIdx] = useState(4); // H200 141GB
  const [precision, setPrecision] = useState<'FP16' | 'FP8' | 'INT4'>('FP8');

  const result: EstimatorResult = useMemo(() => {
    const dailyTokens = employees * tokensPerUser;

    // Peak tokens/sec: 3x peak over 8-hour workday
    const peakToks = (dailyTokens * PEAK_FACTOR) / (WORK_HOURS * 3600);

    const model = ESTIMATOR_MODELS[modelIdx];
    const gpu = ESTIMATOR_GPUS[gpuIdx];

    // Formula 1: Memory Requirements
    const bytesPerParam = precision === 'FP16' ? 2 : precision === 'FP8' ? 1 : 0.5;
    const modelMemory = model.params * bytesPerParam * 1.2;
    const numGpusMem = Math.ceil(modelMemory / gpu.vram);

    // Scaling efficiency (less pessimistic for intra-server scaling)
    const getScaling = (count: number) => {
      if (count <= 1) return 1.0;
      if (count <= 2) return 0.95;
      if (count <= 4) return 0.92;
      if (count <= 8) return 0.88;
      if (count <= 16) return 0.82;
      return 0.75;
    };

    // Throughput calculation
    let baseTps = model.tps[gpu.name] || 0;
    if (baseTps === 0) {
        const availableGpuNames = Object.keys(model.tps);
        if (availableGpuNames.length > 0) {
            const highestAvailableGpu = availableGpuNames[availableGpuNames.length - 1];
            baseTps = model.tps[highestAvailableGpu] * 1.1;
        }
    }

    let numGpusThroughput = 1;
    if (baseTps > 0) {
        while ((numGpusThroughput * baseTps * getScaling(numGpusThroughput)) < peakToks) {
            numGpusThroughput++;
            if (numGpusThroughput > 1024) break;
        }
    } else {
        numGpusThroughput = 1;
    }

    const finalGpuCount = Math.max(numGpusMem, numGpusThroughput);
    const scalingEfficiency = getScaling(finalGpuCount);
    const estimatedClusterCost = finalGpuCount * gpu.price;

    // Amortized cost using pre-computed hourlyRate
    const gpuHourlyRate = gpu.hourlyRate;
    const effectiveTps = baseTps * finalGpuCount * scalingEfficiency;
    const tokensPerHour = effectiveTps * 3600;
    const costPerMTok = tokensPerHour > 0 ? (gpuHourlyRate * finalGpuCount) / (tokensPerHour / 1000000) : 0;

    return {
      dailyTokens,
      peakToks,
      modelMemory,
      numGpusMem,
      numGpusThroughput,
      finalGpuCount,
      scalingEfficiency,
      estimatedClusterCost,
      costPerMTok,
      constraintType: numGpusMem >= numGpusThroughput ? 'Memory' : 'Throughput'
    };
  }, [employees, tokensPerUser, modelIdx, gpuIdx, precision]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-1/3 space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            Deployment Config
          </h3>

          <div className="space-y-6">
            <div>
              <label className="flex items-center text-[10px] text-gray-400 font-bold uppercase mb-1">
                Number of Users
                <InfoTooltip text="Total employees or end-users who will consume AI inference daily." />
              </label>
              <input
                type="number"
                value={employees}
                onChange={(e) => setEmployees(Math.max(1, parseInt(e.target.value) || 0))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold bg-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="flex items-center text-[10px] text-gray-400 font-bold uppercase">
                  Tokens per User / Day
                  <InfoTooltip text="Average tokens (input + output) each user consumes per day. 15k = casual use, 50k+ = heavy coding/analysis." />
                </label>
                <span className="text-xs font-bold text-blue-600">{(tokensPerUser / 1000).toFixed(0)}k</span>
              </div>
              <input
                type="range"
                min="5000"
                max="100000"
                step="1000"
                value={tokensPerUser}
                onChange={(e) => setTokensPerUser(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>5k</span>
                <span>100k</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-center text-xs font-semibold text-gray-500 uppercase mb-2">
                Model
                <InfoTooltip text="The LLM to deploy. Larger models need more VRAM and run slower but are more capable." />
              </label>
              <select value={modelIdx} onChange={e => setModelIdx(Number(e.target.value))} className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium text-gray-800">
                {ESTIMATOR_MODELS.map((m, i) => <option key={i} value={i}>{m.name} ({m.params}B)</option>)}
              </select>
              <label className="flex items-center text-xs font-semibold text-gray-500 uppercase mb-2">
                GPU
                <InfoTooltip text="Hardware for inference. More VRAM fits larger models; higher bandwidth = faster generation." />
              </label>
              <select value={gpuIdx} onChange={e => setGpuIdx(Number(e.target.value))} className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium text-gray-800">
                {ESTIMATOR_GPUS.map((g, i) => <option key={i} value={i}>{g.name} ({g.vram}GB)</option>)}
              </select>
              <label className="flex items-center text-xs font-semibold text-gray-500 uppercase mb-2">
                Precision
                <InfoTooltip text="Lower precision = less memory & faster inference, with minimal quality loss. FP8 is the standard for production." />
              </label>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {(['FP16', 'FP8', 'INT4'] as const).map(p => (
                   <button key={p} onClick={() => setPrecision(p)} className={`flex-1 py-1 text-xs font-bold rounded-md transition ${precision === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>{p}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Dashboard */}
      <div className="w-full lg:w-2/3 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center">
               Peak Demand
               <InfoTooltip text="Max tokens/sec needed during busiest period. Formula: (users x tokens/day x 3) / (8hrs x 3600s). Assumes 3x peak over 8-hour workday." />
             </p>
             <p className="text-3xl font-black text-gray-900">{Math.round(result.peakToks).toLocaleString()}</p>
             <p className="text-xs text-gray-500">Tokens / Sec</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center">
               Memory Footprint
               <InfoTooltip text="GPU memory needed for model weights + KV cache overhead (20%). Formula: params x bytes_per_precision x 1.2" />
             </p>
             <p className="text-3xl font-black text-blue-600">{Math.round(result.modelMemory)} GB</p>
             <p className="text-xs text-gray-500">Model + Overhead</p>
          </div>
          <div className="bg-blue-600 border border-blue-700 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center text-white">
             <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-1 flex items-center">
               Required GPUs
               <InfoTooltip text="Max of memory-bound and throughput-bound GPU counts." />
             </p>
             <p className="text-5xl font-black leading-none py-1">{result.finalGpuCount}</p>
             <p className="text-[10px] font-bold text-blue-100 mt-2 bg-blue-500/50 px-2 py-0.5 rounded uppercase tracking-tighter">
               {result.constraintType === 'Throughput' ? 'Throughput Limited' : 'Memory Limited'}
             </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
           <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
             <h4 className="font-bold text-gray-900">Infrastructure Summary</h4>
             <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase">Enterprise Tier</span>
           </div>
           <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                       <span className="text-sm text-gray-500 flex items-center">
                         Scaling Efficiency
                         <InfoTooltip text="Multi-GPU communication overhead. 2 GPUs = 95%, 4 = 92%, 8 = 88%, 16 = 82%." />
                       </span>
                       <span className="font-mono text-gray-900 font-bold">{Math.round(result.scalingEfficiency * 100)}%</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                       <span className="text-sm text-gray-500 flex items-center">
                         Daily Token Target
                         <InfoTooltip text="Total tokens all users consume per day = users x tokens/user/day." />
                       </span>
                       <span className="font-mono text-gray-900 font-bold">{(result.dailyTokens / 1000).toFixed(0)}k Tok</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                       <span className="text-sm text-gray-500 font-medium flex items-center">
                         Memory Bound GPUs
                         <InfoTooltip text="GPUs needed to fit model in VRAM." />
                       </span>
                       <span className="font-mono text-gray-900 font-bold">{result.numGpusMem}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                       <span className="text-sm text-gray-500 font-medium flex items-center">
                         Throughput Bound GPUs
                         <InfoTooltip text="GPUs needed to hit peak throughput." />
                       </span>
                       <span className="font-mono text-gray-900 font-bold">{result.numGpusThroughput}</span>
                    </div>
                 </div>

                 <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-100">
                    <div>
                       <p className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center">
                         Estimated Cluster CapEx
                         <InfoTooltip text="Total hardware purchase cost = GPU count x unit price." />
                       </p>
                       <p className="text-3xl font-black text-gray-900">${result.estimatedClusterCost.toLocaleString()}</p>
                       <p className="text-[10px] text-gray-400 mt-1 uppercase">*Hardware List Price Estimate</p>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                       <p className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center">
                         Amortized Cost / M Token
                         <InfoTooltip text="Hourly rate x GPU count / tokens processed per hour. Hourly rate = 5-year CapEx amortization + power & overhead." />
                       </p>
                       <p className="text-2xl font-black text-green-600">${result.costPerMTok.toFixed(4)}</p>
                       <p className="text-[10px] text-gray-500 font-bold uppercase">Self-hosted amortized (5-yr). API pricing: $0.30 - $2.00/M tok</p>
                    </div>
                 </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start">
                 <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <p className="text-xs text-blue-900 leading-relaxed font-medium">
                   <strong>Architecture Insight:</strong> Running <b>{ESTIMATOR_MODELS[modelIdx].name}</b> in <b>{precision}</b> precision on a <b>{result.finalGpuCount}-GPU</b> {ESTIMATOR_GPUS[gpuIdx].name} cluster.
                   {result.constraintType === 'Throughput'
                     ? " Demand outpaces model inference speed; cluster size is determined by required throughput."
                     : " Model size outpaces hardware VRAM; cluster size is determined by weights & cache memory needs."}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GpuEstimator;
