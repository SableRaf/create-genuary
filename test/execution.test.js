import { test, expect, describe } from 'vitest';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
import { realpathSync } from 'fs';
import { writeFileSync, mkdtempSync, symlinkSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Simulates the execution detection logic from index.js
 */
function checkIsExecutedDirectly(argv1, scriptPath) {
  let isExecutedDirectly = false;

  if (!argv1) {
    // npm create scenario where argv[1] might be undefined
    isExecutedDirectly = true;
  } else {
    try {
      // Resolve symlinks in argv[1] to get the real path
      const realArgvPath = realpathSync(argv1);
      isExecutedDirectly = realArgvPath === scriptPath;
    } catch {
      // If realpath fails, fall back to simple comparison
      isExecutedDirectly = resolve(argv1) === scriptPath;
    }
  }

  return isExecutedDirectly;
}

/**
 * Test the execution logic that determines whether main() should run
 * This tests the same logic used in index.js without spawning child processes
 */
describe('Execution logic for npm create scenario', () => {
  test('should return true when argv[1] is undefined (npm create scenario)', () => {
    const scriptPath = '/path/to/index.js';
    const argv1 = undefined;

    const isExecutedDirectly = checkIsExecutedDirectly(argv1, scriptPath);

    expect(isExecutedDirectly).toBe(true);
  });

  test('should return true when argv[1] matches the script path (direct node execution)', () => {
    const currentFilePath = fileURLToPath(import.meta.url);
    const argv1 = currentFilePath;

    const isExecutedDirectly = checkIsExecutedDirectly(argv1, currentFilePath);

    expect(isExecutedDirectly).toBe(true);
  });

  test('should return false when argv[1] points to a different file (module import)', () => {
    const currentFilePath = fileURLToPath(import.meta.url);
    const argv1 = '/some/other/file.js';

    const isExecutedDirectly = checkIsExecutedDirectly(argv1, currentFilePath);

    expect(isExecutedDirectly).toBe(false);
  });

  test('should return true when argv[1] is null (edge case)', () => {
    const scriptPath = '/path/to/index.js';
    const argv1 = null;

    const isExecutedDirectly = checkIsExecutedDirectly(argv1, scriptPath);

    expect(isExecutedDirectly).toBe(true);
  });

  test('should return true when argv[1] is empty string (edge case)', () => {
    const scriptPath = '/path/to/index.js';
    const argv1 = '';

    const isExecutedDirectly = checkIsExecutedDirectly(argv1, scriptPath);

    expect(isExecutedDirectly).toBe(true);
  });

  test('should return true when argv[1] is a symlink to the script (npm bin scenario)', () => {
    // Create a temporary directory for testing
    const tmpDir = mkdtempSync(join(tmpdir(), 'test-symlink-'));

    try {
      // Create a test script file
      const scriptPath = join(tmpDir, 'script.js');
      writeFileSync(scriptPath, '// test script');

      // Create a symlink to it (like node_modules/.bin does)
      const symlinkPath = join(tmpDir, 'symlink-to-script');
      symlinkSync(scriptPath, symlinkPath);

      // Resolve the real path of scriptPath to handle /var -> /private/var on macOS
      const realScriptPath = realpathSync(scriptPath);

      // Test that the symlink is resolved correctly
      const isExecutedDirectly = checkIsExecutedDirectly(symlinkPath, realScriptPath);

      expect(isExecutedDirectly).toBe(true);
    } finally {
      // Cleanup
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('Module import detection', () => {
  test('parseArguments should be importable without side effects', async () => {
    // This test verifies that importing functions doesn't trigger main()
    // by simply importing and using parseArguments
    const { parseArguments } = await import('../index.js');

    expect(parseArguments).toBeDefined();
    expect(typeof parseArguments).toBe('function');

    // Should be able to call parseArguments without main() interfering
    const result = parseArguments(['--year', '2024', 'test-folder']);
    expect(result.year).toBe(2024);
    expect(result.folder).toBe('test-folder');
  });
});
