import { renderHook } from '@testing-library/react';
import { createTheme } from '@grafana/data';
import { useColorScale } from './useColorScale';
import { ColorScheme } from '../types';

const theme = createTheme();

describe('useColorScale', () => {
  it('returns a function for each D3 gradient scheme', () => {
    const d3Schemes = [
      ColorScheme.CIVIDIS, ColorScheme.TURBO, ColorScheme.VIRIDIS, ColorScheme.SPECTRAL,
      ColorScheme.PLASMA, ColorScheme.INFERNO, ColorScheme.MAGMA, ColorScheme.COOL,
      ColorScheme.WARM, ColorScheme.RAINBOW,
    ];
    for (const scheme of d3Schemes) {
      const { result } = renderHook(() => useColorScale(scheme, 5, theme));
      expect(typeof result.current).toBe('function');
      const color = result.current(0);
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    }
  });

  it('returns different colors for different series indices', () => {
    const { result } = renderHook(() => useColorScale(ColorScheme.TURBO, 5, theme));
    const color0 = result.current(0);
    const color4 = result.current(4);
    expect(color0).not.toBe(color4);
  });

  it('returns Cividis fallback for an unrecognised scheme string', () => {
    const { result: baseline } = renderHook(() => useColorScale(ColorScheme.CIVIDIS, 5, theme));
    const { result: fallback } = renderHook(() =>
      useColorScale('not-a-real-scheme' as ColorScheme, 5, theme)
    );
    // Both should return valid color strings at the same index
    expect(typeof fallback.current(0)).toBe('string');
    expect(fallback.current(0)).toBe(baseline.current(0));
  });

  it('returns a function for a Grafana categorical scheme', () => {
    const { result } = renderHook(() => useColorScale(ColorScheme.GRAFANA_CLASSIC, 5, theme));
    expect(typeof result.current).toBe('function');
    const color = result.current(0);
    expect(typeof color).toBe('string');
  });

  it('updates when seriesCount changes', () => {
    const { result, rerender } = renderHook(
      ({ count }) => useColorScale(ColorScheme.TURBO, count, theme),
      { initialProps: { count: 5 } }
    );
    const color5 = result.current(4);
    rerender({ count: 10 });
    const color10 = result.current(4);
    // With 10 series, index 4 maps to a different fraction of the gradient
    expect(color5).not.toBe(color10);
  });
});
