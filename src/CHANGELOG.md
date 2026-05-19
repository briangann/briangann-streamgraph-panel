# Changelog (Developer / Tooling)

All notable build, CI/CD, dependency, and contributor-facing changes are
documented here. For user-facing features and bug fixes, see the root
[`CHANGELOG.md`](../CHANGELOG.md).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Band label rendering, React SVG migration, and a provisioned demo dashboard.
Earlier work: project scaffolding, Node/npm pinning, lint tooling, Jest setup,
and code quality improvements replacing hand-rolled UI with Grafana SDK
components.

### Build / Tooling

#### AGENTS.md

- Documents repo stack, coding conventions, changelog policy, and branching rules

#### Node / package.json

- Pinned Node to 24 via `.nvmrc`, `mise.toml`, and `package.json` engines

#### Linting

- Added spellcheck and markdownlint scripts

#### Jest

- Added `ResizeObserver` mock for JSDOM test environment

#### Dependabot

- Ignore `@types/node` 25.x and major bumps for `typescript` and `@grafana/schema`

#### GitHub Actions

- Least-privilege permissions across all workflows (deny-all default,
  minimum grants per job)
- Updated `build-plugin`, `bundle-size`, `create-plugin-update`,
  `wait-for-grafana` to latest versions

#### E2E tests

- Replaced scaffold tests with streamgraph smoke tests
- Added band label toggle on/off tests; assertions use `data-testid="band-label"`
  so they target labels specifically rather than all SVG text

### Code Quality

#### StreamGraph.tsx / Axis.tsx

- Migrated from D3 DOM manipulation to React SVG rendering — D3 is now
  used only for math (scales, stacking, path strings), React owns the DOM
- Removed `d3-selection`; bundle size dropped ~32 KiB
- Resize no longer tears down and rebuilds the SVG, eliminating label flicker
- X axis rewritten as a React component

#### bandLabels.ts

- New module containing all band label placement logic, isolated from rendering
  and covered by 18 unit tests
- Label color, font sizing, band height threshold, opacity fade, and font scale
  are all user-configurable with safe fallbacks for invalid values
- All tuning values are named constants with comments explaining their purpose

#### types.ts

- Adopted Grafana SDK types for legend and tooltip options instead of custom
  string literals and booleans

#### StreamGraph.tsx

- Replaced hand-rolled legend and tooltip with Grafana SDK components

#### utils.ts

- Minor correctness fixes (type coercion guard, redundant allocation)

### Performance

#### bandLabels.ts

- Finding the nearest data point to a label's rendered position now uses binary
  search instead of a full scan — significantly faster on large datasets

#### StreamGraph.tsx

- y-scale extent computed with a direct loop rather than flattening the entire
  dataset into a temporary array
- Tooltip state update skips re-render when the hovered series and value have
  not changed

#### StreamGraphPanel.tsx

- Data transformation memoized correctly — previously a new object reference on
  every Grafana render defeated the memo

### E2E / Docker

#### React 19

- Prepared plugin for React 19 compatibility; enabled React 19 E2E preview in CI

### Dependencies

#### D3

- d3-shape, d3-scale, d3-scale-chromatic (modular imports); d3-selection removed

#### Grafana SDK

- `@grafana/data`, `@grafana/runtime`, `@grafana/ui`, `@grafana/schema` at 12.4.2
