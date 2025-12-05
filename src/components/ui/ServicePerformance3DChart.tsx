import React from 'react';

interface ServiceData {
  service: string;
  margin: number;
}

interface ServicePerformance3DChartProps {
  data: ServiceData[];
}

const COLORS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#f97316', // Orange
];

const ServicePerformance3DChart: React.FC<ServicePerformance3DChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.margin));
  const chartHeight = 200;
  const chartWidth = 100;
  const barWidth = 45;
  const barDepth = 15;
  const barGap = 25;
  const padding = 60;

  const getBarHeight = (value: number) => {
    return (value / maxValue) * (chartHeight - 40);
  };

  // Darken color for 3D effect
  const darkenColor = (color: string, amount: number = 0.2) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - amount * 255);
    const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - amount * 255);
    const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - amount * 255);
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };

  const lightenColor = (color: string, amount: number = 0.15) => {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + amount * 255);
    const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + amount * 255);
    const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + amount * 255);
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };

  const totalWidth = padding * 2 + data.length * (barWidth + barGap);

  return (
    <div className="h-[280px] w-full flex flex-col">
      <svg viewBox={`0 0 ${totalWidth} ${chartHeight + 60}`} className="w-full h-[220px]" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => {
          const y = chartHeight - (percent / 100) * (chartHeight - 40);
          return (
            <g key={percent}>
              <line
                x1={padding - 10}
                y1={y}
                x2={totalWidth - padding + 10}
                y2={y}
                stroke="hsl(var(--border))"
                strokeDasharray="4,4"
                opacity="0.4"
              />
              <text
                x={padding - 15}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {Math.round((percent / 100) * maxValue)}
              </text>
            </g>
          );
        })}

        {/* 3D Bars */}
        {data.map((item, index) => {
          const barHeight = getBarHeight(item.margin);
          const x = padding + index * (barWidth + barGap);
          const y = chartHeight - barHeight;
          const color = COLORS[index % COLORS.length];

          return (
            <g key={index} className="transition-all duration-300 hover:opacity-80">
              {/* Side face (right) */}
              <polygon
                points={`
                  ${x + barWidth},${y}
                  ${x + barWidth + barDepth},${y - barDepth}
                  ${x + barWidth + barDepth},${chartHeight - barDepth}
                  ${x + barWidth},${chartHeight}
                `}
                fill={darkenColor(color, 0.3)}
              />
              
              {/* Top face */}
              <polygon
                points={`
                  ${x},${y}
                  ${x + barDepth},${y - barDepth}
                  ${x + barWidth + barDepth},${y - barDepth}
                  ${x + barWidth},${y}
                `}
                fill={lightenColor(color, 0.1)}
              />
              
              {/* Front face */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="2"
              />
              
              {/* Value label */}
              <text
                x={x + barWidth / 2}
                y={y - barDepth - 8}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-semibold"
              >
                ₹{item.margin.toLocaleString()}
              </text>
              
              {/* Service label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 15}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {item.service.length > 8 ? item.service.slice(0, 8) + '...' : item.service}
              </text>
            </g>
          );
        })}

        {/* Base line */}
        <line
          x1={padding - 10}
          y1={chartHeight}
          x2={totalWidth - padding + 10}
          y2={chartHeight}
          stroke="hsl(var(--border))"
          strokeWidth="2"
        />
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-xs text-muted-foreground">{item.service}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicePerformance3DChart;