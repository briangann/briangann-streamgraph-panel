import React, { useMemo } from 'react';
import { DisplayValue, PanelProps } from '@grafana/data';
import { PanelDataErrorView } from '@grafana/runtime';
import { LegendDisplayMode } from '@grafana/schema';

import { DEFAULT_LEGEND_CALCS, StreamgraphOptions } from '../types';
import { transformToD3 } from '../data/transformer';
import { computeSeriesCalcs } from '../data/seriesCalcs';
import { StreamGraph } from './StreamGraph';

interface Props extends PanelProps<StreamgraphOptions> {}

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
