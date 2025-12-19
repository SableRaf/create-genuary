import { test, expect, describe } from 'vitest';
import { resolve, join } from 'path';
import { parseArguments } from '../index.js';

describe('--sourceDir argument', () => {
  test('should error when --sourceDir and --templateRepo are used together', () => {
    expect(() => {
      parseArguments([
        '--sourceDir', '/path/to/template',
        '--templateRepo', 'user/repo',
        'output'
      ]);
    }).toThrow('Cannot use --sourceDir and --templateRepo together');
  });

  test('should use provided --sourceDir value', () => {
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

describe('--outputDir argument', () => {
  test('should set folder when --outputDir is provided', () => {
    const result = parseArguments(['--outputDir', 'my-project']);

    expect(result.folder).toBe('my-project');
  });

  test('should error when --outputDir is used with a positional folder', () => {
    expect(() => {
      parseArguments(['--outputDir', 'my-project', 'extra-folder']);
    }).toThrow(
      'Choose only one output folder: use a positional folder or --outputDir, not both. \nExample: `create-genuary my-project` OR `create-genuary --outputDir my-project`.'
    );
  });

  test('should require a value for --outputDir', () => {
    expect(() => {
      parseArguments(['--outputDir']);
    }).toThrow('--outputDir requires a folder path');
  });
});

describe('--sketchesDir argument', () => {
  test('should use provided --sketchesDir value', () => {
    const result = parseArguments([
      '--sketchesDir', 'projects',
      '--year', '2024'
    ]);

    expect(result.sketchesDir).toBe('projects');
  });

  test('should require a value for --sketchesDir', () => {
    expect(() => {
      parseArguments(['--sketchesDir']);
    }).toThrow('--sketchesDir requires a folder name');
  });
});

describe('output folder validation', () => {
  test('should reject path traversal segments for --outputDir', () => {
    const traversalPath = join('..', 'tmp', 'malicious');
    expect(() => {
      parseArguments(['--outputDir', traversalPath]);
    }).toThrow('Invalid output folder: must not contain ".." path segments.');
  });

  test('should reject absolute paths for positional folders', () => {
    const absolutePath = resolve('genuary-absolute');
    expect(() => {
      parseArguments([absolutePath]);
    }).toThrow(
      'Invalid output folder: must be a relative path within the current working directory.'
    );
  });
});
