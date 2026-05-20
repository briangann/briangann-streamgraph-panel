import { invertColor, computeBandLabels, BandLabelComputeOptions } from './bandLabels';
import { BandLabelColor } from '../types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function mockSeries(key: string, points: Array<{ y0: number; y1: number; time: number }>): any {
  const series = points.map((p) => {
    const datum = [p.y0, p.y1] as [number, number] & { data: Record<string, number> };
    datum.data = { time: p.time };
    return datum;
  });
  (series as any).key = key;
  return series;
}

// ─── invertColor ─────────────────────────────────────────────────────────────

describe('invertColor', () => {
  it('inverts black to white', () => {
    expect(invertColor('rgb(0, 0, 0)')).toBe('rgb(255, 255, 255)');
  });

  it('inverts white to black', () => {
    expect(invertColor('rgb(255, 255, 255)')).toBe('rgb(0, 0, 0)');
  });

  it('inverts an arbitrary color', () => {
    expect(invertColor('rgb(0, 32, 81)')).toBe('rgb(255, 223, 174)');
  });

  it('returns white for unparseable input', () => {
    expect(invertColor('not-a-color')).toBe('rgb(255, 255, 255)');
  });
});

// ─── computeBandLabels ───────────────────────────────────────────────────────

describe('computeBandLabels', () => {
  const xScale = (time: number) => time / 10;
  const yScale = (val: number) => 400 - val * 4;
  const colorFn = (_i: number) => 'rgb(0, 32, 81)';
  const innerWidth = 1000;
  const innerHeight = 400;

  const defaultOptions: BandLabelComputeOptions = {
    colorMode: BandLabelColor.INVERSE,
    minFontSize: 8,
    maxFontSize: 48,
    minBandHeight: 8,
    fontScaleFactor: 0.7,
    opacityFade: true,
  };

  // Shorthand: call computeBandLabels with shared defaults, override as needed.
  function compute(
    stackedData: any[],
    overrides: Partial<BandLabelComputeOptions> = {},
    panelHeight = innerHeight
  ) {
    return computeBandLabels(stackedData, xScale, yScale, colorFn, innerWidth, panelHeight, {
      ...defaultOptions,
      ...overrides,
    });
  }

  // Single visible band, used by many option tests.
  const oneBand = [mockSeries('A', [{ y0: 0, y1: 20, time: 1000 }])];

  // ── edge cases ────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('skips series with no data points', () => {
      const emptySeries: any = [];
      (emptySeries as any).key = 'A';
      expect(compute([emptySeries])).toHaveLength(0);
    });

    it('skips series where all band heights are negative (inverted y1 < y0)', () => {
      // y1 < y0 everywhere → h = y1-y0 < 0, maxIndices stays empty
      const labels = compute([mockSeries('A', [{ y0: 10, y1: 5, time: 1000 }])]);
      expect(labels).toHaveLength(0);
    });
  });

  // ── label placement ────────────────────────────────────────────────────────

  describe('label placement', () => {
    it('places label at the widest point', () => {
      const labels = compute([
        mockSeries('A', [
          { y0: 0, y1: 5, time: 1000 },
          { y0: 0, y1: 20, time: 2000 },
          { y0: 0, y1: 10, time: 3000 },
        ]),
      ]);
      expect(labels).toHaveLength(1);
      expect(labels[0].seriesName).toBe('A');
      expect(labels[0].x).toBeCloseTo(xScale(2000) + (xScale(3000) - xScale(2000)) * 0.3);
    });

    it('does not nudge x when peak is at the first point', () => {
      const labels = compute([
        mockSeries('A', [
          { y0: 0, y1: 20, time: 1000 },
          { y0: 0, y1: 10, time: 2000 },
          { y0: 0, y1: 5, time: 3000 },
        ]),
      ]);
      // no 30% nudge — clamped to band-start margin, not shifted toward next point
      expect(labels[0].x).toBeLessThan(xScale(2000));
      expect(labels[0].x).not.toBeCloseTo(xScale(1000) + (xScale(2000) - xScale(1000)) * 0.3);
    });

    it('does not nudge x when peak is at the last point', () => {
      const labels = compute([
        mockSeries('A', [
          { y0: 0, y1: 5, time: 1000 },
          { y0: 0, y1: 10, time: 2000 },
          { y0: 0, y1: 20, time: 3000 },
        ]),
      ]);
      expect(labels[0].x).toBe(xScale(3000));
    });

    it('places label at the middle point when all band heights are equal', () => {
      const labels = compute([
        mockSeries('A', [
          { y0: 0, y1: 20, time: 1000 },
          { y0: 0, y1: 20, time: 2000 },
          { y0: 0, y1: 20, time: 3000 },
          { y0: 0, y1: 20, time: 4000 },
          { y0: 0, y1: 20, time: 5000 },
        ]),
      ]);
      expect(labels).toHaveLength(1);
      expect(labels[0].x).toBeCloseTo(xScale(3000) + (xScale(4000) - xScale(3000)) * 0.3);
    });
  });

  // ── visibility threshold ───────────────────────────────────────────────────

  describe('visibility threshold', () => {
    it('skips label when band height is below minimum', () => {
      const labels = computeBandLabels(
        [mockSeries('A', [{ y0: 0, y1: 1, time: 1000 }, { y0: 0, y1: 1, time: 2000 }])],
        yScale, yScale, colorFn, innerWidth, innerHeight, defaultOptions
      );
      expect(labels).toHaveLength(0);
    });

    it('hides a band below a custom minBandHeight', () => {
      // pixelHeight = 4*4 = 16px < minBandHeight=20
      const labels = compute(
        [mockSeries('A', [{ y0: 0, y1: 4, time: 1000 }])],
        { minBandHeight: 20, opacityFade: false }
      );
      expect(labels).toHaveLength(0);
    });

    it('shows a band above a custom minBandHeight', () => {
      // pixelHeight = 6*4 = 24px > minBandHeight=20
      const labels = compute(
        [mockSeries('A', [{ y0: 0, y1: 6, time: 1000 }])],
        { minBandHeight: 20, opacityFade: false }
      );
      expect(labels).toHaveLength(1);
    });
  });

  // ── opacity ────────────────────────────────────────────────────────────────

  describe('opacity', () => {
    // yScale: y1=3 → pixelHeight=12px; minBandHeight=8; FADE_RANGE=8 → opacity=(12-8)/8=0.5
    const fadeSeries = [mockSeries('A', [{ y0: 0, y1: 3, time: 1000 }])];

    it('ramps opacity when band is in the fade zone', () => {
      const labels = compute(fadeSeries, { opacityFade: true });
      expect(labels[0].opacity).toBe(0.5);
    });

    it('snaps to full opacity above threshold when opacity fade is off', () => {
      const labels = compute(fadeSeries, { opacityFade: false });
      expect(labels[0].opacity).toBe(1);
    });
  });

  // ── label color modes ──────────────────────────────────────────────────────

  describe('label color modes', () => {
    it('inverts the band color (INVERSE)', () => {
      const labels = compute(oneBand, { colorMode: BandLabelColor.INVERSE });
      expect(labels[0].color).toBe('rgb(255, 223, 174)');
    });

    it('uses white (WHITE)', () => {
      const labels = compute(oneBand, { colorMode: BandLabelColor.WHITE });
      expect(labels[0].color).toBe('rgb(255, 255, 255)');
    });

    it('uses black (BLACK)', () => {
      const labels = compute(oneBand, { colorMode: BandLabelColor.BLACK });
      expect(labels[0].color).toBe('rgb(0, 0, 0)');
    });

    it('auto contrast picks dark text on a light band', () => {
      // rgb(200, 200, 200) luminance ≈ 0.78 → Grafana returns near-black
      const labels = computeBandLabels(
        oneBand, xScale, yScale,
        () => 'rgb(200, 200, 200)',
        innerWidth, innerHeight,
        { ...defaultOptions, colorMode: BandLabelColor.AUTO }
      );
      expect(labels[0].color).toBe('rgb(32, 34, 38)');
    });

    it('auto contrast picks light text on a dark band', () => {
      // rgb(0, 32, 81) luminance ≈ 0.09 → Grafana returns near-white
      const labels = compute(oneBand, { colorMode: BandLabelColor.AUTO });
      expect(labels[0].color).toBe('rgb(247, 248, 250)');
    });
  });

  // ── font sizing ────────────────────────────────────────────────────────────

  describe('font sizing', () => {
    // Use panelHeight=2000 so the panel-height cap doesn't interfere.
    const tallPanel = 2000;
    const tallBand = [mockSeries('A', [{ y0: 0, y1: 100, time: 1000 }])];

    it('caps font at maxFontSize', () => {
      // pixelHeight=400px; without a cap font would be huge
      const labels = compute(tallBand, {}, tallPanel);
      expect(labels[0].fontSize).toBe(48);
    });

    it('clamps font to a custom max', () => {
      const labels = compute(oneBand, { maxFontSize: 20 }, tallPanel);
      expect(labels[0].fontSize).toBeLessThanOrEqual(20);
    });

    it('floors font at a custom min', () => {
      const labels = compute(oneBand, { minFontSize: 16 });
      expect(labels[0].fontSize).toBeGreaterThanOrEqual(16);
    });

    it('resolves min >= max by raising effective max', () => {
      // min=30 > max=20 → guard kicks in, font still renders without error
      const labels = compute(oneBand, { minFontSize: 30, maxFontSize: 20 }, tallPanel);
      expect(labels[0].fontSize).toBeGreaterThanOrEqual(30);
    });

    it('falls back to defaults for NaN values', () => {
      const labels = compute(oneBand, { minFontSize: NaN, maxFontSize: NaN }, tallPanel);
      expect(labels[0].fontSize).toBeGreaterThanOrEqual(8);
      expect(labels[0].fontSize).toBeLessThanOrEqual(48);
    });

    it('produces a larger font with a higher fontScaleFactor', () => {
      // pixelHeight=80px; factor=0.5 → raw=40; factor=1.0 → raw=80 capped at 48
      const labelsHigh = compute(oneBand, { fontScaleFactor: 1.0 }, tallPanel);
      const labelsLow = compute(oneBand, { fontScaleFactor: 0.5 }, tallPanel);
      expect(labelsHigh[0].fontSize).toBeGreaterThan(labelsLow[0].fontSize);
    });

    it('scales font proportionally before hitting the cap', () => {
      // pixelHeight=80px; factor=0.3 → 24px; factor=0.5 → 40px; both below cap
      const labels30 = compute(oneBand, { fontScaleFactor: 0.3 }, tallPanel);
      const labels50 = compute(oneBand, { fontScaleFactor: 0.5 }, tallPanel);
      expect(labels50[0].fontSize).toBeGreaterThan(labels30[0].fontSize);
    });
  });
});
