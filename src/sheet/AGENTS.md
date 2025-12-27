# Sheet Layer - Data Structures & Operations

## Package Identity
- **Purpose**: Core sheet data structures (Row, Cell) and operations
- **Tech**: Immutable data structures, type-safe cell values
- **Exports**: `cell()`, `row()`, `Cell`, `Row` types and factories

## Setup & Run
```bash
# Test sheet operations
bun test src/sheet/

# Run cell/row benchmarks if available
bun bench 2>/dev/null | grep -i sheet || echo "No sheet benchmarks found"
```

## Patterns & Conventions

### Cell Creation Patterns
- ✅ **DO**: Use typed cell factories for type safety
  ```typescript
  // src/sheet/cell.test.ts examples
  cell('text')           // StringCell
  cell(42)              // NumberCell
  cell(new Date())      // DateCell
  cell(true)            // BooleanCell
  cell(null)            // NullCell
  ```

- ❌ **DON'T**: Create cells manually - lose type safety
  ```typescript
  // Anti-pattern: no type checking
  const manualCell = { type: 'string', value: 'text' };
  ```

### Row Construction
- ✅ **DO**: Use row factory with cell array
  ```typescript
  // src/sheet/row.test.ts example
  row([cell('Name'), cell('Age'), cell(null)]);
  ```

- ✅ **DO**: Include row options when needed
  ```typescript
  // src/sheet/row.test.ts example
  row([cell('Data')], { rowIndex: 1 });
  ```

### Cell Type Handling
- ✅ **DO**: Handle all cell types explicitly
  ```typescript
  // From cell test patterns
  if (cell.type === 'string') {
    // Handle string cells
  } else if (cell.type === 'number') {
    // Handle number cells
  }
  ```

## Touch Points / Key Files
- **Cell factories**: `cell.ts` - Type-safe cell creation
- **Row factories**: `row.ts` - Row construction and options
- **Cell resolution**: `../xml/cell-resolver.ts` - XML conversion
- **Types**: `../types.ts` - Core Cell/Row interfaces

## JIT Index Hints
- Find cell factory: `rg -n "export.*cell"`
- Find row factory: `rg -n "export.*row"`
- Find cell types: `rg -n "type.*Cell.*="`
- Find row types: `rg -n "interface.*Row"`
- Find cell tests: `rg -n "describe.*Cell"`

## Common Gotchas
- Cell values are strongly typed - no implicit conversion
- Null/undefined become NullCell type, not empty strings
- Date cells convert to Excel serial numbers automatically
- Row indices are 1-based (Excel standard)

## Pre-PR Checks
```bash
bun test src/sheet/ && bun run lint src/sheet/
```
