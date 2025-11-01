import React from 'react';
import { LlmCalculationResult } from '../types';

interface ProfitableConfigurationsProps {
  profitableConfigs: LlmCalculationResult[];
  onConfigSelect: (config: LlmCalculationResult) => void;
}

const ProfitableConfigurations: React.FC<ProfitableConfigurationsProps> = ({ profitableConfigs, onConfigSelect }) => {
  if (profitableConfigs.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl">
        No profitable configurations found with current settings.
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl w-full">
      <h2 className="text-xl font-semibold text-white mb-4 text-center">Profitable Configurations (LLM)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {profitableConfigs
          .sort((a,b) => b.profitLossPerHour - a.profitLossPerHour)
          .map((config, index) => (
          <div
            key={`${config.gpu}-${config.modelName}-${index}`}
            className="p-4 border border-gray-700 rounded-lg bg-gray-800/50 hover:bg-gray-800/80 transition-colors duration-200 cursor-pointer"
            onClick={() => onConfigSelect(config)}
          >
            <p className="text-sm font-medium text-white mb-1">{config.gpu}</p>
            <p className="text-xs text-gray-400 mb-2">{config.modelName}</p>
            <p className="text-sm text-gray-300">
              Profit: <span className="font-bold text-green-400">${config.profitLossPerHour.toFixed(2)}/hr</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfitableConfigurations;
