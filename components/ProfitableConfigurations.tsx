import React from 'react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  tooltip?: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

interface ProfitableConfigurationsProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  topConfig?: {
    gpu: string;
    model: string;
    monthlyProfit: number;
    isProfitable?: boolean;
  };
  children?: React.ReactNode; // For the graph
}

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

export function ProfitableConfigurations<T>({ 
  title, 
  data, 
  columns, 
  topConfig,
  children 
}: ProfitableConfigurationsProps<T>) {
  
  const isProfitable = topConfig?.isProfitable ?? (topConfig?.monthlyProfit ?? 0) > 0;

  return (
    <div className="space-y-6">
      {topConfig && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={isProfitable ? 'bg-green-50' : 'bg-red-50'}>
            <p className="text-sm text-gray-500">Top Monthly Profit (GPU)</p>
            <p className="text-2xl font-bold text-gray-800">{topConfig.gpu || 'N/A'}</p>
            <p className="text-sm text-gray-600">{topConfig.model || 'N/A'}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Top Monthly Profit (Est.)</p>
            <p className="text-4xl font-bold text-blue-600">
              ${topConfig.monthlyProfit?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '0'}
            </p>
          </Card>
        </div>
      )}

      {children}

      <div className="bg-white border border-gray-200 rounded-xl p-1 w-full overflow-x-auto shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 my-4 px-4">{title}</h3>
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className="px-4 py-3 font-medium text-gray-500 uppercase tracking-wider">
                  <div className={`flex items-center ${col.align === 'right' ? 'justify-end' : ''}`}>
                    {col.label}
                    {col.tooltip && <InfoTooltip text={col.tooltip} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx < 5 ? 'bg-green-50' : ''}>
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-4 py-3 whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.className || ''}`}>
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProfitableConfigurations;