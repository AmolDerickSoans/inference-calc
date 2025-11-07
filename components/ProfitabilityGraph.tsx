import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

interface ProfitabilityGraphProps {
  title: string;
  data: any[];
  xKey: string;
  yKey: string;
  xLabel: string;
  yLabel: string;
  currentXValue: number;
  xUnit?: string;
}

const ProfitabilityGraph: React.FC<ProfitabilityGraphProps> = ({
  title,
  data,
  xKey,
  yKey,
  xLabel,
  yLabel,
  currentXValue,
  xUnit = '',
}) => {
  return (
    <>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{
            top: 5, right: 20, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey={xKey} 
            tick={{ fill: '#6B7280' }} 
            fontSize={12} 
            tickFormatter={(tick) => `${tick}${xUnit}`}
            label={{ value: xLabel, position: 'insideBottom', offset: -5, fill: '#6B7280', fontSize: 12 }}
          />
          <YAxis 
            tick={{ fill: '#6B7280' }} 
            fontSize={12} 
            tickFormatter={(tick: number) => `$${tick.toLocaleString()}`}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            labelFormatter={(label: number) => `${xLabel}: ${label}${xUnit}`}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              color: '#1F2937',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
            }}
            labelStyle={{ fontWeight: 'bold', color: '#111827' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
          <ReferenceLine x={currentXValue} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Current', fill: '#EF4444', fontSize: 12, position: 'insideTopLeft' }} />
          <Line
            type="monotone"
            dataKey={yKey}
            name={yLabel}
            stroke="#2563EB"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#2563EB', stroke: '#EFF6FF', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};

export default ProfitabilityGraph;