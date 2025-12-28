import { mkdir, readFile, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import type { SharedStringsCachingStrategy } from './strategy';

/**
 * File-based caching strategy for shared strings
 * Writes strings to temporary files to avoid memory issues
 */
export class FileBasedStrategy implements SharedStringsCachingStrategy {
  private readonly tempDir: string;
  private readonly maxStringsPerFile: number;
  private fileCache: Map<number, string[]> = new Map(); // fileIndex -> strings array
  private currentFileIndex: number = 0;
  private currentFileStrings: string[] = [];
  private count: number = 0;
  private lastLoadedFileIndex: number = -1;

  constructor(tempDir: string, maxStringsPerFile: number = 10000) {
    this.tempDir = tempDir;
    this.maxStringsPerFile = maxStringsPerFile;
  }

  async addString(index: number, value: string): Promise<void> {
    const fileIndex = Math.floor(index / this.maxStringsPerFile);
    const localIndex = index % this.maxStringsPerFile;

    // If we need a new file, flush the current one
    if (fileIndex > this.currentFileIndex) {
      await this.flushCurrentFile();
      this.currentFileIndex = fileIndex;
      this.currentFileStrings = [];
    }

    // Ensure array is large enough
    if (localIndex >= this.currentFileStrings.length) {
      const newLength = Math.max(localIndex + 1, this.currentFileStrings.length * 2);
      const newArray = new Array(newLength);
      for (let i = 0; i < this.currentFileStrings.length; i++) {
        newArray[i] = this.currentFileStrings[i];
      }
      this.currentFileStrings = newArray;
    }

    this.currentFileStrings[localIndex] = value;
    this.count = Math.max(this.count, index + 1);
  }

  async getString(index: number): Promise<string | undefined> {
    const fileIndex = Math.floor(index / this.maxStringsPerFile);
    const localIndex = index % this.maxStringsPerFile;

    // If requesting from the current file that hasn't been flushed yet, read from memory
    if (fileIndex === this.currentFileIndex && this.currentFileStrings.length > 0) {
      return this.currentFileStrings[localIndex];
    }

    // Load the file if not already in cache
    if (!this.fileCache.has(fileIndex)) {
      // Unload the last file if we're loading a different one
      if (this.lastLoadedFileIndex !== -1 && this.lastLoadedFileIndex !== fileIndex) {
        this.fileCache.delete(this.lastLoadedFileIndex);
      }

      const filePath = this.getFilePath(fileIndex);
      try {
        const content = await readFile(filePath, 'utf-8');
        const strings = JSON.parse(content) as string[];
        this.fileCache.set(fileIndex, strings);
        this.lastLoadedFileIndex = fileIndex;
      } catch {
        // File might not exist yet (if we're reading before all writes are flushed)
        return undefined;
      }
    }

    const strings = this.fileCache.get(fileIndex);
    return strings?.[localIndex];
  }

  getCount(): number {
    return this.count;
  }

  async cleanup(): Promise<void> {
    // Flush any remaining strings
    await this.flushCurrentFile();

    // Clear cache
    this.fileCache.clear();
    this.currentFileStrings = [];
    this.count = 0;
    this.currentFileIndex = 0;
    this.lastLoadedFileIndex = -1;

    // Remove temp directory
    try {
      await rm(this.tempDir, { recursive: true, force: true });
    } catch {
      // Ignore errors during cleanup
    }
  }

  private async flushCurrentFile(): Promise<void> {
    if (this.currentFileStrings.length === 0) {
      return;
    }

    // Ensure temp directory exists
    try {
      await mkdir(this.tempDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    const filePath = this.getFilePath(this.currentFileIndex);
    const content = JSON.stringify(this.currentFileStrings);
    await writeFile(filePath, content, 'utf-8');
  }

  private getFilePath(fileIndex: number): string {
    return join(this.tempDir, `shared-strings-${fileIndex}.json`);
  }
}

