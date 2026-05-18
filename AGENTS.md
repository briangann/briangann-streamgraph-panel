# AGENTS.md - Coding Agent Guidelines for briangann-streamgraph-panel

This repository contains a **Grafana plugin**. You must Read @./.config/AGENTS/instructions.md before doing changes.

Grafana Streamgraph Panel plugin. React + TypeScript frontend panel plugin built with `@grafana/create-plugin`
scaffolding. Uses npm 11, Node >= 24, React 18.

**Working code only. Finish job. Plausibility ≠ correctness.**

File follows [AGENTS.md](https://agents.md) open standard (Linux Foundation / Agentic AI Foundation). Claude Code,
Codex, Cursor, Windsurf, Copilot, Aider, Devin, Amp read natively. Other tools: symlink:

```bash
ln -s AGENTS.md CLAUDE.md
ln -s AGENTS.md GEMINI.md
```

---

## 0. Non-negotiables

Override everything else when conflict:

1. **No flattery/filler.** Skip "Great question", "Excellent idea", "I'd be happy to". Start with answer or action.
2. **Disagree when wrong.** Say so before doing work. Agreeing false premises = worst failure mode.
3. **No fabrication.** No paths, hashes, API names, test results, library functions. Don't know → read file, run cmd,
   or say so.
4. **Stop when confused.** Two interpretations → ask. Don't pick silently.
5. **Touch only what needed.** Every changed line traces to request. No drive-by refactors/reformats/"while I was in
   there" cleanups.

---

## 1. Before writing code

Goal: understand problem + codebase before diff.

- State plan 1-2 sentences before edit. Non-trivial: bulleted plan, one line per step, ask for approval before
  starting.
- Read files you touch. Read callers. Subagents for exploration (keep main context clean).
- Match existing patterns. Project uses X → use X, even if you'd do differently greenfield.
- Surface assumptions: "Assuming X, Y, Z. Wrong → say so." Don't bury in implementation.
- Two approaches: present both with tradeoffs. Don't pick silently. Exception: changes under ~20 lines.

---

## 2. Writing code: simplicity first

Goal: min code that solves stated problem. Nothing speculative.

- No extra features.
- No abstractions for single-use. No unrequested configurability/hooks.
- No error handling for impossible scenarios. Handle actual failures only.
- 200 lines that could be 50 → rewrite first.
- "For future extensibility" → stop. Future = future decision.
- Delete > add. Less = better.
- Add to existing files unless a new module boundary is justified. Don't create new files for small additions.

Test: would senior engineer call diff overcomplicated? Yes → simplify.

---

## 3. Surgical changes

Goal: clean, reviewable diffs. Change only what request requires.

- **Don't touch:**
  - Adjacent code/comments/formatting/imports not in task.
  - Working code just because you're in file.
  - Pre-existing dead code unless asked. Notice it → mention in summary.
- **Do touch:**
  - Orphans your changes created (unused imports, vars, funcs your edit made obsolete).
  - Match project style exactly: indent, quotes, naming, layout.

Test: every changed line traces to request. Fails → revert.

---

## 4. Goal-driven execution

Goal: define verifiable success, loop until verified.

Rewrite vague asks before starting:

- "Add validation" → "Write tests for invalid inputs (empty, malformed, oversized), make them pass."
- "Fix bug" → "Write failing test reproducing symptom, make it pass."
- "Refactor X" → "Test suite passes before+after. No public API changes."
- "Make faster" → "Benchmark hot path, profile bottleneck, change it, show benchmark improved."
- "Update docs" → "Identify what's stale, fix it, run linters, verify no broken links."

**When to write tests:** code changes that alter behavior need a test. Refactors and docs don't.

Every task:

1. State success criteria before code.
2. Write verification (test/script/benchmark/screenshot diff) where practical.
3. Run it. Read output. No success claim without checking.
4. Verification fails → fix cause, not test.

---

## 5. Tool use and verification

- **Verification:**
  - Run code > guess. Test suite → run it. Linter → run it. Type checker → run it.
  - Never "done" from plausible-looking diff. Plausibility ≠ correctness.
  - UI changes: screenshot before+after, describe diff.
- **Debugging:**
  - Root causes, not symptoms. Suppressing error ≠ fixing error.
  - Logs/errors/traces: read whole thing. Half-read trace → wrong fix.
  - Use CLI tools (`gh`) when available. More efficient than reading docs.
  - Build/lint/test failure during work: fix it before moving on. Don't defer broken state.

---

## 6. Session hygiene

- Context = constraint. Long sessions with failed attempts < fresh session with sharper prompt.
- Two failed corrections same issue → stop. Summarize, ask user reset session with sharper prompt.
- Subagents for exploration (don't pollute main context with file reads).
- Commit messages: subject under 72 chars. Body grouped by filename with bulleted changes under each, wrapped at 120
  chars. Explains why, not what. No "update file"/"fix bug".

---

## 7. Communication style

- Direct, not diplomatic. "Won't scale because X" > "interesting approach, consider..."
- Concise default. 2-3 short paragraphs unless depth asked. No padding/restating/ceremonial closings.
- Clear answer → give it. No clear answer → say so + best tradeoff read.
- Celebrate: shipping, solving hard problems, metrics moved. Not feature ideas, scope creep, "wouldn't it be cool."
- No excessive bullets, unprompted headers, emoji. Prose > structure for short answers.
- Match depth to question. Quick fix → short answer. Design question → thorough analysis.
- When task is complete, state what changed and stop. Don't suggest follow-up work unless asked.

---

## 8. When to ask, when to proceed

Ask when:

- Two interpretations, choice materially affects output.
- Change touches load-bearing/versioned/migration-path code.
- Need credential/secret/prod resource you lack.
- Stated goal conflicts with literal request.

Proceed when:

- Trivial + reversible (typo, rename local var, add log line).
- Ambiguity resolved by reading code or running command.
- User already answered question this session.

---

## 9. Project Context

### Build / Lint / Test Commands

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

#### Running a Single Test

```bash
# By file path
npx jest src/components/SimplePanel.test.tsx

# By test name pattern
npx jest -t "renders panel"

# Single file in watch mode
npx jest --watch src/components/SimplePanel.test.tsx
```

#### E2E Tests (Playwright)

```bash
npm run server          # Start local Grafana via docker compose (port 3000)
npm run e2e             # Run Playwright tests
```

E2E tests require a running Grafana instance at `http://localhost:3000`. CI runs E2E against a matrix of Grafana
versions resolved by `grafana/plugin-actions/e2e-version`.

### Project Structure

- `src/module.ts` -- entry point (PanelPlugin registration)
- `src/types.ts` -- panel options interfaces
- `src/components/SimplePanel.tsx` -- main panel component (streamgraph rendering)
- `src/img/logo.svg` -- plugin logo
- `tests/` -- Playwright E2E tests

### Code Style

#### Formatting (Prettier)

- Print width: 120
- Single quotes, semicolons required
- Trailing commas: ES5 style
- 2-space indentation, no tabs
- JSX uses double quotes

#### Imports

Order imports as: external packages, then internal (relative) imports.

```typescript
import React from 'react';
import { PanelProps } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';

import { StreamgraphOptions } from './types';
```

- Use named imports exclusively
- Import directly from specific files, not barrel/index files

#### Types and Interfaces

- Use `interface` for object shapes (not `type` aliases)
- Use `enum` for fixed named constants with SCREAMING_SNAKE_CASE members
- Props interfaces are defined adjacent to their component in the same file
- Extend Grafana base types for panel props: `interface Props extends PanelProps<StreamgraphOptions> {}`
- Const arrays of `{ value, label }` for UI select options alongside enums

#### Naming Conventions

| Element            | Convention        | Example                            |
| ------------------ | ----------------- | ---------------------------------- |
| React components   | PascalCase `.tsx` | `StreamgraphPanel.tsx`             |
| Processing modules | snake_case `.ts`  | `data_processor.ts`                |
| Utility modules    | camelCase `.ts`   | `colorUtils.ts`                    |
| Exported functions | PascalCase        | `BuildStreamgraph`, `ProcessData`  |
| Internal functions | camelCase         | `getStackedData`, `buildScales`    |
| Global constants   | SCREAMING_SNAKE   | `DEFAULT_FILL_OPACITY`             |
| Enum members       | SCREAMING_SNAKE   | `INTERPOLATION_SMOOTH`             |
| Variables          | camelCase         | `xScale`, `colorScheme`            |
| Interfaces         | PascalCase        | `StreamgraphOptions`, `SeriesData` |

#### React Components

- Functional components only, no class components
- Type with `React.FC<Props>` or destructured props with explicit type annotation
- Use Grafana hooks: `useStyles2`, `useTheme2` for styling
- Styles defined as functions taking `GrafanaTheme2`, returning emotion `css` template literals

```typescript
export const MyComponent: React.FC<Props> = ({ options, data }) => {
  const styles = useStyles2(getStyles);
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    position: relative;
  `,
});
```

#### Error Handling

- Use fallback/default values rather than throwing exceptions
- Guard with null/undefined checks and early returns
- Avoid `console.log` — `no-console` is an ESLint error; use `eslint-disable` only when necessary
- Silent `try/catch` with fallback values for version-compatibility workarounds

#### Testing

- Tests co-located with source: `foo.ts` has `foo.test.ts` alongside it
- Use `describe`/`it` blocks with descriptive strings
- Name `it` blocks with "returns ..." or "should ..." phrasing
- `beforeEach` for mutable fixtures, `beforeAll` for immutable ones
- Use `@testing-library/react` for component tests (`render`, `screen`)
- Use `expect(...).toBe()` for primitives, `.toStrictEqual()` for objects, `.toMatchSnapshot()` for components
- Jest uses SWC for transpilation (not Babel)

### Key Technical Details

- **Grafana SDK versions**: `@grafana/data`, `@grafana/runtime`, `@grafana/ui`, `@grafana/schema` at `12.4.2`
- **React 18** with `@types/react` at `^18.3.0`
- **Webpack 5** with SWC loader
- **Production build** drops `console.log` and `console.info` via TerserPlugin
- **ESLint 9** flat config extending `@grafana/eslint-config`
- **Docker compose** runs Grafana at `localhost:3000`
- **grafanaDependency**: `>=12.3.0` (minimum supported Grafana version)
- **Node**: `>=24`, **package manager**: npm 11

### CI Workflow

CI runs via `.github/workflows/ci.yml`:

- Lint, typecheck, unit tests, build, sign (if `GRAFANA_ACCESS_POLICY_TOKEN` set)
- Playwright E2E against a matrix of Grafana versions (resolved by `grafana/plugin-actions/e2e-version`)
- Bundle stats comparison on PRs via `grafana/plugin-actions/bundle-size`

### Plugin Tooling Rules

- **Never:**
  - Modify anything inside `.config/` — managed by `@grafana/create-plugin`. Extend at repo root only.
  - Change `id` or `type` in `src/plugin.json`. Requires Grafana server restart.
- **Always:**
  - Use webpack from `.config/` for builds; no custom bundler.
  - Use `@grafana/plugin-e2e` for E2E tests.
  - Pin all GitHub Actions to SHAs.
- **Dependencies (npm 11):**
  - `npm install --save-dev` for build/test/lint tools. `npm install` for runtime deps shipped in the bundle.
  - Use `overrides` in package.json to pin transitive deps when needed.
  - Peer dependency warnings are expected — don't add workarounds unless something actually breaks.
- Grafana API docs: <https://grafana.com/developers/plugin-tools/llms.txt>

### Pre-commit Checklist

Run all and fix issues before committing:

1. `npm run typecheck` — when any `src/` files are changed
2. `npm run test:ci` — when any `src/` files are changed
3. `npm run lint` — fix errors with `npm run lint:fix`
4. `npm run markdownlint` — on any `.md` file created or modified
5. `npm run spellcheck` — fix issues, add legit words to `cspell.config.json`
6. Update changelog(s) — see Changelog Policy for which file and format

### ESLint Rules

Flat config (ESLint 9). Common rules applied:

- `no-console` and `no-debugger` are **errors**
- `@typescript-eslint/no-deprecated` is a **warning** — avoid deprecated APIs
- `@typescript-eslint/no-empty-object-type: off`
- Unused variables are errors (except rest siblings)
- Test files, mocks, config files, and server dirs are excluded from linting

### Critical Rules

- **Commits:**
  - NEVER commit unless the user explicitly asks.
  - Always update changelog(s) in the same commit — see Changelog Policy for which file and format.
- **Pushing:**
  - NEVER push unless the user explicitly asks. Never chain `git commit && git push`.
  - After pushing, always update the PR summary using `gh pr edit` with title and body reflecting all changes
    across the entire branch.
- **No AI attribution** in PR summaries, commits, or any other output.
- **Use subagents** for research, code exploration, and multi-step work. Use the Task tool with `explore` or
  `general` agents rather than running many search/read commands directly. Launch multiple agents in parallel when
  tasks are independent.

### Branching Policy

- **Branches:**
  - Never commit directly to `main`. Always create a new branch.
  - Use descriptive branch names (`feat/add-feature`, `fix/bug-description`).
  - When checking out a branch or `main`, always `git fetch` and `git pull` first.
  - Always run `git status` before constructing `git add` commands.
- **Pull requests:**
  - Always create as drafts (`gh pr create --draft`).
  - Use categories in summaries: `### Added`, `### Fixed`, `### Changed`, `### Removed`, `### Dependencies`,
    `### CI/CD`, `### Documentation`, `### Tooling`.
  - Always include a `## Test plan` section with a verification checklist.

