import React, { useMemo } from 'react';
import { PanelProps } from '@grafana/data';
import { PanelDataErrorView } from '@grafana/runtime';

import { StreamgraphOptions } from '../types';
import { transformToD3 } from '../data/transformer';
import { StreamGraph } from './StreamGraph';

interface Props extends PanelProps<StreamgraphOptions> {}

export const StreamGraphPanel: React.FC<Props> = ({
  options,
  data,
  width,
  height,
  fieldConfig,
  id,
}) => {
  const d3Data = useMemo(() => transformToD3(data), [data]);

  if (!data.series.length || !d3Data.rows.length) {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} needsNumberField />;
  }

  return <StreamGraph data={d3Data} width={width} height={height} options={options} />;
};
