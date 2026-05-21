import { buildStreamgraphYScale } from './buildStreamgraphYScale';

describe('buildStreamgraphYScale', () => {
  it('maps yMin to innerHeight and yMax to 0 (SVG top-down)', () => {
    const data = [[[0, 10], [0, 20]]] as any;
    const scale = buildStreamgraphYScale(data, 400);
    expect(scale(20)).toBeCloseTo(0);
    expect(scale(0)).toBeCloseTo(400);
  });

  it('falls back to [0,1] domain when data is empty', () => {
    const scale = buildStreamgraphYScale([], 400);
    expect(scale(0)).toBeCloseTo(400);
    expect(scale(1)).toBeCloseTo(0);
  });

  it('falls back to [0,1] domain when all values are non-finite', () => {
    const data = [[[NaN, Infinity]]] as any;
    const scale = buildStreamgraphYScale(data, 300);
    expect(scale(0)).toBeCloseTo(300);
    expect(scale(1)).toBeCloseTo(0);
  });

  it('handles negative y values (wiggle/silhouette offsets)', () => {
    const data = [[[-50, 0], [-20, 30]]] as any;
    const scale = buildStreamgraphYScale(data, 400);
    // domain is [-50, 30], range is [400, 0]
    expect(scale(-50)).toBeCloseTo(400);
    expect(scale(30)).toBeCloseTo(0);
  });

  it('scans multiple series for the global extent', () => {
    const data = [
      [[0, 5], [0, 10]],
      [[10, 30], [5, 25]],
    ] as any;
    const scale = buildStreamgraphYScale(data, 100);
    // yMin = 0, yMax = 30
    expect(scale(0)).toBeCloseTo(100);
    expect(scale(30)).toBeCloseTo(0);
  });
});
