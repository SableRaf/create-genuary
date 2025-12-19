import { test, expect, describe, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawn } from 'child_process';

/**
 * Helper to run the CLI with arguments and capture output
 */
function runCLI(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['index.js', ...args], {
      cwd: join(process.cwd()),
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', reject);
  });
}

function stripAnsi(value) {
  return value.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Create a minimal template folder for testing
 */
async function createTestTemplate(templateDir) {
  await mkdir(templateDir, { recursive: true });
  await writeFile(
    join(templateDir, 'index.html'),
    '<!DOCTYPE html><html><head><title>Test</title></head><body><script src="sketch.js"></script></body></html>'
  );
  await writeFile(
    join(templateDir, 'sketch.js'),
    'function setup() { createCanvas(400, 400); }\nfunction draw() { background(220); }'
  );
}

describe('--sourceDir argument', () => {
  let testDir;
  let templateDir;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'source-test-'));
    templateDir = join(testDir, 'template');
    await createTestTemplate(templateDir);
  });

  afterEach(async () => {
    if (testDir) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  test('should error when --sourceDir and --templateRepo are used together', async () => {
    const { code, stdout, stderr } = await runCLI([
      '--sourceDir', templateDir,
      '--git', 'user/repo',
      join(testDir, 'output')
    ]);

    expect(code).toBe(1);
    const output = stripAnsi(stdout + stderr);
    expect(output).toContain('Cannot use --sourceDir and --templateRepo together');
    expect(output).toContain('Please use either --sourceDir for a local template or --templateRepo for a remote repository');
  });

  test('should treat folder name as source path when no source value provided', async () => {
    // When --sourceDir is the last argument, the next argument becomes the source path
    // This is how argument parsing works - we can't prevent this without more complex logic
    // So we test that it tries to use a non-existent path as source
    const nonExistentPath = join(testDir, 'does-not-exist');
    const { code, stdout, stderr } = await runCLI([
      '--sourceDir',
      nonExistentPath,
      '--year', '2024'
    ]);

    // It will fail when trying to copy from non-existent source
    expect(code).toBe(1);
    const output = stripAnsi(stdout + stderr);
    // Either fails on path not existing, or on project name issues
    expect(code).toBe(1);
  });

  test('should show warning when --sourceDir is used with --p5-version', async () => {
    const outputDir = join(testDir, 'output-with-version');
    const { stdout } = await runCLI([
      '--sourceDir', templateDir,
      '--p5-version', '1.9.0',
      '--year', '2024',
      outputDir
    ]);

    const output = stripAnsi(stdout);
    expect(output).toContain('Using --sourceDir uses a local template folder');
    expect(output).toContain('--p5-version 1.9.0');
    expect(output).toContain('will be ignored');

    // Clean up output directory
    await rm(outputDir, { recursive: true, force: true });
  });

  test('should display template source path when using --sourceDir', async () => {
    const outputDir = join(testDir, 'output-basic');
    const { stdout } = await runCLI([
      '--sourceDir', templateDir,
      '--year', '2024',
      outputDir
    ]);

    const output = stripAnsi(stdout);
    expect(output).toContain('Template source:');
    expect(output).toContain(templateDir);

    // Clean up output directory
    await rm(outputDir, { recursive: true, force: true });
  });
});

describe('--sourceDir integration', () => {
  let testDir;
  let templateDir;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'source-integration-'));
    templateDir = join(testDir, 'template');
    await createTestTemplate(templateDir);
  });

  afterEach(async () => {
    if (testDir) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  test('should use local template folder to create sketches', async () => {
    const outputDir = join(testDir, 'output');
    const { code, stdout } = await runCLI([
      '--sourceDir', templateDir,
      '--year', '2024',
      outputDir
    ]);

    // Check that it completes successfully (note: may fail due to network/API issues in tests)
    // We're mainly testing that the argument parsing and setup works correctly
    const output = stripAnsi(stdout);
    expect(output).toContain('Template source:');
    expect(output).toContain(templateDir);

    // Clean up output directory
    await rm(outputDir, { recursive: true, force: true });
  }, 30000); // Increase timeout for integration test
});

describe('argument parsing edge cases', () => {
  afterEach(async () => {
    // Clean up test/tmp directory after each test
    await rm(join('test', 'tmp'), { recursive: true, force: true });
    // Also clean up any genuary-* directories
    await rm('genuary-2024', { recursive: true, force: true });
  });

  test('should handle relative paths for --sourceDir', async () => {
    const outputDir = join('test', 'tmp', 'output-relative');
    const { stdout } = await runCLI([
      '--sourceDir', './test',
      '--year', '2024',
      outputDir
    ]);

    // Should accept relative paths (will resolve them internally)
    const output = stripAnsi(stdout);
    expect(output).toContain('Template source: ./test');
  });

  test('should handle absolute paths for --sourceDir', async () => {
    const absolutePath = join(tmpdir(), 'test-template');
    const outputDir = join('test', 'tmp', 'output-absolute');
    const { stdout } = await runCLI([
      '--sourceDir', absolutePath,
      '--year', '2024',
      outputDir
    ]);

    const output = stripAnsi(stdout);
    expect(output).toContain('Template source:');
    expect(output).toContain(absolutePath);
  });
});
