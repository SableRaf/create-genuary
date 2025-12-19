#!/usr/bin/env node

/**
 * create-genuary CLI
 * Scaffold a complete Genuary project with all daily p5.js sketches
 */

import { resolve, normalize, isAbsolute, relative, sep } from 'path';
import { fileURLToPath } from 'url';
import { access } from 'fs/promises';
import { fetchPrompts } from './src/prompts.js';
import { scaffoldProject } from './src/scaffold.js';
import { logColors, log, success, info, warn, error } from './src/utils.js';

export function parseArguments(argv = process.argv.slice(2)) {
  const args = argv;

  let folder = null;
  let outputDirProvided = false;
  let year = new Date().getFullYear();
  let p5Version = 'latest';
  let yearProvided = false;
  let templateRepo = null;
  let sourceDir = null;
  let sketchesDir = 'sketches';
  let usedDeprecatedSource = false;
  let usedDeprecatedGit = false;
  const createP5Options = [];

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--year') {
      yearProvided = true;
      const yearValue = args[++i];
      if (!yearValue) {
        throw new Error('--year requires a value');
      }
      const parsedYear = parseInt(yearValue);
      if (isNaN(parsedYear) || parsedYear < 1000 || parsedYear > 9999) {
        throw new Error(`Invalid year: ${yearValue}. Must be a 4-digit number.`);
      }
      if (parsedYear < 2021) {
        throw new Error(`Invalid year: ${yearValue}. Genuary started in 2021.`);
      }
      if (parsedYear > new Date().getFullYear() + 1) {
        throw new Error(`Invalid year: ${yearValue}. You can not be that far in the future.`);
      }
      year = parsedYear;
    } else if (arg === '--p5-version') {
      const versionValue = args[++i];
      if (!versionValue) {
        throw new Error('--p5-version requires a value');
      }
      // Basic validation for semantic version or "latest"
      if (versionValue !== 'latest' && !/^\d+\.\d+\.\d+$/.test(versionValue)) {
        throw new Error(
          `Invalid p5.js version: ${versionValue}. ` +
          `Must be "latest" or a semantic version like "1.11.1"`
        );
      }
      p5Version = versionValue;
      createP5Options.push(`--p5-version ${versionValue}`);
    } else if (arg === '--templateRepo' || arg === '--git') {
      const repoValue = args[++i];
      if (!repoValue) {
        throw new Error(`${arg} requires a repository argument, e.g. "user/repo"`);
      }
      if (arg === '--git') {
        usedDeprecatedGit = true;
      }
      templateRepo = repoValue;
    } else if (arg === '--sourceDir' || arg === '--source') {
      const sourcePath = args[++i];
      if (!sourcePath) {
        throw new Error(`${arg} requires a folder path`);
      }
      if (arg === '--source') {
        usedDeprecatedSource = true;
      }
      sourceDir = sourcePath;
    } else if (arg === '--outputDir') {
      const outputPath = args[++i];
      if (!outputPath) {
        throw new Error('--outputDir requires a folder path');
      }
      outputDirProvided = true;
      if (folder) {
        throw new Error(
          'Choose only one output folder: use a positional folder or --outputDir, not both. \nExample: `create-genuary my-project` OR `create-genuary --outputDir my-project`.'
        );
      }
      folder = outputPath;
      validateOutputFolder(folder);
    } else if (arg === '--sketchesDir') {
      const sketchesPath = args[++i];
      if (!sketchesPath) {
        throw new Error('--sketchesDir requires a folder name');
      }
      // Validate that sketchesDir is a simple folder name to avoid path traversal
      if (sketchesPath.includes('/') || sketchesPath.includes('\\') || sketchesPath.includes('..')) {
        throw new Error(
          '--sketchesDir must be a simple folder name without path separators or ".."'
        );
      }
      sketchesDir = sketchesPath;
    } else if (arg === '--' || arg.startsWith('--')) {
      // Skip npm's separator or unknown flags
      continue;
    } else if (outputDirProvided) {
      throw new Error(
        'Choose only one output folder: use a positional folder or --outputDir, not both. \nExample: `create-genuary my-project` OR `create-genuary --outputDir my-project`.'
      );
    } else if (!folder) {
      // First positional argument is the folder name
      folder = arg;
      validateOutputFolder(folder);
    }
  }

  // Validate mutually exclusive options
  if (sourceDir && templateRepo) {
    throw new Error(
      'Cannot use --sourceDir and --templateRepo together.\n' +
      'Please use either --sourceDir for a local template or --templateRepo for a remote repository.'
    );
  }

  return {
    folder,
    year,
    p5Version,
    yearProvided,
    templateRepo,
    sourceDir,
    sketchesDir,
    usedDeprecatedSource,
    usedDeprecatedGit,
    createP5Options
  };
}

