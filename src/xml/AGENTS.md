# XML Layer - XLSX XML Generation & Parsing

## Package Identity
- **Purpose**: Generate/parse XLSX XML files (sheets, shared strings, etc.)
- **Tech**: Streaming XML writing, SAX parsing, async iterators
- **Exports**: `writeSheetXml()`, `parseWorkbookXml()`, XML writers/parsers

## Setup & Run
```bash
# Test XML operations
bun test src/xml/

# Run XML benchmarks (sheet writing)
bun run src/tests/benchmarks/write-sheet-xml.bench.ts
```

## Patterns & Conventions

### XML Writing Patterns
- ✅ **DO**: Use streaming for large datasets
  ```typescript
  // src/xml/writer.test.ts example
  const xmlStream = writeSheetXml(rows);
  for await (const chunk of xmlStream) {
    // Process XML chunks
  }
  ```

- ❌ **DON'T**: Buffer entire XML in memory
  ```typescript
  // Anti-pattern: memory intensive
  const xmlString = await collectXml(writeSheetXml(rows));
  ```

## Touch Points / Key Files
- **Sheet XML**: `writer.ts` - Generate worksheet XML
- **Cell resolution**: `cell-resolver.ts` - Convert cells to XML
- **Parsing**: `parser.ts` - Parse XML streams
- **Types**: `../xlsx/types.ts` - XML-related interfaces

## JIT Index Hints
- Find XML writer: `rg -n "export.*writeSheetXml"`
- Find XML parser: `rg -n "export.*parseWorkbookXml"`
- Find cell resolver: `rg -n "export.*resolveCell"`
- Find XML tests: `rg -n "describe.*XML"`

## Common Gotchas
- XML streaming requires async iteration - can't use array methods
- Column width calculation buffers entire sheet in memory
- Control characters (0x00-0x1F except tab/newline/CR) are removed
- Sheet dimensions are calculated automatically

## Pre-PR Checks
```bash
bun test src/xml/ && bun run lint src/xml/
```
