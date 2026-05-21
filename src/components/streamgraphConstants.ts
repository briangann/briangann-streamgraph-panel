import {
  curveBasis,
  curveLinear,
  curveStep,
  stackOffsetExpand,
  stackOffsetNone,
  stackOffsetSilhouette,
  stackOffsetWiggle,
  stackOrderAscending,
  stackOrderDescending,
  stackOrderInsideOut,
  stackOrderNone,
} from 'd3-shape';
import {
  interpolateCividis,
  interpolateCool,
  interpolateInferno,
  interpolateMagma,
  interpolatePlasma,
  interpolateRainbow,
  interpolateSpectral,
  interpolateTurbo,
  interpolateViridis,
  interpolateWarm,
} from 'd3-scale-chromatic';

import { ColorScheme, CurveType, StackOffset, StackOrder } from '../types';

export const MARGIN = { top: 10, right: 10, left: 10 };
export const AXIS_HEIGHT = 30;

export const OFFSET_MAP = {
  [StackOffset.WIGGLE]: stackOffsetWiggle,
  [StackOffset.SILHOUETTE]: stackOffsetSilhouette,
  [StackOffset.ZERO]: stackOffsetNone,
  [StackOffset.EXPAND]: stackOffsetExpand,
};

export const ORDER_MAP = {
  [StackOrder.INSIDE_OUT]: stackOrderInsideOut,
  [StackOrder.ASCENDING]: stackOrderAscending,
  [StackOrder.DESCENDING]: stackOrderDescending,
  [StackOrder.NONE]: stackOrderNone,
};

export const CURVE_MAP = {
  [CurveType.SMOOTH]: curveBasis,
  [CurveType.LINEAR]: curveLinear,
  [CurveType.STEP]: curveStep,
};

export const SCHEME_MAP: Partial<Record<ColorScheme, (t: number) => string>> = {
  [ColorScheme.CIVIDIS]: interpolateCividis,
  [ColorScheme.TURBO]: interpolateTurbo,
  [ColorScheme.VIRIDIS]: interpolateViridis,
  [ColorScheme.SPECTRAL]: interpolateSpectral,
  [ColorScheme.PLASMA]: interpolatePlasma,
  [ColorScheme.INFERNO]: interpolateInferno,
  [ColorScheme.MAGMA]: interpolateMagma,
  [ColorScheme.COOL]: interpolateCool,
  [ColorScheme.WARM]: interpolateWarm,
  [ColorScheme.RAINBOW]: interpolateRainbow,
};
