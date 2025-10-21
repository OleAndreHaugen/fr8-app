"use client";

import { type Message, type TextContent, type FileContent, type ImageContent, type MessageContent } from "../api/chat-client";
import { useEffect, useState, memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Copy, Check, FileText, Image as ImageIcon, X, Download, Square, ChevronDown, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import ChartComponent with SSR disabled
const DynamicChartComponent = dynamic(() => import('./chart-component'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
});

// Memoized Chart Wrapper to prevent re-renders during streaming
const MemoizedChart = memo(({ type, data, theme }: { type: string; data: any; theme?: 'light' | 'dark' }) => {
  return <DynamicChartComponent type={type} data={data} theme={theme} />;
}, (prevProps, nextProps) => {
  // Only re-render if the actual chart data or type changes
  return (
    prevProps.type === nextProps.type &&
    prevProps.theme === nextProps.theme &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});

MemoizedChart.displayName = 'MemoizedChart';

// Collapsible JSON Block Component with Syntax Highlighting
const JsonBlock = memo(({ title, jsonContent, keyProp }: { title: string; jsonContent: string; keyProp: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copyJsonSuccess, setCopyJsonSuccess] = useState(false);

  // Format JSON with proper indentation
  const formattedJson = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonContent.trim());
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      // If parsing fails, return the original content
      console.error('Failed to parse JSON:', error);
      return jsonContent;
    }
  }, [jsonContent]);

  // Syntax highlight JSON
  const highlightedJson = useMemo(() => {
    return formattedJson
      // Highlight keys (property names in quotes followed by colon)
      .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
      // Highlight string values (strings that are not followed by colon)
      .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
      // Highlight numbers
      .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
      // Highlight booleans
      .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
      // Highlight null
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
  }, [formattedJson]);

  const handleCopyJson = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(formattedJson)
      .then(() => {
        setCopyJsonSuccess(true);
        setTimeout(() => setCopyJsonSuccess(false), 2000);
      })
      .catch(err => console.error('Failed to copy JSON: ', err));
  };

  return (
    <div className="my-4 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Header - clickable to toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-gray-50 bg-gray-900"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown size={20} className="text-gray-600 dark:text-gray-300" />
          ) : (
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
          )}
          <span className="font-semibold text-gray-800 dark:text-white">{title}</span>
          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-600 text-blue-700 dark:text-white rounded-full">
            JSON
          </span>
        </div>
        <button
          onClick={handleCopyJson}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Copy JSON"
        >
          {copyJsonSuccess ? (
            <Check size={16} className="text-green-500" />
          ) : (
            <Copy size={16} className="text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Content - expandable */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <pre className="p-4 overflow-x-auto bg-white dark:bg-black text-sm font-mono">
            <code 
              className="language-json text-gray-800 dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: highlightedJson }}
            />
          </pre>
        </div>
      )}
      
      {/* Syntax highlighting styles */}
      <style jsx>{`
        :global(.json-key) {
          color: #d19a66;
        }
        :global(.json-string) {
          color: #98c379;
        }
        :global(.json-number) {
          color: #d19a66;
        }
        :global(.json-boolean) {
          color: #56b6c2;
        }
        :global(.json-null) {
          color: #c678dd;
        }
        :global(.dark .json-key) {
          color: #e5c07b;
        }
        :global(.dark .json-string) {
          color: #98c379;
        }
        :global(.dark .json-number) {
          color: #d19a66;
        }
        :global(.dark .json-boolean) {
          color: #61afef;
        }
        :global(.dark .json-null) {
          color: #c678dd;
        }
      `}</style>
    </div>
  );
});

JsonBlock.displayName = 'JsonBlock';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  theme?: 'light' | 'dark';
  onAppOpen?: (name: string, url: string) => void;
  onAnalyticOpen?: (name: string, data: string) => void;
}

