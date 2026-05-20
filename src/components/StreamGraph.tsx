import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  interpolateCool,
  interpolateInferno,
  interpolateMagma,
  interpolatePlasma,
  interpolateRainbow,
  interpolateSpectral,
  interpolateTurbo,
  interpolateViridis,
  interpolateWarm,
} from 'd3-scale-chromatic';
import { SeriesTable, VizLegend, VizTooltip, useTheme2 } from '@grafana/ui';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { dateTimeFormat, DisplayValue, Field, FieldType, getFieldColorMode } from '@grafana/data';

import { ColorScheme, CurveType, D3WideData, StackOffset, StackOrder, StreamgraphOptions } from '../types';
import { XAxis } from './Axis';
import { computeBandLabels } from '../data/bandLabels';

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
  svgX: number;
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

const SCHEME_MAP: Partial<Record<ColorScheme, (t: number) => string>> = {
  [ColorScheme.CIVIDIS]: interpolateCividis,
  [ColorScheme.TURBO]: interpolateTurbo,
  [ColorScheme.VIRIDIS]: interpolateViridis,
  [ColorScheme.SPECTRAL]: interpolateSpectral,
  [ColorScheme.PLASMA]: interpolatePlasma,
  [ColorScheme.INFERNO]: interpolateInferno,
  [ColorScheme.MAGMA]: interpolateMagma,
  [ColorScheme.COOL]: interpolateCool,
  [ColorScheme.WARM]: interpolateWarm,
  [ColorScheme.RAINBOW]: interpolateRainbow,
};

