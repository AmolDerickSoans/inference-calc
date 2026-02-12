import React from 'react';
import { LlmGpuData, LlmModel, IvGpuData, ImageModelData, VideoModelData } from '../types';

interface CalculatorFormProps {
  mode: 'llm' | 'imageVideo' | 'voice';
  
  // Model Type for Image/Video
  modelType?: 'image' | 'video';
  setModelType?: (type: 'image' | 'video') => void;

  // Common Props
  utilization: number;
  setUtilization: (util: number) => void;
  markup: number;
  setMarkup: (markup: number) => void;

  // Optional Props (can be expanded for future features)
  llmGpuData?: LlmGpuData;
  llmModels?: LlmModel[];
}

const CalculatorForm: React.FC<CalculatorFormProps> = (props) => {
  const { mode, utilization, setUtilization, markup, setMarkup, modelType, setModelType } = props;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="space-y-6">
        {mode === 'imageVideo' && setModelType && (
          <div>
            <label htmlFor="modelType" className="block text-sm font-medium text-gray-700">Model Type</label>
            <select 
              id="modelType" 
              value={modelType} 
              onChange={(e) => setModelType(e.target.value as 'image' | 'video')} 
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>
        )}
        
        <div>
          <label htmlFor="utilization" className="block text-sm font-medium text-gray-700">Utilization</label>
          <input 
            type="range" 
            id="utilization" 
            min="1" 
            max="100" 
            value={utilization} 
            onChange={(e) => setUtilization(Number(e.target.value))} 
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2" 
          />
          <div className="text-center text-sm text-gray-600">{utilization}%</div>
        </div>

        <div>
          <label htmlFor="markup" className="block text-sm font-medium text-gray-700">Price Markup</label>
          <input 
            type="range" 
            id="markup" 
            min="1" 
            max="5" 
            step="0.1" 
            value={markup} 
            onChange={(e) => setMarkup(Number(e.target.value))} 
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2" 
          />
          <div className="text-center text-sm text-gray-600">{markup.toFixed(1)}x</div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorForm;