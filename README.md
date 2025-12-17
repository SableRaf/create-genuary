# create-genuary

A standalone npm package that scaffolds a complete Genuary folder with all daily prompts as individual folders with starter code, ready to use!

The project uses [create-p5js](https://www.npmjs.com/package/create-p5js) under the hood to generate each daily sketch. 

Alternatively, you can provide a custom template repository to use your own starter code for each sketch.

It also generates an interactive gallery to showcase all your sketches with the corresponding prompts.

## About Genuary

Genuary is a month-long creative coding challenge that happens every January since 2021. Each day has a unique prompt to inspire generative art and creative coding experiments.

Learn more at [genuary.art](https://genuary.art)

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

# Use a local folder as template for each sketch
npm create genuary -- --source ./path/to/local/template-folder

# Use a custom template repository from GitHub
npm create genuary -- --git user/repository-name

# Use a custom template repository from GitLab
npm create genuary -- --git gitlab:user/repository-name

# Use a custom template repository from Bitbucket
npm create genuary -- --git bitbucket:user/repository-name
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

### `--source` (optional)
Path to a local folder to use as a template for each sketch instead of running `create-p5js`.
- Examples: `--source ./my-p5-template`, `--source ../shared/p5-starter`
- When provided, any options meant for `create-p5js` (like `--p5-version`) are ignored and a warning will be shown.
- `--source` is not compatible with `--git` and an error will be shown if both are provided.

### `--git` (optional)
Clone a custom template repository (via `degit`) instead of running `create-p5js`.
- Examples: `--git user/genuary-template`, `--git user/genuary-template#branch`
- When provided, any options meant for `create-p5js` (like `--p5-version`) are ignored and a warning will be shown.
- `--git` is not compatible with `--source` and an error will be shown if both are provided.


## Generated Project Structure

```
genuary-2025/
├── sketches/
│   ├── 01_particles/           # p5.js sketch
│   ├── 02_no_palettes/         # p5.js sketch
│   ├── 03_droste_effect/       # p5.js sketch
│   └── ...                     # (31 total sketches)
├── index.html                  # Gallery view of all sketches
├── config.json                 # Project configuration (title, artist name, etc.)
├── prompts.json                # Cached prompts used by the gallery
├── README.md                   # Project documentation with prompt list
├── package.json                # Basic package manifest (includes server script)
└── .gitignore                  # Standard ignores
```

## Interactive Gallery

The generated project includes an `index.html` file that serves as an interactive gallery to navigate and showcase all daily sketches. Each sketch is linked with its corresponding Genuary prompt for easy reference.

### Configuration

The generated folder includes a `config.json` file in the project root. Edit this file to set your name, override the gallery title, or tweak other presentation settings without touching `index.html`. The gallery also ships with a `prompts.json` file so the HTML bundle stays light and can be updated independently of the UI. Browsers block loading JSON when a page is opened straight from the filesystem, so make sure to start a local server (e.g. `npm run serve`) to see changes coming from `config.json` or `prompts.json`.

## Requirements

- Node.js 18 or higher (for native fetch support)
- Internet connection (for fetching prompts and running create-p5js)

## License

MIT
