# Changelog

## [Unreleased]

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
