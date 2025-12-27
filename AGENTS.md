# Bunspout - Fast Excel Read/Write Library

## Project Snapshot
- **Type**: Single package TypeScript library
- **Stack**: TypeScript (strict), Bun runtime, XLSX file format
- **Purpose**: High-performance streaming Excel operations
- **Architecture**: Modular with path aliases (@xlsx/*, @sheet/*, etc.)

Sub-packages have detailed guidance in their own AGENTS.md files.

## Root Setup Commands
```bash
bun install         # Install dependencies
bun test            # Run all tests
bun bench           # Run benchmarks (Tinybench)
bun run lint        # Lint with ESLint
bun run lint:fix    # Auto-fix linting issues
```

## Universal Conventions

### Code Style
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Formatting**: Single quotes, semi-colons, trailing commas
- **Imports**: Path aliases required (no relative imports)
- **ESLint**: Strict rules with import ordering and unused import removal

### Development Workflow
- **Runtime**: Use Bun instead of Node.js, npm, pnpm, or vite
- **Testing**: `bun test` for unit tests, colocated with source files.
- **Benchmarks**: `bun bench` runs Tinybench performance tests
- **Linting**: Run before commits, auto-fix with `--fix`

### Security & Secrets
- Never commit sensitive data or API keys
- No environment variables currently used
- PII handling: None (library-level code only)

## JIT Index - Directory Map

### Core Library Structure
- `src/xlsx/` → High-level XLSX API ([see src/xlsx/AGENTS.md](src/xlsx/AGENTS.md))
- `src/sheet/` → Sheet operations & data structures ([see src/sheet/AGENTS.md](src/sheet/AGENTS.md))
- `src/xml/` → XML parsing/generation ([see src/xml/AGENTS.md](src/xml/AGENTS.md))
- `src/zip/` → ZIP file handling ([see src/zip/AGENTS.md](src/zip/AGENTS.md))
- `src/utils/` → Utility functions ([see src/utils/AGENTS.md](src/utils/AGENTS.md))
- `src/adapters/` → Runtime-specific adapters ([see src/adapters/AGENTS.md](src/adapters/AGENTS.md))

### Testing & Quality
- `src/tests/` → Tests & benchmarks ([see src/tests/AGENTS.md](src/tests/AGENTS.md))
- `src/scripts/` → Utility scripts ([see src/scripts/AGENTS.md](src/scripts/AGENTS.md))

### Quick Find Commands
- Find function: `rg -n "export.*functionName"`
- Find class: `rg -n "export.*className"`
- Find type: `rg -n "export.*type.*TypeName"`
- Find test: `find . -name "*.test.ts" -exec grep -l "describe.*TestName" {} \;`
- Find benchmark: `find . -name "*.bench.ts" -exec grep -l "bench.*Name" {} \;`

## Definition of Done
Before merging a PR:
- ✅ `bun test` passes all tests
- ✅ `bun run lint` passes with no errors
- ✅ `bun bench` runs without failures (if performance changes)
- ✅ TypeScript compiles without errors
- ✅ New features have corresponding tests
- ✅ Breaking changes documented in PR description

