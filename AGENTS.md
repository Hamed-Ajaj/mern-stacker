# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the CLI source: `src/cli.ts` (entry point), `src/run.ts` (execution flow), and `src/generators/createBase.ts` (template generation).
- `templates/` holds scaffolding assets: `templates/base/js|ts/client/` (Vite + React) and `templates/base/js|ts/server/` (Express), plus `templates/features/` for optional patches/files (DBs, routers, auth, UI).
- Authentication features are split by provider and DB (e.g., `auth-jwt-*`, `auth-better-*`) to keep base DB templates auth-agnostic.
- `dist/` is the built CLI output (ESM) produced by `tsup`.

## Build, Test, and Development Commands
- `pnpm dev`: run the CLI directly with `ts-node` for local development.
- `pnpm build`: bundle `src/cli.ts` into `dist/` for publishing or local linking.
- Better Auth templates switch the server to ESM and use `tsx` for `server` dev scripts.

## Coding Style & Naming Conventions
- TypeScript, ESM modules (`"type": "module"`). Use strict typing and avoid `any` unless justified.
- Indentation: 2 spaces in JSON and TS (match existing files).
- File naming: lowerCamel for functions/vars, PascalCase for React components in templates, kebab-case for paths.
- No formatter or linter is configured; keep changes consistent with nearby code.

## Testing Guidelines
- No automated test framework is set up in this repo.
- If adding tests, document the runner and add a `pnpm test` script.
- Name tests after the feature or module under test (e.g., `cli.create-base.test.ts`).

## Commit & Pull Request Guidelines
- Recent commit history uses short, imperative messages; some follow Conventional Commits (e.g., `chore:`).
- Preferred format: `type: summary` (e.g., `fix: handle empty prompt`, `chore: update templates`).
- PRs should include a clear summary, testing notes (or “not tested”), and screenshots for template UI changes.

## Security & Configuration Tips
- Do not commit generated projects or user-specific paths.
- Keep `templates/` minimal and avoid embedding secrets in sample `.env` files.
