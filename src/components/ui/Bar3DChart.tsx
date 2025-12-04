import React from 'react';

interface Bar3DChartProps {
  data: { month: string; revenue: number; expenses: number }[];
}

const Bar3DChart: React.FC<Bar3DChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => Math.max(d.revenue, d.expenses)), 1);
  const chartHeight = 250;
  const barWidth = 45;
  const gap = 30;
  const depth = 15;
  
  const colors = [
    { front: '#22d3ee', top: '#67e8f9', side: '#06b6d4' }, // cyan
    { front: '#facc15', top: '#fde047', side: '#eab308' }, // yellow
    { front: '#a855f7', top: '#c084fc', side: '#9333ea' }, // purple
    { front: '#4ade80', top: '#86efac', side: '#22c55e' }, // green
    { front: '#f87171', top: '#fca5a5', side: '#ef4444' }, // red
    { front: '#fb923c', top: '#fdba74', side: '#f97316' }, // orange
  ];

  const chartWidth = data.length * (barWidth + gap) + 60;

  return (
    <div className="w-full overflow-x-auto">
      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight + 60}`} 
        className="w-full h-[300px]"
        style={{ minWidth: '400px' }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1="40"
            y1={chartHeight - ratio * chartHeight + 20}
            x2={chartWidth - 20}
            y2={chartHeight - ratio * chartHeight + 20}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.5"
          />
        ))}

        {/* 3D Bars */}
        {data.map((item, index) => {
          const barHeight = (item.revenue / maxValue) * (chartHeight - 40);
          const x = 50 + index * (barWidth + gap);
          const y = chartHeight - barHeight + 10;
          const color = colors[index % colors.length];

          return (
            <g key={item.month} className="transition-transform duration-300 hover:opacity-90">
              {/* Shadow */}
              <polygon
                points={`
                  ${x + 8},${chartHeight + 15}
                  ${x + barWidth + 8},${chartHeight + 15}
                  ${x + barWidth + depth + 8},${chartHeight + 15 - depth}
                  ${x + depth + 8},${chartHeight + 15 - depth}
                `}
                fill="rgba(0,0,0,0.15)"
                className="blur-[2px]"
              />

              {/* Front face */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color.front}
                rx="2"
              />

              {/* Top face (3D effect) */}
              <polygon
                points={`
                  ${x},${y}
                  ${x + depth},${y - depth}
                  ${x + barWidth + depth},${y - depth}
                  ${x + barWidth},${y}
                `}
                fill={color.top}
              />

              {/* Right side face (3D effect) */}
              <polygon
                points={`
                  ${x + barWidth},${y}
                  ${x + barWidth + depth},${y - depth}
                  ${x + barWidth + depth},${y + barHeight - depth}
                  ${x + barWidth},${y + barHeight}
                `}
                fill={color.side}
              />

              {/* Center highlight diamond on front face */}
              <polygon
                points={`
                  ${x + barWidth / 2},${y + barHeight * 0.35}
                  ${x + barWidth * 0.3},${y + barHeight * 0.5}
                  ${x + barWidth / 2},${y + barHeight * 0.65}
                  ${x + barWidth * 0.7},${y + barHeight * 0.5}
                `}
                fill={color.top}
                opacity="0.6"
              />

              {/* Bottom edge highlight */}
              <line
                x1={x}
                y1={y + barHeight}
                x2={x + barWidth}
                y2={y + barHeight}
                stroke={color.side}
                strokeWidth="3"
              />

              {/* Month label */}
              <text
                x={x + barWidth / 2 + depth / 2}
                y={chartHeight + 40}
                textAnchor="middle"
                className="fill-muted-foreground text-xs font-medium"
              >
                {item.month}
              </text>

              {/* Value label */}
              <text
                x={x + barWidth / 2 + depth / 2}
                y={y - depth - 8}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-semibold"
              >
                ₹{(item.revenue / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default Bar3DChart;
