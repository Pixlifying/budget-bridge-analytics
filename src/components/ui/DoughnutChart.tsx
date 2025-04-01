
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register the required components
ChartJS.register(ArcElement, Tooltip, Legend);

interface ChartData {
  name: string;
  value: number;
}

interface DoughnutChartProps {
  data: ChartData[];
  getColor: (name: string) => string;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ data, getColor }) => {
  // Filter out any items with zero value
  const filteredData = data.filter(item => item.value > 0);
  
  const chartData = {
    labels: filteredData.map(item => item.name),
    datasets: [
      {
        data: filteredData.map(item => item.value),
        backgroundColor: filteredData.map(item => getColor(item.name)),
        borderColor: filteredData.map(item => getColor(item.name)),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ₹${value.toLocaleString()}`;
          }
        }
      }
    },
    cutout: '70%',
  };

  return (
    <div className="h-[300px] w-full relative">
      {filteredData.length > 0 ? (
        <Pie data={chartData} options={options} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      )}
    </div>
  );
};

export default DoughnutChart;
