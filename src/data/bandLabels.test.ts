import { invertColor, computeBandLabels, BandLabelComputeOptions } from './bandLabels';
import { BandLabelColor } from '../types';

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

function mockSeries(key: string, points: Array<{ y0: number; y1: number; time: number }>): any {
  const series = points.map((p) => {
    const datum = [p.y0, p.y1] as [number, number] & { data: Record<string, number> };
    datum.data = { time: p.time };
    return datum;
  });
  (series as any).key = key;
  return series;
}

describe('computeBandLabels', () => {
  const xScale = (time: number) => time / 10;
  const yScale = (val: number) => 400 - val * 4;
  const colorFn = (_i: number) => 'rgb(0, 32, 81)';

  const innerWidth = 1000;
  const innerHeight = 400;

  const defaultLabelOptions: BandLabelComputeOptions = {
    colorMode: BandLabelColor.INVERSE,
    minFontSize: 8,
    maxFontSize: 48,
    minBandHeight: 8,
    fontScaleFactor: 0.7,
    opacityFade: true,
  };

  it('places label at the widest point', () => {
    const stackedData = [
      mockSeries('A', [
        { y0: 0, y1: 5, time: 1000 },
        { y0: 0, y1: 20, time: 2000 },
        { y0: 0, y1: 10, time: 3000 },
      ]),
    ];
    const labels = computeBandLabels(
      stackedData,
      xScale,
      yScale,
      colorFn,
      innerWidth,
      innerHeight,
      defaultLabelOptions
    );
    expect(labels).toHaveLength(1);
    expect(labels[0].seriesName).toBe('A');
    expect(labels[0].x).toBeCloseTo(xScale(2000) + (xScale(3000) - xScale(2000)) * 0.3);
  });

  it('does not nudge x when peak is at the first point', () => {
    const stackedData = [
      mockSeries('A', [
        { y0: 0, y1: 20, time: 1000 },
        { y0: 0, y1: 10, time: 2000 },
        { y0: 0, y1: 5, time: 3000 },
      ]),
    ];
    const labels = computeBandLabels(
      stackedData,
      xScale,
      yScale,
      colorFn,
      innerWidth,
      innerHeight,
      defaultLabelOptions
    );
    // no 30% nudge — label x is clamped to band-start margin, not shifted toward next point
    expect(labels[0].x).toBeLessThan(xScale(2000));
    expect(labels[0].x).not.toBeCloseTo(xScale(1000) + (xScale(2000) - xScale(1000)) * 0.3);
  });

  it('does not nudge x when peak is at the last point', () => {
    const stackedData = [
      mockSeries('A', [
        { y0: 0, y1: 5, time: 1000 },
        { y0: 0, y1: 10, time: 2000 },
        { y0: 0, y1: 20, time: 3000 },
      ]),
    ];
    const labels = computeBandLabels(
      stackedData,
      xScale,
      yScale,
      colorFn,
      innerWidth,
      innerHeight,
      defaultLabelOptions
    );
    expect(labels[0].x).toBe(xScale(3000));
  });

  it('skips label when band height is below minimum', () => {
    const stackedData = [
      mockSeries('A', [
        { y0: 0, y1: 1, time: 1000 },
        { y0: 0, y1: 1, time: 2000 },
      ]),
    ];
    const labels = computeBandLabels(
      stackedData,
      yScale,
      yScale,
      colorFn,
      innerWidth,
      innerHeight,
      defaultLabelOptions
    );
    expect(labels).toHaveLength(0);
  });

  it('places label at the middle point when all band heights are equal', () => {
    const stackedData = [
      mockSeries('A', [
        { y0: 0, y1: 20, time: 1000 },
        { y0: 0, y1: 20, time: 2000 },
        { y0: 0, y1: 20, time: 3000 },
        { y0: 0, y1: 20, time: 4000 },
        { y0: 0, y1: 20, time: 5000 },
      ]),
    ];
    const labels = computeBandLabels(
      stackedData,
      xScale,
      yScale,
      colorFn,
      innerWidth,
      innerHeight,
      defaultLabelOptions
    );
    expect(labels).toHaveLength(1);
    expect(labels[0].x).toBeCloseTo(xScale(3000) + (xScale(4000) - xScale(3000)) * 0.3);
  });

  it('computes opacity ramp between 8px and 16px band height', () => {
    // yScale maps: val => 400 - val*4, so height of band y0=0,y1=3 => |yScale(0)-yScale(3)| = |400-388| = 12px
    const stackedData = [mockSeries('A', [{ y0: 0, y1: 3, time: 1000 }])];
    const labels = computeBandLabels(
      stackedData,
      (t: number) => t / 10,
      yScale,
      colorFn,
      innerWidth,
      innerHeight,
      defaultLabelOptions
    );
    expect(labels).toHaveLength(1);
    expect(labels[0].opacity).toBe(0.5);
  });

  it('caps font size at 48px', () => {
    // yScale maps: height of band y0=0,y1=100 => |400-0| = 400px; innerHeight=2000 keeps panel cap above 48
    const stackedData = [mockSeries('A', [{ y0: 0, y1: 100, time: 1000 }])];
    const labels = computeBandLabels(
      stackedData,
      (t: number) => t / 10,
      yScale,
      colorFn,
      innerWidth,
      2000,
      defaultLabelOptions
    );
    expect(labels[0].fontSize).toBe(48);
  });

  it('uses inverted band color', () => {
    const stackedData = [mockSeries('A', [{ y0: 0, y1: 20, time: 1000 }])];
    const labels = computeBandLabels(
      stackedData,
      (t: number) => t / 10,
      yScale,
      colorFn,
      innerWidth,
      innerHeight,
      defaultLabelOptions
    );
    expect(labels[0].color).toBe('rgb(255, 223, 174)');
  });

  it('uses white when colorMode is WHITE', () => {
    const stackedData = [mockSeries('A', [{ y0: 0, y1: 20, time: 1000 }])];
    const labels = computeBandLabels(stackedData, (t: number) => t / 10, yScale, colorFn, innerWidth, innerHeight, {
      ...defaultLabelOptions,
      colorMode: BandLabelColor.WHITE,
    });
    expect(labels[0].color).toBe('rgb(255, 255, 255)');
  });

  it('uses black when colorMode is BLACK', () => {
    const stackedData = [mockSeries('A', [{ y0: 0, y1: 20, time: 1000 }])];
    const labels = computeBandLabels(stackedData, (t: number) => t / 10, yScale, colorFn, innerWidth, innerHeight, {
      ...defaultLabelOptions,
      colorMode: BandLabelColor.BLACK,
    });
    expect(labels[0].color).toBe('rgb(0, 0, 0)');
  });

  it('auto contrast returns black on a light band', () => {
    // rgb(200, 200, 200) luminance ≈ 0.78 → dark text
    const lightColorFn = (_i: number) => 'rgb(200, 200, 200)';
    const stackedData = [mockSeries('A', [{ y0: 0, y1: 20, time: 1000 }])];
    const labels = computeBandLabels(
      stackedData,
      (t: number) => t / 10,
      yScale,
      lightColorFn,
      innerWidth,
      innerHeight,
      { ...defaultLabelOptions, colorMode: BandLabelColor.AUTO }
    );
    expect(labels[0].color).toBe('rgb(0, 0, 0)');
  });

  it('auto contrast returns white on a dark band', () => {
    // rgb(0, 32, 81) luminance ≈ 0.09 → light text
    const darkColorFn = (_i: number) => 'rgb(0, 32, 81)';
    const stackedData = [mockSeries('A', [{ y0: 0, y1: 20, time: 1000 }])];
    const labels = computeBandLabels(stackedData, (t: number) => t / 10, yScale, darkColorFn, innerWidth, innerHeight, {
      ...defaultLabelOptions,
      colorMode: BandLabelColor.AUTO,
    });
    expect(labels[0].color).toBe('rgb(255, 255, 255)');
  });

  describe('font size guards', () => {
    const singlePoint = [mockSeries('A', [{ y0: 0, y1: 20, time: 1000 }])];
    const localXScale = (t: number) => t / 10;

    it('clamps font to user-configured max', () => {
      // pixelHeight=80px; at maxFontSize=20 the font should not exceed 20
      const labels = computeBandLabels(singlePoint, localXScale, yScale, colorFn, innerWidth, 2000, {
        ...defaultLabelOptions,
        minFontSize: 8,
        maxFontSize: 20,
      });
      expect(labels[0].fontSize).toBeLessThanOrEqual(20);
    });

    it('respects user-configured min', () => {
      const labels = computeBandLabels(singlePoint, localXScale, yScale, colorFn, innerWidth, innerHeight, {
        ...defaultLabelOptions,
        minFontSize: 16,
        maxFontSize: 48,
      });
      expect(labels[0].fontSize).toBeGreaterThanOrEqual(16);
    });

    it('guards against min >= max by clamping effectiveMax above effectiveMin', () => {
      // min=30, max=20 → effectiveMin=30, effectiveMax=max(31, DEFAULT_MAX_FONT=48)=48
      const labels = computeBandLabels(singlePoint, localXScale, yScale, colorFn, innerWidth, 2000, {
        ...defaultLabelOptions,
        minFontSize: 30,
        maxFontSize: 20,
      });
      expect(labels[0].fontSize).toBeGreaterThanOrEqual(30);
    });

    it('falls back to defaults for non-finite values', () => {
      const labels = computeBandLabels(singlePoint, localXScale, yScale, colorFn, innerWidth, 2000, {
        ...defaultLabelOptions,
        minFontSize: NaN,
        maxFontSize: NaN,
      });
      expect(labels[0].fontSize).toBeGreaterThanOrEqual(8);
      expect(labels[0].fontSize).toBeLessThanOrEqual(48);
    });
  });

  describe('minBandHeight option', () => {
    // yScale: val => 400 - val*4, so pixelHeight for y1=N => N*4 px
    // threshold=20: y1=4 → 16px (below), y1=6 → 24px (above)
    const localXScale = (t: number) => t / 10;

    it('hides a band whose pixel height is below the threshold', () => {
      // pixelHeight = 4*4 = 16px < minBandHeight=20 → opacity=0 → skipped
      const stackedData = [mockSeries('A', [{ y0: 0, y1: 4, time: 1000 }])];
      const labels = computeBandLabels(stackedData, localXScale, yScale, colorFn, innerWidth, innerHeight, {
        ...defaultLabelOptions,
        minBandHeight: 20,
        opacityFade: false,
      });
      expect(labels).toHaveLength(0);
    });

    it('shows a band whose pixel height is above the threshold', () => {
      // pixelHeight = 6*4 = 24px > minBandHeight=20 → shown
      const stackedData = [mockSeries('A', [{ y0: 0, y1: 6, time: 1000 }])];
      const labels = computeBandLabels(stackedData, localXScale, yScale, colorFn, innerWidth, innerHeight, {
        ...defaultLabelOptions,
        minBandHeight: 20,
        opacityFade: false,
      });
      expect(labels).toHaveLength(1);
    });
  });

  describe('opacityFade option', () => {
    // yScale: pixelHeight for y0=0,y1=5 => 5*4=20px; minBandHeight=8; in fade zone (8..16) if height <=16
    // Use y1=5 → 20px which is above the 16px fade ceiling → opacity=1 with fade on
    // Use y1=3 → 12px which is in fade zone → opacity=0.5 with fade on, opacity=1 with fade off
    const localXScale = (t: number) => t / 10;

    it('gives opacity=1 for above-threshold band when opacityFade is false', () => {
      // pixelHeight=12px, minBandHeight=8 → in fade zone normally, but opacityFade=false → opacity=1
      const stackedData = [mockSeries('A', [{ y0: 0, y1: 3, time: 1000 }])];
      const labels = computeBandLabels(stackedData, localXScale, yScale, colorFn, innerWidth, innerHeight, {
        ...defaultLabelOptions,
        opacityFade: false,
      });
      expect(labels).toHaveLength(1);
      expect(labels[0].opacity).toBe(1);
    });

    it('gives fractional opacity for in-fade-zone band when opacityFade is true', () => {
      // pixelHeight=12px, minBandHeight=8, FADE_RANGE=8 → opacity=(12-8)/8=0.5
      const stackedData = [mockSeries('A', [{ y0: 0, y1: 3, time: 1000 }])];
      const labels = computeBandLabels(stackedData, localXScale, yScale, colorFn, innerWidth, innerHeight, {
        ...defaultLabelOptions,
        opacityFade: true,
      });
      expect(labels).toHaveLength(1);
      expect(labels[0].opacity).toBe(0.5);
    });
  });

  describe('fontScaleFactor option', () => {
    // yScale: pixelHeight for y0=0,y1=20 => 20*4=80px
    // font = clamp(min, pixelHeight * scaleFactor, max)
    // factor=1.0 → 80px clamped to 48; factor=0.7 → 56px clamped to 48
    // Use innerHeight=2000 so panel-height cap (2000*0.13=260) doesn't interfere
    const localXScale = (t: number) => t / 10;
    const tallSeries = [mockSeries('A', [{ y0: 0, y1: 20, time: 1000 }])];

    it('produces a larger font with factor=1.0 than factor=0.5 for the same band', () => {
      // pixelHeight=80px; factor=0.5 → raw=40, factor=1.0 → raw=80 capped at 48
      // factor=0.5 stays below 48, factor=1.0 hits 48
      const labelsHigh = computeBandLabels(tallSeries, localXScale, yScale, colorFn, innerWidth, 2000, {
        ...defaultLabelOptions,
        fontScaleFactor: 1.0,
      });
      const labelsLow = computeBandLabels(tallSeries, localXScale, yScale, colorFn, innerWidth, 2000, {
        ...defaultLabelOptions,
        fontScaleFactor: 0.5,
      });
      expect(labelsHigh[0].fontSize).toBeGreaterThan(labelsLow[0].fontSize);
    });

    it('scales font proportionally before hitting the cap', () => {
      // pixelHeight=80px; factor=0.3 → raw=24; factor=0.5 → raw=40; both below 48 and above 8
      const labels30 = computeBandLabels(tallSeries, localXScale, yScale, colorFn, innerWidth, 2000, {
        ...defaultLabelOptions,
        fontScaleFactor: 0.3,
      });
      const labels50 = computeBandLabels(tallSeries, localXScale, yScale, colorFn, innerWidth, 2000, {
        ...defaultLabelOptions,
        fontScaleFactor: 0.5,
      });
      expect(labels50[0].fontSize).toBeGreaterThan(labels30[0].fontSize);
    });
  });
});
