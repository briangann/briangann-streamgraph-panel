import { FieldType, PanelData } from '@grafana/data';

export function detectFrameFormat(data: PanelData): 'wide' | 'multi' {
  if (data.series.length !== 1) {
    return 'multi';
  }
  const frame = data.series[0];
  const valueFields = frame.fields.filter((f) => f.type === FieldType.number);
  return valueFields.length > 1 ? 'wide' : 'multi';
}

export function unionTimestamps(timestampArrays: number[][]): number[] {
  const set = new Set<number>();
  for (const arr of timestampArrays) {
    for (const t of arr) {
      set.add(t);
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

export function nullFill(
  rows: Array<Record<string, number>>,
  keys: string[]
): Array<Record<string, number>> {
  return rows.map((row) => {
    let filled: Record<string, number> | null = null;
    for (const key of keys) {
      const v = row[key];
      if (v == null || Number.isNaN(v)) {
        if (!filled) {
          filled = { ...row };
        }
        filled[key] = 0;
      }
    }
    return filled ?? row;
  });
}
