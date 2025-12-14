# Product Requirements Document: create-genuary

## Overview
A standalone npm package that scaffolds a complete Genuary project with all daily sketches, ready to use.

## Product Description
`create-genuary` is a CLI tool that creates a new Genuary project folder with all 31 daily p5.js sketches pre-generated based on the official Genuary prompts. Users can run `npm create genuary` to instantly set up their Genuary workspace.

## User Stories
- As a developer, I want to quickly scaffold all 31 Genuary sketches so I can start coding immediately
- As a developer, I want a simple gallery view to see all my sketches in one place that I can easy to host if needed
- As a developer, I want to specify the year to work on past Genuary challenges
- As a developer, I want to choose a custom folder name for my project
- As a developer, I want to specify which p5.js version to use in my sketches

## Command Syntax
```bash
npm create genuary [folder] [options]

# Examples:
npm create genuary                          # Creates genuary-2025/ with latest p5.js
npm create genuary my-genuary               # Creates my-genuary/ folder
npm create genuary -- --year 2024           # Creates genuary-2024/ with 2024 prompts
npm create genuary my-2024 -- --year 2024   # Custom name, 2024 prompts
npm create genuary -- --p5-version 1.11.1   # Use specific p5.js version
```

## Parameters

### Positional Arguments
1. **folder** (optional)
   - Type: String
   - Default: `genuary-<year>`
   - Description: Target folder name for the project
   - Examples: `my-genuary`, `genuary-2025`, `art-challenge`

### Options
1. **--year** (optional)
   - Type: Number
   - Default: Current year (2025)
   - Description: Genuary year to use for prompts
   - Fetches from: `https://genuary.art/<year>/prompts.json`
   - Examples: `--year 2024`, `--year 2025`

2. **--p5-version** (optional)
   - Type: String
   - Default: `latest`
   - Description: p5.js version to use in all sketches
   - Passed to: `npm create p5js@<version>`
   - Examples: `--p5-version 1.11.1`, `--p5-version latest`

## Generated Project Structure
```
genuary-2025/
├── sketches/
│   ├── 01_particles/           # p5.js sketch (via create-p5js)
│   ├── 02_no_palettes/         # p5.js sketch (via create-p5js)
│   ├── 03_droste_effect/       # p5.js sketch (via create-p5js)
│   └── ...                     # (31 total sketches)
├── index.html                  # Gallery view of all sketches
├── README.md                   # Project documentation with prompt list
├── package.json                # Basic package manifest
└── .gitignore                  # Standard ignores
```

## Core Features

### 1. Sketch Generation
- **Source**: Fetch prompts from `https://genuary.art/<year>/prompts.json`
- **Expected format**: JSON with `genuaryPrompts` array
- **Naming convention**: `{day}_{shorthand}` (e.g., `01_particles`)
  - Day: 2-digit padded (01-31)
  - Shorthand: Sanitized from prompt.shorthand || prompt.name || prompt.date
  - Sanitization: lowercase, alphanumeric + underscores only
- **Generation**: Use `npm create p5js@<version> <sketch-name> -- --yes`
  - Skip if sketch folder already exists
  - Run sequentially (not parallel)
  - Inherit stdio for progress visibility

### 2. Gallery View (index.html)
**Requirements**:
- Minimal static HTML file (no build process needed)
- Displays all 31 sketches with a header showing the day and prompt + arrows to navigate and a dropdown to jump to any day
- Sketches are shown in an iframe
- Make sure only one sketch loads at a time to save resources (lazy load on demand)
- Shows sketch name and prompt description
- Simple, clean design
- No dependencies beyond the generated sketches

**Layout**:
- Header with project title, author name, and navigation
- Main content area with iframe for sketch display

### 3. README.md
**Contents**:
- Project title: "Genuary <year>"
- Placeholder for author name
- Brief description of Genuary
- Link to the official Genuary website
- Getting started instructions:
  - How to run individual sketches
  - How to view the gallery (open index.html)

### 4. package.json (for generated project)
```json
{
  "name": "genuary-<year>",
  "version": "1.0.0",
  "private": true,
  "description": "Genuary <year> sketches",
  "scripts": {
    "serve": "npx http-server -p 8080"
  }
}
```

### 5. .gitignore (for generated project)
```
node_modules/
.DS_Store
*.log
```

## Package Configuration (create-genuary itself)

### package.json
```json
{
  "name": "create-genuary",
  "version": "1.0.0",
  "description": "Scaffold a Genuary project with all daily p5.js sketches",
  "type": "module",
  "bin": {
    "create-genuary": "./index.js"
  },
  "engines": {
    "node": ">=18"
  },
  "keywords": [
    "genuary",
    "p5js",
    "creative-coding",
    "generative-art",
    "scaffold"
  ],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/create-genuary"
  }
}
```

