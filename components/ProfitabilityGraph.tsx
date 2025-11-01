import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

interface ProfitabilityGraphProps {
  data: { markup: number; profitLossPerHour: number }[];
  currentMarkup: number;
}

const ProfitabilityGraph: React.FC<ProfitabilityGraphProps> = ({ data, currentMarkup }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{
          top: 5, right: 20, left: 20, bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="markup" tick={{ fill: '#6B7280' }} fontSize={12} />
        <YAxis tick={{ fill: '#6B7280' }} fontSize={12} />
        <Tooltip
          formatter={(value: number) => `$${value.toFixed(2)}`}
          labelFormatter={(label: number) => `Markup: ${label.toFixed(2)}x`}
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            color: '#1F2937',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
          }}
          labelStyle={{ fontWeight: 'bold', color: '#111827' }}
        />
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
        <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="profitLossPerHour"
          name="Profit/Loss ($/hr)"
          stroke="#2563EB"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, fill: '#2563EB', stroke: '#EFF6FF', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ProfitabilityGraph;