/**
 * Helpers for injecting context data into project templates.
 */
import { getSketchName } from './prompts.js';

/**
 * Prepare the gallery HTML contents for the provided year.
 */
export function renderGalleryTemplate(template, year) {
  return template.replace(/\{\{YEAR\}\}/g, year);
}

/**
 * Create the prompts.json contents that will be loaded at runtime.
 */
export function renderPromptsFile(year, prompts) {
  const payload = {
    year,
    genuaryPrompts: prompts.map((prompt, index) => ({
      ...prompt,
      day: index + 1,
      folderName: getSketchName(index, prompt)
    }))
  };

  return JSON.stringify(payload, null, 2) + '\n';
}

/**
 * Prepare README contents with the prompts list for the year.
 */
export function renderReadmeTemplate(template, year, prompts) {
  const promptsList = prompts
    .map((prompt, index) => {
      const day = index + 1;
      const name = prompt.shorthand || prompt.name || `Day ${day}`;
      const description = prompt.description || '';
      return `${day}. **${name}** - ${description}`;
    })
    .join('\n');

  return template
    .replace(/\{\{YEAR\}\}/g, year)
    .replace(/\{\{PROMPTS_LIST\}\}/g, promptsList);
}

/**
 * Prepare the package.json contents string.
 */
export function renderPackageTemplate(template, folderName, year) {
  const finalJson = {
    ...template,
    name: folderName,
    description: `Genuary ${year} sketches`
  };

  return JSON.stringify(finalJson, null, 2) + '\n';
}

/**
 * Prepare the gallery config contents string.
 */
export function renderConfigTemplate(template, year) {
  let injected = template.replace(/\{\{YEAR\}\}/g, year);
  if (!injected.endsWith('\n')) {
    injected += '\n';
  }
  return injected;
}
