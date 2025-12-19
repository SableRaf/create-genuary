# GitHub Copilot Code Review Instructions

## Review Philosophy
- Only comment when you have HIGH CONFIDENCE (>80%) that an issue exists
- Be concise: one sentence per comment when possible
- Focus on actionable feedback, not observations
- When reviewing text, only comment on clarity issues if the text is genuinely confusing or could lead to errors

## Priority Areas (Review These)

### Security & Safety
- Path traversal or overwriting outside the target output directory during scaffold/template flows
- Unsafe handling of remote template sources (degit), fetched prompts, or user-supplied paths/flags
- Command injection via unsanitized paths passed to shell or file operations
- Credential leakage in logs or outputs (no tokens or user data)

### Correctness Issues
- Logic errors in scaffold workflows (missing files, wrong folder names, broken gallery output)
- Failure to handle prompt JSON fetch errors or malformed data
- Async/promise misuse (missing awaits, unhandled rejections) in file/network operations
- Boundary conditions for CLI flags (`--outputDir`, `--year`, `--p5-version`, `--sourceDir`, `--templateRepo`, `--sketchesDir`)
- Unexpected behavior when combining flags (e.g., `--sourceDir` with `--templateRepo`)

### Architecture & Patterns
- Mixing concerns: keep core scaffold logic in `src/`, CLI entry in `index.js`, helpers in `src/utils/`
- Bypassing shared utilities with ad-hoc path handling or prompt parsing
- Tight coupling between CLI layer and core logic (keep API boundary clear for programmatic use)

## Project-Specific Context
- CLI tool to scaffold a Genuary project with daily p5.js sketches
- Node 18+ ESM entry point in `index.js`
- Core logic lives in `src/` with helpers in `src/utils/`
- Fetches prompts from `https://genuary.art/<year>/prompts.json`
- Output structure includes `index.html`, `config.json`, `prompts.json`, `README.md`, and a sketches folder

### Non-Negotiable Requirements
- **Safety-First**: Never relax path validation or allow writes outside the target directory
- **Template Rules**: `--sourceDir` and `--templateRepo` are mutually exclusive
- **Gallery Integrity**: Always generate a working `index.html` linked to all sketches
- **Testing Mindset**: Vitest tests in `test/` should accompany new logic if tests exist

## CI Pipeline Context

**Important**: You review PRs immediately, before CI completes. Do not flag issues that CI will catch.

### What Our CI Would Check
- `npm test` (Vitest)
- `npm run test:watch` for local iteration
- `npm ci` installs dependencies (root only)

## Skip These (Low Value)
- Style/formatting issues (CI handles this)
- Linting warnings (CI handles this)
- Missing dependencies (CI handles this)
- Minor naming suggestions unless truly confusing
- Suggestions to add comments for self-documenting code
- Refactoring suggestions unless there's a clear bug or maintainability issue
- Multiple issues in one comment (choose the single most critical issue)
- Logging suggestions unless for errors or security events

## Response Format

When you identify an issue:
1. State the problem (1 sentence)
2. Why it matters (1 sentence, only if not obvious)
3. Suggested fix (code snippet or specific action)

Example:
```
This can write outside the output directory when `--outputDir` contains `..`. Reject non-normalized paths and resolve against the target root before writing.
```

## When to Stay Silent

If you're uncertain whether something is an issue, don't comment.
