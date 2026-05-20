# Grafana Streamgraph Panel

A [streamgraph](https://en.wikipedia.org/wiki/Streamgraph) panel for Grafana.
Stacked areas flow around a central baseline so you can see relative volume
across many series at a glance.

![Streamgraph with 5 series, Cividis color scheme](https://raw.githubusercontent.com/briangann/briangann-streamgraph-panel/main/src/img/screenshots/grafana-streamgraph-5series.png)

## Overview

The streamgraph panel renders time series data as flowing, stacked bands.
Unlike a stacked bar chart, the bands are centered around a shared baseline
rather than stacked from zero, which makes it easier to see peaks and trends
across many series simultaneously.

Key capabilities:

- **21 color schemes** — 10 D3 gradients (Viridis, Turbo, Plasma, and more) plus
  11 Grafana palette registry schemes that adapt to dark and light theme
- **Band labels** — series names rendered inside their bands at the widest visible
  point, with configurable color, font sizing, contrast stroke, and opacity fade
- **Hover dimming** — non-hovered bands dim on hover to highlight the active series
- **Crosshair** — vertical cursor line aligned to the time axis
- **Modern tooltip** — hovered timestamp header above series rows, with configurable
  max width and height
- **Four stack offsets** (Wiggle, Silhouette, Zero, Expand) and four orderings
- **Smooth, Linear, or Step** curve interpolation
- **Interactive legend** in List or Table mode (Table supports calc columns)

![Turbo color scheme](https://raw.githubusercontent.com/briangann/briangann-streamgraph-panel/main/src/img/screenshots/grafana-streamgraph-turbo.png)

## Requirements

Grafana 12.3.0+

## Getting Started

1. Add a new panel and select **Streamgraph** from the visualization picker.
2. Connect any wide-format or multi-frame time series data source.
3. Use the **Streamgraph** section in the panel editor to choose a color scheme,
   stack offset, and curve type.
4. Enable **Band Labels** to render series names inside the bands.
5. Enable **Dim on hover** (on by default) so hovering highlights the active series.

## Options

### Streamgraph

| Option       | Values                                                     | Default    |
| ------------ | ---------------------------------------------------------- | ---------- |
| Stack offset | Wiggle, Silhouette, Zero, Expand                           | Wiggle     |
| Stack order  | Inside out, Ascending, Descending, None                    | Inside out |
| Curve type   | Smooth, Linear, Step                                       | Smooth     |
| Color scheme | 21 options across D3 Gradients and Grafana Palettes groups | Cividis    |
| Fill opacity | 0–1                                                        | 0.8        |
| Dim on hover | on/off                                                     | on         |
| Dim opacity  | 0–1 — opacity of non-hovered bands                         | 0.3        |

### Axis

| Option         | Values | Default |
| -------------- | ------ | ------- |
| Show X axis    | on/off | on      |
| Show crosshair | on/off | on      |

### Band Labels

All band label options are hidden until **Show labels** is enabled.

| Option          | Values                                      | Default |
| --------------- | ------------------------------------------- | ------- |
| Show labels     | on/off                                      | off     |
| Label color     | Inverse, Auto (contrast), White, Black      | Inverse |
| Min font size   | px                                          | 8       |
| Max font size   | px                                          | 48      |
| Min band height | px — bands narrower than this are unlabeled | 8       |
| Font scale      | 0.1–1.5                                     | 0.7     |
| Stroke width    | 0–3 px                                      | 0       |
| Opacity fade    | on/off                                      | on      |

### Tooltip

| Option       | Values                      | Default |
| ------------ | --------------------------- | ------- |
| Tooltip mode | Single, All series, Hidden  | Single  |
| Sort order   | None, Ascending, Descending | None    |
| Hide zeros   | on/off                      | off     |
| Max width    | px, blank = automatic       | —       |
| Max height   | px, blank = automatic       | —       |

### Legend

| Option           | Values                                        | Default |
| ---------------- | --------------------------------------------- | ------- |
| Show legend      | on/off                                        | on      |
| Legend mode      | List, Table                                   | List    |
| Legend placement | Bottom, Right                                 | Bottom  |
| Legend values    | Min, Max, Mean, Sum, Count, First, Last, etc. | —       |

## Contributing

Issues and pull requests are welcome at
[github.com/briangann/briangann-streamgraph-panel](https://github.com/briangann/briangann-streamgraph-panel).
