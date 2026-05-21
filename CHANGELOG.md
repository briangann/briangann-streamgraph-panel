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

#### Time range selection

- Click and drag on the chart to select a time range — the same interaction as
  Grafana's built-in time series panel; releases the selection and updates the
  dashboard time range for all panels

#### Animated transitions

- Band paths now animate smoothly when series are hidden or shown via the legend,
  and when new data arrives — configurable via Enable transitions toggle and
  Transition duration slider in the Streamgraph section

#### Tooltip

- Tooltip shows the hovered timestamp as a header above the series rows
- Added Max width and Max height options to control tooltip size; useful when
  showing many series in All series mode
- Single (hovered series), All series, or Hidden modes
- Sort order (Ascending/Descending/None) in All series mode
- Hide zeros toggle in All series mode

#### Crosshair

- Vertical cursor line appears on hover to align the tooltip position with the
  time axis; toggle on or off in the Axis section of the panel editor (default on)

#### Legend series toggle

- Clicking a legend item hides that series; clicking again shows it
- Hidden series are grayed out in the legend
- Colors remain consistent — each series keeps its color regardless of which
  other series are hidden

#### Hover dimming

- Non-hovered bands dim when hovering to highlight the active series, matching
  the ECharts ThemeRiver interaction style
- Configurable: toggle on/off and set the dim opacity (0–1, default 0.3)

#### Color schemes

- Added Plasma, Inferno, Magma, Cool, Warm, and Rainbow gradient palettes
- Added 11 Grafana palette registry schemes: Classic (theme series colors),
  Green-Yellow-Red, Red-Yellow-Green, Blue-Yellow-Red, Yellow-Red, Blue-Purple,
  Yellow-Blue, Blues, Reds, Greens, and Purples — all adapt automatically to
  Grafana's dark and light themes

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
