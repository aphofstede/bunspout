/*
 * Core domain types for Excel streaming library
 */

// Public API Cell type
export type Cell = {
  value: string | number | Date | boolean | null | undefined;
  type?: 'string' | 'number' | 'date' | 'boolean';
};

// Internal Cell format for XML reader/writer
export type CellResolved = {
  t: 's' | 'n' | 'b' | 'd' | 'e'; // string, number, boolean, date, error
  v: string | number;
};

export type Row = {
  /**
   * Array of cells. May contain undefined/null values for holes (sparse rows).
   * Undefined/null cells are skipped during serialization.
   */
  cells: (Cell | undefined | null)[];
  rowIndex?: number;
  // Future: styles?: Record<number, Style>;
};

export type XmlEvent = {
  type: 'startElement' | 'endElement' | 'text';
  name?: string;
  attributes?: Record<string, string>;
  text?: string;
};

export type XmlNodeChunk = string | Uint8Array;

