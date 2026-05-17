import React, { useEffect, useRef, useState } from 'react';
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

import {
  ColorScheme,
  CurveType,
  D3WideData,
  LegendPlacement,
  StackOffset,
  StackOrder,
  StreamgraphOptions,
} from '../types';
import { renderAxis } from './Axis';

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

  const legendBottom = options.showLegend && options.legendPlacement === LegendPlacement.BOTTOM;
  const legendRight = options.showLegend && options.legendPlacement === LegendPlacement.RIGHT;

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

    const yMin = Math.min(...stackedData.flatMap((s) => s.map((d) => d[0])));
    const yMax = Math.max(...stackedData.flatMap((s) => s.map((d) => d[1])));
    const yScale = scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]);

    const colorScale = scaleSequential(SCHEME_MAP[options.colorScheme]).domain([
      0,
      Math.max(1, data.seriesNames.length - 1),
    ]);

    const areaGen = area<[number, number] & { data: Record<string, number> }>()
      .x((d) => xScale(new Date(d.data['time'])))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(CURVE_MAP[options.curveType]);

    g.selectAll('path')
      .data(stackedData)
      .join('path')
      .attr('d', (d) => areaGen(d as unknown as Array<[number, number] & { data: Record<string, number> }>) ?? '')
      .attr('fill', (_, i) => colorScale(i))
      .attr('fill-opacity', options.fillOpacity)
      .on('mousemove', function (event, d) {
        if (!options.showTooltip) {
          return;
        }
        const mouseX = event.offsetX - MARGIN.left;
        const timeValue = xScale.invert(mouseX).getTime();
        const closest = (d as unknown as Array<[number, number] & { data: Record<string, number> }>).reduce(
          (prev, curr) =>
            Math.abs(curr.data['time'] - timeValue) < Math.abs(prev.data['time'] - timeValue)
              ? curr
              : prev
        );
        const seriesName = (d as unknown as { key: string }).key;
        setTooltip({
          visible: true,
          x: event.offsetX + 12,
          y: event.offsetY - 12,
          seriesName,
          value: closest.data[seriesName] ?? 0,
        });
      })
      .on('mouseleave', () => setTooltip((t) => ({ ...t, visible: false })));

    if (options.showXAxis) {
      renderAxis({ svg: g, xScale, innerWidth, innerHeight });
    }
  }, [data, innerWidth, innerHeight, options]);

  const colorScale = scaleSequential(SCHEME_MAP[options.colorScheme]).domain([
    0,
    Math.max(1, data.seriesNames.length - 1),
  ]);

  const legendItems = data.seriesNames.map((name, i) => (
    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: 2,
          backgroundColor: colorScale(i),
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
    </div>
  ));

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
      {options.showLegend && legendBottom && (
        <div style={{ display: 'flex', flexWrap: 'wrap', padding: '4px 0', width }}>{legendItems}</div>
      )}
      {options.showLegend && legendRight && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: '0 8px',
            width: LEGEND_WIDTH,
            overflowY: 'auto',
            height,
          }}
        >
          {legendItems}
        </div>
      )}
    </div>
  );
};
