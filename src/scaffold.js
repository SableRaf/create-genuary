/**
 * Scaffold the Genuary project
 */

import { mkdir, writeFile, access, cp, mkdtemp, rm } from 'fs/promises';
import { join, basename, resolve } from 'path';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { getSketchName } from './prompts.js';
import { success, info, warn } from './utils.js';
import { renderPromptsFile } from './templateRenderer.js';

/**
 * Create a directory if it doesn't exist
 */
async function ensureDir(path) {
  try {
    await mkdir(path, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Check if a path exists
 */
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Run a command and return a promise
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: true,
      ...options
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

const IGNORED_TEMPLATE_DIRS = new Set(['node_modules', '.git']);
const REMOTE_TEMPLATE_REPO = 'sableRaf/genuary-gallery-templates';

/**
 * Clone a template project using degit
 */
async function cloneFromGit(repo, destinationDirName, cwd) {
  await runCommand('npx degit@latest', [repo, destinationDirName], {
    cwd,
    silent: false
  });
}

/**
 * Clone the gallery template from GitHub
 */
async function cloneGalleryTemplate(projectPath) {
  try {
    info('Downloading gallery template...');
    await cloneFromGit(`${REMOTE_TEMPLATE_REPO}/templates/default`, '.', projectPath);
    success('Gallery template downloaded');
    return true;
  } catch (error) {
    warn('Could not clone gallery template from GitHub');
    warn(`Reason: ${error.message}`);
    return false;
  }
}

/**
 * Scaffold a base p5.js template in a temporary directory
 */
async function scaffoldP5Project(tempRoot, templateDirName, p5Version, gitRepo, sourceFolder) {
  if (sourceFolder) {
    // Copy from local source folder
    const sourcePath = resolve(sourceFolder);
    const destPath = join(tempRoot, templateDirName);
    await cp(sourcePath, destPath, { recursive: true, filter: templateCopyFilter });
    return;
  }

  if (gitRepo) {
    await cloneFromGit(gitRepo, templateDirName, tempRoot);
    return;
  }

  const args = [templateDirName, '--'];
  if (p5Version !== 'latest') {
    args.push('--version', p5Version);
  }
  args.push('--silent');
  args.push('--type', 'basic');

  await runCommand('npm create p5js@latest', args, {
    cwd: tempRoot,
    silent: false
  });
}

/**
 * Create a base p5.js template in a temporary directory
 */
async function createTemplateProject(p5Version, gitRepo, sourceFolder) {
  const tempRoot = await mkdtemp(join(tmpdir(), 'genuary-template-'));
  const templateDirName = 'p5-template';
  const templatePath = join(tempRoot, templateDirName);

  try {
    await scaffoldP5Project(tempRoot, templateDirName, p5Version, gitRepo, sourceFolder);
  } catch (error) {
    await rm(tempRoot, { recursive: true, force: true });
    throw error;
  }

  return {
    templatePath,
    cleanup: async () => {
      await rm(tempRoot, { recursive: true, force: true });
    }
  };
}

/**
 * Lazily fetches the template and handles cleanup after use
 */
function createTemplateManager(p5Version, gitRepo, sourceFolder) {
  let templateInfo = null;

  return {
    ensureTemplate: async () => {
      if (!templateInfo) {
        templateInfo = await createTemplateProject(p5Version, gitRepo, sourceFolder);
      }
      return templateInfo.templatePath;
    },
    cleanup: async () => {
      if (templateInfo) {
        await templateInfo.cleanup();
        templateInfo = null;
      }
    }
  };
}

/**
 * Determine whether a path from the template should be copied.
 * Skips heavy directories like node_modules that would be re-installed per sketch.
 */
export function templateCopyFilter(src) {
  const base = basename(src);
  return !IGNORED_TEMPLATE_DIRS.has(base);
}

/**
 * Generate a single p5.js sketch
 */
async function generateSketch(sketchPath, ensureTemplate) {
  // Check if sketch already exists
  if (await exists(sketchPath)) {
    return { skipped: true };
  }

  const templatePath = await ensureTemplate();
  await cp(templatePath, sketchPath, { recursive: true, filter: templateCopyFilter });

  return { skipped: false };
}

/**
 * Generate all sketches
 */
export async function generateSketches(
  projectPath,
  prompts,
  p5Version,
  gitRepo,
  sourceFolder,
  projectsDir = 'sketches',
  onProgress
) {
  const sketchesDir = join(projectPath, projectsDir);

  const results = [];
  const templateManager = createTemplateManager(p5Version, gitRepo, sourceFolder);

  try {
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const sketchName = getSketchName(i, prompt);
      const sketchPath = join(sketchesDir, sketchName);

      onProgress?.(sketchName, i + 1, prompts.length);

      try {
        const result = await generateSketch(sketchPath, templateManager.ensureTemplate);
        results.push({
          name: sketchName,
          prompt,
          ...result
        });
      } catch (error) {
        throw new Error(`Failed to generate sketch ${sketchName}: ${error.message}`);
      }
    }
  } finally {
    await templateManager.cleanup();
  }

  return results;
}

/**
 * Generate prompts.json for runtime loading
 */
export async function generatePromptsJson(projectPath, year, prompts) {
  const promptsPath = join(projectPath, 'prompts.json');
  const contents = renderPromptsFile(year, prompts);
  await writeFile(promptsPath, contents, 'utf-8');
}

/**
 * Scaffold the entire project
 */
export async function scaffoldProject(
  projectPath,
  folderName,
  year,
  prompts,
  p5Version,
  gitRepo,
  sourceFolder,
  projectsDir = 'sketches',
  onProgress
) {
  // Ensure project directory exists
  await ensureDir(projectPath);

  // Clone the gallery template first
  const templateCloned = await cloneGalleryTemplate(projectPath);

  if (templateCloned) {
    // Remove the example sketches folder from the template
    const exampleSketchesPath = join(projectPath, projectsDir);
    try {
      await rm(exampleSketchesPath, { recursive: true, force: true });
      info(`Removed example ${projectsDir} folder from template`);
    } catch (error) {
      // Ignore if it doesn't exist
    }
  }

  // Make sure a projects container exists
  await ensureDir(join(projectPath, projectsDir));

  // Generate prompts.json (replaces the one from the template)
  await generatePromptsJson(projectPath, year, prompts);

  // Generate sketches
  await generateSketches(projectPath, prompts, p5Version, gitRepo, sourceFolder, projectsDir, onProgress);
}
