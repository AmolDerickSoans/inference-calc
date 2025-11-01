import React from 'react';
import { LlmCalculationResult } from '../types';

interface ResultTableProps {
  result: LlmCalculationResult | null;
}

const ResultTable: React.FC<ResultTableProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="text-center text-gray-400 mt-8 p-4 bg-gray-800 rounded-lg">
        Error: No calculation results available.
      </div>
    );
  }

  const {
    gpu,
    modelName,
    vram,
    hourlyCost,
    inputPrice,
    outputPrice,
    tps,
    utilization,
    markup,
    tokensPerHour,
    revenuePerHour,
    profitLossPerHour,
  } = result;

  const thClass = "py-3 px-4 text-left text-gray-300 uppercase font-semibold text-xs border-b border-gray-700";
  const tdClass = "py-3 px-4 border-b border-gray-700 text-gray-200 text-sm";

  return (
    <div className="overflow-x-auto w-full bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-1">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-800/50">
          <tr>
            <th className={thClass}>GPU</th>
            <th className={thClass}>Model</th>
            <th className={thClass}>VRAM</th>
            <th className={thClass}>Cost/hr</th>
            <th className={thClass}>Input/1M</th>
            <th className={thClass}>Output/1M</th>
            <th className={thClass}>TPS</th>
            <th className={thClass}>Util</th>
            <th className={thClass}>Markup</th>
            <th className={thClass}>Tokens/hr</th>
            <th className={thClass}>Revenue/hr</th>
            <th className={thClass}>Profit/hr</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-gray-900/30 hover:bg-gray-800/50">
            <td className={tdClass}>{gpu}</td>
            <td className={tdClass}>{modelName}</td>
            <td className={tdClass}>{vram}</td>
            <td className={tdClass}>${hourlyCost.toFixed(2)}</td>
            <td className={tdClass}>${inputPrice.toFixed(2)}</td>
            <td className={tdClass}>${outputPrice.toFixed(2)}</td>
            <td className={tdClass}>{tps}</td>
            <td className={tdClass}>{(utilization * 100).toFixed(0)}%</td>
            <td className={tdClass}>{markup}x</td>
            <td className={tdClass}>{Math.round(tokensPerHour)}</td>
            <td className={tdClass}>${revenuePerHour.toFixed(2)}</td>
            <td
              className={`${tdClass} font-bold ${
                profitLossPerHour >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              ${profitLossPerHour.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ResultTable;
