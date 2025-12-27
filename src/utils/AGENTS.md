# Utils Layer - Utility Functions & Transforms

## Package Identity
- **Purpose**: Common utilities, data transforms, column width calculations
- **Tech**: Pure functions, performance-optimized algorithms
- **Exports**: `mapRows()`, `filterRows()`, `collect()`, column width utils

## Setup & Run
```bash
# Test utilities
bun test src/utils/

# Run transform benchmarks
bun bench 2>/dev/null | grep -i transform || echo "No transform benchmarks found"
```

## Patterns & Conventions

### Data Transformation
- ✅ **DO**: Use functional composition for complex transforms
  ```typescript
  // src/utils/transforms.test.ts example
  const result = await collect(
    limitRows(
      filterRows(rows, row => row.cells.length > 0),
      100
    )
  );
  ```

- ❌ **DON'T**: Mix transformation logic with business logic
  ```typescript
  // Anti-pattern: unclear separation
  async function processData(rows) {
    const filtered = [];
    for await (const row of rows) {
      if (row.cells.length > 0 && filtered.length < 100) {
        filtered.push(row);
      }
    }
    return filtered;
  }
  ```

### Memory Management
- ✅ **DO**: Process data in streams when possible
  ```typescript
  // src/utils/transforms.test.ts pattern
  const processedRows = mapRows(rows, row => ({
    ...row,
    cells: row.cells.map(cell => transformCell(cell))
  }));
  ```

- ❌ **DON'T**: Collect everything into arrays unnecessarily
  ```typescript
  // Anti-pattern: memory waste
  const allRows = await collect(rows);
  const processed = allRows.map(row => transform(row));
  ```

## Touch Points / Key Files
- **Transforms**: `transforms.ts` - Row processing utilities
- **Column widths**: `column-widths.ts` - Width calculation logic
- **XML utils**: `xml.ts` - XML-specific utilities

## JIT Index Hints
- Find transform functions: `rg -n "export.*mapRows|export.*filterRows"`
- Find column width utils: `rg -n "export.*calculateColumnWidths"`
- Find utility functions: `rg -n "export.*collect|export.*limitRows"`
- Find transform tests: `rg -n "describe.*transform"`

## Common Gotchas
- Transform functions are lazy - they return AsyncIterables, not arrays
- Column width calculation may buffer rows in memory for auto-detection
- Excel width units are character-based (not pixels)
- Default column width is ~8.43 characters in Excel

## Pre-PR Checks
```bash
bun test src/utils/ && bun run lint src/utils/
```
