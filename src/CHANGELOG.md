# Changelog (Developer / Tooling)

All notable build, CI/CD, dependency, and contributor-facing changes are
documented here. For user-facing features and bug fixes, see the root
[`CHANGELOG.md`](../CHANGELOG.md).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Full interactive streamgraph: band labels, 21 color schemes with Grafana palette
registry, tooltip timestamp header and size controls, vertical crosshair, hover
dimming, legend series toggle, and animated band transitions via React Spring.
Earlier work: project scaffolding, React SVG migration, Grafana SDK integration,
and performance improvements.

### Performance

#### Rendering / interaction

- Replaced O(N) linear reduce in `handlePathMouseMove` with binary search; tooltip
  nearest-point lookup is now O(log N) per mousemove event
- Replaced O(N) `Array.indexOf` in `seriesColor` with a memoized `Map<string, number>`;
  color lookups in path rendering, tooltip rows, and band labels are now O(1)
- Memoized `vizLegendItems` with `useMemo` — previously recomputed on every render,
  causing unnecessary `VizLegend` re-renders and O(S²) work
- Memoized per-path `onMouseMove` handler array; avoids allocating `stackedData.length`
  new closures on tooltip- and selection-driven renders
- `zeroedRows`: skip `{ ...row }` copy for rows where all hidden-series values are
  already zero, cutting allocation on re-renders after a series is fully animated out
- `ResizeObserver` callback now checks for size equality before calling `setSvgSize`,
  preventing spurious re-renders when the browser fires the observer with unchanged
  dimensions
- `unionTimestamps` rewritten as a balanced pairwise merge (O(N log K)) instead of a
  flat Set+sort (O(N log N)) or sequential accumulation (O(N×K)); correct for any
  number of frames and verified by tests covering K=1–4 and unequal-length inputs

### Build / Tooling

#### AGENTS.md

- Documents repo stack, coding conventions, changelog policy, and branching rules

#### Node / package.json

- Pinned Node to 24 via `.nvmrc`, `mise.toml`, and `package.json` engines

#### Linting

- Added spellcheck and markdownlint scripts

#### Jest

- Added `ResizeObserver` mock for JSDOM test environment
- Added jest-suppress-logs.js via setupFiles to silence the i18next/Locize
  marketing banner that printed on every test run
- Added unit tests for `computeSeriesCalcs`, `useColorScale`,
  `buildStreamgraphYScale`, `grafanaTimeFormat`, and `XAxis` — 9 test suites
  covering 115 tests total

#### Dependabot

- Ignore `@types/node` 25.x and major bumps for `typescript` and `@grafana/schema`

#### GitHub Actions

- Least-privilege permissions across all workflows (deny-all default,
  minimum grants per job)
- Updated `build-plugin`, `bundle-size`, `create-plugin-update`,
  `wait-for-grafana` to latest versions

#### StreamGraph.tsx

- Added useTheme2 hook to support theme-aware Grafana categorical palette
- Color scale computation split into sequential gradient path and categorical
  palette path
- Grafana registry path uses getFieldColorMode with a minimal fakeField object
  and try/catch fallback to Cividis for unrecognised scheme IDs
- hiddenSeries state and toggleSeries callback drive legend series toggle
- zeroedRows useMemo zeroes hidden series values rather than removing them from
  the stack, keeping all series in D3 at all times for smooth animation
- seriesColor helper maps by original series name index for consistent colors
  regardless of which other series are hidden
- springConfigs useMemo wraps useSprings configuration to avoid per-render
  array allocation; immediate: true bypasses animation loop when transitions
  are disabled
- Crosshair cursor line: svgX field added to TooltipState, rendered as SVG
  line element; state guard includes svgX so crosshair tracks every pixel of
  cursor movement

#### bandLabels.ts

- parseRgb replaced with colorManipulator.decomposeColor from @grafana/data
- autoContrastColor replaced with getTextColorForBackground from @grafana/ui
- strokeColor added to BandLabel; precomputed once in computeBandLabels rather
  than on every render

#### E2E tests

- Replaced scaffold tests with streamgraph smoke tests
- Added band label toggle on/off tests; assertions use `data-testid="band-label"`
  so they target labels specifically rather than all SVG text

### Code Quality

#### streamgraphConstants.ts (new)

- Extracted all module-level D3 function maps and layout constants from
  `StreamGraph.tsx` — `OFFSET_MAP`, `ORDER_MAP`, `CURVE_MAP`, `SCHEME_MAP`,
  `MARGIN`, `AXIS_HEIGHT`

#### useColorScale.ts (new)

- Extracted the color scale computation hook from `StreamGraph.tsx` — handles
  both d3-scale-chromatic gradient path and Grafana palette registry path with
  Cividis fallback for unknown scheme IDs

#### buildStreamgraphYScale.ts (new)

- Extracted y-scale construction from `StreamGraph.tsx` — pure function that
  scans stacked data for the full y-extent and returns a D3 linear scale;
  handles empty data and non-finite values

#### seriesCalcs.ts (new)

- Extracted `computeSeriesCalcs` from `StreamGraphPanel.tsx` — pure data
  transformation with no component dependencies

#### Axis.tsx

- Exported `grafanaTimeFormat` to enable direct unit testing of boundary
  conditions

#### StreamGraph.tsx — time range selection and refactors

- Time range selection: click-drag overlay with `selectionRef` mirror pattern
  for stale-closure safety; document-level `mouseup` clears stuck selection;
  `updateSelection` helper unifies the ref+state sync pattern;
  `getSvgX` helper eliminates duplicate coordinate extraction
- Reduced from ~570 lines to ~470 lines after module extractions

#### bandLabels.ts

- Replaced custom luminance-based contrast function with Grafana's built-in
  text color utility from @grafana/ui — behavior is consistent with the rest
  of Grafana's UI
- Replaced custom RGB string parser with Grafana's color decomposition utility
  from @grafana/data

#### StreamGraph.tsx / Axis.tsx

- Migrated from D3 DOM manipulation to React SVG rendering — D3 is now
  used only for math (scales, stacking, path strings), React owns the DOM
- Removed `d3-selection`; bundle size dropped ~32 KiB
- Resize no longer tears down and rebuilds the SVG, eliminating label flicker
- X axis rewritten as a React component

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

#### @react-spring/web

- Added for animated band path transitions; `useSprings` animates SVG `d`
  attribute between stack reflows without D3 DOM manipulation

#### D3

- d3-shape, d3-scale, d3-scale-chromatic (modular imports); d3-selection removed

#### Grafana SDK

- `@grafana/data`, `@grafana/runtime`, `@grafana/ui`, `@grafana/schema` at 12.4.2
