import React, { useMemo } from 'react';
import { DataFrame, DisplayValue, FieldType, PanelProps, fieldReducers, reduceField } from '@grafana/data';
import { PanelDataErrorView } from '@grafana/runtime';
import { LegendDisplayMode } from '@grafana/schema';

import { DEFAULT_LEGEND_CALCS, StreamgraphOptions } from '../types';
import { transformToD3 } from '../data/transformer';
import { StreamGraph } from './StreamGraph';

interface Props extends PanelProps<StreamgraphOptions> {}

function computeSeriesCalcs(series: DataFrame[], calcIds: string[]): Map<string, DisplayValue[]> {
  const result = new Map<string, DisplayValue[]>();
  if (!calcIds.length) {
    return result;
  }
  for (const frame of series) {
    // Must mirror transformer.ts name derivation: wide uses field.name fallback, multi-frame uses frame.name
    const numericFields = frame.fields.filter((f) => f.type === FieldType.number);
    const isWide = numericFields.length > 1;
    for (const field of numericFields) {
      const name = field.config?.displayName ?? (isWide ? field.name : (frame.name ?? field.name ?? 'value'));
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

export const StreamGraphPanel: React.FC<Props> = ({ options, data, width, height, fieldConfig, id, onChangeTimeRange }) => {
  const d3Data = useMemo(() => transformToD3(data), [data]);
  const seriesCalcs = useMemo(() => {
    if (options.legend.displayMode !== LegendDisplayMode.Table) {
      return new Map<string, DisplayValue[]>();
    }
    return computeSeriesCalcs(data.series, options.legend.calcs ?? DEFAULT_LEGEND_CALCS);
  }, [data.series, options.legend.calcs, options.legend.displayMode]);

  if (!data.series.length || !d3Data.rows.length) {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} needsNumberField />;
  }

  return (
    <StreamGraph
      data={d3Data}
      width={width}
      height={height}
      options={options}
      seriesCalcs={seriesCalcs}
      onChangeTimeRange={onChangeTimeRange}
    />
  );
};
