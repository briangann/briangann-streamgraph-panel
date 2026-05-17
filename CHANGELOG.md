# Changelog

## [Unreleased]

### Fixed

- `grafanaTimeFormat` in `Axis.tsx`: dead OR conditions caused incorrect tick format for ranges
  7200–86400 s and 2419200–31536000 s; cascade now matches spec thresholds
- `StreamGraph.tsx`: `Math.min/max` spread on empty `stackedData` returned `±Infinity`; added
  early return guard
- `transformer.ts`: `Math.min/max(...times)` crash on empty time array replaced with direct
  index access (time fields are pre-sorted); added consistent `?? 0` fallback in multi-frame path
- `StreamGraph.tsx`: replaced intermediate `allValues` array + spread with `extent` from d3-array
  (single-pass, no allocation); hoisted `colorScale` to `useMemo` to avoid recomputation per render
- `StreamGraphPanel.tsx`: `transformToD3` now memoized (`useMemo`) — avoids re-running the data
  transform on every panel re-render (resize, hover, sibling updates); duplicate `PanelDataErrorView`
  returns collapsed into one guard
- `StreamGraph.tsx`: `useEffect` dep array narrowed to individual `options` fields used inside the
  effect — prevents full D3 teardown/rebuild when unrelated options change
- `StreamGraph.tsx`: removed `new Date()` allocation per data point in area generator hot path;
  `scaleTime` accepts numeric timestamps directly
- `StreamGraph.tsx`: tooltip `setTooltip` now compares new values against prior state before
  updating — eliminates unnecessary re-renders on every mouse-move pixel
- `StreamGraph.tsx`: `legendItems` computation guarded behind `options.showLegend` — skips map
  when legend is hidden; added `StackDatum` type alias to remove verbose triple casts
- `utils.ts`: `isNaN` replaced with `Number.isNaN` (avoids implicit coercion); `nullFill` now
  skips object spread when all values are already valid — returns original row reference unchanged

### Added

- Streamgraph panel visualization using D3 (d3-shape, d3-scale, d3-scale-chromatic)
- Panel options: stack offset, stack order, curve type, color scheme, fill opacity,
  show/hide X axis, tooltip, legend (with bottom/right placement)
- Data transformer supporting wide DataFrame and multi-frame time series input
- Null/gap fill for sparse series (required for D3 stack)
- Hover tooltip showing series name and value
- Legend rendering (bottom or right placement)
- Full unit test coverage for data layer; component tests for StreamGraph and StreamGraphPanel

### Project Updates

- Update AGENTS.md to reflect repo stack (npm 11, React 18, Grafana SDK 12.4.2, Node 24)
- Pin Node to 24 via .nvmrc, mise.toml, and package.json engines
- Prepare plugin for React 19 compatibility: externalize jsx-runtime, enable React 19 E2E preview image in CI
- Add spellcheck and markdownlint scripts with configs from grafana-polystat-panel
- Fix README.md and src/README.md line length and duplicate heading lint errors

## 1.0.0 (Unreleased)

Initial release.
