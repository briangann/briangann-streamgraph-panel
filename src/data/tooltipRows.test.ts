import { SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { buildTooltipRows } from './tooltipRows';

const datum: Record<string, number> = { A: 10, B: 5, C: 0 };
const seriesNames = ['A', 'B', 'C'];
const colorFn = (name: string) => `color-${name}`;

const cfgSingle = { mode: TooltipDisplayMode.Single, sort: SortOrder.None, hideZeros: false };
const cfgMulti = { mode: TooltipDisplayMode.Multi, sort: SortOrder.None, hideZeros: false };
const cfgMultiHide = { mode: TooltipDisplayMode.Multi, sort: SortOrder.None, hideZeros: true };
const cfgMultiAsc = { mode: TooltipDisplayMode.Multi, sort: SortOrder.Ascending, hideZeros: false };
const cfgMultiDesc = { mode: TooltipDisplayMode.Multi, sort: SortOrder.Descending, hideZeros: false };
const cfgMultiAscHide = { mode: TooltipDisplayMode.Multi, sort: SortOrder.Ascending, hideZeros: true };

describe('buildTooltipRows', () => {
  describe('Single mode', () => {
    it('returns exactly one row for the hovered series', () => {
      const rows = buildTooltipRows(datum, seriesNames, 'A', cfgSingle, colorFn);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({ seriesName: 'A', value: 10, color: 'color-A' });
    });

    it('ignores other series even if they have larger values', () => {
      const rows = buildTooltipRows({ A: 1, B: 999 }, ['A', 'B'], 'A', cfgSingle, colorFn);
      expect(rows).toHaveLength(1);
      expect(rows[0].seriesName).toBe('A');
    });

    it('uses 0 when datum has no entry for the hovered series', () => {
      const rows = buildTooltipRows({}, ['X'], 'X', cfgSingle, colorFn);
      expect(rows[0].value).toBe(0);
    });
  });

  describe('Multi mode', () => {
    it('returns a row for every series in order', () => {
      const rows = buildTooltipRows(datum, seriesNames, 'A', cfgMulti, colorFn);
      expect(rows).toHaveLength(3);
      expect(rows.map((r) => r.seriesName)).toEqual(['A', 'B', 'C']);
    });

    it('excludes zero-value rows when hideZeros is true', () => {
      const rows = buildTooltipRows(datum, seriesNames, 'A', cfgMultiHide, colorFn);
      expect(rows.map((r) => r.seriesName)).toEqual(['A', 'B']);
    });

    it('sorts ascending by value', () => {
      const rows = buildTooltipRows(datum, seriesNames, 'A', cfgMultiAsc, colorFn);
      expect(rows.map((r) => r.value)).toEqual([0, 5, 10]);
    });

    it('sorts descending by value', () => {
      const rows = buildTooltipRows(datum, seriesNames, 'A', cfgMultiDesc, colorFn);
      expect(rows.map((r) => r.value)).toEqual([10, 5, 0]);
    });

    it('preserves original order when sort is None', () => {
      const rows = buildTooltipRows(datum, seriesNames, 'A', cfgMulti, colorFn);
      expect(rows.map((r) => r.seriesName)).toEqual(['A', 'B', 'C']);
    });

    it('applies hideZeros before sort', () => {
      const rows = buildTooltipRows(datum, seriesNames, 'A', cfgMultiAscHide, colorFn);
      expect(rows.map((r) => r.value)).toEqual([5, 10]);
      expect(rows.map((r) => r.seriesName)).toEqual(['B', 'A']);
    });

    it('marks the active series with its correct color', () => {
      const rows = buildTooltipRows(datum, seriesNames, 'B', cfgMulti, colorFn);
      const bRow = rows.find((r) => r.seriesName === 'B')!;
      expect(bRow.color).toBe('color-B');
    });
  });
});
