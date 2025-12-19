export { logColors, log, success, info, warn, error };

// Minimal ANSI color utilities
const ANSI = {
  reset: '\x1b[0m',
  white: '\x1b[37m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

// Color function factory
const createColor = (code) => (text) => `${code}${text}${ANSI.reset}`;

// Centralized color configuration for log messages
// You can customize these by changing the ANSI color codes used
const logColors = {
  flag: createColor(ANSI.white),        // Color for CLI flags (--flag-name)
  success: createColor(ANSI.green),     // Color for success messages
  info: createColor(ANSI.blue),         // Color for info messages
  warn: createColor(ANSI.yellow),       // Color for warning messages
  error: createColor(ANSI.red),         // Color for error messages
  log: createColor(ANSI.gray)           // Color for general log messages (gray)
};

/**
 * Colorizes CLI flags within a message and restores the parent color after each flag
 * @param {string} message - The message containing flags
 * @param {string} parentColorCode - The ANSI color code to restore after each flag
 * @returns {string} The message with colorized flags
 */
function colorizeFlags(message, parentColorCode) {
  return message.replace(/--[a-zA-Z0-9-]+/g, (match) =>
    `${ANSI.white}${match}${parentColorCode}`
  );
}

function log(message, colorFn = (x) => x) {
  console.log(colorFn(message));
}

function success(message) {
  console.log(`${ANSI.green}✓ ${colorizeFlags(message, ANSI.green)}${ANSI.reset}`);
}

function info(message) {
  console.log(`${ANSI.blue}${colorizeFlags(message, ANSI.blue)}${ANSI.reset}`);
}

function warn(message) {
  console.log(`${ANSI.yellow}⚠ ${colorizeFlags(message, ANSI.yellow)}${ANSI.reset}`);
}

function error(message) {
  console.log(`${ANSI.red}✗ ${colorizeFlags(message, ANSI.red)}${ANSI.reset}`);
}
