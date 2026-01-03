/*
 * Test helper utilities for runtime-agnostic file operations
 * Use these helpers in tests instead of Bun-specific APIs
 */
import { fileExists, deleteFile } from '../adapters';

/**
 * Deletes a test file
 * Replaces: await import('fs').then(fs => fs.promises.unlink(path))
 */
export async function deleteTestFile(filePath: string): Promise<void> {
  if (await fileExists(filePath)) {
    await deleteFile(filePath);
  }
}

/**
 * Cleanup helper for afterEach hooks
 * Deletes multiple test files if they exist
 */
export async function cleanupTestFiles(...filePaths: string[]): Promise<void> {
  for (const filePath of filePaths) {
    await deleteTestFile(filePath);
  }
}
