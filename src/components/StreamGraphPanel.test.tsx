import React from 'react';
import { render } from '@testing-library/react';
import { LoadingState } from '@grafana/data';
import { StreamGraphPanel } from './StreamGraphPanel';
import { ColorScheme, CurveType, StackOffset, StackOrder } from "../types";
import { multiDataFrames } from '../__mocks__/models/multiDataFrames';

const baseOptions = {
  stackOffset: StackOffset.WIGGLE,
  stackOrder: StackOrder.INSIDE_OUT,
  curveType: CurveType.SMOOTH,
  colorScheme: ColorScheme.CIVIDIS,
  fillOpacity: 0.8,
  showXAxis: true,
  showTooltip: true,
  legend: { showLegend: true, placement: 'bottom' as const, displayMode: 'list' as const, calcs: [] },
};

const baseTimeRange = {
  from: { valueOf: () => 0 } as any,
  to: { valueOf: () => 999999 } as any,
  raw: { from: 'now-1h', to: 'now' },
};

const baseProps = {
  id: 1,
  width: 800,
  height: 400,
  options: baseOptions,
  fieldConfig: { defaults: {}, overrides: [] },
  timeRange: baseTimeRange,
  timeZone: 'browser',
  transparent: false,
  title: 'Test',
  replaceVariables: (v: string) => v,
  onOptionsChange: jest.fn(),
  onFieldConfigChange: jest.fn(),
  renderCounter: 0,
  eventBus: {} as any,
} as any;

describe('StreamGraphPanel', () => {
  it('does not render an SVG when data.series is empty', () => {
    const { container } = render(
      <StreamGraphPanel
        {...baseProps}
        data={{ series: [], state: LoadingState.Done, timeRange: baseTimeRange } as any}
      />
    );
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders an SVG when data has series', () => {
    const { container } = render(
      <StreamGraphPanel
        {...baseProps}
        data={{ series: multiDataFrames, state: LoadingState.Done, timeRange: baseTimeRange } as any}
      />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('passes width and height to StreamGraph', () => {
    const { container } = render(
      <StreamGraphPanel
        {...baseProps}
        data={{ series: multiDataFrames, state: LoadingState.Done, timeRange: baseTimeRange } as any}
      />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: '800px' });
  });
});
