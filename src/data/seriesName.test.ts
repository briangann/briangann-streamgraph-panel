import { FieldType, type Field, type DataFrame } from '@grafana/data';
import { deriveSeriesName } from './seriesName';

function makeField(name: string, displayName?: string): Field {
  return {
    name,
    type: FieldType.number,
    config: displayName ? { displayName } : {},
    values: [],
  } as unknown as Field;
}

function makeFrame(name?: string): DataFrame {
  return { name, fields: [], length: 0 } as unknown as DataFrame;
}

describe('deriveSeriesName', () => {
  describe('wide-frame path (isWide = true)', () => {
    it('returns displayName when set', () => {
      expect(deriveSeriesName(makeField('raw', 'Display'), makeFrame('frame'), true)).toBe('Display');
    });

    it('falls back to field.name when displayName is absent', () => {
      expect(deriveSeriesName(makeField('fieldName'), makeFrame('frame'), true)).toBe('fieldName');
    });

    it('ignores frame.name even when field.name is absent (wide path does not use frame.name)', () => {
      const field = makeField('');
      field.config = {};
      expect(deriveSeriesName(field, makeFrame('frameName'), true)).toBe('');
    });
  });

  describe('multi-frame path (isWide = false)', () => {
    it('returns displayName when set', () => {
      expect(deriveSeriesName(makeField('raw', 'Display'), makeFrame('frame'), false)).toBe('Display');
    });

    it('falls back to frame.name when displayName is absent', () => {
      expect(deriveSeriesName(makeField('raw'), makeFrame('frameName'), false)).toBe('frameName');
    });

    it('falls back to field.name when both displayName and frame.name are absent', () => {
      expect(deriveSeriesName(makeField('fieldName'), makeFrame(undefined), false)).toBe('fieldName');
    });

    it('returns "value" when field.name is undefined and all other fallbacks are absent', () => {
      const field = makeField('fieldName');
      field.name = undefined as unknown as string;
      field.config = {};
      expect(deriveSeriesName(field, makeFrame(undefined), false)).toBe('value');
    });
  });
});
