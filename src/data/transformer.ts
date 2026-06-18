import { DataFrame, FieldType, PanelData } from '@grafana/data';
import { D3WideData } from '../types';
import { detectFrameFormat, nullFill, unionTimestamps } from './utils';
import { deriveSeriesName } from './seriesName';

export function transformToD3(data: PanelData): D3WideData {
  if (!data.series.length) {
    return { rows: [], seriesNames: [], timeRange: [0, 0] };
  }

  return detectFrameFormat(data) === 'wide' ? transformWideFrame(data.series[0]) : transformMultiFrames(data.series);
}

function transformWideFrame(frame: DataFrame): D3WideData {
  const timeField = frame.fields.find((f) => f.type === FieldType.time);
  const valueFields = frame.fields.filter((f) => f.type === FieldType.number);

  if (!timeField || !valueFields.length) {
    return { rows: [], seriesNames: [], timeRange: [0, 0] };
  }

  const seriesNames = valueFields.map((f) => deriveSeriesName(f, frame, true));
  const timeValues = timeField.values as number[];

  const rows: Array<Record<string, number>> = timeValues.map((t, i) => {
    const row: Record<string, number> = { time: t };
    valueFields.forEach((field, fi) => {
      row[seriesNames[fi]] = (field.values as Array<number | null>)[i] ?? 0;
    });
    return row;
  });

  const filledRows = nullFill(rows, seriesNames);

  return {
    rows: filledRows,
    seriesNames,
    timeRange: [timeValues[0] ?? 0, timeValues[timeValues.length - 1] ?? 0],
  };
}

function transformMultiFrames(frames: DataFrame[]): D3WideData {
  const frameData = frames
    .map((frame) => {
      const timeField = frame.fields.find((f) => f.type === FieldType.time);
      const valueField = frame.fields.find((f) => f.type === FieldType.number);
      if (!timeField || !valueField) {
        return null;
      }
      const name = deriveSeriesName(valueField, frame, false);
      return {
        name,
        times: timeField.values as number[],
        values: valueField.values as Array<number | null>,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  if (!frameData.length) {
    return { rows: [], seriesNames: [], timeRange: [0, 0] };
  }

  const seriesNames = frameData.map((f) => f.name);
  const allTimestamps = unionTimestamps(frameData.map((f) => f.times));

  const valueMaps = frameData.map((f) => {
    const map = new Map<number, number | null>();
    f.times.forEach((t, i) => map.set(t, f.values[i]));
    return map;
  });

  const rows: Array<Record<string, number>> = allTimestamps.map((t) => {
    const row: Record<string, number> = { time: t };
    seriesNames.forEach((name, i) => {
      row[name] = valueMaps[i].get(t) ?? 0;
    });
    return row;
  });

  const filledRows = nullFill(rows, seriesNames);

  return {
    rows: filledRows,
    seriesNames,
    timeRange: [allTimestamps[0] ?? 0, allTimestamps[allTimestamps.length - 1] ?? 0],
  };
}
