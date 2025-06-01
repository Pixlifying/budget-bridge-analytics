
import React from 'react';

interface WeeklyChartProps {
  data: number[];
  labels: string[];
  maxValue: number;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ data, labels, maxValue }) => {
  return (
    <div className="flex items-end justify-between h-32 gap-1">
      {data.map((value, index) => {
        const height = (value / maxValue) * 100;
        return (
          <div key={index} className="flex flex-col items-center gap-2 flex-1">
            <div className="flex-1 flex items-end w-full">
              <div 
                className="w-full rounded-lg transition-all duration-1000 ease-out animate-chart-bar"
                style={{ 
                  height: `${height}%`,
                  background: index === 3 ? 'linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)' : 'linear-gradient(180deg, #E2E8F0 0%, #CBD5E1 100%)',
                  animationDelay: `${index * 100}ms`
                }}
              />
            </div>
            <span className="text-xs text-gray-500 font-medium">{labels[index]}</span>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyChart;
