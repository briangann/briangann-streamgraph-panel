# Grafana Streamgraph Panel

A [streamgraph](https://en.wikipedia.org/wiki/Streamgraph) panel for Grafana.
Stacked areas flow around a central baseline, so you can see relative volume
across many series at a glance.

![Streamgraph with 5 series, Cividis color scheme](src/img/screenshots/grafana-streamgraph-5series.png)

## What you get

- Four stack offsets (Wiggle, Silhouette, Zero, Expand) and four orderings
- Smooth, Linear, or Step curves
- Cividis, Turbo, Viridis, and Spectral color schemes
- Adjustable fill opacity
- Legend in List or Table mode (Table shows min/max/mean/last/etc.)
- Tooltip: hover one series or see all at once, with sort and hide-zeros
- Works with wide-format and multi-frame time series

![Turbo color scheme](src/img/screenshots/grafana-streamgraph-turbo.png)

## Requirements

Grafana 12.3.0+

## Options

Everything lives in the panel editor sidebar:

![Panel editor](src/img/screenshots/grafana-panel-editor.png)

| Section     | Option           | Values                                         |
| ----------- | ---------------- | ---------------------------------------------- |
| Streamgraph | Stack offset     | Wiggle, Silhouette, Zero, Expand               |
| Streamgraph | Stack order      | Inside out, Ascending, Descending, None        |
| Streamgraph | Curve type       | Smooth, Linear, Step                           |
| Streamgraph | Color scheme     | Cividis, Turbo, Viridis, Spectral              |
| Streamgraph | Fill opacity     | 0 -- 1 (slider)                                |
| Axis        | Show X axis      | on/off                                         |
| Tooltip     | Tooltip mode     | Single, All series, Hidden                     |
| Tooltip     | Sort order       | None, Ascending, Descending                    |
| Tooltip     | Hide zeros       | on/off                                         |
| Legend      | Show legend      | on/off                                         |
| Legend      | Legend mode      | List, Table                                    |
| Legend      | Legend placement | Bottom, Right                                  |
| Legend      | Legend values    | Min, Max, Mean, Sum, Count, First, Last, etc.  |

## License

Apache 2.0
