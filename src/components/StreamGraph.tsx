import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  area,
  curveBasis,
  curveLinear,
  curveStep,
  stack,
  stackOffsetExpand,
  stackOffsetNone,
  stackOffsetSilhouette,
  stackOffsetWiggle,
  stackOrderAscending,
  stackOrderDescending,
  stackOrderInsideOut,
  stackOrderNone,
} from 'd3-shape';
import { scaleLinear, scaleSequential, scaleTime } from 'd3-scale';
import {
  interpolateCividis,
  interpolateSpectral,
  interpolateTurbo,
  interpolateViridis,
} from 'd3-scale-chromatic';
import { select } from 'd3-selection';
import { VizLegend } from '@grafana/ui';
import { LegendDisplayMode } from '@grafana/schema';

import {
  ColorScheme,
  CurveType,
  D3WideData,
  StackOffset,
  StackOrder,
  StreamgraphOptions,
} from '../types';
import { renderAxis } from './Axis';

type StackDatum = [number, number] & { data: Record<string, number> };

interface StreamGraphProps {
  data: D3WideData;
  width: number;
  height: number;
  options: StreamgraphOptions;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  seriesName: string;
  value: number;
}

const MARGIN = { top: 10, right: 10, left: 10 };
const AXIS_HEIGHT = 30;
const LEGEND_HEIGHT = 32;
const LEGEND_WIDTH = 160;

const OFFSET_MAP = {
  [StackOffset.WIGGLE]: stackOffsetWiggle,
  [StackOffset.SILHOUETTE]: stackOffsetSilhouette,
  [StackOffset.ZERO]: stackOffsetNone,
  [StackOffset.EXPAND]: stackOffsetExpand,
};

const ORDER_MAP = {
  [StackOrder.INSIDE_OUT]: stackOrderInsideOut,
  [StackOrder.ASCENDING]: stackOrderAscending,
  [StackOrder.DESCENDING]: stackOrderDescending,
  [StackOrder.NONE]: stackOrderNone,
};

const CURVE_MAP = {
  [CurveType.SMOOTH]: curveBasis,
  [CurveType.LINEAR]: curveLinear,
  [CurveType.STEP]: curveStep,
};

const SCHEME_MAP = {
  [ColorScheme.CIVIDIS]: interpolateCividis,
  [ColorScheme.TURBO]: interpolateTurbo,
  [ColorScheme.VIRIDIS]: interpolateViridis,
  [ColorScheme.SPECTRAL]: interpolateSpectral,
};

export const StreamGraph: React.FC<StreamGraphProps> = ({ data, width, height, options }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    seriesName: '',
    value: 0,
  });

  const legendBottom = options.legend.showLegend && options.legend.placement === 'bottom';
  const legendRight = options.legend.showLegend && options.legend.placement === 'right';

  const colorScale = useMemo(
    () =>
      scaleSequential(SCHEME_MAP[options.colorScheme]).domain([0, Math.max(1, data.seriesNames.length - 1)]),
    [options.colorScheme, data.seriesNames.length]
  );

  const svgWidth = legendRight ? width - LEGEND_WIDTH : width;
  const svgHeight = legendBottom ? height - LEGEND_HEIGHT : height;
  const innerWidth = svgWidth - MARGIN.left - MARGIN.right;
  const innerHeight = svgHeight - MARGIN.top - (options.showXAxis ? AXIS_HEIGHT : MARGIN.top);

  useEffect(() => {
    if (!svgRef.current || !data.rows.length) {
      return;
    }

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const xScale = scaleTime()
      .domain([new Date(data.timeRange[0]), new Date(data.timeRange[1])])
      .range([0, innerWidth]);

    const stackGen = stack<Record<string, number>>()
      .keys(data.seriesNames)
      .offset(OFFSET_MAP[options.stackOffset])
      .order(ORDER_MAP[options.stackOrder]);

    const stackedData = stackGen(data.rows);
    if (!stackedData.length) {
      return;
    }

    let yMin = Infinity, yMax = -Infinity;
    for (const series of stackedData) {
      for (const point of series) {
        if (point[0] < yMin) { yMin = point[0]; }
        if (point[1] > yMax) { yMax = point[1]; }
      }
    }
    const yScale = scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]);

    const areaGen = area<StackDatum>()
      .x((d) => xScale(d.data['time']))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(CURVE_MAP[options.curveType]);

    g.selectAll('path')
      .data(stackedData)
      .join('path')
      .attr('d', (d) => areaGen(d as unknown as StackDatum[]) ?? '')
      .attr('fill', (_, i) => colorScale(i))
      .attr('fill-opacity', options.fillOpacity)
      .on('mousemove', function (event, d) {
        if (!options.showTooltip) {
          return;
        }
        const mouseX = event.offsetX - MARGIN.left;
        const timeValue = xScale.invert(mouseX).getTime();
        const series = d as unknown as StackDatum[];
        const closest = series.reduce((prev, curr) =>
          Math.abs(curr.data['time'] - timeValue) < Math.abs(prev.data['time'] - timeValue) ? curr : prev
        );
        const seriesName = (d as unknown as { key: string }).key;
        const value = closest.data[seriesName] ?? 0;
        const x = event.offsetX + 12;
        const y = event.offsetY - 12;
        setTooltip((t) => {
          if (t.visible && t.seriesName === seriesName && t.value === value) {
            return t;
          }
          return { visible: true, x, y, seriesName, value };
        });
      })
      .on('mouseleave', () => setTooltip((t) => ({ ...t, visible: false })));

    if (options.showXAxis) {
      renderAxis({ svg: g, xScale, innerWidth, innerHeight });
    }
  }, [data, innerWidth, innerHeight, options.stackOffset, options.stackOrder, options.curveType, options.fillOpacity, options.showTooltip, options.showXAxis, colorScale]);

  const vizLegendItems = options.legend.showLegend
    ? data.seriesNames.map((name, i) => ({ label: name, color: colorScale(i), yAxis: 1 }))
    : null;

  return (
    <div
      style={{
        position: 'relative',
        display: legendRight ? 'flex' : 'block',
        width,
        height,
      }}
    >
      <div style={{ position: 'relative' }}>
        <svg ref={svgRef} width={svgWidth} height={svgHeight} />
        {tooltip.visible && (
          <div
            style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y,
              background: 'rgba(0,0,0,0.75)',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <strong>{tooltip.seriesName}</strong>: {tooltip.value.toFixed(2)}
          </div>
        )}
      </div>
      {vizLegendItems && (
        <VizLegend
          items={vizLegendItems}
          displayMode={options.legend.displayMode as LegendDisplayMode}
          placement={options.legend.placement}
        />
      )}
    </div>
  );
};
