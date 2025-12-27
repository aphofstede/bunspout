# ZIP Layer - XLSX Archive Management

## Package Identity
- **Purpose**: Create/read ZIP archives for XLSX files
- **Tech**: Streaming ZIP operations, yazl/yauzl libraries
- **Exports**: ZIP reader/writer utilities, archive management

## Setup & Run
```bash
# Test ZIP operations
bun test src/zip/

# Test XLSX file creation (uses ZIP internally)
bun test src/xlsx/writer.test.ts
```

## Patterns & Conventions

### ZIP Writing Patterns
- ✅ **DO**: Use streaming for file creation
  ```typescript
  // src/zip/writer.test.ts example
  const archive = createZipArchive();
  await archive.addFile('xl/workbook.xml', workbookXmlStream);
  await archive.finalize();
  ```

- ❌ **DON'T**: Load entire files into memory
  ```typescript
  // Anti-pattern: memory intensive
  const xmlBuffer = await fs.readFile('workbook.xml');
  await archive.addFile('xl/workbook.xml', xmlBuffer);
  ```

### Archive Structure
- ✅ **DO**: Follow XLSX specification structure
  ```typescript
  // Required XLSX structure
  archive.addFile('[Content_Types].xml', contentTypesXml);
  archive.addFile('_rels/.rels', relationshipsXml);
  archive.addFile('xl/workbook.xml', workbookXml);
  // ... etc
  ```

- ❌ **DON'T**: Use arbitrary paths
  ```typescript
  // Anti-pattern: invalid XLSX structure
  archive.addFile('workbook.xml', workbookXml);  // Wrong path
  ```

### File Reading
- ✅ **DO**: Use streaming for large files
  ```typescript
  // src/zip/reader.test.ts pattern
  const entries = await readZipEntries(filePath);
  for (const entry of entries) {
    const stream = await entry.openReadStream();
    // Process stream
  }
  ```

## Touch Points / Key Files
- **ZIP writer**: `writer.ts` - Create ZIP archives
- **ZIP reader**: `reader.ts` - Read ZIP archives
- **Integration**: `../xlsx/writer.ts` - Uses ZIP for XLSX creation

## JIT Index Hints
- Find ZIP writer: `rg -n "export.*createZipArchive"`
- Find ZIP reader: `rg -n "export.*readZipEntries"`
- Find XLSX ZIP usage: `rg -n "createZipArchive" src/xlsx/`
- Find ZIP tests: `rg -n "describe.*ZIP"`

## Common Gotchas
- XLSX files must follow exact directory structure
- ZIP entries use forward slashes (/) regardless of OS
- Compression level affects file size vs speed trade-off
- Archive must be finalized before use

## Pre-PR Checks
```bash
bun test src/zip/ && bun run lint src/zip/
```
