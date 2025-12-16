#!/usr/bin/env node

/**
 * create-genuary CLI
 * Scaffold a complete Genuary project with all daily p5.js sketches
 */

import { resolve } from 'path';
import { access } from 'fs/promises';
import { fetchPrompts } from './src/prompts.js';
import { scaffoldProject } from './src/scaffold.js';
import { colors, log, success, info, error } from './src/utils.js';

function parseArguments() {
  const args = process.argv.slice(2);

  let folder = null;
  let year = new Date().getFullYear();
  let p5Version = 'latest';
  let yearProvided = false;

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
    } else if (arg === '--' || arg.startsWith('--')) {
      // Skip npm's separator or unknown flags
      continue;
    } else if (!folder) {
      // First positional argument is the folder name
      folder = arg;
    }
  }

  return { folder, year, p5Version, yearProvided };
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
    const { folder, year, p5Version, yearProvided } = parseArguments();

    // Display header
    console.log();
    log('╔═══════════════════════════════════════╗', colors.blue);
    log('║       Create Genuary Project          ║', colors.blue);
    log('╚═══════════════════════════════════════╝', colors.blue);
    console.log();

    log('Fetching prompts from genuary.art...', colors.gray);
    const { prompts, year: promptsYear } = yearProvided ? await fetchPrompts(year) : await fetchPrompts();
    const projectYear = yearProvided ? year : promptsYear;
    const folderName = folder || `genuary-${projectYear}`;
    const projectPath = resolve(process.cwd(), folderName);

    success(`Fetched ${prompts.length} prompts from genuary.art`);
    console.log();

    info(`Creating Genuary ${projectYear} project in: ${folderName}/`);
    info(`p5.js version: ${p5Version}`);
    console.log();

    // Check if folder already exists
    if (await checkFolderExists(projectPath)) {
      throw new Error(
        `Folder "${folderName}" already exists.\n` +
        `Please choose a different folder name or remove the existing folder.`
      );
    }

    // Scaffold project
    log('Creating project structure...', colors.gray);

    let currentSketch = 0;
    const totalSketches = prompts.length;

    await scaffoldProject(
      projectPath,
      folderName,
      projectYear,
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
    log(`  cd ${folderName}`, colors.gray);
    log(`  open index.html`, colors.gray);
    console.log();
    log('Or start a local server:', colors.blue);
    console.log();
    log(`  cd ${folderName}`, colors.gray);
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
