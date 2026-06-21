import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface MacroChartProps {
  protein: number;
  carbs: number;
  fat: number;
}

const MacroChart: React.FC<MacroChartProps> = ({ protein, carbs, fat }) => {
  const data = [
    { name: 'Protein', value: protein, color: '#3b82f6' }, // Blue-500
    { name: 'Carbs', value: carbs, color: '#10b981' },   // Emerald-500
    { name: 'Fat', value: fat, color: '#f59e0b' },      // Amber-500
  ];

  // Filter out zero values to avoid empty segments or label issues
  const activeData = data.filter(d => d.value > 0);

  if (activeData.length === 0) {
    return <div className="text-center text-gray-400 text-sm">No macro data available</div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={activeData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {activeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value}g`, '']}
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MacroChart;