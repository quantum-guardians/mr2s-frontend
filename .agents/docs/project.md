# Project Context

Fill this document during project initialization. Agents must verify commands against repository configuration before running them.

## Overview

- Product: MR2S web front end — enter or generate a graph, send it to the MR2S
  backend, and visualize the resulting edge orientation and score.
- Repository: https://github.com/quantum-guardians/mr2s-frontend
- Primary users: demo and benchmark audiences for the MR2S solvers.
- Core domain: graph input, planar layout (2D / 2.5D / 3D), solver benchmarking,
  result presentation.
- Runtime environment: browser. Vite 7 + React 19 + TypeScript 5.9, deployed on
  Vercel. The package is still named `qa2` in `package.json`.

## Architecture

- Entry points: `index.html` → `src/main.tsx` → `src/App.tsx`.
- Main modules: `src/components/` (`GraphInput`, `GraphVisualization`,
  `Graph3DVisualization`, `BenchmarkPanel`, `ResultPanel`, `SimulationPage`,
  `DebugPanel`, `CircleNode`), `src/utils/` (`planarGraph`, `planarLayout`,
  `planarLayout2_5D`, `planarLayout3D`, `validation`), `src/api.ts`,
  `src/types.ts`, `src/i18n/` (ko, en, ja).
- Dependency direction: components call `src/api.ts` and `src/utils/`; utils are
  pure and framework-free, which is what makes them testable.
- External systems: the MR2S backend at `https://quantum.yunseong.dev`. In dev
  the Vite proxy forwards `/api`; in production the `vercel.json` rewrite does.
- Persistent data: none. All state is in-memory.

## Commands

| Purpose | Command |
|---|---|
| Install dependencies | `npm install` |
| Run locally | `npm run dev` |
| Format | TODO — none configured |
| Lint | TODO — none configured |
| Type-check | `npx tsc --noEmit` |
| Unit tests | `npx vitest run` — `vitest` is installed but no `test` script is defined |
| Integration tests | TODO — none |
| Build | `npm run build` (`tsc && vite build`) |

## Constraints

- Supported platforms: modern browsers; WebGL is required by the 3D and 2.5D
  views (`three`, `@react-three/fiber`, `@react-three/drei`).
- Compatibility requirements: the backend allows CORS only from its deployed
  origins, so browser requests must go through the `/api` proxy or rewrite —
  never call `https://quantum.yunseong.dev` directly from the app.
- Performance constraints: layout and rendering cost grows with node count;
  benchmark runs call the backend repeatedly and can be slow.
- Security or privacy requirements: no credentials in the client.

## Ownership

- Maintainers: Yunseong <me@yunseong.dev>
- Sensitive modules: `src/api.ts`, `vite.config.ts`, `vercel.json`
- Changes requiring explicit review: backend contract changes, proxy or rewrite
  configuration, layout algorithms in `src/utils/`.
