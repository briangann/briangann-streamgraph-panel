import { SortOrder, TooltipDisplayMode } from '@grafana/schema';

export interface SeriesRow {
  seriesName: string;
  value: number;
  color: string;
}

export interface TooltipRowConfig {
  mode: TooltipDisplayMode;
  sort: SortOrder;
  hideZeros: boolean;
}

/**
 * Builds the tooltip row array for a given hover position.
 *
 * Single mode: one row for the hovered series only.
 * Multi mode: all series, with optional zero-filtering and sorting applied
 * in that order (filter before sort so zero rows don't affect sort stability).
 */
export function buildTooltipRows(
  datum: Record<string, number>,
  seriesNames: string[],
  hoveredSeries: string,
  config: TooltipRowConfig,
  colorFn: (name: string) => string
): SeriesRow[] {
  if (config.mode === TooltipDisplayMode.Single) {
    return [{ seriesName: hoveredSeries, value: datum[hoveredSeries] ?? 0, color: colorFn(hoveredSeries) }];
  }
  let rows = seriesNames.map((name) => ({ seriesName: name, value: datum[name] ?? 0, color: colorFn(name) }));
  if (config.hideZeros) {
    rows = rows.filter((r) => r.value !== 0);
  }
  if (config.sort === SortOrder.Ascending) {
    rows.sort((a, b) => a.value - b.value);
  } else if (config.sort === SortOrder.Descending) {
    rows.sort((a, b) => b.value - a.value);
  }
  return rows;
}
