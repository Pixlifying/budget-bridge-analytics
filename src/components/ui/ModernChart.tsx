
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  income?: number;
  expenses?: number;
}

interface ModernChartProps {
  data: ChartData[];
  type: 'bar' | 'pie' | 'line' | 'area';
  colors?: string[];
  height?: number;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#06D6A0', '#F59E0B', '#EF4444', '#EC4899'];

const ModernChart: React.FC<ModernChartProps> = ({
  data,
  type,
  colors = COLORS,
  height = 300
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-lg p-4 rounded-xl border border-border/50 shadow-2xl">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: ₹{entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill={colors[0]}
                radius={[4, 4, 0, 0]}
                className="drop-shadow-lg"
              />
              {data[0]?.income && (
                <Bar 
                  dataKey="income" 
                  fill={colors[1]}
                  radius={[4, 4, 0, 0]}
                />
              )}
              {data[0]?.expenses && (
                <Bar 
                  dataKey="expenses" 
                  fill={colors[2]}
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]}
                    className="drop-shadow-lg hover:opacity-80 transition-opacity duration-300"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '12px',
                  color: '#9CA3AF'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={colors[0]}
                strokeWidth={3}
                dot={{ fill: colors[0], strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, className: "drop-shadow-lg" }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                fillOpacity={1}
                fill="url(#colorGradient)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {renderChart()}
    </div>
  );
};

export default ModernChart;