### Files
```
create-genuary/
├── index.js              # Main CLI entry point
├── lib/
│   ├── prompts.js        # Fetch and parse prompts
│   ├── scaffold.js       # Generate project files
│   └── templates/
│       ├── index.html    # Gallery template
│       ├── README.md.template
│       └── gitignore.template
├── package.json
├── README.md            # Usage documentation
├── LICENSE
└── .gitignore
```

## Implementation Details

### CLI Argument Parsing
- Use native Node.js argument parsing (no dependencies)
- Parse positional folder name from `process.argv[2]`
- Parse flags: `--year`, `--p5-version`
- Validate inputs:
  - Year must be 4-digit number
  - Folder must not exist (prevent overwrites)
  - p5-version format validation (semantic version or "latest")

### Prompt Fetching
- Use native `fetch()` (Node 18+)
- Handle errors gracefully:
  - Network failures → Clear error message
  - Invalid JSON → Parse error with details
  - Validate json schema: 
    - Validate array length (31 prompts expected)
    - Validate each prompt object structure
    - Validate no duplicate days or missing days
    - Validate no duplicate shorthands
  - Missing `genuaryPrompts` key → Schema validation error
  - Year not available → Suggest available years

### Sketch Naming
```javascript
function sanitize(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'sketch';
}

function sketchName(index, prompt) {
    const day = String(index + 1).padStart(2, '0');
    const shorthand = prompt.shorthand || prompt.name || prompt.date || `day-${day}`;
    return `${day}_${sanitize(shorthand)}`;
}
```

### Gallery Template Variables
The `index.html` template will use simple string replacement:
- `{{YEAR}}` → Year (e.g., "2025")
- `{{SKETCHES_JSON}}` → JSON array of sketch data for rendering

Example sketches data structure:
```javascript
[
  {
  "genuaryPrompts": [
    {
      "name": "Genuary 1st",
      "date": "2024-01-01",
      "description": "Particles, lots of them.",
      "shorthand": "particles",
      "credit": ["Melissa Wiederrecht","Nicolas Barradeau"],
      "creditUrl": ["https://twitter.com/mwiederrecht/","https://twitter.com/nicoptere"]
    },
    {
      "name": "Genuary 2nd",
      "date": "2024-01-02",
      "description": "No palettes.",
      "shorthand": "no_palettes",
      "credit": ["Luis Fraguada"],
      "creditUrl": ["https://twitter.com/luisfraguada"]
    },    
  // ... 
]
```

### Error Handling
- Check Node version (>=18 required for fetch)
- Check folder doesn't exist before creating
- Validate prompts.json schema
- Handle npm create p5js failures gracefully
- Show clear error messages with actionable advice

### Progress Indication
```
Creating Genuary 2025 project in: genuary-2025/
✓ Fetched 31 prompts from genuary.art
✓ Created project structure
Creating sketches (this may take a moment)...
  ✓ 01_particles
  ✓ 02_no_palettes
  ... (show progress for all 31)
✓ Generated gallery view
✓ Created README

Done! Your Genuary 2025 project is ready.

Next steps:
  cd genuary-2025
  Open index.html in your browser to view the gallery
  Start coding in sketches/01_particles/
```

## Success Criteria
1. ✅ User can run `npm create genuary` and get a working project in < 5 minutes
2. ✅ All 31 sketches are generated without errors
3. ✅ Gallery view displays all sketches correctly
4. ✅ README contains accurate prompt information
5. ✅ Works on macOS, Linux, and Windows
6. ✅ No breaking changes when new Genuary years are added

## Non-Goals
- ❌ Not modifying generated sketch code (use create-p5js as-is)
- ❌ Not providing a dev server (user can use any static server)
- ❌ Not supporting custom prompt files (only genuary.art official prompts)
- ❌ Not supporting interactive prompts during scaffolding
- ❌ Not providing sketch templates or boilerplate code

## Future Enhancements (Post-MVP)
- Support for `--skip` flag to generate specific days only
- Export gallery as static site
- Dark mode toggle for gallery
- Support for other creative coding frameworks (Processing, hydra, three.js, etc.)

## Technical Constraints
- **Node.js**: >=18 (for native fetch support)
- **Dependencies**: Zero runtime dependencies (use only Node.js built-ins)
- **File size**: Keep package small for fast npx execution
- **Network**: Requires internet for fetching prompts and running create-p5js

## Publishing Checklist
- [ ] Choose appropriate license (MIT recommended)
- [ ] Add comprehensive README with examples
- [ ] Test on all major platforms (macOS, Linux, Windows)
- [ ] Set up GitHub repository
- [ ] Configure npm organization/scope (optional)
- [ ] Publish to npm registry
- [ ] Add badges (npm version, license, etc.)
- [ ] Create demo GIF/video for README