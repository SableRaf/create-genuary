# create-genuary

A standalone npm package that scaffolds a complete Genuary project with all daily sketches, ready to use.

## Quick Start

```bash
npm create genuary
```

This will create a `genuary-2025/` folder with all 31 daily p5.js sketches pre-generated based on the official Genuary prompts.

## Usage

```bash
npm create genuary [folder] [options]
```

### Examples

```bash
# Create genuary-2025/ with latest p5.js
npm create genuary

# Create my-genuary/ folder
npm create genuary my-genuary

# Create genuary-2024/ with 2024 prompts
npm create genuary -- --year 2024

# Custom name, 2024 prompts
npm create genuary my-2024 -- --year 2024

# Use specific p5.js version
npm create genuary -- --p5-version 1.11.1
```

## Options

### `folder` (optional)
The target folder name for the project.
- Default: `genuary-<year>`
- Examples: `my-genuary`, `genuary-2025`, `art-challenge`

### `--year` (optional)
Genuary year to use for prompts.
- Default: Current year (2025)
- Fetches from: `https://genuary.art/<year>/prompts.json`
- Examples: `--year 2024`, `--year 2025`

### `--p5-version` (optional)
p5.js version to use in all sketches.
- Default: `latest`
- Passed to: `npm create p5js@<version>`
- Examples: `--p5-version 1.11.1`, `--p5-version latest`

## Generated Project Structure

```
genuary-2025/
├── sketches/
│   ├── 01_particles/           # p5.js sketch
│   ├── 02_no_palettes/         # p5.js sketch
│   ├── 03_droste_effect/       # p5.js sketch
│   └── ...                     # (31 total sketches)
├── index.html                  # Gallery view of all sketches
├── README.md                   # Project documentation with prompt list
├── package.json                # Basic package manifest
└── .gitignore                  # Standard ignores
```

## Features

- **31 Pre-generated Sketches**: All daily sketches created using `create-p5js`
- **Interactive Gallery**: Beautiful gallery view to navigate and showcase all your work
- **Official Prompts**: Fetches prompts directly from genuary.art
- **Zero Config**: Works out of the box, no build process needed
- **Keyboard Navigation**: Use arrow keys to navigate between sketches
- **Direct Links**: Each sketch can be linked directly with `#dayN` URLs

## Requirements

- Node.js 18 or higher (for native fetch support)
- Internet connection (for fetching prompts and running create-p5js)

## About Genuary

Genuary is a month-long creative coding challenge that happens every January. Each day has a unique prompt to inspire generative art and creative coding experiments.

Learn more at [genuary.art](https://genuary.art)

## License

MIT
