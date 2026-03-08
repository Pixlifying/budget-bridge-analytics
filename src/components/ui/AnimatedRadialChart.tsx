import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface AnimatedRadialChartProps {
  data: ChartData[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(220, 90%, 56%)',
  'hsl(340, 82%, 52%)',
  'hsl(180, 90%, 45%)',
  'hsl(280, 85%, 60%)',
  'hsl(25, 95%, 53%)',
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-xl">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
        <span className="text-xs font-semibold text-foreground">{payload[0].name}</span>
      </div>
      <p className="text-sm font-bold text-foreground mt-1">₹{payload[0].value.toLocaleString()}</p>
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.08) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const AnimatedRadialChart: React.FC<AnimatedRadialChartProps> = ({ data }) => {
  const filteredData = data.filter(d => d.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="h-[320px] w-full flex items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {filteredData.map((_, i) => (
              <filter key={i} id={`shadow${i}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
              </filter>
            ))}
          </defs>
          <Pie
            data={filteredData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            animationBegin={0}
            animationDuration={1200}
            animationEasing="ease-out"
            labelLine={false}
            label={renderCustomLabel}
            strokeWidth={2}
            stroke="hsl(var(--background))"
          >
            {filteredData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.color || COLORS[index % COLORS.length]}
                style={{ filter: `url(#shadow${index})` }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnimatedRadialChart;
