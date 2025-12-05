import React from 'react';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface Pie3DChartProps {
  data: ChartData[];
  getColor?: (name: string) => string;
}

const Pie3DChart: React.FC<Pie3DChartProps> = ({ data, getColor }) => {
  // Filter out any items with zero value
  const filteredData = data.filter(item => item.value > 0);
  
  if (filteredData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const total = filteredData.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate slice angles
  let currentAngle = -90; // Start from top
  const slices = filteredData.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    const endAngle = currentAngle;
    const color = item.color || (getColor ? getColor(item.name) : `hsl(${index * 60}, 70%, 50%)`);
    
    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      midAngle: startAngle + angle / 2,
      color,
    };
  });

  const cx = 150;
  const cy = 120;
  const rx = 100; // X radius (horizontal)
  const ry = 60;  // Y radius (vertical, creates 3D effect)
  const depth = 30; // 3D depth

  // Function to calculate point on ellipse
  const getEllipsePoint = (angle: number, radiusX: number, radiusY: number) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: cx + radiusX * Math.cos(radians),
      y: cy + radiusY * Math.sin(radians),
    };
  };

  // Create path for a slice
  const createSlicePath = (startAngle: number, endAngle: number, radiusX: number, radiusY: number) => {
    const start = getEllipsePoint(startAngle, radiusX, radiusY);
    const end = getEllipsePoint(endAngle, radiusX, radiusY);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radiusX} ${radiusY} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  };

  // Create side path for 3D effect
  const createSidePath = (startAngle: number, endAngle: number, radiusX: number, radiusY: number, depth: number) => {
    // Only show sides that are "visible" (bottom half)
    if (startAngle > 0 && startAngle < 180) {
      const start = getEllipsePoint(startAngle, radiusX, radiusY);
      const end = getEllipsePoint(Math.min(endAngle, 180), radiusX, radiusY);
      const largeArcFlag = Math.min(endAngle, 180) - startAngle > 180 ? 1 : 0;
      
      return `M ${start.x} ${start.y} A ${radiusX} ${radiusY} 0 ${largeArcFlag} 1 ${end.x} ${end.y} L ${end.x} ${end.y + depth} A ${radiusX} ${radiusY} 0 ${largeArcFlag} 0 ${start.x} ${start.y + depth} Z`;
    } else if (endAngle > 0 && startAngle < 0) {
      const start = getEllipsePoint(0, radiusX, radiusY);
      const end = getEllipsePoint(Math.min(endAngle, 180), radiusX, radiusY);
      const largeArcFlag = Math.min(endAngle, 180) > 180 ? 1 : 0;
      
      return `M ${start.x} ${start.y} A ${radiusX} ${radiusY} 0 ${largeArcFlag} 1 ${end.x} ${end.y} L ${end.x} ${end.y + depth} A ${radiusX} ${radiusY} 0 ${largeArcFlag} 0 ${start.x} ${start.y + depth} Z`;
    }
    return '';
  };

  // Darken color for 3D effect
  const darkenColor = (color: string, amount: number = 0.3) => {
    if (color.startsWith('hsl')) {
      const match = color.match(/hsl\((\d+),?\s*(\d+)%?,?\s*(\d+)%?\)/);
      if (match) {
        const h = parseInt(match[1]);
        const s = parseInt(match[2]);
        const l = Math.max(0, parseInt(match[3]) - amount * 100);
        return `hsl(${h}, ${s}%, ${l}%)`;
      }
    }
    if (color.startsWith('#')) {
      // Convert hex to darker version
      const r = Math.max(0, parseInt(color.slice(1, 3), 16) - amount * 255);
      const g = Math.max(0, parseInt(color.slice(3, 5), 16) - amount * 255);
      const b = Math.max(0, parseInt(color.slice(5, 7), 16) - amount * 255);
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }
    return color;
  };

  return (
    <div className="h-[300px] w-full flex flex-col items-center">
      <svg viewBox="0 0 300 250" className="w-full h-[200px]">
        <defs>
          {slices.map((slice, index) => (
            <linearGradient key={`grad-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={slice.color} stopOpacity="1" />
              <stop offset="100%" stopColor={darkenColor(slice.color, 0.2)} stopOpacity="1" />
            </linearGradient>
          ))}
        </defs>
        
        {/* 3D sides (rendered first so they appear behind) */}
        {slices.map((slice, index) => {
          const sidePath = createSidePath(slice.startAngle, slice.endAngle, rx, ry, depth);
          if (!sidePath) return null;
          return (
            <path
              key={`side-${index}`}
              d={sidePath}
              fill={darkenColor(slice.color, 0.3)}
            />
          );
        })}
        
        {/* Bottom ellipse outline for depth */}
        <ellipse
          cx={cx}
          cy={cy + depth}
          rx={rx}
          ry={ry}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          opacity="0.3"
        />
        
        {/* Top pie slices */}
        {slices.map((slice, index) => (
          <g key={`slice-${index}`}>
            <path
              d={createSlicePath(slice.startAngle, slice.endAngle, rx, ry)}
              fill={`url(#gradient-${index})`}
              stroke="hsl(var(--background))"
              strokeWidth="2"
              className="transition-all duration-300 hover:opacity-80"
            />
            {/* Percentage labels */}
            {slice.percentage > 8 && (
              <text
                x={getEllipsePoint(slice.midAngle, rx * 0.6, ry * 0.6).x}
                y={getEllipsePoint(slice.midAngle, rx * 0.6, ry * 0.6).y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-xs font-bold"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
              >
                {slice.percentage.toFixed(0)}%
              </text>
            )}
          </g>
        ))}
      </svg>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-2 px-2">
        {slices.map((slice, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-xs text-muted-foreground">{slice.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pie3DChart;