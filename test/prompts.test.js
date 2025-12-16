import { test, expect } from 'vitest';
import { sanitize, getSketchName } from '../src/prompts.js';

test('sanitize normalizes strings for filesystem safety', () => {
  expect(sanitize('Hello World!')).toBe('hello_world');
  expect(sanitize('  Mixed__Case  ')).toBe('mixed_case');
});

test('sanitize falls back to "sketch" when input has no valid characters', () => {
  expect(sanitize('!!!')).toBe('sketch');
  expect(sanitize('')).toBe('sketch');
});

test('getSketchName uses zero-padded day numbers and sanitized text', () => {
  const prompt = { shorthand: 'Shiny Things' };
  expect(getSketchName(0, prompt)).toBe('01_shiny_things');
});

test('getSketchName falls back through prompt properties', () => {
  const prompt = { name: 'Generative Grids' };
  expect(getSketchName(5, prompt)).toBe('06_generative_grids');

  const fallbackPrompt = { date: '2023-01-07' };
  expect(getSketchName(6, fallbackPrompt)).toBe('07_2023_01_07');
});
