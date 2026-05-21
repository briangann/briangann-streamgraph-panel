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
  if (timestampArrays.length === 0) {
    return [];
  }
  // Each input array is already time-sorted. k-way merge is O(N) vs O(N log N)
  // for a flat Set+sort when there are many frames.
  let result = timestampArrays[0];
  for (let i = 1; i < timestampArrays.length; i++) {
    result = mergeSortedUnique(result, timestampArrays[i]);
  }
  return result;
}

/** Merge two sorted (ascending) number arrays, deduplicating equal values. */
function mergeSortedUnique(a: number[], b: number[]): number[] {
  const out: number[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] < b[j]) {
      out.push(a[i++]);
    } else if (a[i] > b[j]) {
      out.push(b[j++]);
    } else {
      out.push(a[i++]);
      j++;
    }
  }
  while (i < a.length) {
    out.push(a[i++]);
  }
  while (j < b.length) {
    out.push(b[j++]);
  }
  return out;
}

export function nullFill(rows: Array<Record<string, number>>, keys: string[]): Array<Record<string, number>> {
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
