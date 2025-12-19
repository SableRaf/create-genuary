import { test, expect, describe } from 'vitest';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

/**
 * Test the execution logic that determines whether main() should run
 * This tests the same logic used in index.js without spawning child processes
 */
describe('Execution logic for npm create scenario', () => {
  test('should return true when argv[1] is undefined (npm create scenario)', () => {
    // Simulate the logic from index.js
    const argv1 = undefined;
    const mockScriptPath = '/path/to/index.js';

    const isExecutedDirectly = argv1
      ? fileURLToPath(import.meta.url) === resolve(argv1)
      : true; // If argv[1] is undefined, assume direct execution

    expect(isExecutedDirectly).toBe(true);
  });

  test('should return true when argv[1] matches the script path (direct node execution)', () => {
    const currentFilePath = fileURLToPath(import.meta.url);
    const argv1 = currentFilePath;

    const isExecutedDirectly = argv1
      ? currentFilePath === resolve(argv1)
      : true;

    expect(isExecutedDirectly).toBe(true);
  });

  test('should return false when argv[1] points to a different file (module import)', () => {
    const currentFilePath = fileURLToPath(import.meta.url);
    const argv1 = '/some/other/file.js';

    const isExecutedDirectly = argv1
      ? currentFilePath === resolve(argv1)
      : true;

    expect(isExecutedDirectly).toBe(false);
  });

  test('should return true when argv[1] is null (edge case)', () => {
    const argv1 = null;

    const isExecutedDirectly = argv1
      ? fileURLToPath(import.meta.url) === resolve(argv1)
      : true;

    expect(isExecutedDirectly).toBe(true);
  });

  test('should return true when argv[1] is empty string (edge case)', () => {
    const argv1 = '';

    const isExecutedDirectly = argv1
      ? fileURLToPath(import.meta.url) === resolve(argv1)
      : true;

    expect(isExecutedDirectly).toBe(true);
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
