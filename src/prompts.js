/**
 * Fetch and validate Genuary prompts from genuary.art
 */

export async function fetchPrompts(year) {
  const url = year
    ? `https://genuary.art/${year}/prompts.json`
    : `https://genuary.art/prompts.json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        const msg = year
          ? `Prompts for ${year} not found. The year may not be available yet.`
          : 'Prompts not found. The requested prompts may not be available yet.';
        throw new Error(`${msg}\nTry --year <year> to specify a year or check https://genuary.art`);
      }
      throw new Error(`Failed to fetch prompts: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.year) {
      throw new Error('Invalid prompts format: missing "year" key');
    }

    // Validate schema
    if (!data.genuaryPrompts) {
      throw new Error('Invalid prompts format: missing "genuaryPrompts" key');
    }

    if (!Array.isArray(data.genuaryPrompts)) {
      throw new Error('Invalid prompts format: "genuaryPrompts" must be an array');
    }

    const prompts = data.genuaryPrompts;

    // Validate array length
    if (prompts.length !== 31) {
      throw new Error(`Invalid prompts: expected 31 prompts, got ${prompts.length}`);
    }

    // Validate each prompt object
    const days = new Set();
    const shorthands = new Set();

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const day = i + 1;

      // Validate required fields
      if (!prompt.name && !prompt.date && !prompt.shorthand) {
        throw new Error(`Invalid prompt at index ${i}: missing name, date, or shorthand`);
      }

      // Check for duplicate days (based on index)
      if (days.has(day)) {
        throw new Error(`Duplicate day found: ${day}`);
      }
      days.add(day);

      // Check for duplicate shorthands
      const shorthand = prompt.shorthand || prompt.name || prompt.date;
      if (shorthand && shorthands.has(shorthand)) {
        throw new Error(`Duplicate shorthand found: "${shorthand}"`);
      }
      if (shorthand) {
        shorthands.add(shorthand);
      }
    }

    return {
      year: data.year,
      prompts
    };

  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        'Network error: Unable to fetch prompts from genuary.art\n' +
        'Please check your internet connection and try again.'
      );
    }
    throw error;
  }
}

/**
 * Sanitize a string for use in folder names
 */
export function sanitize(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'sketch';
}

/**
 * Generate a sketch name from day index and prompt
 */
export function getSketchName(index, prompt) {
  const day = String(index + 1).padStart(2, '0');
  const shorthand = prompt.shorthand || prompt.name || prompt.date || `day-${day}`;
  return `${day}_${sanitize(shorthand)}`;
}
