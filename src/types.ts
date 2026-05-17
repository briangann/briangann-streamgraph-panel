export enum StackOffset {
  WIGGLE = 'wiggle',
  SILHOUETTE = 'silhouette',
  ZERO = 'zero',
  EXPAND = 'expand',
}

export enum StackOrder {
  INSIDE_OUT = 'insideOut',
  ASCENDING = 'ascending',
  DESCENDING = 'descending',
  NONE = 'none',
}

export enum CurveType {
  SMOOTH = 'smooth',
  LINEAR = 'linear',
  STEP = 'step',
}

export enum ColorScheme {
  CIVIDIS = 'cividis',
  TURBO = 'turbo',
  VIRIDIS = 'viridis',
  SPECTRAL = 'spectral',
}

export enum LegendPlacement {
  BOTTOM = 'bottom',
  RIGHT = 'right',
}

export interface StreamgraphOptions {
  stackOffset: StackOffset;
  stackOrder: StackOrder;
  curveType: CurveType;
  colorScheme: ColorScheme;
  fillOpacity: number;
  showXAxis: boolean;
  showTooltip: boolean;
  showLegend: boolean;
  legendPlacement: LegendPlacement;
}

export interface D3WideData {
  rows: Array<Record<string, number>>;
  seriesNames: string[];
  timeRange: [number, number];
}
