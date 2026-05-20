# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For build tooling, CI/CD, dependency, and contributor-facing changes, see
[`src/CHANGELOG.md`](src/CHANGELOG.md).

## [Unreleased]

Initial implementation of the Grafana Streamgraph Panel plugin. Renders D3-based
streamgraph visualizations with configurable stacking, curves, and color schemes.
Includes a Grafana-native legend (List and Table modes with calc columns) and
tooltip (Single, All series, and Hidden modes with sort and zero filtering).

### Features / Enhancements

#### Color schemes

- Added Plasma, Inferno, Magma, Cool, Warm, and Rainbow gradient palettes
- Added Grafana palette — uses the current Grafana theme's series colors,
  adapting automatically when switching between dark and light mode

#### Band labels

- Configurable label color: Inverse (default), Auto (contrast), White, Black
- Configurable min/max font size (defaults: 8–48px); invalid or inverted values
  are sanitized automatically
- Configurable minimum band height threshold — bands below this pixel height
  are unlabeled (default 8px)
- Configurable font scale factor — controls font size as a fraction of band
  height (default 0.7; range 0.1–1.5)
- Configurable text stroke width — outline drawn behind label text for
  contrast; stroke color is the inverse of the label color (default 0, off)
- Opacity fade toggle — when off, labels are full opacity above the minimum
  band height threshold with no ramp (default on)
- Show metric names inside streamgraph bands at their widest point
- Font scales to fit band height (8--48px), fades out when band is too narrow
- Inverted band color for contrast
- Toggle via Show band labels in Streamgraph options (off by default)
- Labels and panel resize are stable — no flicker when resizing the browser or
  dashboard panel

#### Streamgraph visualization

- Stack offset: Wiggle, Silhouette, Zero (stacked), Expand (normalized)
- Stack order: Inside out, Ascending, Descending, None
- Curve type: Smooth, Linear, Step
- Color scheme: Cividis, Turbo, Viridis, Spectral
- Fill opacity slider (0–1)
- Show/hide X axis toggle

#### Data handling

- Wide-format and multi-frame time series input
- Automatic null/gap fill for sparse series

#### Legend

- Show/hide with bottom or right placement
- List and Table display modes
- Table mode: configurable calc columns (min, max, mean, sum, count, first,
  last, etc.), defaults to min, max, mean, last non-null
- Dynamic sizing — legend takes natural space, chart fills the remainder

#### Tooltip

- Single (hovered series), All series, or Hidden
- Sort order (Ascending/Descending/None) in All series mode
- Hide zeros toggle in All series mode

### Bug fixes

#### Data layer

- Fixed crash on empty time arrays
- Fixed legend calcs not appearing when data source returns named frames
  without explicit display names

#### Rendering

- Fixed empty dataset producing infinite axis range
- Fixed incorrect X axis tick format for certain time ranges
- Reduced unnecessary re-renders when hovering and changing unrelated options

#### Legend

- Hidden display mode no longer reserves layout space

## 1.0.0 (Unreleased)

Initial release.
