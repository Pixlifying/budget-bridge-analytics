import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

interface AnimatedBarChartProps {
  data: { service: string; margin: number }[];
}

const GRADIENT_COLORS = [
  { start: '#6366f1', end: '#818cf8' },
  { start: '#3b82f6', end: '#60a5fa' },
  { start: '#ec4899', end: '#f472b6' },
  { start: '#14b8a6', end: '#2dd4bf' },
  { start: '#a855f7', end: '#c084fc' },
  { start: '#f97316', end: '#fb923c' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-xl">
      <p className="text-xs font-semibold text-foreground">{payload[0].payload.service}</p>
      <p className="text-sm font-bold text-primary mt-1">₹{payload[0].value.toLocaleString()}</p>
    </div>
  );
};

const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 5 }} barCategoryGap="25%">
          <defs>
            {GRADIENT_COLORS.map((c, i) => (
              <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.start} stopOpacity={1} />
                <stop offset="100%" stopColor={c.end} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
          <XAxis
            dataKey="service"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fontSize: 9 }}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
          <Bar
            dataKey="margin"
            radius={[8, 8, 4, 4]}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={`url(#barGrad${index % GRADIENT_COLORS.length})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnimatedBarChart;
