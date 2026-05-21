import { useMemo } from 'react';
import { scaleSequential } from 'd3-scale';
import { interpolateCividis } from 'd3-scale-chromatic';
import { Field, FieldType, GrafanaTheme2, getFieldColorMode } from '@grafana/data';

import { ColorScheme } from '../types';
import { SCHEME_MAP } from './streamgraphConstants';

export function useColorScale(
  colorScheme: ColorScheme,
  seriesCount: number,
  theme: GrafanaTheme2
): (i: number) => string {
  return useMemo((): ((i: number) => string) => {
    const d3Interpolator = SCHEME_MAP[colorScheme];
    if (d3Interpolator) {
      return scaleSequential(d3Interpolator).domain([0, Math.max(1, seriesCount - 1)]);
    }
    // Grafana registry path — scheme value matches FieldColorModeId string directly
    try {
      const mode = getFieldColorMode(colorScheme);
      if (mode.isContinuous) {
        const fakeField = {
          config: { color: { mode: colorScheme } },
          state: {},
          values: [],
          name: '',
          type: FieldType.number,
        } as unknown as Field;
        const calculator = mode.getCalculator(fakeField, theme);
        const total = Math.max(1, seriesCount - 1);
        return (i: number) => calculator(i, i / total);
      }
      if (mode.getColors) {
        const colors = mode.getColors(theme);
        if (colors.length > 0) {
          return (i: number) => colors[Math.floor(i) % colors.length];
        }
      }
    } catch {
      // getFieldColorMode throws for unrecognised IDs; any other registry error
      // also falls back to the default rather than crashing the panel
    }
    return scaleSequential(interpolateCividis).domain([0, Math.max(1, seriesCount - 1)]);
  }, [colorScheme, seriesCount, theme]);
}