export function validateOutputFolder(folderName, cwd = process.cwd()) {
  if (!folderName) {
    return;
  }

  const normalized = normalize(folderName);
  if (isAbsolute(normalized)) {
    throw new Error(
      'Invalid output folder: must be a relative path within the current working directory.'
    );
  }

  const segments = normalized.split(sep);
  if (segments.includes('..')) {
    throw new Error(
      'Invalid output folder: must not contain ".." path segments.'
    );
  }

  const resolvedPath = resolve(cwd, normalized);
  const relativePath = relative(cwd, resolvedPath);
  const relativeSegments = relativePath.split(sep);
  if (relativeSegments.includes('..')) {
    throw new Error(
      'Invalid output folder: must be within the current working directory.'
    );
  }
}

export async function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);

  if (major < 18) {
    throw new Error(
      `Node.js version ${version} is not supported.\n` +
      `create-genuary requires Node.js 18 or higher for native fetch support.\n` +
      `Please upgrade Node.js and try again.`
    );
  }
}

export async function checkFolderExists(folderPath) {
  try {
    await access(folderPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  try {
    // Check Node.js version
    await checkNodeVersion();

    // Parse arguments
    const {
      folder,
      year,
      p5Version,
      yearProvided,
      templateRepo,
      sourceDir,
      sketchesDir,
      usedDeprecatedSource,
      usedDeprecatedGit,
      createP5Options
    } = parseArguments();

    // Display header
    console.log();
    log('╔═══════════════════════════════════════╗', logColors.info);
    log('║       Create Genuary Project          ║', logColors.info);
    log('╚═══════════════════════════════════════╝', logColors.info);
    console.log();

    if (usedDeprecatedSource || usedDeprecatedGit) {
      if (usedDeprecatedSource) {
        warn(
          'Deprecated flag detected: --source ' +
          '(will be replaced by --sourceDir in future releases).'
        );
      }
      if (usedDeprecatedGit) {
        warn(
          'Deprecated flag detected: --git ' +
          '(will be replaced by --templateRepo in future releases).'
        );
      }
      console.log();
    }

    log('Fetching prompts from genuary.art...', logColors.log);
    const { prompts, year: promptsYear } = yearProvided ? await fetchPrompts(year) : await fetchPrompts();
    const projectYear = yearProvided ? year : promptsYear;
    const folderName = folder || `genuary-${projectYear}`;
    const projectPath = resolve(process.cwd(), folderName);

    success(`Fetched ${prompts.length} prompts from genuary.art`);
    console.log();

    info(`Creating Genuary ${projectYear} project in: ${folderName}/`);
    info(`p5.js version: ${p5Version}`);
    if (templateRepo) {
      info(`Template source: ${templateRepo}`);
    }
    if (sourceDir) {
      info(`Template source: ${sourceDir}`);
    }
    if (sketchesDir !== 'sketches') {
      info(`Sketches folder: ${sketchesDir}`);
    }

    if (templateRepo && createP5Options.length > 0) {
      console.log();
      warn(
        'Using --templateRepo clones a template from a repository. \n' +
        '  The following arguments will be ignored: ' +
        createP5Options.join(', ')
      );
    }

    if (sourceDir && createP5Options.length > 0) {
      console.log();
      warn(
        'Using --sourceDir uses a local template folder. \n' +
        '  The following arguments will be ignored: ' +
        createP5Options.join(', ')
      );
    }
    console.log();

    // Check if folder already exists
    if (await checkFolderExists(projectPath)) {
      throw new Error(
        `Folder "${folderName}" already exists.\n` +
        `Please choose a different folder name or remove the existing folder.`
      );
    }

    // Scaffold project
    log('Creating project structure...', logColors.log);

    await scaffoldProject(
      projectPath,
      folderName,
      projectYear,
      prompts,
      p5Version,
      templateRepo,
      sourceDir,
      sketchesDir,
      (sketchName, index, total) => {
        log(`  [${index}/${total}] ${sketchName}`, logColors.log);
      }
    );

    console.log();
    success('Project created successfully!');
    console.log();

    // Display next steps
    log('Next steps:', logColors.log);
    console.log();
    log('Start a local server:', logColors.log);
    console.log();
    log(`  cd ${folderName}`, logColors.log);
    log(`  npm run serve`, logColors.log);
    console.log();
    log('Happy coding! 🎨', logColors.success);
    console.log();
    if (usedDeprecatedSource || usedDeprecatedGit) {
      if (usedDeprecatedSource) {
        warn('  The --source flag is deprecated. Use --sourceDir instead.');
      }
      if (usedDeprecatedGit) {
        warn('  The --git flag is deprecated. Use --templateRepo instead.');
      }
      console.log();
    }

  } catch (err) {
    console.log();
    error(err.message);
    console.log();
    process.exit(1);
  }
}

// Only run main() when this file is executed directly, not when imported
const isExecutedDirectly = process.argv[1]
  ? fileURLToPath(import.meta.url) === resolve(process.argv[1])
  : true; // If argv[1] is undefined, assume direct execution (npm create scenario)

if (isExecutedDirectly) {
  main();
}
