# Tests Layer - Testing & Benchmarking Infrastructure

## Package Identity
- **Purpose**: Comprehensive test suite and performance benchmarks
- **Tech**: Bun test runner, Tinybench, colocated tests
- **Structure**: Unit tests, integration tests, benchmarks

## Setup & Run
```bash
# Run all tests
bun test

# Run specific test file
bun test src/xlsx/writer.test.ts

# Run benchmarks
bun bench

# Run specific benchmark
bun run src/tests/benchmarks/write-sheet-xml.bench.ts

# Run integration tests
bun test src/tests/integration/
```

## Patterns & Conventions

### Test Organization
- ✅ **DO**: Colocate tests with source files
  ```typescript
  // src/xlsx/writer.test.ts - colocated with writer.ts
  import { writeXlsx } from './writer';
  ```

- ❌ **DON'T**: Centralize all tests in one directory
  ```typescript
  // Anti-pattern: hard to maintain
  // tests/writer.test.ts (far from src/xlsx/writer.ts)
  ```

### Test File Creation
- ✅ **DO**: Create test files dynamically to avoid cleanup issues
  ```typescript
  // src/xlsx/writer.test.ts pattern
  const testFile = 'temp-test.xlsx';
  await writeXlsx(testFile, { /* test data */ });

  // Cleanup in test
  if (existsSync(testFile)) {
    await import('fs').then(fs => fs.promises.unlink(testFile));
  }
  ```

- ❌ **DON'T**: Rely on static test files
  ```typescript
  // Anti-pattern: file conflicts, cleanup issues
  await writeXlsx('test-output.xlsx', { /* data */ });
  ```

### Benchmark Structure
- ✅ **DO**: Use Tinybench for performance testing
  ```typescript
  // src/tests/benchmarks/write-sheet-xml.bench.ts pattern
  const bench = new Bench({ iterations: 10 });
  bench.add('test name', async () => {
    // Benchmark code
  });
  ```

- ✅ **DO**: Include context in benchmark output
  ```typescript
  // Benchmark output pattern
  console.log(`Rows: ${ROW_COUNT.toLocaleString()}`);
  console.log(`Columns: ${COLUMN_COUNT}`);
  ```

## Touch Points / Key Files
- **Benchmarks**: `benchmarks/` - Performance testing
- **Integration**: `integration/` - End-to-end tests
- **Unit tests**: Colocated `*.test.ts` files throughout src/

## JIT Index Hints
- Find test file: `find . -name "*.test.ts" | head -10`
- Find benchmark: `find . -name "*.bench.ts" | head -5`
- Find test for function: `rg -n "describe.*FunctionName"`
- Find benchmark for feature: `rg -n "bench.*add.*Feature"`

## Common Gotchas
- Test files must be cleaned up to avoid conflicts between runs
- Benchmarks need sufficient iterations for statistical significance
- Integration tests may be slower - separate from unit tests when needed
- Bun test runner has different assertions than Jest

## Pre-PR Checks
```bash
bun test && bun bench
```
