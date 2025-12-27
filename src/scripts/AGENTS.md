# Scripts Layer - Utility Scripts & Tools

## Package Identity
- **Purpose**: Development utilities, data generation, debugging tools
- **Tech**: Bun scripts, command-line utilities
- **Usage**: Development helpers, not part of main library API

## Setup & Run
```bash
# Run available scripts
ls src/scripts/  # See available scripts

# Example: print rows from a file
bun run src/scripts/printRows.ts test-data.xlsx

# Example: generate test data
bun run src/scripts/writeTestData.ts
```

## Patterns & Conventions

### Script Structure
- ✅ **DO**: Include proper error handling and usage info
  ```typescript
  // src/scripts/printRows.ts pattern
  async function main() {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
      console.error('Usage: bun run printRows.ts <xlsx-file>');
      process.exit(1);
    }
    // ... main logic
  }
  ```

- ❌ **DON'T**: Assume arguments without validation
  ```typescript
  // Anti-pattern: crashes on missing args
  const filePath = process.argv[2]; // May be undefined
  const workbook = await readXlsx(filePath);
  ```

### Output Formatting
- ✅ **DO**: Provide clear, readable output
  ```typescript
  // src/scripts/printRows.ts pattern
  console.log(`Sheet: ${sheet.name}`);
  console.log(`Rows: ${rowCount}`);
  for await (const row of sheet.rows()) {
    console.log(row.cells.map(c => c.value).join('\t'));
  }
  ```

## Touch Points / Key Files
- **Data generation**: `writeTestData.ts` - Create test XLSX files
- **Data inspection**: `printRows.ts` - Display XLSX contents

## JIT Index Hints
- Find all scripts: `ls src/scripts/`
- Find script usage: `rg -n "console\.error.*Usage" src/scripts/`
- Find main functions: `rg -n "async function main" src/scripts/`

## Common Gotchas
- Scripts run with Bun. Use Bun APIs when available
- Command-line arguments start at index 2 (after 'bun run script.ts')
- Scripts should handle errors gracefully and provide usage info
- File paths are relative to script execution directory

## Pre-PR Checks
```bash
# Test scripts manually - no automated tests currently
bun run src/scripts/printRows.ts test-data.xlsx
bun run src/scripts/writeTestData.ts
```
