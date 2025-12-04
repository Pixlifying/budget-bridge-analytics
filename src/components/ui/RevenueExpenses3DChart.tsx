import React from 'react';

interface RevenueExpenses3DChartProps {
  data: { month: string; revenue: number; expenses: number }[];
}

const RevenueExpenses3DChart: React.FC<RevenueExpenses3DChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => Math.max(d.revenue, d.expenses)), 1);
  const chartHeight = 280;
  const barWidth = 35;
  const groupGap = 60;
  const barGap = 8;
  const depth = 12;
  
  const revenueColor = { front: '#22c55e', top: '#4ade80', side: '#16a34a' }; // green
  const expenseColor = { front: '#f87171', top: '#fca5a5', side: '#ef4444' }; // red

  const chartWidth = data.length * (barWidth * 2 + barGap + groupGap) + 80;

  return (
    <div className="w-full overflow-x-auto">
      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight + 80}`} 
        className="w-full h-[320px]"
        style={{ minWidth: '500px' }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1="50"
            y1={chartHeight - ratio * (chartHeight - 40) + 20}
            x2={chartWidth - 20}
            y2={chartHeight - ratio * (chartHeight - 40) + 20}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.4"
          />
        ))}

        {/* 3D Bars */}
        {data.map((item, index) => {
          const groupX = 60 + index * (barWidth * 2 + barGap + groupGap);
          
          // Revenue bar
          const revenueHeight = (item.revenue / maxValue) * (chartHeight - 60);
          const revenueX = groupX;
          const revenueY = chartHeight - revenueHeight;
          
          // Expense bar
          const expenseHeight = (item.expenses / maxValue) * (chartHeight - 60);
          const expenseX = groupX + barWidth + barGap;
          const expenseY = chartHeight - expenseHeight;

          return (
            <g key={item.month}>
              {/* Revenue Bar */}
              <g className="transition-transform duration-300 hover:opacity-90">
                {/* Shadow */}
                <polygon
                  points={`
                    ${revenueX + 6},${chartHeight + 12}
                    ${revenueX + barWidth + 6},${chartHeight + 12}
                    ${revenueX + barWidth + depth + 6},${chartHeight + 12 - depth}
                    ${revenueX + depth + 6},${chartHeight + 12 - depth}
                  `}
                  fill="rgba(0,0,0,0.12)"
                  className="blur-[2px]"
                />
                {/* Front face */}
                <rect
                  x={revenueX}
                  y={revenueY}
                  width={barWidth}
                  height={revenueHeight}
                  fill={revenueColor.front}
                  rx="2"
                />
                {/* Top face */}
                <polygon
                  points={`
                    ${revenueX},${revenueY}
                    ${revenueX + depth},${revenueY - depth}
                    ${revenueX + barWidth + depth},${revenueY - depth}
                    ${revenueX + barWidth},${revenueY}
                  `}
                  fill={revenueColor.top}
                />
                {/* Right side face */}
                <polygon
                  points={`
                    ${revenueX + barWidth},${revenueY}
                    ${revenueX + barWidth + depth},${revenueY - depth}
                    ${revenueX + barWidth + depth},${revenueY + revenueHeight - depth}
                    ${revenueX + barWidth},${revenueY + revenueHeight}
                  `}
                  fill={revenueColor.side}
                />
                {/* Diamond highlight */}
                <polygon
                  points={`
                    ${revenueX + barWidth / 2},${revenueY + revenueHeight * 0.35}
                    ${revenueX + barWidth * 0.3},${revenueY + revenueHeight * 0.5}
                    ${revenueX + barWidth / 2},${revenueY + revenueHeight * 0.65}
                    ${revenueX + barWidth * 0.7},${revenueY + revenueHeight * 0.5}
                  `}
                  fill={revenueColor.top}
                  opacity="0.5"
                />
                {/* Value label */}
                <text
                  x={revenueX + barWidth / 2 + depth / 2}
                  y={revenueY - depth - 6}
                  textAnchor="middle"
                  className="fill-foreground text-[9px] font-semibold"
                >
                  ₹{(item.revenue / 1000).toFixed(0)}k
                </text>
              </g>

              {/* Expense Bar */}
              <g className="transition-transform duration-300 hover:opacity-90">
                {/* Shadow */}
                <polygon
                  points={`
                    ${expenseX + 6},${chartHeight + 12}
                    ${expenseX + barWidth + 6},${chartHeight + 12}
                    ${expenseX + barWidth + depth + 6},${chartHeight + 12 - depth}
                    ${expenseX + depth + 6},${chartHeight + 12 - depth}
                  `}
                  fill="rgba(0,0,0,0.12)"
                  className="blur-[2px]"
                />
                {/* Front face */}
                <rect
                  x={expenseX}
                  y={expenseY}
                  width={barWidth}
                  height={expenseHeight}
                  fill={expenseColor.front}
                  rx="2"
                />
                {/* Top face */}
                <polygon
                  points={`
                    ${expenseX},${expenseY}
                    ${expenseX + depth},${expenseY - depth}
                    ${expenseX + barWidth + depth},${expenseY - depth}
                    ${expenseX + barWidth},${expenseY}
                  `}
                  fill={expenseColor.top}
                />
                {/* Right side face */}
                <polygon
                  points={`
                    ${expenseX + barWidth},${expenseY}
                    ${expenseX + barWidth + depth},${expenseY - depth}
                    ${expenseX + barWidth + depth},${expenseY + expenseHeight - depth}
                    ${expenseX + barWidth},${expenseY + expenseHeight}
                  `}
                  fill={expenseColor.side}
                />
                {/* Diamond highlight */}
                <polygon
                  points={`
                    ${expenseX + barWidth / 2},${expenseY + expenseHeight * 0.35}
                    ${expenseX + barWidth * 0.3},${expenseY + expenseHeight * 0.5}
                    ${expenseX + barWidth / 2},${expenseY + expenseHeight * 0.65}
                    ${expenseX + barWidth * 0.7},${expenseY + expenseHeight * 0.5}
                  `}
                  fill={expenseColor.top}
                  opacity="0.5"
                />
                {/* Value label */}
                <text
                  x={expenseX + barWidth / 2 + depth / 2}
                  y={expenseY - depth - 6}
                  textAnchor="middle"
                  className="fill-foreground text-[9px] font-semibold"
                >
                  ₹{(item.expenses / 1000).toFixed(0)}k
                </text>
              </g>

              {/* Month label */}
              <text
                x={groupX + barWidth + barGap / 2}
                y={chartHeight + 45}
                textAnchor="middle"
                className="fill-muted-foreground text-xs font-medium"
              >
                {item.month}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${chartWidth / 2 - 80}, ${chartHeight + 60})`}>
          <rect x="0" y="0" width="14" height="14" fill={revenueColor.front} rx="2" />
          <text x="20" y="11" className="fill-muted-foreground text-[11px]">Revenue</text>
          <rect x="90" y="0" width="14" height="14" fill={expenseColor.front} rx="2" />
          <text x="110" y="11" className="fill-muted-foreground text-[11px]">Expenses</text>
        </g>
      </svg>
    </div>
  );
};

export default RevenueExpenses3DChart;
