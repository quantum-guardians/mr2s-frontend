# Project Agent Instructions

## Scope and Precedence

This file is the repository-level entrypoint for coding agents.

Read `.agents/docs/project.md` before non-trivial work. Repository-specific
commands, constraints, and narrower instructions take precedence over these
template defaults.

## Project Workflow

For non-trivial work, follow:

- `.agents/docs/workflow.md`
- `.agents/docs/testing.md`

For tracked Git work, follow:

- `.agents/docs/issue.md`
- `.agents/docs/branch.md`
- `.agents/docs/commit.md`
- `.agents/docs/pull-request.md`

For published releases, follow:

- `.agents/docs/release.md`

Use project-local skills when installed and applicable. Skill instructions
define their own triggers, formats, and output paths.

## Project Structure & Module Organization

`index.html` boots `src/main.tsx`, which mounts `src/App.tsx`. UI lives in
`src/components/`: `GraphInput.tsx` for edge entry, `GraphVisualization.tsx`
and `Graph3DVisualization.tsx` for the 2D and 3D views, `BenchmarkPanel.tsx`
for solver comparison, `ResultPanel.tsx` for scores, `SimulationPage.tsx` for
the simulation tab. Pure logic lives in `src/utils/` — `planarGraph.ts`,
`planarLayout.ts`, `planarLayout2_5D.ts`, `planarLayout3D.ts`, `validation.ts` —
and is the part covered by tests. Backend calls go through `src/api.ts`, shared
types through `src/types.ts`, and translations through `src/i18n/locales/`
(`ko`, `en`, `ja`; Korean is the default). Keep new algorithms in `src/utils/`
as framework-free functions rather than inside components.

## Backend Integration

`src/api.ts` targets the v2 solver catalog: `/api/v2/solvers/qubo`,
`/api/v2/solvers/raw-sa`, and `/api/v2/solvers/robin`. It uses relative paths on
purpose — the backend's CORS allowlist has no localhost entry, so requests must
travel through the `/api` proxy in `vite.config.ts` during development and the
`/api/(.*)` rewrite in `vercel.json` in production. Do not hardcode
`https://quantum.yunseong.dev` into the client. `408` responses surface as
`ApiTimeoutError`; keep that path intact, since large graphs do time out.

## Build, Test, and Development Commands

Install with `npm install`. Run the dev server with `npm run dev`, build with
`npm run build` (`tsc && vite build`), and preview the build with
`npm run preview`. There is no `test` script yet even though `vitest` is a dev
dependency — run the suite with `npx vitest run`, and add the script when you
next touch `package.json`. Type-check separately with `npx tsc --noEmit`.

## Coding Style & Naming Conventions

TypeScript with `strict`, `noUnusedLocals`, and `noUnusedParameters` enabled —
build failures from unused bindings are intentional, so remove rather than
suppress. Components are `PascalCase.tsx` with a default or named export
matching the file; utilities are `camelCase.ts`. Imports of local modules carry
the explicit `.ts` / `.tsx` extension, as `allowImportingTsExtensions` is on;
match that. No formatter or linter is configured, so keep to the surrounding
2-space, double-quote style. Every user-facing string goes through `i18n` with
entries added to all three locale files.

## Testing Guidelines

Tests are colocated with the module under test as `<module>.test.ts` in
`src/utils/`, run by `vitest`. Cover layout and graph logic with deterministic
inputs — no random seeds inside assertions. When changing a layout algorithm,
extend the matching `planarLayout*.test.ts` rather than adding a parallel file,
and state in the pull request which views you verified visually, since the
rendering itself is untested.

## Commit & Pull Request Guidelines

History uses short imperative subjects, usually with a Conventional Commit
prefix such as `feat:` or `fix:`, occasionally in Korean. Branch names follow
`<tag>/<issue num>`, for example `feature/2` or `feat/10`. Pull requests should
describe the user-visible change, link the issue, note any backend contract it
depends on, and include a screenshot when the visualization changes.