export default function ChatMessage({ 
  message, 
  isStreaming = false, 
  theme, 
  onAppOpen, 
  onAnalyticOpen,
}: ChatMessageProps) {
  const { role, content } = message;
  const [copied, setCopied] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);

  // Handle image click to open dialog
  const handleImageClick = (imageSrc: string, imageAlt: string = "Image") => {
    setSelectedImage({ src: imageSrc, alt: imageAlt });
    setImageDialogOpen(true);
  };

  // Close dialog
  const closeImageDialog = () => {
    setImageDialogOpen(false);
    setSelectedImage(null);
  };

  // Handle escape key to close dialog
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && imageDialogOpen) {
        closeImageDialog();
      }
    };

    if (imageDialogOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [imageDialogOpen]);

  const copyToClipboard = () => {
    const textToCopy = typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? content
          .filter(part => part.type === 'text')
          .map(part => (part as TextContent).text)
          .join('\n')
        : '';

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // Fancy streaming indicator component
  const StreamingIndicator = () => {
    if (!isStreaming || role !== "assistant") {
      return null;
    }

    return (
      <div className="mt-3 inline-flex items-center">
        <div 
          className="flex items-center space-x-3 rounded-lg px-4 py-2 border shadow-sm"
          style={{
            background: theme === 'dark' 
              ? 'linear-gradient(to right, #1f2937, #312e81)' 
              : 'linear-gradient(to right, #f9fafb, #eff6ff)',
            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
          }}
        >
          {/* Multi-layered animated spinner */}
          <div className="relative">
            {/* Outer spinning ring */}
            <div 
              className="w-5 h-5 border-2 rounded-full"
              style={{
                borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                borderTopColor: theme === 'dark' ? '#60a5fa' : '#3b82f6',
                animation: 'spin 1s linear infinite'
              }}
            ></div>
            {/* Inner pulsing ring */}
            <div 
              className="absolute rounded-full"
              style={{
                top: '2px',
                left: '2px',
                width: '16px',
                height: '16px',
                border: '1px solid transparent',
                borderTopColor: theme === 'dark' ? '#a78bfa' : '#8b5cf6',
                opacity: 0.4,
                animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
              }}
            ></div>
            {/* Center pulsing dot */}
            <div 
              className="absolute rounded-full"
              style={{
                top: '6px',
                left: '6px',
                width: '8px',
                height: '8px',
                background: theme === 'dark' 
                  ? 'linear-gradient(to right, #60a5fa, #a78bfa)' 
                  : 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            ></div>
          </div>
          
          {/* Text with animated dots */}
          <div className="flex items-center space-x-1">
            <span 
              className="text-sm font-medium"
              style={{
                background: theme === 'dark' 
                  ? 'linear-gradient(to right, #60a5fa, #a78bfa)' 
                  : 'linear-gradient(to right, #2563eb, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Our AI is working
            </span>
            <div className="flex" style={{ gap: '2px' }}>
              <div 
                className="rounded-full"
                style={{
                  width: '4px',
                  height: '4px',
                  backgroundColor: theme === 'dark' ? '#60a5fa' : '#3b82f6',
                  animation: 'bounce 1s infinite',
                  animationDelay: '0ms'
                }}
              ></div>
              <div 
                className="rounded-full"
                style={{
                  width: '4px',
                  height: '4px',
                  backgroundColor: theme === 'dark' ? '#a78bfa' : '#8b5cf6',
                  animation: 'bounce 1s infinite',
                  animationDelay: '200ms'
                }}
              ></div>
              <div 
                className="rounded-full"
                style={{
                  width: '4px',
                  height: '4px',
                  backgroundColor: theme === 'dark' ? '#60a5fa' : '#3b82f6',
                  animation: 'bounce 1s infinite',
                  animationDelay: '400ms'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to render chart from code block
  const renderChart = (chartType: string, chartData: string, key?: string) => {
    try {
      // Remove JSON comments before parsing
      const cleanJsonString = chartData
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* block comments */
        .replace(/\/\/.*$/gm, '')         // Remove // line comments
        .replace(/,(\s*[}\]])/g, '$1');   // Remove trailing commas before } or ]

      const parsedData = JSON.parse(cleanJsonString);

      return (
        <MemoizedChart
          key={key || `chart-${chartType}-${cleanJsonString.length}`}
          type={chartType}
          data={parsedData}
          theme={theme}
        />
      );
    } catch (error) {
      console.error("Failed to parse chart data:", error);
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg border border-red-100 dark:border-red-800 w-full max-w-full my-4">
          <div className="flex items-center gap-3 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="font-medium">Unable to generate chart</h3>
          </div>
          <p className="text-sm" style={{ marginLeft: '2rem' }}>The data format is not compatible with the requested chart type. Please try a different visualization or check the data structure.</p>
        </div>
      );
    }
  };

  // Helper function to render image from code block
  const renderImage = (imageData: string, key?: string) => {
    const trimmedData = imageData.trim();

    return (
      <div key={key || `image-${trimmedData.substring(0, 50)}`} className="my-6 p-2">
        <div className="max-w-full">
          <img
            src={trimmedData}
            alt="Generated image"
            className="max-w-full max-h-96 rounded-md object-contain mb-2 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleImageClick(trimmedData, "Generated image")}
            onError={(e) => {
              console.error("Failed to load image:", trimmedData);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="flex justify-end text-sm mr-2">
            <a
              href={trimmedData}
              download="generated-image.jpeg"
              className="text-blue-500 hover:text-blue-600"
            >
              Download
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to render app block as button
  const renderApp = (appName: string, appUrl: string, key?: string) => {
    const handleAppClick = () => {
      if (onAppOpen) {
        onAppOpen(appName, appUrl);
      }
    };

    return (
      <div key={key || `app-${appName}`} onClick={handleAppClick} className="my-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">{appName}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Click to open application</p>
            </div>
          </div>

        </div>
      </div>
    );
  };

  // Helper function to render JSON block
  const renderJson = (title: string, jsonData: string, key?: string) => {
    return (
      <JsonBlock
        key={key || `json-${title.replace(/\s/g, '')}`}
        title={title}
        jsonContent={jsonData.trim()}
        keyProp={key || `json-${title.replace(/\s/g, '')}`}
      />
    );
  };

  // Helper function to render analytic block as button
  const renderAnalytic = (analyticData: string, key?: string) => {
    // Parse CSV to get preview info
    const lines = analyticData.trim().split('\n');
    const headers = lines[0]?.split(';') || [];
    const dataRows = lines.slice(1);
    const recordCount = dataRows.length;
    const columnCount = headers.length;

    // Create a dataset name based on headers or use default
    const datasetName = headers.length > 0 ? `Dataset (${headers.join(', ')})` : 'Analytics Dataset';

    const handleAnalyticClick = () => {
      if (onAnalyticOpen) {
        onAnalyticOpen(datasetName, analyticData);
      }
    };

    return (
      <div key={key || `analytic-${analyticData.substring(0, 50)}`} onClick={handleAnalyticClick} className="my-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Analytics Dataset</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {recordCount} records, {columnCount} columns - Click to analyze
              </p>
              {headers.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Fields: {headers.slice(0, 3).join(', ')}{headers.length > 3 ? ` (+${headers.length - 3} more)` : ''}
                </p>
              )}
            </div>
          </div>
          <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-800/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
            Pivot Table
          </div>
        </div>
      </div>
    );
  };

  // Render image loading indicator
  const renderImageLoading = () => {
    // Add a timeout mechanism - if image loading takes too long, show error state
    useEffect(() => {
      if (isStreaming) {
        const timeout = setTimeout(() => {
          console.warn("Image generation timeout - this may indicate a streaming issue");
        }, 30000); // 30 second timeout

        return () => clearTimeout(timeout);
      }
    }, [isStreaming]);

    return (
      <div className="my-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 w-full block" style={{
        display: 'block',
        contain: 'layout',
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        overscrollBehavior: 'contain',
        scrollSnapStop: 'always'
      }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-indigo-500 dark:border-indigo-400 border-t-transparent rounded-full"></div>
          </div>
          <div className="font-medium text-gray-700 dark:text-gray-300">
            Generating image...
          </div>
        </div>

        <div className="h-64 md:h-80 relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 w-full flex items-center justify-center">
          {/* Image placeholder with shimmer effect */}
          <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 animate-pulse relative overflow-hidden">
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -translate-x-full"></div>

            {/* Image icon in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon size={48} className="text-gray-400 dark:text-gray-500" />
            </div>

            {/* Corner indicators to suggest it's an image */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-gray-400 dark:border-gray-500"></div>
            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-gray-400 dark:border-gray-500"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-gray-400 dark:border-gray-500"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-gray-400 dark:border-gray-500"></div>
          </div>
        </div>

        <div className="mt-4 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
            <span>Processing image data...</span>
          </div>
          <div>Please wait...</div>
        </div>

        {/* Add shimmer keyframe animation */}
        <style jsx>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    );
  };

  // Render chart loading indicator
  const renderChartLoading = (type: string = "unknown") => {
    // Normalize chart type
    const normalizedType = type.toLowerCase();

    return (
      <div className="my-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 w-full block" style={{
        display: 'block',
        contain: 'layout',
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        overscrollBehavior: 'contain',
        scrollSnapStop: 'always'
      }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-indigo-500 dark:border-indigo-400 border-t-transparent rounded-full"></div>
          </div>
          <div className="font-medium text-gray-700 dark:text-gray-300">
            Generating {normalizedType} chart...
          </div>
        </div>

        <div className="h-64 md:h-80 relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 w-full">
          {/* Axes */}
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-300 dark:bg-gray-600"></div>
          <div className="absolute bottom-0 left-0 w-0.5 h-full bg-gray-300 dark:bg-gray-600"></div>

          {/* Grid lines - horizontal */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={`h-${i}`}
              className="absolute w-full h-px bg-gray-200 dark:bg-gray-600"
              style={{ bottom: `${i * 20}%` }}
            ></div>
          ))}

          {/* Grid lines - vertical */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={`v-${i}`}
              className="absolute h-full w-px bg-gray-200 dark:bg-gray-600"
              style={{ left: `${i * 12.5}%` }}
            ></div>
          ))}

          {/* For line/bar charts - show placeholder bars/points */}
          {normalizedType === 'bar' && (
            <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-around p-4">
              {[45, 80, 30, 65, 50, 75, 40].map((h, i) => (
                <div
                  key={`bar-${i}`}
                  className="w-8 bg-gray-300 dark:bg-gray-600 animate-pulse rounded-t-sm opacity-60"
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>
          )}

          {normalizedType === 'line' && (
            <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-around p-4">
              {[45, 80, 30, 65, 50, 75, 40].map((h, i) => (
                <div
                  key={`point-${i}`}
                  className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"
                  style={{
                    position: 'absolute',
                    bottom: `${h}%`,
                    left: `${10 + i * 12}%`
                  }}
                ></div>
              ))}
            </div>
          )}

          {(normalizedType === 'pie' || normalizedType === 'doughnut') && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-32 h-32 rounded-full border-8 border-gray-300 dark:border-gray-600 animate-pulse ${normalizedType === 'doughnut' ? 'border-[16px]' : 'border-8'}`}></div>
              <div className="absolute w-32 h-32">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={`slice-${i}`}
                    className="absolute w-16 h-0.5 bg-gray-400 dark:bg-gray-500 origin-left"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `rotate(${i * 45}deg)`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {normalizedType === 'scatter' && (
            <div className="absolute inset-0">
              {Array.from({ length: 15 }).map((_, i) => {
                const x = 10 + Math.random() * 80;
                const y = 10 + Math.random() * 80;
                return (
                  <div
                    key={`scatter-${i}`}
                    className="absolute w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"
                    style={{
                      left: `${x}%`,
                      bottom: `${y}%`,
                      animationDelay: `${i * 100}ms`
                    }}
                  ></div>
                );
              })}
            </div>
          )}

          {normalizedType === 'radar' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 relative">
                {/* Radar web */}
                {[1, 2, 3].map((level) => (
                  <div
                    key={`radar-web-${level}`}
                    className="absolute rounded-full border border-gray-300 dark:border-gray-600"
                    style={{
                      width: `${level * 33}%`,
                      height: `${level * 33}%`,
                      left: `${50 - (level * 33) / 2}%`,
                      top: `${50 - (level * 33) / 2}%`
                    }}
                  ></div>
                ))}

                {/* Radar axes */}
                {[0, 60, 120, 180, 240, 300].map((angle) => (
                  <div
                    key={`radar-axis-${angle}`}
                    className="absolute w-24 h-0.5 bg-gray-300 dark:bg-gray-600 origin-left"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `rotate(${angle}deg)`
                    }}
                  ></div>
                ))}

                {/* Radar data polygon */}
                <div className="absolute w-full h-full animate-pulse">
                  <div className="w-3 h-3 absolute rounded-full bg-gray-400 dark:bg-gray-500"
                    style={{ left: '50%', top: '10%', transform: 'translate(-50%, -50%)' }}></div>
                  <div className="w-3 h-3 absolute rounded-full bg-gray-400 dark:bg-gray-500"
                    style={{ left: '85%', top: '35%', transform: 'translate(-50%, -50%)' }}></div>
                  <div className="w-3 h-3 absolute rounded-full bg-gray-400 dark:bg-gray-500"
                    style={{ left: '75%', top: '75%', transform: 'translate(-50%, -50%)' }}></div>
                  <div className="w-3 h-3 absolute rounded-full bg-gray-400 dark:bg-gray-500"
                    style={{ left: '25%', top: '75%', transform: 'translate(-50%, -50%)' }}></div>
                  <div className="w-3 h-3 absolute rounded-full bg-gray-400 dark:bg-gray-500"
                    style={{ left: '15%', top: '35%', transform: 'translate(-50%, -50%)' }}></div>
                </div>
              </div>
            </div>
          )}

          {(normalizedType !== 'bar' && normalizedType !== 'line' &&
            normalizedType !== 'pie' && normalizedType !== 'doughnut' &&
            normalizedType !== 'scatter' && normalizedType !== 'radar') && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-400 dark:text-gray-500 text-lg">
                  Preparing {normalizedType} chart...
                </div>
              </div>
            )}
        </div>

        <div className="mt-4 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="w-2/3 flex gap-2">
            {['Dataset 1', 'Dataset 2'].map((label, i) => (
              <div key={`legend-${i}`} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-gray-400 dark:bg-gray-500' : 'bg-gray-300 dark:bg-gray-600'}`} style={{ marginRight: '0.25rem' }}></div>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div>Processing data...</div>
        </div>
      </div>
    );
  };

  // Render app loading indicator
  const renderAppLoading = (appName: string = "Unknown App") => {
    return (
      <div className="my-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 w-full block">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full"></div>
          </div>
          <div className="font-medium text-gray-700 dark:text-gray-300">
            Preparing {appName}...
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 animate-pulse flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">{appName}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Getting ready to launch...</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg">
            Loading...
          </div>
        </div>
      </div>
    );
  };

  // Render analytic loading indicator
  const renderAnalyticLoading = () => {
    return (
      <div className="my-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 w-full block">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-emerald-500 dark:border-emerald-400 border-t-transparent rounded-full"></div>
          </div>
          <div className="font-medium text-gray-700 dark:text-gray-300">
            Processing analytics data...
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 animate-pulse flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Analytics Dataset</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Preparing pivot table interface...</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-800/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full animate-pulse">
            Loading...
          </div>
        </div>
      </div>
    );
  }; 

  // Custom Markdown component with all styles applied
  const CustomMarkdown = ({ content }: { content: string }) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 py-2 my-4 bg-gray-100 dark:bg-gray-800 rounded-md">{children}</blockquote>,
        p: ({ children }) => <p className="last:mb-0 mb-2">{children}</p>,
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-2 last:mb-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mb-2 last:mb-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mb-2 last:mb-0">{children}</h3>,
        h4: ({ children }) => <h4 className="text-base font-bold mb-2 last:mb-0">{children}</h4>,
        h5: ({ children }) => <h5 className="text-sm font-bold mb-2 last:mb-0">{children}</h5>,
        h6: ({ children }) => <h6 className="text-xs font-bold mb-2 last:mb-0">{children}</h6>,
        ul: ({ children }) => <ul className="list-disc list-outside ml-6 mb-2 last:mb-0 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-outside ml-6 mb-2 last:mb-0 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        hr: () => <hr className="my-4 border-t border-gray-200 dark:border-gray-700 mb-3" />,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline">
            {children}
          </a>
        ),
        pre: ({ children }) => (
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto my-2">
            {children}
          </pre>
        ),
        code: ({ className, children }) => {
          const isInlineCode = !className;
          return isInlineCode ? (
            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ) : (
            <code className={className}>{children}</code>
          );
        },
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="border-collapse w-full">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-left">
            {children}
          </th>
        ),
        td: ({ children, ...props }) => (
          <td className="border border-gray-300 dark:border-gray-700 px-4 py-2" {...props}>
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );

  // Function to process text for charts and regular markdown
  const processTextContent = useMemo(() => {
    return (text: string) => {
      if (!isStreaming) {
        // Not streaming - process all charts, images, apps, analytics, widgets, and JSON blocks normally
        const parts = text.split(/(```(?:chart:[a-z]+|image|app:[^\n]+|analytic|(?:widget:)?(?:card|form|decision)|json:[^\n]+)\n[\s\S]*?\n```)/g);

        if (parts.length > 1) {
          return (
            <>
              {parts.map((part, i) => {
                const chartMatch = part.match(/```chart:([a-z]+)\n([\s\S]*?)\n```/);
                const imageMatch = part.match(/```image\n([\s\S]*?)\n```/);
                const appMatch = part.match(/```app:([^\n]+)\n([\s\S]*?)\n```/);
                const analyticMatch = part.match(/```analytic\n([\s\S]*?)\n```/);
                const jsonMatch = part.match(/```json:([^\n]+)\n([\s\S]*?)\n```/);

                if (chartMatch) {
                  const [_, chartType, chartData] = chartMatch;
                  // Use a stable key based on chart content for completed charts
                  const chartKey = `completed-chart-${i}-${chartData.substring(0, 50).replace(/\s/g, '')}`;
                  return (
                    <div key={chartKey} className="my-6 block w-full" style={{
                      display: 'block',
                      contain: 'layout',
                      marginTop: '1.5rem',
                      marginBottom: '1.5rem',
                      overscrollBehavior: 'contain',
                      scrollSnapStop: 'always'
                    }}>
                      {renderChart(chartType, chartData, chartKey)}
                    </div>
                  );
                } else if (imageMatch) {
                  const [_, imageData] = imageMatch;
                  const imageKey = `completed-image-${i}-${imageData.substring(0, 50).replace(/\s/g, '')}`;
                  return (
                    <div key={imageKey} className="my-6 block w-full" style={{
                      display: 'block',
                      contain: 'layout',
                      marginTop: '1.5rem',
                      marginBottom: '1.5rem',
                      overscrollBehavior: 'contain',
                      scrollSnapStop: 'always'
                    }}>
                      {renderImage(imageData, imageKey)}
                    </div>
                  );
                } else if (appMatch) {
                  const [_, appName, appUrl] = appMatch;
                  const appKey = `completed-app-${i}-${appName.replace(/\s/g, '')}`;
                  return (
                    <div key={appKey} className="my-6 block w-full" style={{
                      display: 'block',
                      contain: 'layout',
                      marginTop: '1.5rem',
                      marginBottom: '1.5rem',
                      overscrollBehavior: 'contain',
                      scrollSnapStop: 'always'
                    }}>
                      {renderApp(appName, appUrl.trim(), appKey)}
                    </div>
                  );
                } else if (analyticMatch) {
                  const [_, analyticData] = analyticMatch;
                  const analyticKey = `completed-analytic-${i}-${analyticData.substring(0, 50).replace(/\s/g, '')}`;
                  return (
                    <div key={analyticKey} className="my-6 block w-full" style={{
                      display: 'block',
                      contain: 'layout',
                      marginTop: '1.5rem',
                      marginBottom: '1.5rem',
                      overscrollBehavior: 'contain',
                      scrollSnapStop: 'always'
                    }}>
                      {renderAnalytic(analyticData.trim(), analyticKey)}
                    </div>
                  );
                } else if (jsonMatch) {
                  const [_, jsonTitle, jsonData] = jsonMatch;
                  const jsonKey = `completed-json-${i}-${jsonTitle.replace(/\s/g, '')}`;
                  return renderJson(jsonTitle, jsonData, jsonKey);
                }
                return part ? <CustomMarkdown key={`text-${i}`} content={part} /> : null;
              })}
            </>
          );
        }

        return <CustomMarkdown content={text} />;
      }

      // Streaming mode - separate complete charts/images/apps/analytics/widgets/JSON from incomplete ones
      const chartTagMatches = [...text.matchAll(/```chart:([a-z]+)\n/g)];
      const imageTagMatches = [...text.matchAll(/```image\n/g)];
      const appTagMatches = [...text.matchAll(/```app:([^\n]+)\n/g)];
      const analyticTagMatches = [...text.matchAll(/```analytic\n/g)];
      const jsonTagMatches = [...text.matchAll(/```json:([^\n]+)\n/g)];

      if (!chartTagMatches.length && !imageTagMatches.length && !appTagMatches.length && !analyticTagMatches.length && !jsonTagMatches.length) {
        return <CustomMarkdown content={text} />;
      }

      // Find all opening tags and their positions
      const allTags: Array<
        | { type: 'chart'; index: number; chartType: string; match: string }
        | { type: 'image'; index: number; match: string }
        | { type: 'app'; index: number; appName: string; match: string }
        | { type: 'analytic'; index: number; match: string }
        | { type: 'json'; index: number; jsonTitle: string; match: string }
      > = [
        ...chartTagMatches.map(match => ({
          type: 'chart' as const,
          index: match.index!,
          chartType: match[1],
          match: match[0]
        })),
        ...imageTagMatches.map(match => ({
          type: 'image' as const,
          index: match.index!,
          match: match[0]
        })),
        ...appTagMatches.map(match => ({
          type: 'app' as const,
          index: match.index!,
          appName: match[1],
          match: match[0]
        })),
        ...analyticTagMatches.map(match => ({
          type: 'analytic' as const,
          index: match.index!,
          match: match[0]
        })),
        ...jsonTagMatches.map(match => ({
          type: 'json' as const,
          index: match.index!,
          jsonTitle: match[1],
          match: match[0]
        }))
      ].sort((a, b) => a.index - b.index);

      if (!allTags.length) {
        return <CustomMarkdown content={text} />;
      }

      // Find the last opening tag
      const lastTag = allTags[allTags.length - 1];
      const lastOpeningTagIndex = lastTag.index;

      // Split content into: text before last block, and last block content
      const textBeforeLastBlock = text.substring(0, lastOpeningTagIndex);
      const lastBlockContent = text.substring(lastOpeningTagIndex);

      // Check if the last block is complete
      const hasClosingTag = /\n```|```\n|```$/.test(lastBlockContent);

      let processedBeforeBlock = null;
      
      if (textBeforeLastBlock) {
        // Process all complete charts/images/apps/analytics/widgets/JSON before the last one
        const beforeParts = textBeforeLastBlock.split(/(```(?:chart:[a-z]+|image|app:[^\n]+|analytic|(?:widget:)?(?:card|form|decision)|json:[^\n]+)\n[\s\S]*?\n```)/g);

        if (beforeParts.length > 1) {
          processedBeforeBlock = (
            <>
              {beforeParts.map((part, i) => {
                const chartMatch = part.match(/```chart:([a-z]+)\n([\s\S]*?)\n```/);
                const imageMatch = part.match(/```image\n([\s\S]*?)\n```/);
                const appMatch = part.match(/```app:([^\n]+)\n([\s\S]*?)\n```/);
                const analyticMatch = part.match(/```analytic\n([\s\S]*?)\n```/);
                const jsonMatch = part.match(/```json:([^\n]+)\n([\s\S]*?)\n```/);

                if (chartMatch) {
                  const [_, chartType, chartData] = chartMatch;
                  // Use stable key for completed charts to prevent re-renders
                  const chartKey = `streaming-complete-chart-${i}-${chartData.substring(0, 50).replace(/\s/g, '')}`;
                  return (
                    <div key={chartKey} className="my-6 block w-full" style={{
                      display: 'block',
                      contain: 'layout',
                      marginTop: '1.5rem',
                      marginBottom: '1.5rem',
                      overscrollBehavior: 'contain',
                      scrollSnapStop: 'always'
                    }}>
                      {renderChart(chartType, chartData, chartKey)}
                    </div>
                  );
                } else if (imageMatch) {
                  const [_, imageData] = imageMatch;
                  const imageKey = `streaming-complete-image-${i}-${imageData.substring(0, 50).replace(/\s/g, '')}`;
                  return (
                    <div key={imageKey} className="my-6 block w-full" style={{
                      display: 'block',
                      contain: 'layout',
                      marginTop: '1.5rem',
                      marginBottom: '1.5rem',
                      overscrollBehavior: 'contain',
                      scrollSnapStop: 'always'
                    }}>
                      {renderImage(imageData, imageKey)}
                    </div>
                  );
                } else if (appMatch) {
                  const [_, appName, appUrl] = appMatch;
                  const appKey = `streaming-complete-app-${i}-${appName.replace(/\s/g, '')}`;
                  return (
                    <div key={appKey} className="my-6 block w-full" style={{
                      display: 'block',
                      contain: 'layout',
                      marginTop: '1.5rem',
                      marginBottom: '1.5rem',
                      overscrollBehavior: 'contain',
                      scrollSnapStop: 'always'
                    }}>
                      {renderApp(appName, appUrl.trim(), appKey)}
                    </div>
                  );
                } else if (analyticMatch) {
                  const [_, analyticData] = analyticMatch;
                  const analyticKey = `streaming-complete-analytic-${i}-${analyticData.substring(0, 50).replace(/\s/g, '')}`;
                  return (
                    <div key={analyticKey} className="my-6 block w-full" style={{
                      display: 'block',
                      contain: 'layout',
                      marginTop: '1.5rem',
                      marginBottom: '1.5rem',
                      overscrollBehavior: 'contain',
                      scrollSnapStop: 'always'
                    }}>
                      {renderAnalytic(analyticData.trim(), analyticKey)}
                    </div>
                  );                
                } else if (jsonMatch) {
                  const [_, jsonTitle, jsonData] = jsonMatch;
                  const jsonKey = `streaming-complete-json-${i}-${jsonTitle.replace(/\s/g, '')}`;
                  return renderJson(jsonTitle, jsonData, jsonKey);
                }
                return part ? <CustomMarkdown key={`text-${i}`} content={part} /> : null;
              })}
            </>
          );
        } else {
          processedBeforeBlock = <CustomMarkdown content={textBeforeLastBlock} />;
        }
      }

      // Handle the last block
      let lastBlockElement = null;

      if (hasClosingTag) {
        // Last block is complete - render it normally with stable key
        if (lastTag.type === 'chart') {
          const chartMatch = lastBlockContent.match(/```chart:([a-z]+)\n([\s\S]*?)\n```/);
          if (chartMatch) {
            const [_, chartType, chartData] = chartMatch;
            const chartKey = `streaming-last-complete-chart-${chartData.substring(0, 50).replace(/\s/g, '')}`;
            lastBlockElement = (
              <div key={chartKey} className="my-6 block w-full" style={{
                display: 'block',
                contain: 'layout',
                marginTop: '1.5rem',
                marginBottom: '1.5rem',
                overscrollBehavior: 'contain',
                scrollSnapStop: 'always'
              }}>
                {renderChart(chartType, chartData, chartKey)}
              </div>
            );
          }
        } else if (lastTag.type === 'image') {
          const imageMatch = lastBlockContent.match(/```image\n([\s\S]*?)\n```/);
          if (imageMatch) {
            const [_, imageData] = imageMatch;
            const imageKey = `streaming-last-complete-image-${imageData.substring(0, 50).replace(/\s/g, '')}`;
            lastBlockElement = (
              <div key={imageKey} className="my-6 block w-full" style={{
                display: 'block',
                contain: 'layout',
                marginTop: '1.5rem',
                marginBottom: '1.5rem',
                overscrollBehavior: 'contain',
                scrollSnapStop: 'always'
              }}>
                {renderImage(imageData, imageKey)}
              </div>
            );
          }
        } else if (lastTag.type === 'app') {
          const appMatch = lastBlockContent.match(/```app:([^\n]+)\n([\s\S]*?)\n```/);
          if (appMatch) {
            const [_, appName, appUrl] = appMatch;
            const appKey = `streaming-last-complete-app-${appName.replace(/\s/g, '')}`;
            lastBlockElement = (
              <div key={appKey} className="my-6 block w-full" style={{
                display: 'block',
                contain: 'layout',
                marginTop: '1.5rem',
                marginBottom: '1.5rem',
                overscrollBehavior: 'contain',
                scrollSnapStop: 'always'
              }}>
                {renderApp(appName, appUrl.trim(), appKey)}
              </div>
            );
          }
        } else if (lastTag.type === 'analytic') {
          const analyticMatch = lastBlockContent.match(/```analytic\n([\s\S]*?)\n```/);
          if (analyticMatch) {
            const [_, analyticData] = analyticMatch;
            const analyticKey = `streaming-last-complete-analytic-${analyticData.substring(0, 50).replace(/\s/g, '')}`;
            lastBlockElement = (
              <div key={analyticKey} className="my-6 block w-full" style={{
                display: 'block',
                contain: 'layout',
                marginTop: '1.5rem',
                marginBottom: '1.5rem',
                overscrollBehavior: 'contain',
                scrollSnapStop: 'always'
              }}>
                {renderAnalytic(analyticData.trim(), analyticKey)}
              </div>
            );
          }
        } else if (lastTag.type === 'json') {
          const jsonMatch = lastBlockContent.match(/```json:([^\n]+)\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const [_, jsonTitle, jsonData] = jsonMatch;
            const jsonKey = `streaming-last-complete-json-${jsonTitle.replace(/\s/g, '')}`;
            lastBlockElement = renderJson(jsonTitle, jsonData, jsonKey);
          }
        }
      } else {
        // Last block is incomplete - show loading indicator (for JSON, just show a loading placeholder)
        if (lastTag.type === 'chart') {
          const chartType = lastTag.chartType;
          lastBlockElement = renderChartLoading(chartType);
        } else if (lastTag.type === 'image') {
          lastBlockElement = renderImageLoading();
        } else if (lastTag.type === 'app') {
          const appName = lastTag.appName;
          lastBlockElement = renderAppLoading(appName);
        } else if (lastTag.type === 'analytic') {
          lastBlockElement = renderAnalyticLoading();
        } else if (lastTag.type === 'json') {
          // For JSON, show a simple loading indicator
          const jsonTitle = lastTag.jsonTitle;
          lastBlockElement = (
            <div className="my-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full"></div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{jsonTitle}</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    JSON
                  </span>
                </div>
              </div>
            </div>
          );
        }
      }

      return (
        <>
          {processedBeforeBlock}
          {lastBlockElement}
        </>
      );
    };
  }, [isStreaming, theme]); // Only re-create the function when these values change

  const renderContent = () => {
    const contentToRender = content;

    if (typeof contentToRender === "string") {
      return (
        <>
          {processTextContent(contentToRender)}
          <StreamingIndicator />
        </>
      );
    } else if (Array.isArray(contentToRender)) {
      return (
        <div className="">
          {contentToRender.map((part, i) => {
            if (part.type === "text") {
              const textContent = (part as TextContent).text;
              return (
                <div key={`text-${i}`}>
                  {processTextContent(textContent)}
                </div>
              );
            } else if (part.type === "file") {
              const filePart = part as FileContent;

              return (
                <div key={`file-${i}-${filePart.filename || i}`} className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                  <p className="text-sm text-gray-500 mb-2 flex items-center">
                    <FileText size={16} style={{ marginRight: '0.25rem' }} />
                    PDF Document:
                  </p>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium mb-2">{filePart.filename || "Document"}</span>

                    {/* Direct download option that opens the data directly */}
                    <a
                      href={filePart.data}
                      download={filePart.filename}
                      className="mb-2 inline-flex items-center text-blue-500 hover:text-blue-600"
                    >
                      Download
                    </a>
                  </div>
                </div>
              );
            } else if (part.type === "image") {
              const imagePart = part as ImageContent;

              return (
                <div key={`image-${i}-${i}`} className="p-2">
                  <div className="max-w-full">
                    {/* The image itself - now clickable */}
                    <img
                      src={imagePart.image}
                      alt={"Attached image"}
                      className="max-w-full max-h-96 rounded-md object-contain mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleImageClick(imagePart.image, "Attached image")}
                    />

                    {/* Caption with download option */}
                    <div className="flex justify-end text-sm mr-2">
                      <a
                        href={imagePart.image}
                        download={"image.png"}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })}

          <StreamingIndicator />
        </div>
      );
    }

    return <div>...</div>;
  };

  const formatTime = (date: string) => {
    try {

      if (!date) {
        return "";
      }

      return new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      }).format(new Date(date));
    } catch (error) {
      console.error("Error formatting date:", date, error);
      return "--:--";
    }
  };

  return (
    <>
      <div className="mb-3">
        <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[100%] sm:max-w-[90%] ${role === "user" ? "" : ""}`}>
            <div className={`rounded-2xl ${role === "assistant"
              ? "bg-transparent p-3"
              : "chat-message-background p-3"
              } transition-all duration-200`}>
              <div className="text-base mb-0">
                {renderContent()}
              </div>
            </div>
            <div className={`p-3 mt-2 text-xs text-gray-500 dark:text-gray-400 ${role === "user" ? "text-right pr-1" : "text-left"}`}>
              {formatTime(message.created_at)}
              {role === "assistant" && (
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  style={{ marginLeft: '0.5rem' }}
                  aria-label="Copy message"
                >
                  {copied ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Dialog */}
      {imageDialogOpen && selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeImageDialog}
        >
          <div
            className="relative max-w-[95vw] max-h-[95vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="absolute top-0 right-0 z-10 p-4">
              <div className="flex items-center gap-2">
                <a
                  href={selectedImage.src}
                  download="image.png"
                  className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all cursor-pointer"
                  title="Download image"
                >
                  <Download size={20} />
                </a>
                <button
                  onClick={closeImageDialog}
                  className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all cursor-pointer"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Image */}
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-[95vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}