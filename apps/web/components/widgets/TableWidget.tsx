/**
 * File: apps/web/components/widgets/TableWidget.tsx
 * Purpose: Schema-driven table widget for admin data display
 * Owner: Engineering Team
 * Tags: #widgets #tables #admin #copilotkit
 */

"use client";

import React, { useState, useMemo } from 'react';
import { AdminUISchema, TableDataConfig, TableColumn } from '../../../../packages/agent-core/types/AdminUISchema';
import { UniversalWidgetSchema } from '../../../../packages/agent-core/types/UniversalWidgetSchema';

interface TableWidgetProps {
  schema: AdminUISchema | UniversalWidgetSchema;
  onRowAction?: (action: string, row: any) => void;
  onBulkAction?: (action: string, selectedRows: any[]) => void;
}

/**
 * TableWidget - Schema-driven table rendering
 * Supports sorting, selection, pagination, and actions
 */
export const TableWidget: React.FC<TableWidgetProps> = ({
  schema,
  onRowAction,
  onBulkAction
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Extract table configuration from schema
  const tableData = (schema.data as any).tableData as TableDataConfig | undefined;
  const tableConfig = (schema.config as any).tableConfig;

  if (!tableData?.rows || !tableData?.columns) {
    return (
      <div className="p-4 text-red-600">
        Error: No table data provided
      </div>
    );
  }

  // Handle sorting
  const sortedRows = useMemo(() => {
    if (!sortColumn || !tableConfig?.sortable) return tableData.rows;

    return [...tableData.rows].sort((a, b) => {
      const column = tableData.columns.find(col => col.id === sortColumn);
      if (!column) return 0;

      const aVal = getNestedValue(a, column.accessor);
      const bVal = getNestedValue(b, column.accessor);

      if (aVal === bVal) return 0;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tableData.rows, sortColumn, sortDirection, tableConfig?.sortable, tableData.columns]);

  // Handle pagination
  const paginatedRows = useMemo(() => {
    if (!tableData.pagination?.enabled) return sortedRows;

    const { pageSize } = tableData.pagination;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    return sortedRows.slice(start, end);
  }, [sortedRows, currentPage, tableData.pagination]);

  // Helper to get nested values using dot notation
  function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  // Handle row selection
  const handleSelectRow = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === paginatedRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedRows.map((_, index) => index.toString())));
    }
  };

  // Handle column sorting
  const handleSort = (columnId: string) => {
    if (!tableConfig?.sortable) return;

    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  // Render cell content based on column type
  const renderCell = (row: any, column: TableColumn): React.ReactNode => {
    const value = getNestedValue(row, column.accessor);

    switch (column.type) {
      case 'boolean':
        return value ? '✓' : '✗';
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : '-';
      case 'status':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'active' ? 'bg-green-100 text-green-800' :
            value === 'inactive' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {value}
          </span>
        );
      default:
        return value?.toString() || '-';
    }
  };

  const totalPages = tableData.pagination?.enabled
    ? Math.ceil((tableData.pagination.totalItems || tableData.rows.length) / tableData.pagination.pageSize)
    : 1;

  return (
    <div className="table-widget">
      {schema.config.title && (
        <h2 className="text-xl font-semibold mb-4">{schema.config.title}</h2>
      )}

      {/* Bulk actions */}
      {tableConfig?.bulkActions && selectedRows.size > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {selectedRows.size} row(s) selected
          </span>
          {tableConfig.bulkActions.map(action => (
            <button
              key={action.id}
              onClick={() => {
                const selected = Array.from(selectedRows).map(idx =>
                  paginatedRows[parseInt(idx)]
                );
                onBulkAction?.(action.id, selected);
              }}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {tableData.selectionConfig?.mode !== 'none' && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedRows.length && paginatedRows.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              {tableData.columns.map(column => (
                <th
                  key={column.id}
                  onClick={() => column.sortable !== false && handleSort(column.id)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable !== false && tableConfig?.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {sortColumn === column.id && (
                      <span className="text-gray-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {tableConfig?.rowActions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {tableData.selectionConfig?.mode !== 'none' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex.toString())}
                        onChange={() => handleSelectRow(rowIndex.toString())}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  {tableData.columns.map(column => (
                    <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {renderCell(row, column)}
                    </td>
                  ))}
                  {tableConfig?.rowActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {tableConfig.rowActions.map(action => (
                        <button
                          key={action.id}
                          onClick={() => onRowAction?.(action.id, row)}
                          className="text-indigo-600 hover:text-indigo-900 ml-3"
                        >
                          {action.label}
                        </button>
                      ))}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={tableData.columns.length + (tableData.selectionConfig?.mode !== 'none' ? 1 : 0) + (tableConfig?.rowActions ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {tableConfig?.emptyState?.message || 'No data available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {tableData.pagination?.enabled && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// Schema to props transformation function for registry
export const tableSchemaToProps = (schema: UniversalWidgetSchema): any => {
  return {
    schema,
    // Additional prop transformations can be added here
  };
};