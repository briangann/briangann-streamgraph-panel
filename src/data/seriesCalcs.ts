import { DataFrame, DisplayValue, FieldType, fieldReducers, reduceField } from '@grafana/data';
import { deriveSeriesName } from './seriesName';

export function computeSeriesCalcs(series: DataFrame[], calcIds: string[]): Map<string, DisplayValue[]> {
  const result = new Map<string, DisplayValue[]>();
  if (!calcIds.length) {
    return result;
  }
  for (const frame of series) {
    const numericFields = frame.fields.filter((f) => f.type === FieldType.number);
    const isWide = numericFields.length > 1;
    for (const field of numericFields) {
      const name = deriveSeriesName(field, frame, isWide);
      const calcs = reduceField({ field, reducers: calcIds });
      result.set(
        name,
        calcIds.map((id) => {
          const raw = calcs[id];
          const base = field.display ? field.display(raw) : { numeric: raw ?? 0, text: String(raw ?? 0) };
          return { ...base, title: fieldReducers.get(id)?.name ?? id };
        })
      );
    }
  }
  return result;
}
