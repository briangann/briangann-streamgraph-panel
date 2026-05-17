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
import { SeriesTable, VizLegend, VizTooltip } from '@grafana/ui';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { DisplayValue } from '@grafana/data';

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

interface SeriesRow {
  seriesName: string;
  value: number;
  color: string;
}

interface StreamGraphProps {
  data: D3WideData;
  width: number;
  height: number;
  options: StreamgraphOptions;
  seriesCalcs: Map<string, DisplayValue[]>;
}

interface TooltipState {
  visible: boolean;
  clientX: number;
  clientY: number;
  timeValue: number;
  hoveredSeries: string;
  seriesRows: SeriesRow[];
}

const MARGIN = { top: 10, right: 10, left: 10 };
const AXIS_HEIGHT = 30;

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

export const StreamGraph: React.FC<StreamGraphProps> = ({ data, width, height, options, seriesCalcs }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgSize, setSvgSize] = useState({ width, height });
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    clientX: 0,
    clientY: 0,
    timeValue: 0,
    hoveredSeries: '',
    seriesRows: [],
  });

  const legendVisible = options.legend.showLegend && options.legend.displayMode !== LegendDisplayMode.Hidden;
  const legendBottom = legendVisible && options.legend.placement === 'bottom';

  const colorScale = useMemo(
    () =>
      scaleSequential(SCHEME_MAP[options.colorScheme]).domain([0, Math.max(1, data.seriesNames.length - 1)]),
    [options.colorScheme, data.seriesNames.length]
  );

  useEffect(() => {
    const el = svgContainerRef.current;
    if (!el) { return; }
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      if (w > 0 && h > 0) {
        setSvgSize({ width: w, height: h });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const innerWidth = svgSize.width - MARGIN.left - MARGIN.right;
  const innerHeight = svgSize.height - MARGIN.top - (options.showXAxis ? AXIS_HEIGHT : MARGIN.top);

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
        if (isFinite(point[0]) && point[0] < yMin) { yMin = point[0]; }
        if (isFinite(point[1]) && point[1] > yMax) { yMax = point[1]; }
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
        if (options.tooltip.mode === TooltipDisplayMode.None) {
          return;
        }
        const mouseX = event.offsetX - MARGIN.left;
        const timeValue = xScale.invert(mouseX).getTime();
        const series = d as unknown as StackDatum[];
        const closest = series.reduce((prev, curr) =>
          Math.abs(curr.data['time'] - timeValue) < Math.abs(prev.data['time'] - timeValue) ? curr : prev
        );
        const hoveredSeries = (d as unknown as { key: string }).key;

        let seriesRows: SeriesRow[];
        if (options.tooltip.mode === TooltipDisplayMode.Single) {
          const idx = data.seriesNames.indexOf(hoveredSeries);
          seriesRows = [{ seriesName: hoveredSeries, value: closest.data[hoveredSeries] ?? 0, color: colorScale(idx) }];
        } else {
          seriesRows = stackedData.map((s, i) => {
            const name = (s as unknown as { key: string }).key;
            return { seriesName: name, value: closest.data[name] ?? 0, color: colorScale(i) };
          });
          if (options.tooltip.sort === SortOrder.Ascending) {
            seriesRows.sort((a, b) => a.value - b.value);
          } else if (options.tooltip.sort === SortOrder.Descending) {
            seriesRows.sort((a, b) => b.value - a.value);
          }
        }

        setTooltip((t) => {
          if (t.visible && t.timeValue === timeValue && t.hoveredSeries === hoveredSeries) {
            return t;
          }
          return { visible: true, clientX: event.clientX, clientY: event.clientY, timeValue, hoveredSeries, seriesRows };
        });
      })
      .on('mouseleave', () => setTooltip((t) => ({ ...t, visible: false })));

    if (options.showXAxis) {
      renderAxis({ svg: g, xScale, innerWidth, innerHeight });
    }
  }, [data, innerWidth, innerHeight, options.stackOffset, options.stackOrder, options.curveType, options.fillOpacity, options.tooltip.mode, options.tooltip.sort, options.showXAxis, colorScale]);

  const vizLegendItems = legendVisible
    ? data.seriesNames.map((name, i) => {
        const calcs = seriesCalcs.get(name);
        return {
          label: name,
          color: colorScale(i),
          yAxis: 1,
          getDisplayValues: calcs ? () => calcs : undefined,
        };
      })
    : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: legendBottom ? 'column' : 'row',
        width,
        height,
        overflow: 'hidden',
      }}
    >
      <div ref={svgContainerRef} style={{ flex: 1, minHeight: 0, minWidth: 0, position: 'relative' }}>
        <svg ref={svgRef} width={svgSize.width} height={svgSize.height} />
        {tooltip.visible && (
          <VizTooltip
            content={
              <SeriesTable
                series={tooltip.seriesRows.map((r) => ({
                  color: r.color,
                  label: r.seriesName,
                  value: r.value.toFixed(2),
                  isActive: r.seriesName === tooltip.hoveredSeries,
                }))}
              />
            }
            position={{ x: tooltip.clientX, y: tooltip.clientY }}
            offset={{ x: 10, y: 10 }}
          />
        )}
      </div>
      {vizLegendItems && (
        <VizLegend
          items={vizLegendItems}
          displayMode={options.legend.displayMode}
          placement={options.legend.placement}
        />
      )}
    </div>
  );
};
