import { LegendDisplayMode, SortOrder, TooltipDisplayMode } from '@grafana/schema';

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
  PLASMA = 'plasma',
  INFERNO = 'inferno',
  MAGMA = 'magma',
  COOL = 'cool',
  WARM = 'warm',
  RAINBOW = 'rainbow',
  GRAFANA = 'grafana',
}

export enum BandLabelColor {
  INVERSE = 'inverse',
  WHITE = 'white',
  BLACK = 'black',
  AUTO = 'auto',
}

export interface StreamgraphOptions {
  stackOffset: StackOffset;
  stackOrder: StackOrder;
  curveType: CurveType;
  colorScheme: ColorScheme;
  fillOpacity: number;
  showXAxis: boolean;
  showBandLabels: boolean;
  bandLabelColor: BandLabelColor;
  bandLabelMinFontSize: number;
  bandLabelMaxFontSize: number;
  bandLabelMinBandHeight: number;
  bandLabelFontScaleFactor: number;
  bandLabelStrokeWidth: number;
  bandLabelOpacityFade: boolean;
  tooltip: {
    mode: TooltipDisplayMode;
    sort: SortOrder;
    hideZeros: boolean;
  };
  legend: {
    showLegend: boolean;
    placement: 'bottom' | 'right';
    displayMode: LegendDisplayMode;
    calcs?: string[];
  };
}

export const DEFAULT_LEGEND_CALCS = ['min', 'max', 'mean', 'lastNotNull'];

export interface D3WideData {
  rows: Array<Record<string, number>>;
  seriesNames: string[];
  timeRange: [number, number];
}
