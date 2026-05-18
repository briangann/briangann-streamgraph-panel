# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For build tooling, CI/CD, dependency, and contributor-facing changes, see
[`src/CHANGELOG.md`](src/CHANGELOG.md).

## [Unreleased]

### Features / Enhancements

- Streamgraph panel visualization using D3 (d3-shape, d3-scale, d3-scale-chromatic)
- Panel options: stack offset (Wiggle/Silhouette/Zero/Expand), stack order
  (Inside out/Ascending/Descending/None), curve type (Smooth/Linear/Step),
  color scheme (Cividis/Turbo/Viridis/Spectral), fill opacity
- Show/hide X axis toggle
- Data transformer supporting wide DataFrame and multi-frame time series input
- Null/gap fill for sparse series (required for D3 stack)
- Legend: show/hide, bottom/right placement, List and Table display modes
- Legend calcs in Table mode (min/max/mean/sum/count/first/last etc.) computed
  via `reduceField` from original data frames, surfaced via `getDisplayValues`
- Legend values selector (multi-select) visible only in Table mode; defaults to
  min, max, mean, last non-null
- SVG container sized dynamically via `ResizeObserver` — legend takes natural
  space in both List and Table modes (replaced fixed pixel constants)
- Tooltip: Single (hovered series), All series (multi), Hidden modes via
  `VizTooltip` + `SeriesTable` from `@grafana/ui`
- Tooltip sort order (Ascending/Descending/None) for All series mode
- Tooltip hide-zeros toggle filters zero-value series from All series mode
- Panel option categories: Streamgraph, Axis, Tooltip, Legend

### Bug fixes

- `grafanaTimeFormat` in `Axis.tsx`: dead OR conditions caused incorrect tick
  format for ranges 7200–86400 s and 2419200–31536000 s; cascade now matches
  spec thresholds
- `StreamGraph.tsx`: `Math.min/max` spread on empty `stackedData` returned
  `±Infinity`; added early return guard
- `transformer.ts`: `Math.min/max(...times)` crash on empty time array replaced
  with direct index access; added consistent `?? 0` fallback in multi-frame path
- `StreamGraph.tsx`: replaced `extent(stackedData.flat(2))` O(N×M) allocation
  with direct two-loop scan; dropped `d3-array` import
- `StreamGraphPanel.tsx`: `transformToD3` memoized via `useMemo`; `timeRange`
  dropped from deps (new object every Grafana render defeated the memo)
- `StreamGraph.tsx`: `useEffect` dep array narrowed to individual `options`
  fields — prevents full D3 teardown/rebuild on unrelated option changes
- `StreamGraph.tsx`: removed `new Date()` allocation per data point in area
  generator hot path; `scaleTime` accepts numeric timestamps directly
- `StreamGraph.tsx`: tooltip `setTooltip` equality guard on `seriesName`+`value`
  — eliminates re-renders on every mouse-move pixel
- `StreamGraph.tsx`: `colorScale` hoisted to `useMemo` to avoid recomputation
- `StreamGraphPanel.tsx`: `computeSeriesCalcs` name derivation mirrors
  `transformer.ts` — wide frames use `field.name` fallback, multi-frame uses
  `frame.name`; fixes calcs not appearing when frame has name but no displayName
- `StreamGraph.tsx`: `displayMode: 'hidden'` now suppresses legend rendering and
  flexbox space allocation
- `StreamGraph.tsx`: y-extent loop guards with `isFinite()` — prevents NaN
  poisoning the scale domain
- `StreamGraph.tsx`: Single tooltip mode creates one `SeriesRow` directly —
  skips `stackedData.map()` and sort on every mousemove
- `types.ts`: `legend.displayMode` typed as `LegendDisplayMode` enum; all
  comparisons use enum members instead of string literals
- `StreamGraphPanel.tsx`: `computeSeriesCalcs` filters numeric fields once per
  frame — eliminates double-pass over all fields
