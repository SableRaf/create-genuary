import { test, expect } from 'vitest';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

async function importScaffold() {
  return import('../src/scaffold.js');
}

test('templateCopyFilter skips heavy directories', async () => {
  const { templateCopyFilter } = await importScaffold();
  expect(templateCopyFilter('/tmp/project/node_modules')).toBe(false);
  expect(templateCopyFilter('/tmp/project/.git')).toBe(false);
});

test('templateCopyFilter allows regular paths', async () => {
  const { templateCopyFilter } = await importScaffold();
  expect(templateCopyFilter('/tmp/project/src')).toBe(true);
  expect(templateCopyFilter('/tmp/project/assets/images')).toBe(true);
});

// Test removed: generateReadme no longer exists in simplified scaffold
// The gallery template is now cloned as-is with no placeholder replacement

test('generatePromptsJson writes prompts payload with folderName', async () => {
  const { generatePromptsJson } = await importScaffold();
  const projectDir = await mkdtemp(join(tmpdir(), 'genuary-test-'));
  const prompts = [
    { name: 'Particles, lots of them.', shorthand: 'Particles' },
    { name: 'No palettes.', description: 'No palettes prompt.' }
  ];

  try {
    await generatePromptsJson(projectDir, 2024, prompts);
    const content = await readFile(join(projectDir, 'prompts.json'), 'utf-8');
    const data = JSON.parse(content);

    expect(data.year).toBe(2024);
    expect(Array.isArray(data.genuaryPrompts)).toBe(true);
    expect(data.genuaryPrompts).toHaveLength(2);
    expect(data.genuaryPrompts[0].day).toBe(1);
    expect(data.genuaryPrompts[0].folderName).toBe('01_particles');
    expect(data.genuaryPrompts[1].day).toBe(2);
    expect(data.genuaryPrompts[1].folderName).toBe('02_no_palettes');
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});

// Test removed: generatePackageJson no longer exists in simplified scaffold
// Package.json comes from the cloned gallery template and is used as-is
