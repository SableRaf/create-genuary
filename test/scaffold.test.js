import { test, expect } from 'vitest';
import { templateCopyFilter } from '../src/scaffold.js';

test('templateCopyFilter skips heavy directories', () => {
  expect(templateCopyFilter('/tmp/project/node_modules')).toBe(false);
  expect(templateCopyFilter('/tmp/project/.git')).toBe(false);
});

test('templateCopyFilter allows regular paths', () => {
  expect(templateCopyFilter('/tmp/project/src')).toBe(true);
  expect(templateCopyFilter('/tmp/project/assets/images')).toBe(true);
});
