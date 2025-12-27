import type { ColumnWidthDefinition, SheetColumnWidthOptions } from '@xlsx/types';
import { ColumnWidthTracker } from '@utils/column-widths';
import { escapeXml } from '@utils/xml';
import type { Row, Cell } from '../types';
import { resolveCell } from './cell-resolver';

/**
 * Options for writing sheet XML
 */
export interface WriteSheetXmlOptions {
  /**
   * Function to get shared string index for a given string.
   * If provided, strings will be stored in shared strings table.
   */
  getStringIndex?: (str: string) => number;
  /**
   * Column width options for the sheet
   */
  columnWidths?: SheetColumnWidthOptions;
}

/**
 * Converts a column index (0-based) to Excel column letter (A, B, ..., Z, AA, AB, ...)
 * @param colIndex - Column index (0-based: 0 = A, 1 = B, etc.)
 * @returns Excel column letter(s)
 */
function columnIndexToLetter(colIndex: number): string {
  let result = '';
  colIndex++; // Convert to 1-based
  while (colIndex > 0) {
    colIndex--;
    result = String.fromCharCode(65 + (colIndex % 26)) + result;
    colIndex = Math.floor(colIndex / 26);
  }
  return result;
}

/**
 * Generates a cell reference (e.g., "A1", "B2") from row and column indices
 * @param rowIndex - Row index (1-based: 1 = first row)
 * @param colIndex - Column index (0-based: 0 = A, 1 = B, etc.)
 * @returns Excel cell reference string
 */
function getCellReference(rowIndex: number, colIndex: number): string {
  return `${columnIndexToLetter(colIndex)}${rowIndex}`;
}

/**
 * Serializes a single cell to XML
 * @param cell - Cell to serialize
 * @param rowIndex - Row index (1-based: 1 = first row)
 * @param colIndex - Column index (0-based: 0 = A, 1 = B, etc.)
 * @param getStringIndex - Optional function to get shared string index
 * @returns XML string for the cell
 */
export function serializeCell(
  cell: Cell,
  rowIndex: number,
  colIndex: number,
  getStringIndex?: (str: string) => number,
): string {
  const resolved = resolveCell(cell);
  const cellRef = getCellReference(rowIndex, colIndex);
  const styleAttr = ' s="0"'; // Default style index
  const refAttr = ` r="${cellRef}"`;

  if (resolved.t === 's' && getStringIndex) {
    // Use shared strings - reference by index
    const index = getStringIndex(resolved.v as string);
    return `<c${refAttr}${styleAttr} t="s"><v>${index}</v></c>`;
  }

  if (resolved.t === 's' && !getStringIndex) {
    // Use inline strings - text stored directly in cell
    const text = escapeXml(resolved.v as string);
    return `<c${refAttr}${styleAttr} t="inlineStr"><is><t>${text}</t></is></c>`;
  }

  // Handle non-string types (number, date, boolean, etc.)
  const typeAttr = resolved.t !== 'n' ? ` t="${resolved.t}"` : '';
  const value = String(resolved.v);
  return `<c${refAttr}${styleAttr}${typeAttr}><v>${value}</v></c>`;
}

/**
 * Serializes a row to XML
 */
export function serializeRow(
  row: Row,
  getStringIndex?: (str: string) => number,
  widthTracker?: ColumnWidthTracker,
): string {
  const rowIndex = row.rowIndex ?? 1;
  const rowIndexAttr = ` r="${rowIndex}"`;

  // Calculate spans (first column to last column, 1-based)
  // Handle rows with holes (e.g., cell at col 3 but not at col 1)
  const firstColIndex = row.cells.findIndex((c) => c !== undefined && c !== null);
  const firstCol = firstColIndex >= 0 ? firstColIndex + 1 : 1;

  // Find last column with an actual cell
  let lastCol = firstCol;
  for (let i = row.cells.length - 1; i >= 0; i--) {
    if (row.cells[i] !== undefined && row.cells[i] !== null) {
      lastCol = i + 1;
      break;
    }
  }
  const spansAttr = ` spans="${firstCol}:${lastCol}"`;

  const cellsXml = row.cells
    .map((cell, colIndex) => {
      // Skip undefined/null cells (holes in the row)
      if (cell === undefined || cell === null) {
        return '';
      }
      // Track column width if auto-detection is enabled
      if (widthTracker && cell !== undefined && cell !== null) {
        widthTracker.updateColumnWidth(colIndex, cell);
      }
      return serializeCell(cell, rowIndex, colIndex, getStringIndex);
    })
    .join('');

  return `<row${rowIndexAttr}${spansAttr}>${cellsXml}</row>`;
}