### Changelog Policy

This project maintains two changelog files:

- **`CHANGELOG.md`** — end-user facing. Covers features, bug fixes, breaking
  changes, and Grafana compatibility updates that affect plugin users.
- **`src/CHANGELOG.md`** — technical/developer facing. Covers dependency
  upgrades, CI/CD changes, build tooling, test infrastructure, ESLint,
  Docker, and other contributor-relevant changes.

Both files follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

- Title: `# Changelog`
- Header boilerplate: "All notable changes to this project will be documented
  in this file. The format is based on Keep a Changelog, and this project
  adheres to Semantic Versioning."
- Unreleased section: `## [Unreleased]`
- Release summary: a short plain-language paragraph immediately after the
  `## [Unreleased]` or `## [X.Y.Z]` heading, before the first `###` subsection.
  Summarize what changed and why in 1–3 sentences for quick scanning.
- Released versions: `## [X.Y.Z] - YYYY-MM-DD`
- Subsections (h3) for `CHANGELOG.md`: `### Breaking changes`, `### Features / Enhancements`,
  `### Bug fixes` as appropriate
- Subsections (h3) for `src/CHANGELOG.md` (in this order): `### Build / Tooling`,
  `### Code Quality`, `### E2E / Docker`, `### Dependencies`
- Subject groups (h4) within each subsection to cluster related bullets
  (e.g., `#### Legend`, `#### Tooltip`, `#### Data layer`, `#### Rendering`).
  Add new group names as needed; reuse existing ones when the subject matches.

Add entries to one or both files depending on the nature of the change.
Every commit that modifies code, documentation, dependencies, or configuration
must have a corresponding entry before pushing.

The `## [Unreleased]` heading is automatically replaced with the release version
and date by the publish workflow (`publish.yml`). **Never manually stamp it** —
always leave it as `## [Unreleased]` and let the workflow handle it on release.

## 10. Project Learnings

- Preserve all comments when refactoring. Comments documenting color values, URLs, workarounds, or alternate values
  are intentional — do not strip them during mechanical transforms.

---

## Maintaining this file

Sections 0–8 = general agent behavioral rules.
Section 9 = project context.
Section 10 = project learnings.

File is living. Keep short by keeping honest.

After session where agent erred:

1. Missing rule or ignored rule?
2. Missing → add under "Project Learnings", concrete ("Always use X for Y", not "be careful with Y").
3. Ignored → rule too long/vague/buried. Tighten or move up.
4. Prune every few weeks. Per line: "removing this → agent mistake?" No → delete.
