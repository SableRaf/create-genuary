export { colors, log, success, info, error };

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