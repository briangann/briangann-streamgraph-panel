# pnpm 10 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace npm 11 with pnpm 10 across package management, CI workflows, and docs — no behavior changes, same scripts and dependency versions.

**Architecture:** Update `package.json` and `.npmrc` for pnpm compatibility, swap the lock file, update all three affected GitHub Actions workflows to use `pnpm/action-setup`, and update `CLAUDE.md` references. Use `node-linker=hoisted` to keep the flat `node_modules` layout that the unmodifiable Grafana `.config/` webpack config expects.

**Tech Stack:** pnpm 10.34.1, `pnpm/action-setup@v6.0.8`, Node ≥ 24

---

## File Map

| File | Action |
|------|--------|
| `package.json` | Modify — `packageManager` field, `lint:fix` and `sign` scripts |
| `.npmrc` | Modify — add `node-linker=hoisted` and `public-hoist-pattern[]=*` |
| `package-lock.json` | Delete |
| `pnpm-lock.yaml` | Generate via `pnpm install` |
| `.github/workflows/ci.yml` | Modify — 2 jobs |
| `.github/workflows/coverage.yml` | Modify — 2 install cycles |
| `.github/workflows/is-compatible.yml` | Modify — 1 job |
| `CLAUDE.md` | Modify — all npm references |
| `src/CHANGELOG.md` | Modify — add Unreleased entry |

---

## Task 1: Install pnpm 10 locally

**Files:** none

- [ ] Install pnpm 10 globally via corepack (ships with Node ≥ 16):

```bash
corepack enable
corepack prepare pnpm@10.34.1 --activate
```

- [ ] Verify:

```bash
pnpm --version
```

Expected output: `10.34.1`

---

## Task 2: Update `package.json`

**Files:**
- Modify: `package.json`

- [ ] Change `packageManager` field:

Old:
```json
"packageManager": "npm@11.12.1"
```

New:
```json
"packageManager": "pnpm@10.34.1"
```

- [ ] Change `lint:fix` script (replace `npm run` with `pnpm`):

Old:
```json
"lint:fix": "npm run lint -- --fix && prettier --write --list-different .",
```

New:
```json
"lint:fix": "pnpm lint -- --fix && prettier --write --list-different .",
```

- [ ] Change `sign` script (replace `npx --yes` with `pnpm dlx`):

Old:
```json
"sign": "npx --yes @grafana/sign-plugin@latest",
```

New:
```json
"sign": "pnpm dlx @grafana/sign-plugin@latest",
```

- [ ] Verify no `^` or `~` ranges crept in:

```bash
grep '"\^' package.json; grep '"~' package.json
```

Expected: no output.

---

## Task 3: Update `.npmrc`

**Files:**
- Modify: `.npmrc`

Current content:
```ini
# Disable post install scripts to prevent execution of arbitrary code during package installation.
# This secures both local development and CI from common supply chain attacks.
# If you experience problems with legitimate lifecycle scripts rather than
# disable this please use https://www.npmjs.com/package/@lavamoat/allow-scripts
ignore-scripts=true
```

- [ ] Append two lines after `ignore-scripts=true`:

```ini
node-linker=hoisted
public-hoist-pattern[]=*
```

Final `.npmrc`:
```ini
# Disable post install scripts to prevent execution of arbitrary code during package installation.
# This secures both local development and CI from common supply chain attacks.
# If you experience problems with legitimate lifecycle scripts rather than
# disable this please use https://www.npmjs.com/package/@lavamoat/allow-scripts
ignore-scripts=true
node-linker=hoisted
public-hoist-pattern[]=*
```

`node-linker=hoisted` produces a flat `node_modules` layout. `public-hoist-pattern[]=*` hoists all packages. Together these replicate npm's default layout, which the Grafana `.config/` webpack config requires.

---

## Task 4: Generate `pnpm-lock.yaml`

**Files:**
- Delete: `package-lock.json`
- Generate: `pnpm-lock.yaml`

- [ ] Delete the npm lock file:

```bash
rm /Users/bgann/go/src/github.com/briangann/briangann-streamgraph-panel/package-lock.json
```

- [ ] Install with pnpm (generates lock file):

```bash
cd /Users/bgann/go/src/github.com/briangann/briangann-streamgraph-panel && pnpm install
```

Expected: install completes with no unresolved peer dependency errors. Peer dependency **warnings** are expected and acceptable (noted in CLAUDE.md). If hard errors appear, add a `peerDependencyRules` entry to `package.json` — do not suppress with `--legacy-peer-deps` (that flag does not exist in pnpm).

