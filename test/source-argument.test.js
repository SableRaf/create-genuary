import { test, expect, describe } from 'vitest';
import { parseArguments } from '../index.js';

describe('--sourceDir argument', () => {
  test('should error when --sourceDir and --templateRepo are used together', () => {
    expect(() => {
      parseArguments([
        '--sourceDir', '/path/to/template',
        '--git', 'user/repo',
        'output'
      ]);
    }).toThrow('Cannot use --sourceDir and --templateRepo together');
  });

  test('should treat folder name as source path when no source value provided', () => {
    const result = parseArguments([
      '--sourceDir',
      '/path/to/source',
      '--year', '2024'
    ]);

    expect(result.sourceDir).toBe('/path/to/source');
  });

  test('should show warning when --sourceDir is used with --p5-version', () => {
    const result = parseArguments([
      '--sourceDir', '/path/to/template',
      '--p5-version', '1.9.0',
      '--year', '2024',
      'output'
    ]);

    expect(result.sourceDir).toBe('/path/to/template');
    expect(result.p5Version).toBe('1.9.0');
    expect(result.createP5Options).toContain('--p5-version 1.9.0');
  });

  test('should display template source path when using --sourceDir', () => {
    const result = parseArguments([
      '--sourceDir', '/path/to/template',
      '--year', '2024',
      'output'
    ]);

    expect(result.sourceDir).toBe('/path/to/template');
    expect(result.folder).toBe('output');
  });
});

describe('--sourceDir integration', () => {
  test('should use local template folder to create sketches', () => {
    const result = parseArguments([
      '--sourceDir', '/path/to/template',
      '--year', '2024',
      'output'
    ]);

    expect(result.sourceDir).toBe('/path/to/template');
    expect(result.year).toBe(2024);
    expect(result.folder).toBe('output');
  });
});

describe('argument parsing edge cases', () => {
  test('should handle relative paths for --sourceDir', () => {
    const result = parseArguments([
      '--sourceDir', './test',
      '--year', '2024',
      'output-relative'
    ]);

    expect(result.sourceDir).toBe('./test');
  });

  test('should handle absolute paths for --sourceDir', () => {
    const absolutePath = '/tmp/test-template';
    const result = parseArguments([
      '--sourceDir', absolutePath,
      '--year', '2024',
      'output-absolute'
    ]);

    expect(result.sourceDir).toBe(absolutePath);
  });
});
