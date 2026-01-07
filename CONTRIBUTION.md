# Contributing

Thanks for contributing! This project is a CLI that scaffolds a MERN starter.
Use the guidelines below to set up locally, make changes, and keep things
consistent.

## Getting started (local setup)

Prerequisites:

- Node.js (LTS recommended)
- pnpm (`corepack enable` if needed)

Steps:

1. Install dependencies:
   - `pnpm install`
2. Run the CLI in dev mode:
   - `pnpm dev`
3. Build the published bundle:
   - `pnpm build`
   - `node dist/cli.js`

## Project structure

CLI source:

```
src/
  cli.ts               # entry point
  run.ts               # execution flow
  generators/
    createProject.ts      # template generation
```

Templates:

```
templates/
  base/
    client/            # Vite + React
    server/            # Express + TypeScript
  features/            # composable feature additions (files + patches)
```

Build output:

```
dist/                  # bundled CLI output (ESM)
```

## Contributing workflow

1. Create a new branch for your change.
2. Make focused edits that match existing style and structure.
3. Ensure the CLI still runs and the templates generate as expected.
4. Open a PR with a clear summary and testing notes.

## Coding style

- TypeScript + ESM (`"type": "module"`).
- 2-space indentation in TS and JSON.
- File naming: lowerCamel for functions/vars, PascalCase for React components,
  kebab-case for paths.
- Avoid `any` unless there is a clear justification.
- Keep changes consistent with nearby code (no formatter is configured).

## Testing

There is no automated test runner configured yet. If you add tests, please:

- Document the runner in this file.
- Add a `pnpm test` script.
- Name tests after the feature or module under test.

## Commit and PR guidelines

- Preferred commit format: `type: summary`
  (e.g., `fix: handle empty prompt`, `chore: update templates`).
- PRs should include:
  - Summary of the change.
  - Testing notes (or "not tested").
  - Screenshots for template UI changes.

## Notes for template changes

- Keep `templates/` minimal and avoid secrets in `.env` samples.
- Do not commit generated projects or user-specific paths.
- If you change the scaffolded output, verify it still boots for both client
  and server.