- [ ] Verify lock file generated:

```bash
ls pnpm-lock.yaml
```

Expected: file exists.

---

## Task 5: Verify local build and test pass

**Files:** none

- [ ] Type check:

```bash
pnpm run typecheck
```

Expected: exits 0, no errors.

- [ ] Lint:

```bash
pnpm run lint
```

Expected: exits 0, no errors.

- [ ] Unit tests:

```bash
pnpm run test:ci
```

Expected: all tests pass (currently 119 tests across 9 suites).

- [ ] Build:

```bash
pnpm run build
```

Expected: exits 0, `dist/` directory populated.

If any step fails: diagnose the root cause. Most likely cause is a missing hoisted package — check that `node-linker=hoisted` and `public-hoist-pattern[]=*` are both present in `.npmrc`, then re-run `pnpm install`.

---

## Task 6: Update `.github/workflows/ci.yml`

**Files:**
- Modify: `.github/workflows/ci.yml`

Two jobs need changes: `build` and `playwright-tests`.

### `build` job

- [ ] Insert `pnpm/action-setup` step **before** the `Setup Node.js environment` step (around line 34):

```yaml
      - name: Setup pnpm
        uses: pnpm/action-setup@0e279bb959325dab635dd2c09392533439d90093 # v6.0.8
        with:
          version: 10
```

- [ ] Change the `setup-node` cache value:

Old:
```yaml
          cache: 'npm'
```

New:
```yaml
          cache: 'pnpm'
```

- [ ] Change install command:

Old:
```yaml
      - name: Install dependencies
        run: npm ci
```

New:
```yaml
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
```

- [ ] Change sign step:

Old:
```yaml
      - name: Sign plugin
        run: npm run sign
```

New:
```yaml
      - name: Sign plugin
        run: pnpm run sign
```

### `playwright-tests` job

- [ ] Insert `pnpm/action-setup` step **before** the `Setup Node.js environment` step in this job:

```yaml
      - name: Setup pnpm
        uses: pnpm/action-setup@0e279bb959325dab635dd2c09392533439d90093 # v6.0.8
        with:
          version: 10
```

- [ ] Change the `setup-node` cache value for this job:

Old:
```yaml
          cache: 'npm'
```

New:
```yaml
          cache: 'pnpm'
```

- [ ] Change install command for this job:

Old:
```yaml
      - name: Install dev dependencies
        run: npm ci
```

New:
```yaml
      - name: Install dev dependencies
        run: pnpm install --frozen-lockfile
```

- [ ] Change Playwright browser install command:

Old:
```yaml
      - name: Install Playwright Browsers
        run: npm exec playwright install chromium --with-deps
```

New:
```yaml
      - name: Install Playwright Browsers
        run: pnpm exec playwright install chromium --with-deps
```

- [ ] Change e2e run command:

Old:
```yaml
      - name: Run Playwright tests
        id: run-tests
        run: npm run e2e
```

New:
```yaml
      - name: Run Playwright tests
        id: run-tests
        run: pnpm run e2e
```

---

## Task 7: Update `.github/workflows/coverage.yml`

**Files:**
- Modify: `.github/workflows/coverage.yml`

This workflow checks out the PR branch and the base branch in the same job — two full install cycles.

### First cycle (PR branch, around line 22)

- [ ] Insert `pnpm/action-setup` step before `Setup Node`:

```yaml
      - name: Setup pnpm
        uses: pnpm/action-setup@0e279bb959325dab635dd2c09392533439d90093 # v6.0.8
        with:
          version: 10
```

- [ ] Change `setup-node` cache:

Old:
```yaml
          cache: npm
```

New:
```yaml
          cache: pnpm
```

- [ ] Change install command:

Old:
```yaml
      - name: Install dependencies
        run: npm ci
```

New:
```yaml
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
```

- [ ] Change jest run command:

Old:
```yaml
        run: npx jest --ci --coverage --coverageReporters=json-summary --coverageReporters=json --maxWorkers=4
```

New:
```yaml
        run: pnpm exec jest --ci --coverage --coverageReporters=json-summary --coverageReporters=json --maxWorkers=4
```

### Second cycle (base branch, around line 48)

- [ ] Insert `pnpm/action-setup` step before `Setup Node (base)`:

