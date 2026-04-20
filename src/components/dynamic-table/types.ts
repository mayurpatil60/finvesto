// ─── DynamicTable – shared types ──────────────────────────────────────────────

export type ColType = "text" | "number" | "date";
export type SortDir = "asc" | "desc";

/** Schema definition for one column */
export interface DynamicColumn {
  field: string;
  header: string;
  /** Pixel width of the column. Default 120 */
  width?: number;
  /** Controls which filter UI to show */
  type?: ColType;
  /** Show/hide in the table. Default true */
  visible?: boolean;
  /** Allow column-header sort. Default true */
  sortable?: boolean;
  /** Allow per-column filter row. Default true */
  filterable?: boolean;
  /** Show a copy-icon button in the header; copies all visible rows */
  copyEnabled?: boolean;
  /** Prefix added when copying. e.g. "NSE:" */
  copyPrefix?: string;
  /**
   * Mark this column as a percentage column.
   * Auto-detected when the field name ends with `_per`, `_percentage`, or `%`
   * (case-insensitive). Percentage columns are right-aligned and colored
   * green (positive) / red (negative). Values may or may not carry a `%` suffix.
   */
  isPercentage?: boolean;
  /**
   * Return a CSS/hex color for the cell value.
   * Return undefined to use the default text color.
   */
  colorFn?: (value: any, row: any) => string | undefined;
}

/** One entry in the multi-sort array */
export interface SortState {
  field: string;
  dir: SortDir;
  /** 1-indexed priority shown as badge */
  priority: number;
}

/** Per-column filter strings (keyed by field) */
export type ColumnFilters = Record<string, string>;

/** Props for the top-level DynamicTable component */
export interface DynamicTableProps {
  /** Raw row data */
  data: any[];
  /**
   * Optional explicit column schema.
   * If omitted, schema is auto-generated from data[0] keys.
   */
  schema?: DynamicColumn[];
  /**
   * Async refresh callback. Providing this enables pull-to-refresh
   * and the toolbar Refresh button.
   */
  onRefresh?: () => Promise<void>;
  /** Shows a loading spinner overlay */
  loading?: boolean;
  /** Initial rows per page. Default 25 */
  pageSize?: number;
  /** Rows-per-page options. Default [10, 25, 50, 100] */
  pageSizeOptions?: number[];
  /** Optional label shown in the toolbar */
  title?: string;
  /** Message shown when the table is empty */
  emptyText?: string;
}
