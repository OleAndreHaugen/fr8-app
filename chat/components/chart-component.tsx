"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Filler
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line, Bar, Pie, Doughnut, Scatter, Radar, Bubble, PolarArea } from 'react-chartjs-2';
import { useState, useEffect, useRef, ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

// Error Boundary Component
class ChartErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('Chart Error Boundary caught an error:', error);
    
    // Check for specific Chart.js control point errors
    if (error.message?.includes('cp1x') || error.message?.includes('control point')) {
      console.warn('Chart.js control point error detected - this usually indicates data structure issues');
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chart Error Boundary caught an error:', error, errorInfo);
    
    // Log additional context for cp1x errors
    if (error.message?.includes('cp1x') || error.message?.includes('control point')) {
      console.error('This appears to be a Chart.js control point error. Common causes:');
      console.error('- Invalid data structure for line charts');
      console.error('- Missing or null data points');
      console.error('- Improper tension values');
      console.error('- Chart rendered before data validation complete');
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

interface ChartComponentProps {
  type: string;
  data: any;
  theme?: 'light' | 'dark';
}

export default function ChartComponent({ type, data, theme }: ChartComponentProps) {
  const [error, setError] = useState<string | null>(null);
  const [chartOptions, setChartOptions] = useState<ChartOptions<any>>({});
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);
  const readyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup function to destroy chart instances and prevent memory leaks
  const cleanupChart = () => {
    if (chartRef.current) {
      try {
        if (typeof chartRef.current.destroy === 'function') {
          chartRef.current.destroy();
        }
      } catch (err) {
        console.warn("Error destroying chart instance:", err);
      }
      chartRef.current = null;
    }
  };


  // Use MutationObserver to watch for canvas position changes
  useEffect(() => {
    if (!chartRef.current?.canvas) return;

    const canvas = chartRef.current.canvas;

    
    // Block wheel events on the canvas to prevent Chart.js interference
    const blockWheelEvents = (e: WheelEvent) => {
      // Prevent Chart.js from processing wheel events but allow normal page scrolling
      e.preventDefault();
      e.stopPropagation();
      
      // Manually handle the scroll by finding the nearest scrollable parent
      let scrollableParent = canvas.parentElement;
      while (scrollableParent && scrollableParent !== document.body) {
        const style = window.getComputedStyle(scrollableParent);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          break;
        }
        scrollableParent = scrollableParent.parentElement;
      }
      
      // Apply scroll to the scrollable parent or window
      const target = scrollableParent || window;
      if (target === window) {
        window.scrollBy(0, e.deltaY);
      } else {
        scrollableParent!.scrollTop += e.deltaY;
      }
    };
    
    canvas.addEventListener('wheel', blockWheelEvents, { passive: false });

    
    // Create observer to watch for style changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          // Reset any positioning that might cause issues
          canvas.style.position = 'static';
          canvas.style.transform = 'none';
          canvas.style.willChange = 'auto';
        }
      });
    });

    // Start observing
    observer.observe(canvas, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => {
      observer.disconnect();
      canvas.removeEventListener('wheel', blockWheelEvents);
    };
  }, [isReady]);

  // Recovery mechanism to reset the component state
  const recoverFromError = () => {
    if (!mountedRef.current) return;
    
    setIsRecovering(true);
    setRenderError(false);
    setIsReady(false);
    cleanupChart();
    
    // Clear any existing recovery timeout
    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current);
    }
    
    // Reset state after a delay
    recoveryTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setError(null);
        setIsRecovering(false);
        // Add a small delay before marking as ready again
        setTimeout(() => {
          if (mountedRef.current) {
            setIsReady(true);
          }
        }, 100);
      }
    }, 500);
  };

  // Initialize component with delay to ensure Chart.js is ready
  useEffect(() => {
    mountedRef.current = true;
    
    // Remove scroll event listeners for now
    
    // Add a small delay to ensure Chart.js is fully initialized
    readyTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setIsReady(true);
      }
    }, 50);
    
    return () => {
      mountedRef.current = false;
      cleanupChart();
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to get theme-aware colors
  const getThemeColors = (currentTheme?: 'light' | 'dark') => {
    const isDark = currentTheme === 'dark' || (!currentTheme && document.documentElement.classList.contains('dark'));
    
    return {
      textColor: isDark ? 'white' : 'black',
      tickColor: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    };
  };

  // Validate the data structure
  useEffect(() => {
    // Skip validation if currently recovering
    if (isRecovering) return;
    
    // Reset error state on new data
    setError(null);
    
    try {
      // Basic validation of data structure
      if (!data || !data.data) {
        setError("Chart data missing required 'data' property");
        return;
      }
      
      // Deep clone and sanitize data to prevent Chart.js internal errors
      const sanitizedData = JSON.parse(JSON.stringify(data.data));
      
      // Specific validations based on chart type
      const chartType = type.toLowerCase();
      
      if (['line', 'bar', 'area'].includes(chartType)) {
        if (!sanitizedData.labels || !Array.isArray(sanitizedData.labels)) {
          setError("Missing or invalid 'labels' array for this chart type");
          return;
        }
        if (!sanitizedData.datasets || !Array.isArray(sanitizedData.datasets)) {
          setError("Missing or invalid 'datasets' array for this chart type");
          return;
        }
        
        // Validate each dataset for line/area charts to prevent cp1x errors
        for (let i = 0; i < sanitizedData.datasets.length; i++) {
          const dataset = sanitizedData.datasets[i];
          if (!dataset.data || !Array.isArray(dataset.data)) {
            setError(`Dataset ${i + 1} missing or invalid data array`);
            return;
          }
          
          // For line charts, ensure we have at least 2 data points to avoid cp1x errors
          if (chartType === 'line' || chartType === 'area') {
            if (dataset.data.length < 2) {
              setError(`Line charts require at least 2 data points. Dataset ${i + 1} has ${dataset.data.length} points.`);
              return;
            }
          }
          
          // Ensure all data points are valid numbers and properly structured
          const validData = dataset.data.map((point: any, index: number) => {
            if (typeof point === 'number' && !isNaN(point) && isFinite(point)) {
              return point;
            } else if (typeof point === 'object' && point !== null) {
              // Handle object-style data points
              if (typeof point.y === 'number' && isFinite(point.y)) {
                return {
                  x: point.x !== undefined ? point.x : index,
                  y: point.y
                };
              } else if (typeof point.x === 'number' && typeof point.y === 'number') {
                return {
                  x: isFinite(point.x) ? point.x : index,
                  y: isFinite(point.y) ? point.y : 0
                };
              }
            }
            return 0; // Default to 0 for invalid points
          });
          
          // Update the dataset with sanitized data
          dataset.data = validData;
          
          // Ensure proper configuration for line charts to prevent cp1x errors
          if (chartType === 'line' || chartType === 'area') {
            // Set tension with strict validation
            if (typeof dataset.tension !== 'number' || isNaN(dataset.tension) || !isFinite(dataset.tension)) {
              dataset.tension = 0.1; // Default safe value
            } else {
              dataset.tension = Math.max(0, Math.min(1, dataset.tension)); // Clamp between 0 and 1
            }
            
            // Ensure borderColor is set for proper line rendering
            if (!dataset.borderColor) {
              dataset.borderColor = '#4BC0C0';
            }
            
            // Ensure backgroundColor for area charts
            if (chartType === 'area' && !dataset.backgroundColor) {
              dataset.backgroundColor = 'rgba(75, 192, 192, 0.2)';
            }
            
            // Remove any undefined or null properties that could cause issues
            Object.keys(dataset).forEach(key => {
              if (dataset[key] === undefined || dataset[key] === null) {
                delete dataset[key];
              }
            });
          }
          
          // Ensure proper fill configuration for area charts
          if (dataset.fill !== undefined && typeof dataset.fill === 'string') {
            // Validate fill string values
            const validFillValues = ['origin', 'start', 'end', 'stack'];
            if (!validFillValues.includes(dataset.fill) && !dataset.fill.match(/^\d+$/)) {
              dataset.fill = true; // Default to true for invalid string values
            }
          }
        }
        
        // Ensure labels match data length and are valid
        const maxDataLength = Math.max(...sanitizedData.datasets.map((d: any) => d.data.length));
        if (sanitizedData.labels.length !== maxDataLength) {
          console.warn('Labels length does not match data length, adjusting...');
          if (sanitizedData.labels.length < maxDataLength) {
            // Pad labels if too short
            for (let i = sanitizedData.labels.length; i < maxDataLength; i++) {
              sanitizedData.labels.push(`Point ${i + 1}`);
            }
          } else {
            // Trim labels if too long
            sanitizedData.labels = sanitizedData.labels.slice(0, maxDataLength);
          }
        }
        
        // Ensure all labels are strings
        sanitizedData.labels = sanitizedData.labels.map((label: any, index: number) => {
          if (typeof label === 'string') return label;
          if (typeof label === 'number') return label.toString();
          return `Label ${index + 1}`;
        });
      }
      
      if (['pie', 'doughnut', 'polararea'].includes(chartType)) {
        if (!sanitizedData.datasets || !Array.isArray(sanitizedData.datasets) || sanitizedData.datasets.length === 0) {
          setError("Missing dataset information for this chart type");
          return;
        }
        
        // Additional validation for polar area charts
        if (chartType === 'polararea') {
          for (let i = 0; i < sanitizedData.datasets.length; i++) {
            const dataset = sanitizedData.datasets[i];
            if (!dataset.data || !Array.isArray(dataset.data)) {
              setError(`Polar area chart dataset ${i + 1} missing or invalid data array`);
              return;
            }
            
            // Ensure all data points are valid numbers
            const validData = dataset.data.map((point: any) => {
              if (typeof point === 'number' && !isNaN(point) && isFinite(point)) {
                return Math.max(0, point); // Ensure non-negative values
              }
              return 0; // Default to 0 for invalid points
            });
            
            dataset.data = validData;
          }
        }
      }
      
      if (chartType === 'scatter' && (!sanitizedData.datasets || !Array.isArray(sanitizedData.datasets))) {
        setError("Missing or invalid dataset for scatter chart");
        return;
      }
      
      if (chartType === 'bubble') {
        if (!sanitizedData.datasets || !Array.isArray(sanitizedData.datasets)) {
          setError("Missing or invalid dataset for bubble chart");
          return;
        }
        
        // Validate bubble chart data structure
        for (let i = 0; i < sanitizedData.datasets.length; i++) {
          const dataset = sanitizedData.datasets[i];
          if (!dataset.data || !Array.isArray(dataset.data)) {
            setError(`Bubble chart dataset ${i + 1} missing or invalid data array`);
            return;
          }
          
          // Validate each bubble data point has x, y, and r properties
          const validBubbleData = dataset.data.map((point: any, index: number) => {
            if (typeof point === 'object' && point !== null) {
              const x = typeof point.x === 'number' && isFinite(point.x) ? point.x : index;
              const y = typeof point.y === 'number' && isFinite(point.y) ? point.y : 0;
              const r = typeof point.r === 'number' && isFinite(point.r) && point.r > 0 ? point.r : 5;
              return { x, y, r };
            }
            // Default bubble point if invalid
            return { x: index, y: 0, r: 5 };
          });
          
          dataset.data = validBubbleData;
        }
      }
      
      // Check for empty datasets
      if (sanitizedData.datasets && sanitizedData.datasets.length === 0) {
        setError("No data to display in chart");
        return;
      }
      
      // Validate dataset structure
      if (sanitizedData.datasets) {
        for (const dataset of sanitizedData.datasets) {
          if (!dataset.data || (!Array.isArray(dataset.data) && typeof dataset.data !== 'object')) {
            setError("Invalid dataset data structure");
            return;
          }
        }
      }
      
      // Store sanitized data
      data.data = sanitizedData;
      
    } catch (err) {
      setError("An error occurred while processing chart data");
      console.error("Chart validation error:", err);
      // Trigger recovery after a validation error
      setTimeout(recoverFromError, 500);
    }
  }, [type, data, isRecovering]);

  // Update chart options when theme or data changes
  useEffect(() => {
    const colors = getThemeColors(theme);
    
    const newOptions: ChartOptions<any> = {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 50,
      devicePixelRatio: window.devicePixelRatio || 1,
      animation: false,
      events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
      onResize: (chart: any) => {
        // Ensure chart canvas stays in normal document flow
        if (chart && chart.canvas) {
          chart.canvas.style.position = 'static';
          chart.canvas.style.display = 'block';
          chart.canvas.style.transform = 'none';
          chart.canvas.style.willChange = 'auto';
        }
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: colors.textColor,
            boxWidth: 12,
            padding: 15,
            font: {
              size: 12
            },
            usePointStyle: true
          }      
        },
        title: {
          display: true,
          text: data.options?.plugins?.title?.text || 'Chart',
          color: colors.textColor,
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 10
          }
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: false
            },
            pinch: {
              enabled: false
            },
            mode: 'xy'
          },
          pan: {
            enabled: false
          }
        }
      },
      elements: {
        point: {
          hoverRadius: 6,
          radius: 3
        },
        line: {
          tension: 0.1
        }
      },
      interaction: {
        intersect: false,
        mode: 'index',
        includeInvisible: false
      },
      scales: {
        x: {
          ticks: {
            color: colors.tickColor,
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true,
            autoSkipPadding: 5
          },
          grid: {
            color: colors.gridColor,
          }
        },
        y: {
          ticks: {
            color: colors.tickColor,
          },
          grid: {
            color: colors.gridColor,
          }
        }
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 0,
          bottom: 5
        }
      }
    };

    // Merge with provided options
    const finalOptions = {
      ...newOptions,
      ...data.options,
      plugins: {
        ...newOptions.plugins,
        ...data.options?.plugins,
      }
    };

    setChartOptions(finalOptions);
  }, [theme, data]);

  // Enhanced render function with error boundaries
  const renderChart = () => {
    if (renderError) {
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg border border-red-100 dark:border-red-800">
          <div className="flex items-center gap-3 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="font-medium">Chart rendering failed</h3>
          </div>
          <p className="ml-8 text-sm mb-3">The chart could not be rendered due to a technical error.</p>
          <button 
            onClick={recoverFromError}
            className="ml-8 px-3 py-1 text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            disabled={isRecovering}
          >
            {isRecovering ? 'Recovering...' : 'Try Again'}
          </button>
        </div>
      );
    }

    // Additional safety check before rendering
    if (!data || !data.data || !chartOptions) {
      return null;
    }

    try {
      // Create a safe copy of chart data for rendering
      const safeChartData = JSON.parse(JSON.stringify(data.data));
      const safeChartOptions = JSON.parse(JSON.stringify(chartOptions));
      
      // Add additional safety for line charts to prevent cp1x errors
      if (type.toLowerCase() === 'line' || type.toLowerCase() === 'area') {
        // Ensure each dataset has proper structure
        safeChartData.datasets = safeChartData.datasets.map((dataset: any) => ({
          ...dataset,
          tension: typeof dataset.tension === 'number' && isFinite(dataset.tension) ? dataset.tension : 0.1,
          borderColor: dataset.borderColor || '#4BC0C0',
          pointRadius: dataset.pointRadius !== undefined ? dataset.pointRadius : 3,
          pointHoverRadius: dataset.pointHoverRadius !== undefined ? dataset.pointHoverRadius : 6,
          spanGaps: true, // This helps with missing data points
        }));
        
        // Ensure scales are properly configured
        safeChartOptions.scales = {
          ...safeChartOptions.scales,
          x: {
            ...safeChartOptions.scales?.x,
            type: 'category'
          },
          y: {
            ...safeChartOptions.scales?.y,
            type: 'linear'
          }
        };
      }

      switch (type.toLowerCase()) {
        case 'line':
          return <Line ref={chartRef} data={safeChartData} options={safeChartOptions} style={{width: '100%', height: '100%', display: 'block', position: 'static'}} />;
        case 'bar':
          return <Bar ref={chartRef} data={safeChartData} options={safeChartOptions} style={{width: '100%', height: '100%', display: 'block', position: 'static'}} />;
        case 'pie':
          return <Pie ref={chartRef} data={safeChartData} options={safeChartOptions} style={{width: '100%', height: '100%', display: 'block', position: 'static'}} />;
        case 'doughnut':
          return <Doughnut ref={chartRef} data={safeChartData} options={safeChartOptions} style={{width: '100%', height: '100%', display: 'block', position: 'static'}} />;
        case 'polararea':
          return <PolarArea ref={chartRef} data={safeChartData} options={safeChartOptions} style={{width: '100%', height: '100%', display: 'block', position: 'static'}} />;
        case 'scatter':
          return <Scatter ref={chartRef} data={safeChartData} options={safeChartOptions} style={{width: '100%', height: '100%', display: 'block', position: 'static'}} />;
        case 'bubble':
          return <Bubble ref={chartRef} data={safeChartData} options={safeChartOptions} style={{width: '100%', height: '100%', display: 'block', position: 'static'}} />;
        case 'radar':
          return <Radar ref={chartRef} data={safeChartData} options={safeChartOptions} style={{width: '100%', height: '100%', display: 'block', position: 'static'}} />;
        case 'area':
          // Area chart is a line chart with fill enabled
          const areaData = {
            ...safeChartData,
            datasets: safeChartData.datasets.map((dataset: any) => ({
              ...dataset,
              fill: true,
              backgroundColor: dataset.backgroundColor || 'rgba(75, 192, 192, 0.2)',
              borderColor: dataset.borderColor || 'rgba(75, 192, 192, 1)',
              tension: typeof dataset.tension === 'number' && isFinite(dataset.tension) ? dataset.tension : 0.4,
              pointRadius: dataset.pointRadius !== undefined ? dataset.pointRadius : 3,
              pointHoverRadius: dataset.pointHoverRadius !== undefined ? dataset.pointHoverRadius : 6,
              spanGaps: true,
            }))
          };
          return <Line ref={chartRef} data={areaData} options={safeChartOptions} style={{width: '100%', height: '100%', display: 'block', position: 'static'}} />;
        default:
          return (
            <div className="p-6 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 rounded-lg border border-amber-100 dark:border-amber-800 w-full max-w-full">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p>Unsupported chart type: {type}</p>
              </div>
              <p className="text-sm mt-2 ml-8">Supported types: line, bar, pie, doughnut, polararea, scatter, bubble, radar, area</p>
            </div>
          );
      }
    } catch (renderError: any) {
      console.error("Chart rendering error:", renderError);
      
      // Specific handling for cp1x errors
      if (renderError.message?.includes('cp1x') || renderError.message?.includes('control point')) {
        console.error('Chart.js control point error detected during render. Chart data:', JSON.stringify(data, null, 2));
        setError('Chart rendering failed due to data structure issues. Please check your data format.');
      } else {
        console.error('General chart rendering error:', renderError.message);
        setRenderError(true);
      }
      return null;
    }
  };

  // Error boundary fallback component
  const ErrorFallback = () => (
    <div className="w-full h-64 md:h-96 max-w-full overflow-hidden flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
      <div className="text-center p-6">
        <div className="flex items-center justify-center gap-3 mb-3 text-red-600 dark:text-red-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className="font-medium text-lg">Chart Error</h3>
        </div>
        <p className="text-sm text-red-600 dark:text-red-300 mb-4">
          Something went wrong while rendering the {type} chart.
        </p>
        <button 
          onClick={recoverFromError}
          className="px-4 py-2 text-sm bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          disabled={isRecovering}
        >
          {isRecovering ? 'Recovering...' : 'Try Again'}
        </button>
      </div>
    </div>
  );

  // Main render with comprehensive error handling
  const MainChart = () => {
    // If there's a validation error, show error message
    if (error) {
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg border border-red-100 dark:border-red-800 w-full max-w-full">
          <div className="flex items-center gap-3 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="font-medium">Chart data issue</h3>
          </div>
          <p className="ml-8 text-sm mb-3">{error}</p>
          <button 
            onClick={recoverFromError}
            className="ml-8 px-3 py-1 text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            disabled={isRecovering}
          >
            {isRecovering ? 'Recovering...' : 'Try Again'}
          </button>
        </div>
      );
    }

    // Show loading state during recovery or initialization
    if (isRecovering || !isReady) {
      return (
        <div className="w-full h-64 md:h-96 max-w-full overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm">{isRecovering ? 'Recovering chart...' : 'Initializing chart...'}</p>
          </div>
        </div>
      );
    }

    try {
      return (
        <div 
          ref={containerRef}
          className="w-full h-64 md:h-96 max-w-full overflow-hidden relative isolate" 
          style={{
            contain: 'layout style paint',
            overscrollBehavior: 'contain',
            scrollSnapAlign: 'start',
            scrollMargin: '1rem',
            isolation: 'isolate'
          }}
        >
          <div className="w-full h-full" style={{
            contain: 'layout style paint',
            display: 'block',
            position: 'static',
            width: '100%',
            height: '100%'
          }}>
            {renderChart()}
          </div>
        </div>
      );
    } catch (err) {
      console.error("Main chart render error:", err);
      setRenderError(true);
      return <ErrorFallback />;
    }
  };

  // Render the appropriate chart based on type
  try {
    return (
      <ChartErrorBoundary fallback={<ErrorFallback />}>
        <MainChart />
      </ChartErrorBoundary>
    );
  } catch (err) {
    console.error("Error rendering chart:", err);
    // Final fallback - this should always render something
    return <ErrorFallback />;
  }
} 