export const StreamGraph: React.FC<StreamGraphProps> = ({ data, width, height, options, seriesCalcs }) => {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [svgSize, setSvgSize] = useState({ width, height });
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    clientX: 0,
    clientY: 0,
    svgX: 0,
    timeValue: 0,
    hoveredSeries: '',
    seriesRows: [],
  });

  const legendVisible = options.legend.showLegend && options.legend.displayMode !== LegendDisplayMode.Hidden;
  const legendBottom = legendVisible && options.legend.placement === 'bottom';

  useEffect(() => {
    const containerElement = svgContainerRef.current;
    if (!containerElement) {
      return;
    }
    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width: newWidth, height: newHeight } = entry.contentRect;
      if (newWidth > 0 && newHeight > 0) {
        setSvgSize({ width: newWidth, height: newHeight });
      }
    });
    resizeObserver.observe(containerElement);
    return () => resizeObserver.disconnect();
  }, []);

  const theme = useTheme2();

  const innerWidth = svgSize.width - MARGIN.left - MARGIN.right;
  const innerHeight = svgSize.height - MARGIN.top - (options.showXAxis ? AXIS_HEIGHT : MARGIN.top);

  const colorScale = useMemo((): ((i: number) => string) => {
    const d3Interpolator = SCHEME_MAP[options.colorScheme];
    if (d3Interpolator) {
      return scaleSequential(d3Interpolator).domain([0, Math.max(1, data.seriesNames.length - 1)]);
    }
    // Grafana registry path — scheme value matches FieldColorModeId string directly
    try {
      const mode = getFieldColorMode(options.colorScheme);
      if (mode.isContinuous) {
        const fakeField = {
          config: { color: { mode: options.colorScheme } },
          state: {},
          values: [],
          name: '',
          type: FieldType.number,
        } as unknown as Field;
        const calculator = mode.getCalculator(fakeField, theme);
        const total = Math.max(1, data.seriesNames.length - 1);
        return (i: number) => calculator(i, i / total);
      }
      if (mode.getColors) {
        const colors = mode.getColors(theme);
        if (colors.length > 0) {
          return (i: number) => colors[Math.floor(i) % colors.length];
        }
      }
    } catch {
      // getFieldColorMode throws for unrecognised IDs; any other registry error
      // also falls back to the default rather than crashing the panel
    }
    return scaleSequential(interpolateCividis).domain([0, Math.max(1, data.seriesNames.length - 1)]);
  }, [options.colorScheme, data.seriesNames.length, theme]);

  const stackedData = useMemo(() => {
    if (!data.rows.length) {
      return [];
    }
    const stackGen = stack<Record<string, number>>()
      .keys(data.seriesNames)
      .offset(OFFSET_MAP[options.stackOffset])
      .order(ORDER_MAP[options.stackOrder]);
    return stackGen(data.rows);
  }, [data.rows, data.seriesNames, options.stackOffset, options.stackOrder]);

  const xScale = useMemo(
    () =>
      scaleTime()
        .domain([new Date(data.timeRange[0]), new Date(data.timeRange[1])])
        .range([0, innerWidth]),
    [data.timeRange, innerWidth]
  );

  const yScale = useMemo(() => {
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const series of stackedData) {
      for (const point of series) {
        if (isFinite(point[0]) && point[0] < yMin) {
          yMin = point[0];
        }
        if (isFinite(point[1]) && point[1] > yMax) {
          yMax = point[1];
        }
      }
    }
    if (!isFinite(yMin) || !isFinite(yMax)) {
      return scaleLinear().domain([0, 1]).range([innerHeight, 0]);
    }
    return scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]);
  }, [stackedData, innerHeight]);

  const areaGen = useMemo(
    () =>
      area<StackDatum>()
        .x((d) => xScale(d.data['time']))
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]))
        .curve(CURVE_MAP[options.curveType]),
    [xScale, yScale, options.curveType]
  );

  const bandLabels = useMemo(() => {
    if (!options.showBandLabels || !stackedData.length) {
      return [];
    }
    return computeBandLabels(
      stackedData,
      (time: number) => xScale(time),
      (val: number) => yScale(val),
      (i: number) => colorScale(i),
      innerWidth,
      innerHeight,
      {
        colorMode: options.bandLabelColor,
        minFontSize: options.bandLabelMinFontSize,
        maxFontSize: options.bandLabelMaxFontSize,
        minBandHeight: options.bandLabelMinBandHeight,
        fontScaleFactor: options.bandLabelFontScaleFactor,
        opacityFade: options.bandLabelOpacityFade,
      }
    );
  }, [
    stackedData,
    xScale,
    yScale,
    colorScale,
    options.showBandLabels,
    options.bandLabelColor,
    options.bandLabelMinFontSize,
    options.bandLabelMaxFontSize,
    options.bandLabelMinBandHeight,
    options.bandLabelFontScaleFactor,
    options.bandLabelOpacityFade,
    innerWidth,
    innerHeight,
  ]);

  const handlePathMouseMove = useCallback(
    (event: React.MouseEvent, seriesIdx: number, series: StackDatum[]) => {
      if (options.tooltip.mode === TooltipDisplayMode.None) {
        return;
      }
      const g = gRef.current;
      if (!g) {
        return;
      }
      const rect = g.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const timeValue = xScale.invert(mouseX).getTime();
      const hoveredSeries = (stackedData[seriesIdx] as any).key as string;
      const closest = series.reduce((prev, curr) =>
        Math.abs(curr.data['time'] - timeValue) < Math.abs(prev.data['time'] - timeValue) ? curr : prev
      );

      let seriesRows: SeriesRow[];
      if (options.tooltip.mode === TooltipDisplayMode.Single) {
        const idx = data.seriesNames.indexOf(hoveredSeries);
        seriesRows = [{ seriesName: hoveredSeries, value: closest.data[hoveredSeries] ?? 0, color: colorScale(idx) }];
      } else {
        seriesRows = stackedData.map((s, i) => {
          const name = (s as any).key as string;
          return { seriesName: name, value: closest.data[name] ?? 0, color: colorScale(i) };
        });
        if (options.tooltip.hideZeros) {
          seriesRows = seriesRows.filter((r) => r.value !== 0);
        }
        if (options.tooltip.sort === SortOrder.Ascending) {
          seriesRows.sort((a, b) => a.value - b.value);
        } else if (options.tooltip.sort === SortOrder.Descending) {
          seriesRows.sort((a, b) => b.value - a.value);
        }
      }

      setTooltip((previousTooltip) => {
        if (
          previousTooltip.visible &&
          previousTooltip.timeValue === timeValue &&
          previousTooltip.hoveredSeries === hoveredSeries &&
          previousTooltip.svgX === mouseX
        ) {
          return previousTooltip;
        }
        return {
          visible: true,
          clientX: event.clientX,
          clientY: event.clientY,
          svgX: mouseX,
          timeValue,
          hoveredSeries,
          seriesRows,
        };
      });
    },
    [xScale, stackedData, colorScale, options.tooltip, data.seriesNames]
  );

  const handlePathMouseLeave = useCallback(() => {
    setTooltip((previousTooltip) => ({ ...previousTooltip, visible: false }));
  }, []);

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
        <svg width={svgSize.width} height={svgSize.height}>
          <g ref={gRef} transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {stackedData.map((series, i) => (
              <path
                key={(series as any).key}
                d={areaGen(series as unknown as StackDatum[]) ?? ''}
                fill={colorScale(i)}
                fillOpacity={options.fillOpacity}
                onMouseMove={(e) => handlePathMouseMove(e, i, series as unknown as StackDatum[])}
                onMouseLeave={handlePathMouseLeave}
              />
            ))}
            {options.showCrosshair && tooltip.visible && (
              <line
                x1={tooltip.svgX}
                x2={tooltip.svgX}
                y1={0}
                y2={innerHeight}
                stroke="currentColor"
                strokeOpacity={0.4}
                strokeWidth={1}
                pointerEvents="none"
              />
            )}
            {options.showXAxis && <XAxis xScale={xScale} innerWidth={innerWidth} innerHeight={innerHeight} />}
            {bandLabels.map((label) => (
              <text
                key={label.seriesName}
                data-testid="band-label"
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={`${label.fontSize}px`}
                fill={label.color}
                opacity={label.opacity}
                stroke={options.bandLabelStrokeWidth > 0 ? label.strokeColor : undefined}
                strokeWidth={options.bandLabelStrokeWidth > 0 ? options.bandLabelStrokeWidth : undefined}
                paintOrder={options.bandLabelStrokeWidth > 0 ? 'stroke' : undefined}
                pointerEvents="none"
              >
                {label.seriesName}
              </text>
            ))}
          </g>
        </svg>
        {tooltip.visible && (
          <VizTooltip
            content={
              <div style={options.tooltip.maxWidth ? { maxWidth: options.tooltip.maxWidth } : undefined}>
                <div
                  style={
                    options.tooltip.maxHeight ? { maxHeight: options.tooltip.maxHeight, overflowY: 'auto' } : undefined
                  }
                >
                  <SeriesTable
                    timestamp={dateTimeFormat(tooltip.timeValue, { timeZone: 'browser' })}
                    series={tooltip.seriesRows.map((r) => ({
                      color: r.color,
                      label: r.seriesName,
                      value: r.value.toFixed(2),
                      isActive: r.seriesName === tooltip.hoveredSeries,
                    }))}
                  />
                </div>
              </div>
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
