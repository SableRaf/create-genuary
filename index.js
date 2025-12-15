#!/usr/bin/env node

/**
 * create-genuary CLI
 * Scaffold a complete Genuary project with all daily p5.js sketches
 */

import { join, resolve } from 'path';
import { access } from 'fs/promises';
import { fetchPrompts } from './src/prompts.js';
import { scaffoldProject } from './src/scaffold.js';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

function log(message, color = '') {
  console.log(color + message + colors.reset);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function info(message) {
  log(message, colors.blue);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function parseArguments() {
  const args = process.argv.slice(2);

  let folder = null;
  let year = new Date().getFullYear();
  let p5Version = 'latest';

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--year') {
      const yearValue = args[++i];
      if (!yearValue) {
        throw new Error('--year requires a value');
      }
      const parsedYear = parseInt(yearValue);
      if (isNaN(parsedYear) || yearValue.length !== 4) {
        throw new Error(`Invalid year: ${yearValue}. Must be a 4-digit number.`);
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
    } else if (arg === '--' || arg.startsWith('--')) {
      // Skip npm's separator or unknown flags
      continue;
    } else if (!folder) {
      // First positional argument is the folder name
      folder = arg;
    }
  }

  // Set default folder name if not provided
  if (!folder) {
    folder = `genuary-${year}`;
  }

  return { folder, year, p5Version };
}

async function checkNodeVersion() {
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

async function checkFolderExists(folderPath) {
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
    const { folder, year, p5Version } = parseArguments();
    const projectPath = resolve(process.cwd(), folder);

    // Display header
    console.log();
    log('╔═══════════════════════════════════════╗', colors.blue);
    log('║       Create Genuary Project          ║', colors.blue);
    log('╚═══════════════════════════════════════╝', colors.blue);
    console.log();

    info(`Creating Genuary ${year} project in: ${folder}/`);
    info(`p5.js version: ${p5Version}`);
    console.log();

    // Check if folder already exists
    if (await checkFolderExists(projectPath)) {
      throw new Error(
        `Folder "${folder}" already exists.\n` +
        `Please choose a different folder name or remove the existing folder.`
      );
    }

    // Fetch prompts
    log('Fetching prompts from genuary.art...', colors.gray);
    const prompts = await fetchPrompts(year);
    success(`Fetched ${prompts.length} prompts from genuary.art`);
    console.log();

    // Scaffold project
    log('Creating project structure...', colors.gray);

    let currentSketch = 0;
    const totalSketches = prompts.length;

    await scaffoldProject(
      projectPath,
      folder,
      year,
      prompts,
      p5Version,
      (sketchName, index, total) => {
        currentSketch = index;
        log(`  [${index}/${total}] ${sketchName}`, colors.gray);
      }
    );

    console.log();
    success('Project created successfully!');
    console.log();

    // Display next steps
    log('Next steps:', colors.blue);
    console.log();
    log(`  cd ${folder}`, colors.gray);
    log(`  open index.html`, colors.gray);
    console.log();
    log('Or start a local server:', colors.blue);
    console.log();
    log(`  cd ${folder}`, colors.gray);
    log(`  npm run serve`, colors.gray);
    console.log();
    log('Happy coding! 🎨', colors.green);
    console.log();

  } catch (err) {
    console.log();
    error(err.message);
    console.log();
    process.exit(1);
  }
}

main();