/**
 * Generates the cols XML element for column width definitions
 * @param maxColumnIndex - Maximum column index (0-based: 0 = A, 1 = B, etc.)
 * @param defaultWidth - Default width for columns without specific definitions
 * @param columnWidths - Array of column width definitions (all indices are 0-based, ranges are inclusive)
 * @param trackedWidths - Map of auto-detected widths by column index (0-based)
 * @returns XML string for the cols element, or empty string if no columns need width definitions
 */
function generateColsXml(
  maxColumnIndex: number,
  defaultWidth: number | undefined,
  columnWidths: Array<ColumnWidthDefinition> | undefined,
  trackedWidths: Map<number, number>,
): string {
  if (maxColumnIndex < 0) {
    return '';
  }

  const colElements: string[] = [];
  const processedColumns = new Set<number>();

  // Process explicit column width definitions first (they take priority)
  if (columnWidths) {
    for (const def of columnWidths) {
      if (def.columnIndex !== undefined) {
        const colIndex = def.columnIndex;
        if (colIndex <= maxColumnIndex && !processedColumns.has(colIndex)) {
          const width = def.width ?? (def.autoDetect ? trackedWidths.get(colIndex) : undefined);
          if (width !== undefined) {
            colElements.push(`    <col min="${colIndex + 1}" max="${colIndex + 1}" width="${width}" customWidth="1"/>`);
            processedColumns.add(colIndex);
          }
        }
      } else if (def.columnRange) {
        const { from, to } = def.columnRange;
        const min = Math.max(0, from);
        const max = Math.min(maxColumnIndex, to);
        if (min <= max) {
          // Handle auto-detect for ranges first (each column needs individual width)
          if (def.autoDetect) {
            for (let i = min; i <= max; i++) {
              if (!processedColumns.has(i)) {
                const trackedWidth = trackedWidths.get(i);
                if (trackedWidth !== undefined) {
                  colElements.push(`    <col min="${i + 1}" max="${i + 1}" width="${trackedWidth}" customWidth="1"/>`);
                  processedColumns.add(i);
                }
              }
            }
            continue;
          }
          // Handle explicit width for ranges
          if (def.width !== undefined) {
            colElements.push(`    <col min="${min + 1}" max="${max + 1}" width="${def.width}" customWidth="1"/>`);
            for (let i = min; i <= max; i++) {
              processedColumns.add(i);
            }
          }
        }
      }
    }
  }

  // Process auto-detected widths for columns not explicitly defined
  for (let colIndex = 0; colIndex <= maxColumnIndex; colIndex++) {
    if (!processedColumns.has(colIndex)) {
      const trackedWidth = trackedWidths.get(colIndex);
      if (trackedWidth !== undefined) {
        colElements.push(`    <col min="${colIndex + 1}" max="${colIndex + 1}" width="${trackedWidth}" customWidth="1"/>`);
        processedColumns.add(colIndex);
      } else if (defaultWidth !== undefined) {
        colElements.push(`    <col min="${colIndex + 1}" max="${colIndex + 1}" width="${defaultWidth}" customWidth="1"/>`);
        processedColumns.add(colIndex);
      }
    }
  }

  // If we have a default width but no explicit columns, create a single col element for all columns
  if (colElements.length === 0 && defaultWidth !== undefined) {
    colElements.push(`    <col min="1" max="${maxColumnIndex + 1}" width="${defaultWidth}" customWidth="1"/>`);
  }

  if (colElements.length === 0) {
    return '';
  }

  return `<cols>\n${colElements.join('\n')}\n  </cols>`;
}

/**
 * Generates sheetFormatPr XML for default column width
 */
function generateSheetFormatPr(defaultWidth: number | undefined): string {
  if (defaultWidth === undefined) {
    return '';
  }
  return `    <sheetFormatPr defaultColWidth="${defaultWidth}"/>`;
}

