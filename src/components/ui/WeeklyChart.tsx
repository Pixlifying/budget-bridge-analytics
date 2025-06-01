
import React from 'react';

interface WeeklyChartProps {
  data: number[];
  labels: string[];
  maxValue: number;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ data, labels, maxValue }) => {
  return (
    <div className="flex items-end justify-between h-32 gap-2">
      {data.map((value, index) => {
        const height = (value / maxValue) * 100;
        return (
          <div key={index} className="flex flex-col items-center gap-2 flex-1">
            <div className="flex-1 flex items-end w-full">
              <div 
                className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg transition-all duration-1000 ease-out hover:from-primary/80 hover:to-primary/40"
                style={{ 
                  height: `${height}%`,
                  animationDelay: `${index * 100}ms`
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">{labels[index]}</span>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyChart;
