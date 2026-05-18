# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For build tooling, CI/CD, dependency, and contributor-facing changes, see
[`src/CHANGELOG.md`](src/CHANGELOG.md).

## [Unreleased]

### Features / Enhancements

#### Streamgraph visualization

- D3-based streamgraph using d3-shape, d3-scale, d3-scale-chromatic
- Stack offset: Wiggle, Silhouette, Zero (stacked), Expand (normalized)
- Stack order: Inside out, Ascending, Descending, None
- Curve type: Smooth, Linear, Step
- Color scheme: Cividis, Turbo, Viridis, Spectral
- Fill opacity slider (0–1)
- Show/hide X axis toggle
- Panel option categories: Streamgraph, Axis, Tooltip, Legend

#### Data handling

- Wide DataFrame and multi-frame time series input supported
- Null/gap fill for sparse series (required for D3 stack)

#### Legend

- Show/hide toggle with bottom or right placement
- List and Table display modes
- Table mode: configurable calc columns (min/max/mean/sum/count/first/last
  etc.) via `reduceField`, defaults to min, max, mean, last non-null
- SVG container sized dynamically via `ResizeObserver` — legend takes natural
  space in both List and Table modes

#### Tooltip

- Single (hovered series), All series (multi), Hidden modes using `VizTooltip`
  and `SeriesTable` from `@grafana/ui`
- Sort order (Ascending/Descending/None) for All series mode
- Hide zeros toggle filters zero-value series from All series mode

### Bug fixes

#### Data layer

- `transformer.ts`: `Math.min/max(...times)` crash on empty time array replaced
  with direct index access; added `?? 0` fallback in multi-frame path
- `StreamGraphPanel.tsx`: `transformToD3` memoized via `useMemo`; `timeRange`
  dropped from deps (new reference every Grafana render defeated the memo)
- `StreamGraphPanel.tsx`: `computeSeriesCalcs` name derivation mirrors
  `transformer.ts` — wide frames use `field.name` fallback, multi-frame uses
  `frame.name`; fixes calcs not appearing when frame has name but no displayName
- `StreamGraphPanel.tsx`: numeric fields filtered once per frame — eliminates
  double-pass over all fields

#### Rendering

- `StreamGraph.tsx`: empty `stackedData` guard prevents `±Infinity` from
  `Math.min/max` spread
- `StreamGraph.tsx`: replaced `extent(stackedData.flat(2))` O(N×M) allocation
  with direct two-loop scan; dropped `d3-array` import
- `StreamGraph.tsx`: removed `new Date()` allocation per data point in area
  generator; `scaleTime` accepts numeric timestamps directly
- `StreamGraph.tsx`: `useEffect` dep array narrowed to individual `options`
  fields — prevents full D3 teardown/rebuild on unrelated option changes
- `StreamGraph.tsx`: `colorScale` hoisted to `useMemo`
- `StreamGraph.tsx`: y-extent loop guards with `isFinite()` — prevents NaN
  poisoning the scale domain
- `Axis.tsx`: dead OR conditions in `grafanaTimeFormat` caused incorrect tick
  format for 7200–86400 s and 2419200–31536000 s ranges

#### Tooltip

- Tooltip `setTooltip` equality guard on `seriesName`+`value` — eliminates
  re-renders on every mouse-move pixel
- Single mode creates one `SeriesRow` directly — skips `stackedData.map()` and
  sort on every mousemove

#### Legend

- `displayMode: 'hidden'` now suppresses rendering and flexbox space allocation
- `legend.displayMode` typed as `LegendDisplayMode` enum; all comparisons use
  enum members instead of string literals

## 1.0.0 (Unreleased)

Initial release.