/**
 * Writes sheet XML from an async iterable of rows
 *
 * Performance optimization:
 * - Fast path: When column widths are NOT needed, rows are streamed directly without buffering.
 *   This allows processing of very large sheets with constant memory usage.
 * - Slow path: When column widths ARE needed, rows must be buffered to calculate maxColumnIndex
 *   and generate the cols XML before sheetData. This is unavoidable because:
 *   1. We need maxColumnIndex to generate cols XML with correct column ranges
 *   2. We need actual row data for auto-detection width tracking
 *   3. AsyncIterables from streams cannot be re-iterated
 *
 * For re-readable sources (e.g., generator functions), callers can implement a two-pass
 * approach themselves to avoid buffering in this function.
 */
export async function* writeSheetXml(
  rows: AsyncIterable<Row>,
  options?: WriteSheetXmlOptions,
): AsyncIterable<string> {
  yield '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';

  const getStringIndex = options?.getStringIndex;
  const columnWidthOptions = options?.columnWidths;

  // Check if we need per-column width definitions (cols XML)
  // A global defaultColumnWidth only needs sheetFormatPr, not cols XML
  const needsColsXml =
    (columnWidthOptions?.columnWidths !== undefined && columnWidthOptions.columnWidths.length > 0) ||
    columnWidthOptions?.autoDetectColumnWidth === true;

  // Initialize column width tracker if auto-detection is enabled (globally or per-column)
  const autoDetect = columnWidthOptions?.autoDetectColumnWidth ?? false;
  const hasPerColumnAutoDetect = columnWidthOptions?.columnWidths?.some(def => def.autoDetect) ?? false;
  const needsWidthTracking = autoDetect || hasPerColumnAutoDetect;
  const widthTracker = new ColumnWidthTracker(needsWidthTracking);

  // Fast path: no per-column overrides needed - stream directly
  // This covers both: no widths at all, and defaultColumnWidth only (which just needs sheetFormatPr)
  if (!needsColsXml) {
    // Yield sheetFormatPr if we have a default width
    if (columnWidthOptions?.defaultColumnWidth !== undefined) {
      yield generateSheetFormatPr(columnWidthOptions.defaultColumnWidth);
    }
    yield '<sheetData>';

    for await (const row of rows) {
      yield serializeRow(row, getStringIndex, widthTracker);
    }

    yield '</sheetData></worksheet>';
    return;
  }

  // Slow path: need to buffer rows to calculate maxColumnIndex and generate cols XML
  // This is unavoidable when column widths are needed because:
  // 1. We need maxColumnIndex to generate cols XML with correct column ranges
  // 2. We need actual row data for auto-detection width tracking
  // 3. AsyncIterables from streams cannot be re-iterated
  const allRows: Row[] = [];
  let maxColumnIndex = -1;

  for await (const row of rows) {
    allRows.push(row);
    maxColumnIndex = Math.max(maxColumnIndex, row.cells.length - 1);
    // Track widths if auto-detection is enabled
    if (needsWidthTracking) {
      row.cells.forEach((cell, colIndex) => {
        if (cell !== undefined && cell !== null) {
          widthTracker.updateColumnWidth(colIndex, cell);
        }
      });
    }
  }

  // Generate column width XML if needed
  const sheetFormatPr = generateSheetFormatPr(columnWidthOptions?.defaultColumnWidth);
  // Only generate cols XML if we have per-column definitions or auto-detection
  // A global defaultColumnWidth alone doesn't need cols XML (only sheetFormatPr)
  const colsXml = needsColsXml
    ? generateColsXml(
      maxColumnIndex,
      columnWidthOptions?.defaultColumnWidth,
      columnWidthOptions?.columnWidths,
      widthTracker.getAllWidths(),
    )
    : '';

  // Yield sheetFormatPr and cols before sheetData
  if (sheetFormatPr) {
    yield sheetFormatPr;
  }
  if (colsXml) {
    yield colsXml;
  }

  yield '<sheetData>';

  // Yield all rows
  for (const row of allRows) {
    yield serializeRow(row, getStringIndex, widthTracker);
  }

  yield '</sheetData></worksheet>';
}

