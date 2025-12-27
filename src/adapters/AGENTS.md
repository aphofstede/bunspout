# Adapters Layer - Runtime-Specific Implementations

## Package Identity
- **Purpose**: Handle differences between Bun, Node.js, and other runtimes
- **Tech**: Conditional imports, runtime detection, polyfills
- **Exports**: Runtime-specific utilities (streams, file I/O, etc.)

## Setup & Run
```bash
# Test adapters
bun test src/adapters/

# Test runtime-specific behavior
bun run index.ts  # Uses Bun adapter
node index.ts     # Would use Node adapter (if implemented)
```

## Patterns & Conventions

### Runtime Detection
- ✅ **DO**: Use feature detection over user-agent sniffing
  ```typescript
  // src/adapters/common.ts pattern
  const isBun = typeof Bun !== 'undefined';
  const isNode = typeof process !== 'undefined' && process.versions?.node;
  ```

- ❌ **DON'T**: Hardcode runtime assumptions
  ```typescript
  // Anti-pattern: brittle
  if (process.env.RUNTIME === 'bun') {
    // Bun-specific code
  }
  ```

### Stream Conversion
- ✅ **DO**: Provide unified interfaces across runtimes
  ```typescript
  // src/adapters/bun.ts example
  export function stringToReadableStream(strings: AsyncIterable<string>): ReadableStream<Uint8Array>
  ```

- ✅ **DO**: Handle Bun's Web Streams API
  ```typescript
  // src/adapters/bun.ts pattern
  export async function* blobToBytes(blob: Blob): AsyncIterable<Uint8Array> {
    const buffer = await blob.arrayBuffer();
    yield new Uint8Array(buffer);
  }
  ```

### Conditional Exports
- ✅ **DO**: Export based on runtime capabilities
  ```typescript
  // src/adapters/common.ts pattern
  export const { stringToStream } = isBun
    ? await import('./bun.js')
    : await import('./node.js');
  ```

## Touch Points / Key Files
- **Bun adapter**: `bun.ts` - Bun-specific implementations
- **Node adapter**: `node.ts` - Node.js implementations
- **Common logic**: `common.ts` - Shared runtime detection
- **Integration**: `../xlsx/writer.ts` - Uses adapters for file I/O

## JIT Index Hints
- Find Bun-specific code: `rg -n "typeof Bun"`
- Find Node-specific code: `rg -n "process\.versions\.node"`
- Find adapter exports: `rg -n "export.*from.*adapters"`
- Find runtime detection: `rg -n "isBun|isNode"`

## Common Gotchas
- Bun has different stream APIs than Node.js
- Bun automatically provides ReadableStream, Node.js uses streams
- Runtime detection must happen at module load time
- Some Bun APIs aren't available in Node.js (and vice versa)

## Pre-PR Checks
```bash
bun test src/adapters/ && bun run lint src/adapters/
```