```yaml
      - name: Setup pnpm (base)
        uses: pnpm/action-setup@0e279bb959325dab635dd2c09392533439d90093 # v6.0.8
        with:
          version: 10
```

- [ ] Change `setup-node` cache:

Old:
```yaml
          cache: npm
```

New:
```yaml
          cache: pnpm
```

- [ ] Change install command:

Old:
```yaml
      - name: Install dependencies (base)
        run: npm ci
```

New:
```yaml
      - name: Install dependencies (base)
        run: pnpm install --frozen-lockfile
```

- [ ] Change jest run command (second occurrence):

Old:
```yaml
        run: npx jest --ci --coverage --coverageReporters=json-summary --coverageReporters=json --maxWorkers=4
```

New:
```yaml
        run: pnpm exec jest --ci --coverage --coverageReporters=json-summary --coverageReporters=json --maxWorkers=4
```

---

## Task 8: Update `.github/workflows/is-compatible.yml`

**Files:**
- Modify: `.github/workflows/is-compatible.yml`

- [ ] Insert `pnpm/action-setup` step before `Setup Node.js environment`:

```yaml
      - name: Setup pnpm
        uses: pnpm/action-setup@0e279bb959325dab635dd2c09392533439d90093 # v6.0.8
        with:
          version: 10
```

- [ ] Change `setup-node` cache:

Old:
```yaml
          cache: 'npm'
```

New:
```yaml
          cache: 'pnpm'
```

- [ ] Change install command:

Old:
```yaml
      - name: Install dependencies
        run: npm ci
```

New:
```yaml
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
```

- [ ] Change build command:

Old:
```yaml
      - name: Build plugin
        run: npm run build
```

New:
```yaml
      - name: Build plugin
        run: pnpm run build
```

---

## Task 9: Update `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

Replace all npm references. Make each change individually to avoid accidental skips.

- [ ] Header line (around line 6) — change `npm 11` to `pnpm 10`:

Old:
```
scaffolding. Uses npm 11, Node >= 24, React 18.
```

New:
```
scaffolding. Uses pnpm 10, Node >= 24, React 18.
```

- [ ] Build/Lint/Test Commands section — replace entire commands block:

Old:
```bash
npm ci                  # Install dependencies (npm 11)
npm run build           # Production build (webpack, outputs to dist/)
npm run dev             # Dev build with watch mode + livereload
npm run typecheck       # TypeScript type checking (tsc --noEmit)
npm run lint            # ESLint (flat config, v9)
npm run lint:fix        # ESLint autofix + Prettier
npm run test            # Jest in watch mode (changed files only)
npm run test:ci         # Jest CI mode (all tests, 4 workers)
npm run spellcheck      # cspell across all source files
npm run markdownlint    # markdownlint-cli2 across all .md files
```

New:
```bash
pnpm install --frozen-lockfile  # Install dependencies (pnpm 10)
pnpm run build                  # Production build (webpack, outputs to dist/)
pnpm run dev                    # Dev build with watch mode + livereload
pnpm run typecheck              # TypeScript type checking (tsc --noEmit)
pnpm run lint                   # ESLint (flat config, v9)
pnpm run lint:fix               # ESLint autofix + Prettier
pnpm run test                   # Jest in watch mode (changed files only)
pnpm run test:ci                # Jest CI mode (all tests, 4 workers)
pnpm run spellcheck             # cspell across all source files
pnpm run markdownlint           # markdownlint-cli2 across all .md files
```

- [ ] Running a Single Test section — replace `npx jest` with `pnpm exec jest`:

Old:
```bash
# By file path
npx jest src/components/SimplePanel.test.tsx

# By test name pattern
npx jest -t "renders panel"

# Single file in watch mode
npx jest --watch src/components/SimplePanel.test.tsx
```

New:
```bash
# By file path
pnpm exec jest src/components/SimplePanel.test.tsx

# By test name pattern
pnpm exec jest -t "renders panel"

# Single file in watch mode
pnpm exec jest --watch src/components/SimplePanel.test.tsx
```

- [ ] Key Technical Details section — change package manager line:

Old:
```
- **Node**: `>=24`, **package manager**: npm 11
```

New:
```
- **Node**: `>=24`, **package manager**: pnpm 10
```

- [ ] Dependencies section header:

Old:
```markdown
- **Dependencies (npm 11):**
  - `npm install --save-dev` for build/test/lint tools. `npm install` for runtime deps shipped in the bundle.
```

New:
```markdown
- **Dependencies (pnpm 10):**
  - `pnpm add --save-dev` for build/test/lint tools. `pnpm add` for runtime deps shipped in the bundle.
```

