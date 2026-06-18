import { DataFrame, Field } from '@grafana/data';

/**
 * Derives the display name for a series field.
 *
 * Wide frames (one frame, multiple numeric fields) use field-level names only —
 * frame.name is irrelevant because it belongs to the whole frame, not a series.
 * Multi-frames (one numeric field per frame) fall back through frame.name since
 * the frame itself represents the series.
 */
export function deriveSeriesName(field: Field, frame: DataFrame, isWide: boolean): string {
  if (isWide) {
    return field.config?.displayName ?? field.name;
  }
  return field.config?.displayName ?? frame.name ?? field.name ?? 'value';
}
