import { PanelData } from '@grafana/data';
import { wideDataFrame } from '../__mocks__/models/wideDataFrame';
import { multiDataFrames } from '../__mocks__/models/multiDataFrames';
import { sparseDataFrames } from '../__mocks__/models/sparseDataFrames';
import { transformToD3 } from './transformer';

describe('transformToD3', () => {
  it('returns empty D3WideData for empty series', () => {
    const result = transformToD3({ series: [] } as unknown as PanelData);
    expect(result).toStrictEqual({ rows: [], seriesNames: [], timeRange: [0, 0] });
  });

  describe('wide frame input', () => {
    it('produces correct seriesNames from field names', () => {
      const result = transformToD3({ series: [wideDataFrame] } as unknown as PanelData);
      expect(result.seriesNames).toStrictEqual(['Series A', 'Series B', 'Series C']);
    });

    it('produces rows with correct shape', () => {
      const result = transformToD3({ series: [wideDataFrame] } as unknown as PanelData);
      expect(result.rows).toHaveLength(5);
      expect(result.rows[0]).toStrictEqual({ time: 1000, 'Series A': 1, 'Series B': 4, 'Series C': 2 });
    });

    it('sets correct timeRange', () => {
      const result = transformToD3({ series: [wideDataFrame] } as unknown as PanelData);
      expect(result.timeRange).toStrictEqual([1000, 5000]);
    });
  });

  describe('multi-frame input', () => {
    it('merges frames into wide format with correct row count', () => {
      const result = transformToD3({ series: multiDataFrames } as unknown as PanelData);
      expect(result.rows).toHaveLength(3);
    });

    it('uses frame name as series name when field has no displayName', () => {
      const result = transformToD3({ series: multiDataFrames } as unknown as PanelData);
      expect(result.seriesNames).toStrictEqual(['Series A', 'Series B', 'Series C']);
    });

    it('sets timeRange from merged timestamps', () => {
      const result = transformToD3({ series: multiDataFrames } as unknown as PanelData);
      expect(result.timeRange).toStrictEqual([1000, 3000]);
    });
  });

  describe('sparse / null input', () => {
    it('produces rows for union of all timestamps', () => {
      const result = transformToD3({ series: sparseDataFrames } as unknown as PanelData);
      expect(result.rows).toHaveLength(3);
      expect(result.rows.map((r) => r['time'])).toStrictEqual([1000, 2000, 3000]);
    });

    it('fills missing timestamps with 0', () => {
      const result = transformToD3({ series: sparseDataFrames } as unknown as PanelData);
      const t2000 = result.rows.find((r) => r['time'] === 2000)!;
      expect(t2000['Series A']).toBe(0);
    });

    it('fills null values with 0', () => {
      const result = transformToD3({ series: sparseDataFrames } as unknown as PanelData);
      const t3000 = result.rows.find((r) => r['time'] === 3000)!;
      expect(t3000['Series A']).toBe(0);
    });
  });

  it('handles single series gracefully', () => {
    const result = transformToD3({ series: [multiDataFrames[0]] } as unknown as PanelData);
    expect(result.seriesNames).toHaveLength(1);
    expect(result.rows).toHaveLength(3);
  });

  it('respects field.config.displayName over field.name', () => {
    const { toDataFrame } = require('@grafana/data');
    const frame = toDataFrame({
      fields: [
        { name: 'time', type: 'time', values: [1000, 2000] },
        {
          name: 'rawName',
          type: 'number',
          values: [1, 2],
          config: { displayName: 'Pretty Name' },
        },
        { name: 'other', type: 'number', values: [3, 4] },
      ],
    });
    const result = transformToD3({ series: [frame] } as unknown as PanelData);
    expect(result.seriesNames).toContain('Pretty Name');
  });
});
