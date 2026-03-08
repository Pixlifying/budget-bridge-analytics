import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface ODFlowData {
  date: string;
  received: number;
  given: number;
  cash_in_hand: number;
  od_from_bank: number;
}

interface AnimatedODFlowChartProps {
  data: ODFlowData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-xl min-w-[160px]">
      <p className="text-xs font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs py-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
          <span className="font-semibold text-foreground">₹{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const COLORS = {
  od: 'hsl(25, 95%, 53%)',
  received: 'hsl(160, 84%, 39%)',
  given: 'hsl(280, 85%, 55%)',
  cash: 'hsl(340, 82%, 52%)',
};

const AnimatedODFlowChart: React.FC<AnimatedODFlowChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="odGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.od} stopOpacity={0.9} />
              <stop offset="100%" stopColor={COLORS.od} stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="receivedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.received} stopOpacity={0.9} />
              <stop offset="100%" stopColor={COLORS.received} stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="givenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.given} stopOpacity={0.9} />
              <stop offset="100%" stopColor={COLORS.given} stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="od_from_bank" name="OD from Bank" fill="url(#odGrad)" radius={[6, 6, 0, 0]} barSize={16} animationDuration={800} />
          <Bar dataKey="received" name="Received" fill="url(#receivedGrad)" radius={[6, 6, 0, 0]} barSize={16} animationDuration={1000} />
          <Bar dataKey="given" name="Given" fill="url(#givenGrad)" radius={[6, 6, 0, 0]} barSize={16} animationDuration={1200} />
          <Line
            type="monotone"
            dataKey="cash_in_hand"
            name="Cash in Hand"
            stroke={COLORS.cash}
            strokeWidth={2.5}
            dot={{ r: 4, fill: COLORS.cash, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            activeDot={{ r: 6, stroke: COLORS.cash, strokeWidth: 2 }}
            animationDuration={1500}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnimatedODFlowChart;
