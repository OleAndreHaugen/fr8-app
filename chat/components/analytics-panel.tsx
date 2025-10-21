"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, Filter, Download, RotateCcw, ArrowUp, ArrowDown, X, ArrowUpDown, Folder, FolderOpen, FileText, BarChart3, Settings, Eye, EyeOff } from 'lucide-react';

interface AnalyticsPanelProps {
  name: string;
  csvData: string;
  theme?: 'light' | 'dark';
}

interface PivotConfig {
  rows: string[];
  columns: string[];
  values: string[];
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
}

interface TreeNode {
  id: string;
  level: number;
  label: string;
  value: any;
  count: number;
  aggregatedData: Record<string, any>;
  children: TreeNode[];
  isExpanded: boolean;
  parent?: TreeNode;
  originalRows: any[];
  _isTreeNode: boolean;
}

export default function AnalyticsPanel({ name, csvData, theme }: AnalyticsPanelProps) {
  // Parse CSV data
  const { headers, data } = useMemo(() => {
    const lines = csvData.trim().split('\n');
    const headers = lines[0]?.split(';').map(h => h.trim()) || [];
    const rows = lines.slice(1).map(line => {
      const values = line.split(';').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    return { headers, data: rows };
  }, [csvData]);

  // Pivot configuration state
  const [pivotConfig, setPivotConfig] = useState<PivotConfig>({
    rows: [],
    columns: [],
    values: [],
    aggregation: 'count'
  });

  // Filter state
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Group expansion state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showGroupedView, setShowGroupedView] = useState(false);

  // Tree view state
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [animatingNodes, setAnimatingNodes] = useState<Set<string>>(new Set());

  // Number formatting utilities
  const isNumericValue = (value: any): boolean => {
    return typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value));
  };

  const formatNumericValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    const parsed = parseFloat(value);
    return !isNaN(parsed) ? parsed.toLocaleString() : value;
  };

  const shouldFormatAsNumber = (value: any, header: string): boolean => {
    // Only format numbers for Value Columns and Count column
    const isValueColumn = pivotConfig.values.includes(header);
    const isCountColumn = header === '_count';

    return (isValueColumn || isCountColumn) && isNumericValue(value);
  };

  const getCellAlignment = (value: any, header: string, isFirstColumn: boolean): string => {
    if (isFirstColumn) return 'text-left'; // First column always left-aligned for hierarchy

    // Right-align only value columns and count column
    const isValueColumn = pivotConfig.values.includes(header);
    const isCountColumn = header === '_count';

    if (isValueColumn || isCountColumn) {
      return 'text-right';
    }

    // All other columns stay left-aligned (including numeric group-by columns like Year, ID, etc.)
    return 'text-left';
  };

  // Tree visual utilities
  const getTreeIcon = (node: any, hasChildren: boolean) => {
    if (!hasChildren) {
      return <FileText size={14} className="text-blue-500 dark:text-blue-400" />;
    }

    if (node.isExpanded) {
      return <FolderOpen size={14} className="text-emerald-600 dark:text-emerald-400" />;
    } else {
      return <Folder size={14} className="text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const getExpandIcon = (isExpanded: boolean, hasChildren: boolean) => {
    if (!hasChildren) return null;

    return isExpanded ? (
      <ChevronDown size={14} className="text-gray-600 dark:text-gray-400 transition-transform duration-200" />
    ) : (
      <ChevronRight size={14} className="text-gray-600 dark:text-gray-400 transition-transform duration-200" />
    );
  };

  const getLevelColor = (level: number) => {
    const colors = [
      'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10', // Level 0
      'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',         // Level 1
      'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',   // Level 2
      'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10',   // Level 3
      'border-l-pink-500 bg-pink-50 dark:bg-pink-900/10',         // Level 4+
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  // Tree building utilities
  const generateTreeId = (path: string[], level: number): string => {
    return `tree-${level}-${path.join('-')}`;
  };

  const calculateAggregations = (rows: any[], valueColumns: string[], aggregation: string): Record<string, any> => {
    const result: Record<string, any> = {};

    valueColumns.forEach(col => {
      const numericValues = rows.map(row => {
        const cleaned = String(row[col] || '').replace(/[,\s]/g, '');
        const parsed = parseFloat(cleaned);
        return !isNaN(parsed) ? parsed : 0;
      }).filter(val => !isNaN(val));

      switch (aggregation) {
        case 'sum':
          result[col] = numericValues.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          result[col] = numericValues.length > 0 ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 0;
          break;
        case 'min':
          result[col] = numericValues.length > 0 ? Math.min(...numericValues) : 0;
          break;
        case 'max':
          result[col] = numericValues.length > 0 ? Math.max(...numericValues) : 0;
          break;
        default: // count
          result[col] = rows.length;
      }
    });

    return result;
  };

  const buildTreeStructure = (
    rows: any[],
    groupColumns: string[],
    currentPath: string[] = [],
    level: number = 0
  ): TreeNode[] => {
    if (groupColumns.length === 0) {
      // When no more grouping columns, create a single aggregated node
      // instead of individual row nodes
      return [{
        id: generateTreeId([...currentPath, 'aggregated'], level),
        level,
        label: `${rows.length} records`,
        value: rows.length,
        count: rows.length,
        aggregatedData: calculateAggregations(rows, pivotConfig.values, pivotConfig.aggregation),
        children: [],
        isExpanded: false,
        originalRows: rows,
        _isTreeNode: true
      }];
    }

    const [currentColumn, ...remainingColumns] = groupColumns;
    const grouped = rows.reduce((acc, row) => {
      const value = row[currentColumn] || 'Unknown';
      if (!acc[value]) acc[value] = [];
      acc[value].push(row);
      return acc;
    }, {} as Record<string, any[]>);

    let treeNodes = Object.entries(grouped).map(([value, groupRows]) => {
      const typedGroupRows = groupRows as any[];
      const nodePath = [...currentPath, value];
      const nodeId = generateTreeId(nodePath, level);

      return {
        id: nodeId,
        level,
        label: value,
        value,
        count: typedGroupRows.length,
        aggregatedData: calculateAggregations(typedGroupRows, pivotConfig.values, pivotConfig.aggregation),
        children: buildTreeStructure(typedGroupRows, remainingColumns, nodePath, level + 1),
        isExpanded: expandedGroups.has(nodeId),
        originalRows: typedGroupRows,
        _isTreeNode: true
      };
    });

    // Sort tree nodes based on sortConfig
    if (sortConfig) {
      treeNodes = treeNodes.sort((a, b) => {
        let valueA: any;
        let valueB: any;

        if (sortConfig.key === currentColumn) {
          // Sorting by the current grouping column
          valueA = a.label;
          valueB = b.label;
        } else if (sortConfig.key === '_count') {
          // Sorting by count
          valueA = a.count;
          valueB = b.count;
        } else if (pivotConfig.values.includes(sortConfig.key)) {
          // Sorting by a value column (aggregated data)
          valueA = a.aggregatedData[sortConfig.key] || 0;
          valueB = b.aggregatedData[sortConfig.key] || 0;
        } else {
          // Default to label sort
          valueA = a.label;
          valueB = b.label;
        }

        return compareValues(valueA, valueB, sortConfig.direction);
      });
    } else {
      // Default alphabetical sort by label
      treeNodes = treeNodes.sort((a, b) => a.label.localeCompare(b.label));
    }

    return treeNodes;
  };

  // Helper function for comparing values with proper numeric/string handling
  const compareValues = (valueA: any, valueB: any, direction: 'asc' | 'desc'): number => {
    // Handle numeric vs string comparison
    const numA = parseFloat(String(valueA).replace(/[,\s]/g, ''));
    const numB = parseFloat(String(valueB).replace(/[,\s]/g, ''));

    let comparison = 0;
    if (!isNaN(numA) && !isNaN(numB)) {
      comparison = numA - numB;
    } else {
      comparison = String(valueA).localeCompare(String(valueB));
    }

    return direction === 'desc' ? -comparison : comparison;
  };

  const flattenTreeToRows = (nodes: TreeNode[]): any[] => {
    const result: any[] = [];

    nodes.forEach(node => {
      // Add the tree node itself
      result.push({
        ...node,
        _isTreeNode: true,
        _treeLevel: node.level
      });

      // Add children if expanded
      if (node.isExpanded && node.children.length > 0) {
        result.push(...flattenTreeToRows(node.children));
      }
    });

    return result;
  };

  // Generate pivot table data
  const pivotData = useMemo(() => {
    if (!data.length || !headers.length) return { rows: [], summary: null, filteredData: [], totals: null };

    // Apply filters
    let filteredData = data.filter(row => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = Object.values(row).some(value =>
          value.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Column filters
      return Object.entries(filters).every(([column, allowedValues]) => {
        return allowedValues.length === 0 || allowedValues.includes(row[column]);
      });
    });

    // Calculate totals for footer
    const totals = pivotConfig.values.length > 0 ? calculateAggregations(filteredData, pivotConfig.values, pivotConfig.aggregation) : null;

    if (pivotConfig.rows.length === 0 && pivotConfig.columns.length === 0 && pivotConfig.values.length === 0) {
      // Empty state - user needs to configure pivot table for better performance with large datasets
      return {
        rows: [],
        summary: {
          totalRows: 0,
          originalRows: data.length,
          totalColumns: headers.length
        },
        filteredData: [],
        totals: null
      };
    }

    // Generate pivot table (simplified implementation)
    const pivotRows: Record<string, any>[] = [];

    // Group by row fields
    const groups = filteredData.reduce((acc, row) => {
      const rowKey = pivotConfig.rows.map(col => row[col]).join(' | ') || 'Total';
      if (!acc[rowKey]) {
        acc[rowKey] = [];
      }
      acc[rowKey].push(row);
      return acc;
    }, {} as Record<string, any[]>);

    // Determine if we should use tree view
    const useTreeView = pivotConfig.rows.length > 0 && showGroupedView;

    if (useTreeView) {
      // Build tree structure
      const treeStructure = buildTreeStructure(filteredData, pivotConfig.rows);

      // Flatten tree to rows for rendering
      const flattenedRows = flattenTreeToRows(treeStructure);
      pivotRows.push(...flattenedRows);

    } else if (pivotConfig.rows.length > 0) {
      // Traditional flat grouping for aggregated view
      Object.entries(groups).forEach(([rowKey, groupData]) => {
        const pivotRow: Record<string, any> = {
          _rowKey: rowKey,
          _count: groupData.length
        };

        // Add row dimension values
        pivotConfig.rows.forEach((rowCol, index) => {
          pivotRow[rowCol] = rowKey.split(' | ')[index] || '';
        });

        // Calculate aggregations for value columns
        pivotConfig.values.forEach(valueCol => {
          const rawValues = groupData.map(d => d[valueCol]);
          const numericValues = rawValues.map(val => {
            const cleaned = String(val).replace(/[,\s]/g, '');
            const parsed = parseFloat(cleaned);
            return !isNaN(parsed) ? parsed : 0;
          });

          const validNumericValues = numericValues.filter(val => !isNaN(val) && val !== 0 || rawValues[numericValues.indexOf(val)] === '0');

          switch (pivotConfig.aggregation) {
            case 'sum':
              pivotRow[valueCol] = numericValues.reduce((sum, val) => sum + val, 0);
              break;
            case 'avg':
              pivotRow[valueCol] = validNumericValues.length > 0 ?
                validNumericValues.reduce((sum, val) => sum + val, 0) / validNumericValues.length :
                0;
              break;
            case 'min':
              pivotRow[valueCol] = validNumericValues.length > 0 ? Math.min(...validNumericValues) : 0;
              break;
            case 'max':
              pivotRow[valueCol] = validNumericValues.length > 0 ? Math.max(...validNumericValues) : 0;
              break;
            default: // count
              pivotRow[valueCol] = groupData.length;
          }
        });

        pivotRows.push(pivotRow);
      });
    }

    // Apply sorting - handle tree data specially
    if (sortConfig && useTreeView) {
      // For tree data, sort at each level while preserving hierarchy
      // Tree sorting is handled within the buildTreeStructure function
      // No additional sorting needed here as tree maintains structure
    } else if (sortConfig && !useTreeView) {
      // Regular sorting for non-tree data
      pivotRows.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return {
      rows: pivotRows,
      summary: {
        totalRows: pivotRows.length,
        totalGroups: Object.keys(groups).length,
        originalRows: filteredData.length
      },
      filteredData,
      totals
    };
  }, [data, headers, pivotConfig, filters, searchTerm, sortConfig, expandedGroups, showGroupedView]);

  // Get unique values for filter dropdowns
  const getUniqueValues = (column: string) => {
    return [...new Set(data.map(row => row[column]))].filter(Boolean).sort();
  };

  // Handle pivot configuration changes
  const updatePivotConfig = (key: keyof PivotConfig, value: any) => {
    setPivotConfig(prev => ({ ...prev, [key]: value }));
  };

  const addToPivotConfig = (key: 'rows' | 'columns' | 'values', value: string) => {
    setPivotConfig(prev => ({
      ...prev,
      [key]: [...prev[key], value]
    }));
  };

  const removeFromPivotConfig = (key: 'rows' | 'columns' | 'values', value: string) => {
    setPivotConfig(prev => ({
      ...prev,
      [key]: prev[key].filter(item => item !== value)
    }));
  };

  // Reorder columns
  const moveColumnUp = (key: 'rows' | 'columns' | 'values', index: number) => {
    if (index === 0) return;
    setPivotConfig(prev => {
      const newArray = [...prev[key]];
      [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
      return { ...prev, [key]: newArray };
    });
  };

  const moveColumnDown = (key: 'rows' | 'columns' | 'values', index: number) => {
    setPivotConfig(prev => {
      if (index >= prev[key].length - 1) return prev;
      const newArray = [...prev[key]];
      [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
      return { ...prev, [key]: newArray };
    });
  };

  // Handle column filters
  const toggleColumnFilter = (column: string, value: string) => {
    setFilters(prev => {
      const currentFilters = prev[column] || [];
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(v => v !== value)
        : [...currentFilters, value];
      return { ...prev, [column]: newFilters };
    });
  };

  const clearColumnFilter = (column: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  // Handle sorting
  const handleSort = (columnKey: string) => {
    setSortConfig(prev => {
      if (prev && prev.key === columnKey) {
        // Toggle direction or clear if already desc
        if (prev.direction === 'asc') {
          return { key: columnKey, direction: 'desc' };
        } else {
          return null; // Clear sort
        }
      } else {
        // Set new column to ascending
        return { key: columnKey, direction: 'asc' };
      }
    });
  };

  // Handle tree node expansion with animation
  const toggleTreeNodeExpansion = (nodeId: string) => {
    setAnimatingNodes(prev => new Set(prev).add(nodeId));

    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });

    // Remove from animating after animation completes
    setTimeout(() => {
      setAnimatingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
    }, 200);
  };

  // Export to CSV
  const exportToCsv = () => {
    const csvContent = [
      headers.join(';'),
      ...pivotData.rows.map(row =>
        headers.map(header => row[header] || '').join(';')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Reset configuration
  const resetConfig = () => {
    setPivotConfig({
      rows: [],
      columns: [],
      values: [],
      aggregation: 'count'
    });
    setFilters({});
    setSearchTerm('');
    setActiveFilterDropdown(null);
    setSortConfig(null);
    setExpandedGroups(new Set());
    setShowGroupedView(false);
    setTreeNodes([]);
    setAnimatingNodes(new Set());
  };

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeFilterDropdown && !(event.target as Element).closest('.relative')) {
        setActiveFilterDropdown(null);
      }
    };

    if (activeFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeFilterDropdown]);

  // Filter panel visibility state
  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(true);

  return (
    <div className="flex h-[calc(100%-70px)] bg-white dark:bg-gray-900 min-h-0">
      {/* Main Data Table Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Table Header with Actions */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
          <div className="flex items-center justify-between">
            {/* Left: Title and Summary */}
            <div className="flex items-center space-x-4">

              {/* Summary statistics */}
              {pivotData.summary && (
                <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">Rows:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{pivotData.summary.totalRows.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">Columns:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{(pivotData.summary.totalColumns || headers.length).toLocaleString()}</span>
                  </div>
                  {pivotData.summary.originalRows && (
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Filtered:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{pivotData.summary.originalRows.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center space-x-2">

              <button
                onClick={exportToCsv}
                className="flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 transition-colors"
                title="Export to CSV"
              >
                <Download size={14} className="mr-1" />
                Export
              </button>
              <button
                onClick={resetConfig}
                className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                title="Reset Configuration"
              >
                <RotateCcw size={14} className="mr-1" />
                Reset
              </button>

              <button
                onClick={() => setIsFilterPanelVisible(!isFilterPanelVisible)}
                className="flex items-center px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title={isFilterPanelVisible ? "Hide Filters" : "Show Filters"}
              >
                {isFilterPanelVisible ? <EyeOff size={14} className="mr-1" /> : <Eye size={14} className="mr-1" />}
                {isFilterPanelVisible ? "Hide" : "Show"} Filters
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
          <div className="flex-1 overflow-auto min-w-0">
            {pivotData.rows.length > 0 ? (
              <div className="">
                <table className="w-full text-sm border-collapse bg-white dark:bg-gray-900 analytics-table-container">
                  <thead className="bg-gray-100 dark:bg-gray-900 sticky top-0">
                    <tr>
                      {(pivotConfig.rows.length > 0 || pivotConfig.columns.length > 0 || pivotConfig.values.length > 0 ?
                        [...pivotConfig.rows, ...pivotConfig.values, ...(showGroupedView ? [] : ['_count'])] :
                        headers
                      ).map((header, index) => (
                        <th key={header} className="border-0 border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 relative">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{header === '_count' ? 'Count' : header}</span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleSort(header)}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                                title="Sort column"
                              >
                                {sortConfig?.key === header ? (
                                  sortConfig.direction === 'asc' ? (
                                    <ArrowUp size={14} />
                                  ) : (
                                    <ArrowDown size={14} />
                                  )
                                ) : (
                                  <ArrowUpDown size={14} className="opacity-50" />
                                )}
                              </button>
                              {header !== '_count' && header !== '_rowKey' && (
                                <button
                                  onClick={() => setActiveFilterDropdown(activeFilterDropdown === header ? null : header)}
                                  className={`p-1 rounded cursor-pointer ${(filters[header] || []).length > 0
                                      ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30'
                                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                  title="Filter column"
                                >
                                  <Filter size={14} />
                                </button>
                              )}
                            </div>

                            {/* Filter Dropdown */}
                            {activeFilterDropdown === header && header !== '_count' && header !== '_rowKey' && (
                              <div className="absolute right-0 top-8 z-50 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg min-w-96 max-w-96 min-h-96 max-h-96 overflow-auto">
                                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Filter {header}</span>
                                    <button
                                      onClick={() => clearColumnFilter(header)}
                                      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                </div>
                                <div className="overflow-y-auto">
                                  {getUniqueValues(header).map(value => (
                                    <label key={value} className="flex items-center px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={(filters[header] || []).includes(value)}
                                        onChange={() => toggleColumnFilter(header, value)}
                                        className="mr-2 text-emerald-600 focus:ring-emerald-500"
                                      />
                                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900">
                    {pivotData.rows.slice(0, 1000000).map((row, index) => {
                      // Handle tree node rows
                      if (row._isTreeNode && showGroupedView) {
                        const indentLevel = row._treeLevel || row.level || 0;
                        const isLeafNode = row.children && row.children.length === 0;
                        const hasChildren = row.children && row.children.length > 0;
                        const isAnimating = animatingNodes.has(row.id);

                        // For leaf nodes (individual data rows), show all columns
                        if (isLeafNode) {
                          return (
                            <tr
                              key={row.id || index}
                              className={`transition-all duration-200 bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-gray-700 border-l-2 border-l-transparent hover:border-l-blue-400 ${isAnimating ? 'animate-pulse' : ''
                                }`}
                            >
                              {(pivotConfig.rows.length > 0 || pivotConfig.columns.length > 0 || pivotConfig.values.length > 0 ?
                                [...pivotConfig.rows, ...pivotConfig.values, ...(showGroupedView ? [] : ['_count'])] :
                                headers
                              ).map((header, headerIndex) => {
                                const cellIndent = headerIndex === 0 ? indentLevel * 24 + 32 : 0;
                                const isFirstColumn = headerIndex === 0;

                                // Get the cell value for alignment determination
                                let cellValue;
                                if (header === '_count') {
                                  cellValue = row.count;
                                } else if (row.aggregatedData?.[header] !== undefined) {
                                  cellValue = row.aggregatedData[header];
                                } else if (row.value?.[header] !== undefined) {
                                  cellValue = row.value[header];
                                } else {
                                  cellValue = isFirstColumn ? row.label : '';
                                }

                                const alignmentClass = getCellAlignment(cellValue, header, isFirstColumn);

                                return (
                                  <td
                                    key={header}
                                    className={`border-0 border-b border-gray-200 dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 ${alignmentClass}`}
                                    style={headerIndex === 0 ? { paddingLeft: `${cellIndent}px` } : {}}
                                  >
                                    {headerIndex === 0 && (
                                      <div className="flex items-center space-x-2">
                                        {/* Tree connector lines */}
                                        <div className="flex items-center">
                                          {Array.from({ length: indentLevel }).map((_, levelIndex) => (
                                            <div key={levelIndex} className="w-6 flex justify-center">
                                              <div className="w-px h-full bg-gray-300 dark:bg-gray-600"></div>
                                            </div>
                                          ))}
                                          <div className="w-6 flex items-center justify-center">
                                            <div className="w-3 h-px bg-gray-300 dark:bg-gray-600"></div>
                                          </div>
                                        </div>
                                        {getTreeIcon(row, hasChildren)}
                                        <span className="text-gray-700 dark:text-gray-300">
                                          {shouldFormatAsNumber(cellValue, header) ? formatNumericValue(cellValue) : cellValue}
                                        </span>
                                      </div>
                                    )}
                                    {headerIndex !== 0 && (
                                      <span>{shouldFormatAsNumber(cellValue, header) ? formatNumericValue(cellValue) : cellValue}</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        }

                        // For parent nodes, show as expandable groups with enhanced styling
                        return (
                          <tr
                            key={row.id}
                            className={`transition-all duration-200 font-medium ${getLevelColor(indentLevel)} hover:bg-opacity-75 border-l-4 ${isAnimating ? 'animate-pulse' : ''
                              }`}
                          >
                            <td
                              colSpan={(pivotConfig.rows.length > 0 || pivotConfig.columns.length > 0 || pivotConfig.values.length > 0 ?
                                [...pivotConfig.rows, ...pivotConfig.values, ...(showGroupedView ? [] : ['_count'])] :
                                headers
                              ).length}
                              className="border-0 border-b border-gray-200 dark:border-gray-700 px-3 py-3 text-gray-900 dark:text-gray-100"
                            >
                              <div
                                className="flex items-center space-x-3 cursor-pointer group"
                                style={{ paddingLeft: `${indentLevel * 24}px` }}
                                onClick={() => toggleTreeNodeExpansion(row.id)}
                              >
                                {/* Tree connector lines for parent nodes */}
                                {indentLevel > 0 && (
                                  <div className="flex items-center">
                                    {Array.from({ length: indentLevel }).map((_, levelIndex) => (
                                      <div key={levelIndex} className="w-6 flex justify-center">
                                        <div className="w-px h-full bg-gray-300 dark:bg-gray-600"></div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Expand/collapse button with enhanced styling */}
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-gray-700 shadow-sm border border-gray-300 dark:border-gray-600 group-hover:bg-gray-50 dark:group-hover:bg-gray-600 transition-colors">
                                  {getExpandIcon(row.isExpanded, hasChildren)}
                                </div>

                                {/* Node icon */}
                                {getTreeIcon(row, hasChildren)}

                                {/* Node label and info */}
                                <div className="flex items-center space-x-2 flex-1">
                                  <span className="font-semibold text-gray-800 dark:text-gray-200">{row.label}</span>
                                  <span className="text-sm px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                                    {row.count} records
                                  </span>
                                </div>

                                {/* Aggregated values with better styling */}
                                {pivotConfig.values.length > 0 && (
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                    {pivotConfig.values.slice(0, 3).map(col => (
                                      <div key={col} className="flex items-center space-x-1">
                                        <BarChart3 size={12} className="text-gray-500" />
                                        <span className="font-medium">{col}:</span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono">
                                          {shouldFormatAsNumber(row.aggregatedData[col], col) ?
                                            formatNumericValue(row.aggregatedData[col]) :
                                            row.aggregatedData[col]}
                                        </span>
                                      </div>
                                    ))}
                                    {pivotConfig.values.length > 3 && (
                                      <span className="text-xs text-gray-500">+{pivotConfig.values.length - 3} more</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      // Handle regular pivot rows (non-tree view)
                      return (
                        <tr key={row._rowKey || index} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700">
                          {(pivotConfig.rows.length > 0 || pivotConfig.columns.length > 0 || pivotConfig.values.length > 0 ?
                            [...pivotConfig.rows, ...pivotConfig.values, ...(showGroupedView ? [] : ['_count'])] :
                            headers
                          ).map((header, headerIndex) => {
                            const cellValue = header === '_count' ? (row._count || '') : (row[header] || '');
                            const isFirstColumn = headerIndex === 0;
                            const alignmentClass = getCellAlignment(cellValue, header, isFirstColumn);

                            return (
                              <td key={header} className={`border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 ${alignmentClass}`}>
                                {shouldFormatAsNumber(cellValue, header) ? formatNumericValue(cellValue) : cellValue}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Footer with Totals */}
                  {pivotData.totals && pivotConfig.values.length > 0 && (
                    <tfoot className="bg-gray-100 dark:bg-gray-800 border-t-2 border-gray-400 dark:border-gray-600">
                      <tr>
                        {(pivotConfig.rows.length > 0 || pivotConfig.columns.length > 0 || pivotConfig.values.length > 0 ?
                          [...pivotConfig.rows, ...pivotConfig.values, ...(showGroupedView ? [] : ['_count'])] :
                          headers
                        ).map((header, headerIndex) => {
                          const isFirstColumn = headerIndex === 0;
                          
                          let cellContent = '';
                          let alignmentClass = getCellAlignment('', header, isFirstColumn);
                          
                          if (isFirstColumn) {
                            cellContent = `Total (${pivotConfig.aggregation})`;
                            alignmentClass = 'text-left';
                          } else if (pivotConfig.values.includes(header) && pivotData.totals && pivotData.totals[header] !== undefined) {
                            const totalValue = pivotData.totals[header];
                            cellContent = shouldFormatAsNumber(totalValue, header) ? 
                              formatNumericValue(totalValue) : 
                              String(totalValue);
                            alignmentClass = 'text-right';
                          } else if (header === '_count' && !showGroupedView) {
                            cellContent = pivotData.filteredData.length.toLocaleString();
                            alignmentClass = 'text-right';
                          }

                          return (
                            <td 
                              key={header} 
                              className={`border-0 border-gray-300 dark:border-gray-600 px-3 py-3 font-semibold text-gray-900 dark:text-gray-100 ${alignmentClass}`}
                            >
                              {cellContent}
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <div className="text-center max-w-md">
                  {pivotConfig.rows.length === 0 && pivotConfig.columns.length === 0 && pivotConfig.values.length === 0 ? (
                    <>
                      <div className="w-16 h-16 mx-auto mt-16 mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium mb-2">Configure Your Analytics</p>
                      <p className="text-sm mb-4">
                        Dataset loaded with {data.length.toLocaleString()} records and {headers.length} columns.<br />
                        Select columns in the filter panel to start analyzing your data.
                      </p>
                      <div className="text-left bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-xs">
                        <p className="font-medium mb-2">Quick Start:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li><strong>Group by Rows:</strong> Select dimensions to group your data</li>
                          <li><strong>Value Columns:</strong> Choose metrics to analyze</li>
                          <li><strong>Aggregation:</strong> Pick how to summarize values (sum, average, etc.)</li>
                        </ol>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium mb-2">No data to display</p>
                      <p className="text-sm">Try adjusting your filters or configuration</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Filter Panel - Right Side */}
      {isFilterPanelVisible && (
        <div className="w-80 min-w-80 border-l border-gray-200 dark:border-gray-700 bg-white flex flex-col flex-shrink-0">


          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Search Data
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search across all columns..."
                className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Pivot Configuration */}
            <div className="space-y-4">
              {/* Row Grouping */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Group by Rows
                </label>
                <select
                  value=""
                  onChange={(e) => e.target.value && addToPivotConfig('rows', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Add column...</option>
                  {headers.filter(h => !pivotConfig.rows.includes(h)).sort().map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
                {pivotConfig.rows.map((row, index) => (
                  <div key={row} className="flex items-center justify-between mt-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded text-sm">
                    <span className="text-emerald-800 dark:text-emerald-200 flex-1">{row}</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveColumnUp('rows', index)}
                        disabled={index === 0}
                        className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => moveColumnDown('rows', index)}
                        disabled={index === pivotConfig.rows.length - 1}
                        className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        onClick={() => removeFromPivotConfig('rows', row)}
                        className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Value Columns */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Value Columns
                </label>
                <select
                  value=""
                  onChange={(e) => e.target.value && addToPivotConfig('values', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Add column...</option>
                  {headers.filter(h => !pivotConfig.values.includes(h)).sort().map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
                {pivotConfig.values.map((value, index) => (
                  <div key={value} className="flex items-center justify-between mt-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-sm">
                    <span className="text-blue-800 dark:text-blue-200 flex-1">{value}</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveColumnUp('values', index)}
                        disabled={index === 0}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => moveColumnDown('values', index)}
                        disabled={index === pivotConfig.values.length - 1}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        onClick={() => removeFromPivotConfig('values', value)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Aggregation */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Aggregation
                </label>
                <select
                  value={pivotConfig.aggregation}
                  onChange={(e) => updatePivotConfig('aggregation', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="count">Count</option>
                  <option value="sum">Sum</option>
                  <option value="avg">Average</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                </select>
              </div>

              {/* Display Mode */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Display Mode
                </label>
                <select
                  value={showGroupedView ? "grouped" : "aggregated"}
                  onChange={(e) => setShowGroupedView(e.target.value === "grouped")}
                  className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="aggregated">Aggregated View</option>
                  <option value="grouped">Grouped View</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
