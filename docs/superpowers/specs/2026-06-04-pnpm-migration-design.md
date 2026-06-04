# pnpm 10 Migration Design

**Date:** 2026-06-04  
**Status:** Approved  
**Scope:** Replace npm 11 with pnpm 10 across package management, CI workflows, and docs

---

## Goal

Migrate `briangann-streamgraph-panel` from npm 11 to pnpm 10. No behavior changes — same scripts, same dependency versions, same lock-file determinism. Motivation: pnpm 10 provides faster installs, stricter dep isolation, and better monorepo readiness.

---

## Files Changed

### `package.json`

Three edits:

1. `"packageManager"` field: `"npm@11.12.1"` → `"pnpm@10.34.1"`
2. `lint:fix` script: `npm run lint -- --fix` → `pnpm lint -- --fix`
3. `sign` script: `npx --yes @grafana/sign-plugin@latest` → `pnpm dlx @grafana/sign-plugin@latest`

### `.npmrc`

Add two pnpm settings below the existing `ignore-scripts=true` line:

```ini
node-linker=hoisted
public-hoist-pattern[]=*
```

`node-linker=hoisted` makes pnpm produce a flat `node_modules` layout compatible with the Grafana plugin webpack config in `.config/` (which we cannot modify). Without it, pnpm's default symlinked layout breaks webpack peer-dep resolution for `@grafana/*` packages.

`public-hoist-pattern[]=*` hoists all packages — same behavior as `shamefully-hoist=true` but the pnpm 10 canonical spelling.

`ignore-scripts=true` remains unchanged — pnpm respects this `.npmrc` key.

### Lock file

- Delete `package-lock.json`
- Run `pnpm install` locally to generate `pnpm-lock.yaml`
- Commit `pnpm-lock.yaml`

### `.github/workflows/ci.yml`

Two jobs need updating: `build` and `playwright-tests`.

For each job, before the `actions/setup-node` step, insert:

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@<sha> # v4
  with:
    version: 10
```

Then:
- `setup-node` `cache: 'npm'` → `cache: 'pnpm'`
- `npm ci` → `pnpm install --frozen-lockfile`
- `npm run sign` → `pnpm run sign`
- `npm exec playwright install chromium --with-deps` → `pnpm exec playwright install chromium --with-deps`
- `npm run e2e` → `pnpm run e2e`

SHA for `pnpm/action-setup` must be resolved at implementation time — project requires all actions pinned to full-length commit SHAs.

### `.github/workflows/coverage.yml`

Two `Setup Node` + `Install dependencies` pairs (PR branch and base branch). For each:
- Add `pnpm/action-setup` step before `setup-node`
- `cache: npm` → `cache: pnpm`
- `npm ci` → `pnpm install --frozen-lockfile`
- `npx jest ...` → `pnpm exec jest ...`

### `.github/workflows/is-compatible.yml`

Single job:
- Add `pnpm/action-setup` step before `setup-node`
- `cache: 'npm'` → `cache: 'pnpm'`
- `npm ci` → `pnpm install --frozen-lockfile`
- `npm run build` → `pnpm run build`

### `CLAUDE.md`

Update all npm references:

| Old | New |
|-----|-----|
| `Uses npm 11, Node >= 24` | `Uses pnpm 10, Node >= 24` |
| `npm ci` | `pnpm install --frozen-lockfile` |
| `npm run build` | `pnpm run build` |
| `npm run dev` | `pnpm run dev` |
| `npm run typecheck` | `pnpm run typecheck` |
| `npm run lint` | `pnpm run lint` |
| `npm run lint:fix` | `pnpm run lint:fix` |
| `npm run test` | `pnpm run test` |
| `npm run test:ci` | `pnpm run test:ci` |
| `npm run spellcheck` | `pnpm run spellcheck` |
| `npm run markdownlint` | `pnpm run markdownlint` |
| `npm run server` | `pnpm run server` |
| `npm run e2e` | `pnpm run e2e` |
| `npx jest ...` | `pnpm exec jest ...` |
| `npm install --save-dev` | `pnpm add --save-dev` |
| `npm install` | `pnpm add` |
| `package manager: npm 11` | `package manager: pnpm 10` |

### `src/CHANGELOG.md`

New entry under `## [Unreleased]` → `### Dependencies`:

> **Migrate package manager from npm 11 to pnpm 10** — replaces `package-lock.json` with `pnpm-lock.yaml`,
> updates CI workflows to use `pnpm/action-setup`, and adds `node-linker=hoisted` to `.npmrc` for
> Grafana webpack compatibility.

---

## Risk: Peer Dep Conflicts

pnpm 10 is stricter about peer deps than npm 11. After generating the lock file, verify `pnpm install` exits clean with no unresolved peer dep errors. If peer dep errors surface, resolve with `peerDependencyRules` in `package.json` — do not use workarounds that suppress the error silently.

---

## Out of Scope

- `.config/` directory — managed by `@grafana/create-plugin`, must not be modified
- Renovate configuration — Renovate supports pnpm natively; `renovate.json` already uses `"packageRules"` not tied to npm specifically. No changes needed.
- `bundle-stats.yml`, `cp-update.yml`, `release.yml` — confirmed no npm references
