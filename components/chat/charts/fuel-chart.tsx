'use client';

import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface FuelChartProps {
  chartType: 'line' | 'bar' | 'pie';
  title: string;
  data: Record<string, any>[];
  xKey?: string;
  yKeys?: string[];
  nameKey?: string;
  valueKey?: string;
  colors?: string[];
}

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function FuelChart({ 
  chartType, 
  title, 
  data, 
  xKey, 
  yKeys, 
  nameKey, 
  valueKey, 
  colors = DEFAULT_COLORS 
}: FuelChartProps) {
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400">No data available for chart</p>
      </div>
    );
  }

  const renderLineChart = () => {
    if (!xKey || !yKeys || yKeys.length === 0) {
      return <div className="text-red-500">Line chart requires xKey and yKeys</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip 
            formatter={(value: any, name: string) => [
              typeof value === 'number' ? value.toFixed(2) : value, 
              name
            ]}
          />
          <Legend />
          {yKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderBarChart = () => {
    if (!xKey || !yKeys || yKeys.length === 0) {
      return <div className="text-red-500">Bar chart requires xKey and yKeys</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip 
            formatter={(value: any, name: string) => [
              typeof value === 'number' ? value.toFixed(2) : value, 
              name
            ]}
          />
          <Legend />
          {yKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderPieChart = () => {
    if (!nameKey || !valueKey) {
      return <div className="text-red-500">Pie chart requires nameKey and valueKey</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: any) => `${entry[nameKey!]} ${((entry[valueKey!] / data.reduce((sum: number, item: any) => sum + item[valueKey!], 0)) * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey={valueKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => [
              typeof value === 'number' ? value.toFixed(2) : value, 
              valueKey
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      default:
        return <div className="text-red-500">Unsupported chart type: {chartType}</div>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 my-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
        {title}
      </h3>
      <div className="w-full">
        {renderChart()}
      </div>
    </div>
  );
}
