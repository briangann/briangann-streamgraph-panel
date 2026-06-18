import { renderHook } from '@testing-library/react';
import { createTheme } from '@grafana/data';
import { buildColorScale, useColorScale } from './useColorScale';
import { ColorScheme } from '../types';

const theme = createTheme();

describe('buildColorScale', () => {
  const d3Schemes = [
    ColorScheme.CIVIDIS,
    ColorScheme.TURBO,
    ColorScheme.VIRIDIS,
    ColorScheme.SPECTRAL,
    ColorScheme.PLASMA,
    ColorScheme.INFERNO,
    ColorScheme.MAGMA,
    ColorScheme.COOL,
    ColorScheme.WARM,
    ColorScheme.RAINBOW,
  ];

  it('returns a function for each D3 gradient scheme', () => {
    for (const scheme of d3Schemes) {
      const scale = buildColorScale(scheme, 5, theme);
      expect(typeof scale).toBe('function');
      const color = scale(0);
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    }
  });

  it('returns different colors for different series indices', () => {
    const scale = buildColorScale(ColorScheme.TURBO, 5, theme);
    expect(scale(0)).not.toBe(scale(4));
  });

  it('returns Cividis fallback for an unrecognised scheme string', () => {
    const baseline = buildColorScale(ColorScheme.CIVIDIS, 5, theme);
    const fallback = buildColorScale('not-a-real-scheme' as ColorScheme, 5, theme);
    expect(typeof fallback(0)).toBe('string');
    expect(fallback(0)).toBe(baseline(0));
  });

  it('returns a function for a Grafana categorical scheme', () => {
    const scale = buildColorScale(ColorScheme.GRAFANA_CLASSIC, 5, theme);
    expect(typeof scale).toBe('function');
    expect(typeof scale(0)).toBe('string');
  });

  it('updates domain when seriesCount changes', () => {
    const scale5 = buildColorScale(ColorScheme.TURBO, 5, theme);
    const scale10 = buildColorScale(ColorScheme.TURBO, 10, theme);
    // index 4 maps to a different fraction of the gradient with 5 vs 10 series
    expect(scale5(4)).not.toBe(scale10(4));
  });
});

describe('useColorScale', () => {
  it('returns the same function reference when deps are unchanged', () => {
    const { result, rerender } = renderHook(
      ({ scheme, count }: { scheme: ColorScheme; count: number }) => useColorScale(scheme, count, theme),
      { initialProps: { scheme: ColorScheme.TURBO, count: 5 } }
    );
    const first = result.current;
    rerender({ scheme: ColorScheme.TURBO, count: 5 });
    expect(result.current).toBe(first);
  });

  it('returns a new function reference when seriesCount changes', () => {
    const { result, rerender } = renderHook(
      ({ count }: { count: number }) => useColorScale(ColorScheme.TURBO, count, theme),
      { initialProps: { count: 5 } }
    );
    const first = result.current;
    rerender({ count: 10 });
    expect(result.current).not.toBe(first);
  });

  it('returns a new function reference when colorScheme changes', () => {
    const { result, rerender } = renderHook(
      ({ scheme }: { scheme: ColorScheme }) => useColorScale(scheme, 5, theme),
      { initialProps: { scheme: ColorScheme.TURBO } }
    );
    const first = result.current;
    rerender({ scheme: ColorScheme.VIRIDIS });
    expect(result.current).not.toBe(first);
  });
});
