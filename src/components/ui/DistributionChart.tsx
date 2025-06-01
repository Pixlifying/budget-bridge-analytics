
import React from 'react';

interface DistributionItem {
  name: string;
  value: number;
  color: string;
}

interface DistributionChartProps {
  data: DistributionItem[];
  total: number;
}

const DistributionChart: React.FC<DistributionChartProps> = ({ data, total }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {data.map((item, index) => (
          <div key={item.name} className="text-center space-y-2">
            <div className="text-xs text-muted-foreground font-medium">{item.name}</div>
            <div className="text-xl font-bold">₹{item.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
      
      <div className="relative">
        <svg viewBox="0 0 200 100" className="w-full h-24">
          <defs>
            {data.map((item, index) => (
              <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={item.color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={item.color} stopOpacity="0.4" />
              </linearGradient>
            ))}
          </defs>
          
          {/* Semi-circle background */}
          <path
            d="M 20 80 A 80 80 0 0 1 180 80"
            fill="none"
            stroke="rgb(226 232 240)"
            strokeWidth="8"
          />
          
          {/* Semi-circle progress */}
          <path
            d="M 20 80 A 80 80 0 0 1 180 80"
            fill="none"
            stroke="url(#gradient-0)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(data[0].value / total) * 251.3} 251.3`}
            className="animate-pulse"
          />
        </svg>
      </div>
    </div>
  );
};

export default DistributionChart;
