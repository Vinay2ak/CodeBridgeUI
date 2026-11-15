import React from 'react';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  isRowHeader?: boolean;
}

export interface DataTableProps<T> {
  caption: string;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  className?: string;
  rowClassName?: (row: T) => string;
}

export function DataTable<T>({
  caption,
  columns,
  data,
  keyExtractor,
  className = '',
  rowClassName,
}: DataTableProps<T>): JSX.Element {
  return (
    <div className={`overflow-x-auto w-full rounded-md border border-border ${className}`}>
      <table className="w-full text-left text-sm divide-y divide-border">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-raised/70 text-xs font-semibold text-text-muted uppercase tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={`px-4 py-3 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {data.map((row) => {
            const extraClasses = rowClassName ? rowClassName(row) : '';
            return (
              <tr
                key={keyExtractor(row)}
                className={`hover:bg-surface-raised/40 transition-colors ${extraClasses}`}
              >
                {columns.map((col, idx) => {
                  const content =
                    typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : col.accessor
                      ? (row[col.accessor] as React.ReactNode)
                      : null;

                  if (col.isRowHeader) {
                    return (
                      <th
                        key={idx}
                        scope="row"
                        className={`px-4 py-3 font-medium text-text whitespace-nowrap ${col.className || ''}`}
                      >
                        {content}
                      </th>
                    );
                  }

                  return (
                    <td
                      key={idx}
                      className={`px-4 py-3 text-text-muted whitespace-nowrap ${col.className || ''}`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

