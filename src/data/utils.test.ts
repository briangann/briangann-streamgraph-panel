import { PanelData } from '@grafana/data';
import { wideDataFrame } from '../__mocks__/models/wideDataFrame';
import { multiDataFrames } from '../__mocks__/models/multiDataFrames';
import { detectFrameFormat, unionTimestamps, nullFill } from './utils';

describe('detectFrameFormat', () => {
  it('returns wide for a single frame with multiple value fields', () => {
    const data = { series: [wideDataFrame] } as PanelData;
    expect(detectFrameFormat(data)).toBe('wide');
  });

  it('returns multi for multiple frames', () => {
    const data = { series: multiDataFrames } as PanelData;
    expect(detectFrameFormat(data)).toBe('multi');
  });

  it('returns multi for a single frame with one value field', () => {
    const data = { series: [multiDataFrames[0]] } as PanelData;
    expect(detectFrameFormat(data)).toBe('multi');
  });
});

describe('unionTimestamps', () => {
  it('merges and deduplicates two sparse timestamp arrays, sorted ascending', () => {
    expect(unionTimestamps([[1000, 3000], [2000, 3000]])).toStrictEqual([1000, 2000, 3000]);
  });

  it('returns a single array unchanged', () => {
    expect(unionTimestamps([[1000, 2000, 3000]])).toStrictEqual([1000, 2000, 3000]);
  });

  it('handles empty input', () => {
    expect(unionTimestamps([])).toStrictEqual([]);
  });
});

describe('nullFill', () => {
  it('fills undefined keys with 0', () => {
    const rows = [{ time: 1000, A: 1 }] as Array<Record<string, number>>;
    expect(nullFill(rows, ['A', 'B'])).toStrictEqual([{ time: 1000, A: 1, B: 0 }]);
  });

  it('fills NaN values with 0', () => {
    const rows = [{ time: 1000, A: NaN }] as Array<Record<string, number>>;
    expect(nullFill(rows, ['A'])).toStrictEqual([{ time: 1000, A: 0 }]);
  });

  it('fills null values with 0', () => {
    const rows = [{ time: 1000, A: null as unknown as number }];
    expect(nullFill(rows, ['A'])).toStrictEqual([{ time: 1000, A: 0 }]);
  });

  it('does not modify non-null values', () => {
    const rows = [{ time: 1000, A: 5 }];
    expect(nullFill(rows, ['A'])).toStrictEqual([{ time: 1000, A: 5 }]);
  });
});
