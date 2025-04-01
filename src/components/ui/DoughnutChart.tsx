
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ChartDataItem {
  name: string;
  value: number;
}

interface DoughnutChartProps {
  data: ChartDataItem[];
  getColor: (name: string) => string;
}

const DoughnutChart = ({ data, getColor }: DoughnutChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={1}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => `₹${value}`} 
          labelFormatter={(label) => `Service: ${label}`}
        />
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="right"
          payload={
            data.map(item => ({
              id: item.name,
              type: 'square',
              value: `${item.name} (₹${item.value})`,
              color: getColor(item.name)
            }))
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DoughnutChart;
