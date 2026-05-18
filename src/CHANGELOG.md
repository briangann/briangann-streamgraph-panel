# Changelog (Developer / Tooling)

All notable build, CI/CD, dependency, and contributor-facing changes are
documented here. For user-facing features and bug fixes, see the root
[`CHANGELOG.md`](../CHANGELOG.md).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Project scaffolding, Node/npm pinning, lint tooling, Jest mocks, and React 19
prep. Code quality improvements replace hand-rolled UI with Grafana SDK
components and strengthen type safety with schema enums.

### Build / Tooling

#### AGENTS.md

- Updated to reflect repo stack (npm 11, React 18, Grafana SDK 12.4.2, Node 24)
- Changelog Policy added: two-file split (`CHANGELOG.md` user-facing,
  `src/CHANGELOG.md` developer-facing) with Keep a Changelog format and h4
  subject grouping

#### Node / package.json

- Pinned Node to 24 via `.nvmrc`, `mise.toml`, and `package.json` engines

#### Linting

- Added spellcheck (`cspell`) and markdownlint (`markdownlint-cli2`) scripts
  with configs from grafana-polystat-panel
- Fixed `README.md` and `src/README.md` line length and duplicate heading lint
  errors

#### Jest

- Added `ResizeObserver` mock to `jest-setup.js` for JSDOM test environment

#### Dependabot

- Ignore `@types/node` 25.x (non-LTS odd release)
- Ignore major bumps for `typescript` and `@grafana/schema`

### Code Quality

#### types.ts

- Replaced custom `LegendPlacement` enum with `@grafana/schema` string literals
- `legend.displayMode` typed as `LegendDisplayMode` enum from `@grafana/schema`
  instead of string literal union
- Replaced `showTooltip: boolean` with structured
  `tooltip: { mode: TooltipDisplayMode; sort: SortOrder; hideZeros: boolean }`

#### utils.ts

- `isNaN` replaced with `Number.isNaN` (avoids implicit coercion)
- `nullFill` skips object spread when all values are already valid — returns
  original row reference unchanged

#### StreamGraph.tsx

- Replaced hand-rolled legend divs with `VizLegend` from `@grafana/ui`
- Replaced hand-rolled tooltip div with `VizTooltip` + `SeriesTable` from
  `@grafana/ui`

### Performance

#### StreamGraph.tsx

- Replaced `extent(stackedData.flat(2))` O(N×M) allocation with direct
  two-loop scan; dropped `d3-array` import
- Removed `new Date()` allocation per data point in area generator hot path;
  `scaleTime` accepts numeric timestamps directly
- `useEffect` dep array narrowed to individual `options` fields — prevents full
  D3 teardown/rebuild when unrelated options change
- `colorScale` hoisted to `useMemo` to avoid recomputation per render
- y-extent loop guards with `isFinite()` — prevents NaN poisoning the scale
  domain
- Tooltip `setTooltip` equality guard on `seriesName`+`value` — eliminates
  re-renders on every mouse-move pixel
- Single tooltip mode creates one `SeriesRow` directly — skips
  `stackedData.map()` and sort on every mousemove

#### StreamGraphPanel.tsx

- `transformToD3` memoized via `useMemo`; `timeRange` dropped from deps (new
  reference every Grafana render defeated the memo)
- `computeSeriesCalcs` numeric fields filtered once per frame — eliminates
  double-pass over all fields

#### transformer.ts

- `Math.min/max(...times)` crash on empty time array replaced with direct index
  access; added `?? 0` fallback in multi-frame path

#### Axis.tsx

- Dead OR conditions in `grafanaTimeFormat` caused incorrect tick format for
  7200–86400 s and 2419200–31536000 s ranges

### E2E / Docker

#### React 19

- Prepared plugin for React 19 compatibility: externalize jsx-runtime, enable
  React 19 E2E preview image in CI

### Dependencies

#### D3

- d3-shape, d3-scale, d3-scale-chromatic, d3-selection (modular imports)

#### Grafana SDK

- `@grafana/data`, `@grafana/runtime`, `@grafana/ui`, `@grafana/schema` at
  12.4.2
