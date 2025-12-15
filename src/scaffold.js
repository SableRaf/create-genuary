/**
 * Scaffold the Genuary project
 */

import { mkdir, writeFile, access, readFile, cp, mkdtemp, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { getSketchName } from './prompts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

/**
 * Create a base p5.js template in a temporary directory
 */
async function createTemplateProject(p5Version) {
  const tempRoot = await mkdtemp(join(tmpdir(), 'genuary-template-'));
  const templateDirName = 'p5-template';
  const templatePath = join(tempRoot, templateDirName);

  const args = [templateDirName, '--'];
  if (p5Version !== 'latest') {
    args.push('--version', p5Version);
  }
  args.push('--yes');

  try {
    await runCommand('npm create p5js@latest', args, {
      cwd: tempRoot,
      silent: false
    });
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
function createTemplateManager(p5Version) {
  let templateInfo = null;

  return {
    ensureTemplate: async () => {
      if (!templateInfo) {
        templateInfo = await createTemplateProject(p5Version);
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
 * Generate a single p5.js sketch
 */
async function generateSketch(sketchPath, ensureTemplate) {
  // Check if sketch already exists
  if (await exists(sketchPath)) {
    return { skipped: true };
  }

  const templatePath = await ensureTemplate();
  await cp(templatePath, sketchPath, { recursive: true });

  return { skipped: false };
}

/**
 * Generate all sketches
 */
export async function generateSketches(projectPath, prompts, p5Version, onProgress) {
  const sketchesDir = join(projectPath, 'sketches');

  const results = [];
  const templateManager = createTemplateManager(p5Version);

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
 * Generate the gallery view (index.html)
 */
export async function generateGallery(projectPath, year, prompts) {
  const templatePath = join(__dirname, 'templates', 'index.html');
  let template = await readFile(templatePath, 'utf-8');

  // Prepare sketches data
  const sketchesData = prompts.map((prompt, index) => ({
    day: index + 1,
    name: getSketchName(index, prompt),
    description: prompt.description || prompt.name || '',
    shorthand: prompt.shorthand || prompt.name || `Day ${index + 1}`,
    credit: prompt.credit || [],
    creditUrl: prompt.creditUrl || []
  }));

  // Replace template variables
  template = template.replace(/\{\{YEAR\}\}/g, year);
  template = template.replace(/\{\{SKETCHES_JSON\}\}/g, JSON.stringify(sketchesData, null, 2));

  const galleryPath = join(projectPath, 'index.html');
  await writeFile(galleryPath, template, 'utf-8');
}

/**
 * Generate the README.md
 */
export async function generateReadme(projectPath, year, prompts) {
  const templatePath = join(__dirname, 'templates', 'README.md.template');
  let template = await readFile(templatePath, 'utf-8');

  // Create prompts list
  const promptsList = prompts
    .map((prompt, index) => {
      const day = index + 1;
      const name = prompt.shorthand || prompt.name || `Day ${day}`;
      const description = prompt.description || '';
      return `${day}. **${name}** - ${description}`;
    })
    .join('\n');

  // Replace template variables
  template = template.replace(/\{\{YEAR\}\}/g, year);
  template = template.replace(/\{\{PROMPTS_LIST\}\}/g, promptsList);

  const readmePath = join(projectPath, 'README.md');
  await writeFile(readmePath, template, 'utf-8');
}

/**
 * Generate package.json for the project
 */
export async function generatePackageJson(projectPath, folderName, year) {
  const packagePath = join(projectPath, 'package.json');
  const templatePackagePath = join(__dirname, '..', 'base', 'package.template.json');

  if (await exists(templatePackagePath)) {
    const template = JSON.parse(await readFile(templatePackagePath, 'utf-8'));
    template.name = folderName;
    template.description = `Genuary ${year} sketches`;
    await writeFile(packagePath, JSON.stringify(template, null, 2) + '\n', 'utf-8');
    return;
  }

  const packageJson = {
    name: folderName,
    version: '1.0.0',
    private: true,
    description: `Genuary ${year} sketches`,
    scripts: {
      serve: 'npx http-server -p 8080'
    }
  };

  await writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
}

/**
 * Generate .gitignore
 */
export async function generateGitignore(projectPath) {
  const templatePath = join(__dirname, 'templates', 'gitignore.template');
  const template = await readFile(templatePath, 'utf-8');

  const gitignorePath = join(projectPath, '.gitignore');
  await writeFile(gitignorePath, template, 'utf-8');
}

/**
 * Scaffold the entire project
 */
export async function scaffoldProject(projectPath, folderName, year, prompts, p5Version, onProgress) {
  // Ensure project directory exists
  await ensureDir(projectPath);
  // Make sure a sketches container exists before we copy templates
  await ensureDir(join(projectPath, 'sketches'));

  // Generate project files
  await generatePackageJson(projectPath, folderName, year);
  await generateGitignore(projectPath);

  // Generate sketches
  await generateSketches(projectPath, prompts, p5Version, onProgress);

  // Generate gallery and README
  await generateGallery(projectPath, year, prompts);
  await generateReadme(projectPath, year, prompts);
}