- [ ] Pre-commit Checklist section — replace `npm run` with `pnpm run`:

Old:
```markdown
1. `npm run typecheck` — when any `src/` files are changed
2. `npm run test:ci` — when any `src/` files are changed
3. `npm run lint` — fix errors with `npm run lint:fix`
4. `npm run markdownlint` — on any `.md` file created or modified
5. `npm run spellcheck` — fix issues, add legit words to `cspell.config.json`
```

New:
```markdown
1. `pnpm run typecheck` — when any `src/` files are changed
2. `pnpm run test:ci` — when any `src/` files are changed
3. `pnpm run lint` — fix errors with `pnpm run lint:fix`
4. `pnpm run markdownlint` — on any `.md` file created or modified
5. `pnpm run spellcheck` — fix issues, add legit words to `cspell.config.json`
```

- [ ] Verify no npm references remain (besides the Renovate/npm registry context, which is fine):

```bash
grep -n '\bnpm\b' /Users/bgann/go/src/github.com/briangann/briangann-streamgraph-panel/CLAUDE.md | grep -v 'npmrc\|npm info\|npm registry\|lavamoat\|npmjs\|@npm'
```

Review each hit and confirm it's intentional (e.g., `.npmrc` file references are fine).

---

## Task 10: Update `src/CHANGELOG.md`

**Files:**
- Modify: `src/CHANGELOG.md`

- [ ] Open `src/CHANGELOG.md` and locate the `## [Unreleased]` section.

- [ ] Under `## [Unreleased]`, add or extend a `### Dependencies` subsection with:

```markdown
### Dependencies

#### Package manager

- Migrated from npm 11 to pnpm 10 — replaced `package-lock.json` with `pnpm-lock.yaml`,
  updated CI workflows to use `pnpm/action-setup@v6.0.8`, and added `node-linker=hoisted`
  to `.npmrc` for Grafana webpack compatibility
```

If a `### Dependencies` section already exists under `[Unreleased]`, add the bullet to it instead of creating a duplicate.

---

## Task 11: Commit

**Files:** all modified files

- [ ] Verify all checks pass one final time:

```bash
pnpm run typecheck && pnpm run lint && pnpm run test:ci && pnpm run build
```

Expected: all exit 0.

- [ ] Run markdownlint on modified markdown files:

```bash
pnpm run markdownlint
```

Expected: exits 0.

- [ ] Check git status to see everything staged correctly:

```bash
git status
```

Expected: modified files match the file map at the top of this plan. `package-lock.json` should appear as deleted, `pnpm-lock.yaml` as a new untracked file.

- [ ] Stage all changes:

```bash
git add package.json .npmrc pnpm-lock.yaml .github/workflows/ci.yml .github/workflows/coverage.yml .github/workflows/is-compatible.yml CLAUDE.md src/CHANGELOG.md
git rm package-lock.json
```

- [ ] Commit:

```bash
git commit -m "$(cat <<'EOF'
chore: migrate from npm 11 to pnpm 10

Replaces npm 11 with pnpm 10 across all tooling. Removes
package-lock.json in favour of pnpm-lock.yaml. Adds
node-linker=hoisted to .npmrc so the Grafana .config/ webpack
config continues to resolve peer deps from a flat node_modules.

- package.json: update packageManager field, lint:fix and sign scripts
- .npmrc: add node-linker=hoisted, public-hoist-pattern[]=*
- ci.yml, coverage.yml, is-compatible.yml: add pnpm/action-setup,
  switch cache to pnpm, replace npm ci with pnpm install --frozen-lockfile
- CLAUDE.md: update all npm command references to pnpm equivalents
EOF
)"
```

---

## Self-Review

**Spec coverage:**
- ✅ `package.json` — Task 2
- ✅ `.npmrc` — Task 3
- ✅ Lock file swap — Task 4
- ✅ `ci.yml` both jobs — Task 6
- ✅ `coverage.yml` both cycles — Task 7
- ✅ `is-compatible.yml` — Task 8
- ✅ `CLAUDE.md` all references — Task 9
- ✅ `src/CHANGELOG.md` — Task 10
- ✅ Local verification — Tasks 5 and 11
- ✅ pnpm install step — Task 1

**Placeholder scan:** None found. All steps contain exact commands, exact file content, and exact expected outputs.

**Type consistency:** N/A — pure config migration, no TypeScript types.
