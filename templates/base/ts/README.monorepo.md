# MERN Stacker Monorepo (TypeScript)

This monorepo layout is TypeScript-only and designed for shared types, schemas, and API
contracts across the app.

## Structure

```
apps/
  web/        # React + Vite frontend
  api/        # Express backend
packages/
  shared/     # Zod schemas, types, shared utils
  config/     # Shared TS/lint config
```

## Development

This setup defaults to pnpm workspaces, but npm and bun workspaces are supported.

```bash
pnpm install
pnpm dev
```

## Shared Code

Add shared schemas and types in `packages/shared/src` and import them with:

```ts
import { sharedConstants } from "@shared/index";
```
