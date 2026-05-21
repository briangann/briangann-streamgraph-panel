import { toDataFrame } from '@grafana/data';
import { computeSeriesCalcs } from './seriesCalcs';

describe('computeSeriesCalcs', () => {
  it('returns an empty map when calcIds is empty', () => {
    const frame = toDataFrame({ fields: [{ name: 'value', values: [1, 2, 3] }] });
    const result = computeSeriesCalcs([frame], []);
    expect(result.size).toBe(0);
  });

  it('returns an empty map when series is empty', () => {
    const result = computeSeriesCalcs([], ['mean']);
    expect(result.size).toBe(0);
  });

  it('uses field.name for wide format (multiple numeric fields in one frame)', () => {
    const frame = toDataFrame({
      fields: [
        { name: 'time', type: 'time', values: [1000, 2000] },
        { name: 'Alpha', type: 'number', values: [10, 20] },
        { name: 'Beta', type: 'number', values: [30, 40] },
      ],
    });
    const result = computeSeriesCalcs([frame], ['mean']);
    expect(result.has('Alpha')).toBe(true);
    expect(result.has('Beta')).toBe(true);
  });

  it('uses frame.name for multi-frame format (single numeric field per frame)', () => {
    const frame = toDataFrame({
      name: 'Series A',
      fields: [
        { name: 'time', type: 'time', values: [1000] },
        { name: 'value', type: 'number', values: [42] },
      ],
    });
    const result = computeSeriesCalcs([frame], ['mean']);
    expect(result.has('Series A')).toBe(true);
    expect(result.has('value')).toBe(false);
  });

  it('prefers displayName from field.config over field.name', () => {
    const frame = toDataFrame({
      fields: [
        { name: 'time', type: 'time', values: [1000, 2000] },
        { name: 'raw_field', config: { displayName: 'Pretty Name' }, type: 'number', values: [1, 2] },
        { name: 'other', type: 'number', values: [3, 4] },
      ],
    });
    const result = computeSeriesCalcs([frame], ['mean']);
    expect(result.has('Pretty Name')).toBe(true);
    expect(result.has('raw_field')).toBe(false);
  });

  it('returns DisplayValue entries with the calc title', () => {
    const frame = toDataFrame({
      fields: [
        { name: 'time', type: 'time', values: [1000, 2000, 3000] },
        { name: 'A', type: 'number', values: [10, 20, 30] },
        { name: 'B', type: 'number', values: [5, 5, 5] },
      ],
    });
    const result = computeSeriesCalcs([frame], ['mean', 'max']);
    const aCalcs = result.get('A')!;
    expect(aCalcs).toHaveLength(2);
    // Each entry should have a title string
    expect(typeof aCalcs[0].title).toBe('string');
    expect(typeof aCalcs[1].title).toBe('string');
  });

  it('skips non-numeric fields', () => {
    const frame = toDataFrame({
      fields: [
        { name: 'time', type: 'time', values: [1000] },
        { name: 'label', type: 'string', values: ['foo'] },
        { name: 'metric', type: 'number', values: [99] },
      ],
    });
    const result = computeSeriesCalcs([frame], ['mean']);
    expect(result.has('label')).toBe(false);
    expect(result.has('metric')).toBe(true);
  });
});
