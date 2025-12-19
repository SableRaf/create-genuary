# Color Configuration

This document explains how colors are managed in the create-genuary CLI using minimal ANSI escape codes.

## Overview

All color management is centralized in [`src/utils.js`](src/utils.js) through the `logColors` configuration object. The project uses a minimal custom ANSI color implementation with no external dependencies.

## Configuration

### Log Color Configuration

The `logColors` object in [`src/utils.js`](src/utils.js) controls which colors are used for different message types:

```javascript
const ANSI = {
  reset: '\x1b[0m',
  white: '\x1b[37m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

const createColor = (code) => (text) => `${code}${text}${ANSI.reset}`;

const logColors = {
  flag: createColor(ANSI.white),        // Color for CLI flags (--flag-name)
  success: createColor(ANSI.green),     // Color for success messages
  info: createColor(ANSI.blue),         // Color for info messages
  warn: createColor(ANSI.yellow),       // Color for warning messages
  error: createColor(ANSI.red),         // Color for error messages
  log: createColor(ANSI.gray)           // Color for general log messages (gray)
};
```

### Available ANSI Colors

Standard ANSI color codes available:
- `\x1b[30m` - black
- `\x1b[31m` - red
- `\x1b[32m` - green
- `\x1b[33m` - yellow
- `\x1b[34m` - blue
- `\x1b[35m` - magenta
- `\x1b[36m` - cyan
- `\x1b[37m` - white
- `\x1b[90m` - gray (bright black)
- `\x1b[91m` - bright red
- `\x1b[92m` - bright green
- `\x1b[93m` - bright yellow
- `\x1b[94m` - bright blue
- `\x1b[95m` - bright magenta
- `\x1b[96m` - bright cyan
- `\x1b[97m` - bright white

You can also use background colors (`\x1b[40m` through `\x1b[47m`) and text styles like bold (`\x1b[1m`), underline (`\x1b[4m`), etc.

## Usage

### Logging Functions

The following helper functions automatically use the configured colors:

- `success(message)` - Green checkmark with message
- `info(message)` - Blue informational message
- `warn(message)` - Yellow warning icon with message
- `error(message)` - Red X with message
- `log(message, colorFn)` - Generic log with optional color function

All logging functions automatically colorize CLI flags (e.g., `--source`, `--year`) using the `logColors.flag` color.

### Simple Usage

Just write plain error/warning messages - flags are automatically colored:

```javascript
import { error, warn, info, success } from './src/utils.js';

// Flags are automatically highlighted in blue
error('The --source flag requires a value');
warn('Deprecated flag detected: --git');
info('Using --templateRepo to clone from GitHub');
success('All --p5-version arguments processed');
```

### Using the log() Function

For custom colored output, use `log()` with a color function:

```javascript
import { log, logColors } from './src/utils.js';

// Log with gray text
log('Creating project structure...', logColors.log);

// Log with blue text
log('╔═══════════════════════╗', logColors.info);

// Log with green text
log('Happy coding!', logColors.success);
```

## Customizing Colors

To change the colors used throughout the application, simply modify the ANSI codes or `logColors` object in [`src/utils.js`](src/utils.js):

```javascript
const ANSI = {
  reset: '\x1b[0m',
  magenta: '\x1b[35m',
  brightGreen: '\x1b[92m',
  cyan: '\x1b[36m',
  brightYellow: '\x1b[93m',
  brightRed: '\x1b[91m',
  gray: '\x1b[90m'
};

const logColors = {
  flag: createColor(ANSI.magenta),         // Make all flags magenta instead of white
  success: createColor(ANSI.brightGreen),  // Use bright green for success
  info: createColor(ANSI.cyan),            // Use cyan for info messages
  warn: createColor(ANSI.brightYellow),    // Use bright yellow for warnings
  error: createColor(ANSI.brightRed),      // Use bright red for errors
  log: createColor(ANSI.gray)              // Keep gray for general logs
};
```

All CLI flags and log messages will automatically use the new colors without needing to change any other code.

## Examples

### Automatic Flag Colorization

```javascript
// Simple, clean syntax - no manual flag formatting needed
error('The --source flag requires a value');
// Output: ✗ The --source flag requires a value
//         (--source will be blue, rest will be red)

warn('Deprecated flag detected: --git. Use --templateRepo instead.');
// Output: ⚠ Deprecated flag detected: --git. Use --templateRepo instead.
//         (Both --git and --templateRepo will be blue, rest will be yellow)

info('Using --sourceDir for local template folder');
// Output: Using --sourceDir for local template folder
//         (--sourceDir will be blue, rest will be blue)
```

### Custom Color Combinations

```javascript
import { log } from './src/utils.js';

// Create custom color functions
const bold = (text) => `\x1b[1m${text}\x1b[0m`;
const underline = (text) => `\x1b[4m${text}\x1b[0m`;
const boldRed = (text) => `\x1b[1m\x1b[31m${text}\x1b[0m`;

// Use them
log('Critical warning!', boldRed);
log('Important note', underline);
```

## Why Minimal ANSI Colors?

This minimal implementation provides:
- **Zero dependencies**: No external packages needed
- **Small footprint**: Only the colors we actually use
- **Simple and maintainable**: Easy to understand and modify
- **Cross-platform**: ANSI codes work on all modern terminals
- **Automatic color resets**: Built into the color functions
