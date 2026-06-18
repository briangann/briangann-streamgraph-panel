import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSprings, animated } from '@react-spring/web';
import { area, stack, SeriesPoint } from 'd3-shape';
import { scaleTime } from 'd3-scale';
import { SeriesTable, VizLegend, VizTooltip, useTheme2 } from '@grafana/ui';
import { LegendDisplayMode, TooltipDisplayMode } from '@grafana/schema';
import { AbsoluteTimeRange, dateTimeFormat, DisplayValue } from '@grafana/data';

import { D3WideData, StreamgraphOptions } from '../types';
import { XAxis } from './Axis';
import { computeBandLabels } from '../data/bandLabels';
import { MARGIN, AXIS_HEIGHT, OFFSET_MAP, ORDER_MAP, CURVE_MAP } from './streamgraphConstants';
import { buildStreamgraphYScale } from '../data/buildStreamgraphYScale';
import { useColorScale } from './useColorScale';
import { buildTooltipRows, SeriesRow } from '../data/tooltipRows';

type StackDatum = SeriesPoint<Record<string, number>>;

interface StreamGraphProps {
  data: D3WideData;
  width: number;
  height: number;
  options: StreamgraphOptions;
  seriesCalcs: Map<string, DisplayValue[]>;
  onChangeTimeRange: (timeRange: AbsoluteTimeRange) => void;
}

interface SelectionState {
  active: boolean;
  startSvgX: number;
  currentSvgX: number;
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

const MIN_DRAG_PX = 5;
const INITIAL_SELECTION_STATE: SelectionState = { active: false, startSvgX: 0, currentSvgX: 0 };

export const StreamGraph: React.FC<StreamGraphProps> = ({ data, width, height, options, seriesCalcs, onChangeTimeRange }) => {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [svgSize, setSvgSize] = useState({ width, height });
  const svgSizeRef = useRef({ width, height });
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    clientX: 0,
    clientY: 0,
    svgX: 0,
    timeValue: 0,
    hoveredSeries: '',
    seriesRows: [],
  });

  const [selection, setSelection] = useState<SelectionState>(INITIAL_SELECTION_STATE);
  // Ref mirrors selection state so mouseUp always reads the latest coordinates
  // without depending on potentially stale closure values.
  const selectionRef = useRef<SelectionState>(INITIAL_SELECTION_STATE);

  const updateSelection = useCallback((next: SelectionState) => {
    selectionRef.current = next;
    setSelection(next);
  }, []);

  const [hiddenSeries, setHiddenSeries] = useState(new Set<string>());

  const toggleSeries = useCallback(({ label }: { label: string }) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }, []);

  const legendVisible = options.legend.showLegend && options.legend.displayMode !== LegendDisplayMode.Hidden;
  const legendBottom = legendVisible && options.legend.placement === 'bottom';

  useEffect(() => {
    const containerElement = svgContainerRef.current;
    if (!containerElement) {
      return;
    }
    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width: newWidth, height: newHeight } = entry.contentRect;
      if (newWidth > 0 && newHeight > 0 && (newWidth !== svgSizeRef.current.width || newHeight !== svgSizeRef.current.height)) {
        svgSizeRef.current = { width: newWidth, height: newHeight };
        setSvgSize({ width: newWidth, height: newHeight });
      }
    });
    resizeObserver.observe(containerElement);
    return () => resizeObserver.disconnect();
  }, []);

  // Reset selection if the user releases the mouse outside the SVG — otherwise
  // the selection stays active indefinitely and blocks tooltip interactions.
  useEffect(() => {
    const onMouseUp = () => {
      if (!selectionRef.current.active) { return; }
      updateSelection(INITIAL_SELECTION_STATE);
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, [updateSelection]);

  const theme = useTheme2();

  const innerWidth = svgSize.width - MARGIN.left - MARGIN.right;
  const innerHeight = svgSize.height - MARGIN.top - (options.showXAxis ? AXIS_HEIGHT : MARGIN.top);

  const colorScale = useColorScale(options.colorScheme, data.seriesNames.length, theme);

  const seriesIndexMap = useMemo(
    () => new Map(data.seriesNames.map((name, i) => [name, i])),
    [data.seriesNames]
  );

  // Color by original series index so each series keeps the same color when others are hidden.
  const seriesColor = useCallback(
    (seriesName: string) => colorScale(seriesIndexMap.get(seriesName) ?? 0),
    [colorScale, seriesIndexMap]
  );

  // Zero out hidden series values instead of removing them from the stack.
  // This keeps all series in D3's stack at all times so React Spring can animate
  // each band's path from its current shape to the new zero-height shape.
  const zeroedRows = useMemo(
    () =>
      hiddenSeries.size === 0
        ? data.rows
        : data.rows.map((row) => {
            let result: Record<string, number> | null = null;
            hiddenSeries.forEach((name) => {
              if (row[name] !== 0) {
                if (!result) {
                  result = { ...row };
                }
                result[name] = 0;
              }
            });
            return result ?? row;
          }),
    [data.rows, hiddenSeries]
  );

  const stackedData = useMemo(() => {
    if (!zeroedRows.length) {
      return [];
    }
    const stackGen = stack<Record<string, number>>()
      .keys(data.seriesNames)
      .offset(OFFSET_MAP[options.stackOffset])
      .order(ORDER_MAP[options.stackOrder]);
    return stackGen(zeroedRows);
  }, [zeroedRows, data.seriesNames, options.stackOffset, options.stackOrder]);

  const xScale = useMemo(
    () =>
      scaleTime()
        .domain([new Date(data.timeRange[0]), new Date(data.timeRange[1])])
        .range([0, innerWidth]),
    [data.timeRange, innerWidth]
  );

  const yScale = useMemo(
    () => buildStreamgraphYScale(stackedData, innerHeight),
    [stackedData, innerHeight]
  );

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
      (i: number) => seriesColor(stackedData[i].key),
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
    seriesColor,
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

  const springConfigs = useMemo(
    () =>
      stackedData.map((series) => ({
        to: { d: areaGen(series) ?? '' },
        immediate: !options.enableTransitions,
        config: { duration: options.transitionDuration },
      })),
    [stackedData, areaGen, options.enableTransitions, options.transitionDuration]
  );

  const pathSprings = useSprings(stackedData.length, springConfigs);

  const getSvgX = useCallback((event: React.MouseEvent): number | null => {
    const rect = gRef.current?.getBoundingClientRect();
    return rect ? event.clientX - rect.left : null;
  }, []);

  const handlePathMouseMove = useCallback(
    (event: React.MouseEvent, seriesIdx: number, series: StackDatum[]) => {
      if (options.tooltip.mode === TooltipDisplayMode.None || selectionRef.current.active) {
        return;
      }
      const mouseX = getSvgX(event);
      if (mouseX === null) { return; }
      const timeValue = xScale.invert(mouseX).getTime();
      const hoveredSeries = stackedData[seriesIdx].key;
      // Binary search for the nearest data point — series is time-ordered (same
      // pattern as bandLabels). Replaces O(N) reduce with O(log N).
      if (series.length === 0) { return; }
      let lo = 0;
      let hi = series.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (series[mid].data['time'] < timeValue) {
          lo = mid + 1;
        } else {
          hi = mid;
        }
      }
      const closest =
        lo > 0 && Math.abs(series[lo - 1].data['time'] - timeValue) <= Math.abs(series[lo].data['time'] - timeValue)
          ? series[lo - 1]
          : series[lo];

      const seriesRows = buildTooltipRows(closest.data, data.seriesNames, hoveredSeries, options.tooltip, seriesColor);

      setTooltip((prev) => {
        if (
          prev.visible &&
          prev.timeValue === timeValue &&
          prev.hoveredSeries === hoveredSeries &&
          prev.svgX === mouseX
        ) {
          return prev;
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
    [xScale, stackedData, seriesColor, options.tooltip, getSvgX]
  );

  // Stable per-path handlers — only recreated when stackedData or handlePathMouseMove changes.
  const pathMouseMoveHandlers = useMemo(
    () =>
      stackedData.map(
        (series, i) => (e: React.MouseEvent) =>
          handlePathMouseMove(e, i, series)
      ),
    [stackedData, handlePathMouseMove]
  );

  const handlePathMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleSvgMouseDown = useCallback((event: React.MouseEvent<SVGGElement>) => {
    const startSvgX = getSvgX(event);
    if (startSvgX === null) { return; }
    const next = { active: true, startSvgX, currentSvgX: startSvgX };
    updateSelection(next);
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, [getSvgX, updateSelection]);

  const handleSvgMouseMove = useCallback(
    (event: React.MouseEvent<SVGGElement>) => {
      if (!selectionRef.current.active) { return; }
      const currentSvgX = getSvgX(event);
      if (currentSvgX === null) { return; }
      updateSelection({ ...selectionRef.current, currentSvgX });
    },
    [getSvgX, updateSelection]
  );

  const handleSvgMouseUp = useCallback(() => {
    const current = selectionRef.current;
    if (!current.active) { return; }
    const { startSvgX, currentSvgX } = current;
    updateSelection(INITIAL_SELECTION_STATE);
    if (Math.abs(currentSvgX - startSvgX) >= MIN_DRAG_PX) {
      const from = xScale.invert(Math.min(startSvgX, currentSvgX)).getTime();
      const to = xScale.invert(Math.max(startSvgX, currentSvgX)).getTime();
      onChangeTimeRange({ from, to });
    }
  }, [xScale, onChangeTimeRange, updateSelection]);

  const handleSvgMouseLeave = useCallback(() => {
    updateSelection(INITIAL_SELECTION_STATE);
    setTooltip((previousTooltip) => ({ ...previousTooltip, visible: false }));
  }, [updateSelection]);

  const vizLegendItems = useMemo(
    () =>
      legendVisible
        ? data.seriesNames.map((name) => {
            const calcs = seriesCalcs.get(name);
            return {
              label: name,
              color: seriesColor(name),
              yAxis: 1,
              disabled: hiddenSeries.has(name),
              getDisplayValues: calcs ? () => calcs : undefined,
            };
          })
        : null,
    [legendVisible, data.seriesNames, seriesCalcs, seriesColor, hiddenSeries]
  );

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
          <g
            ref={gRef}
            transform={`translate(${MARGIN.left},${MARGIN.top})`}
            onMouseDown={handleSvgMouseDown}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onMouseLeave={handleSvgMouseLeave}
          >
            {pathSprings.map((springProps, i) => {
              const series = stackedData[i];
              const seriesName = series.key;
              const isDimmed = options.hoverDimming && tooltip.visible && tooltip.hoveredSeries !== seriesName;
              return (
                <animated.path
                  key={seriesName}
                  d={springProps.d}
                  fill={seriesColor(seriesName)}
                  fillOpacity={isDimmed ? options.hoverDimmingOpacity : options.fillOpacity}
                  style={{ transition: 'fill-opacity 150ms ease' }}
                  onMouseMove={pathMouseMoveHandlers[i]}
                  onMouseLeave={handlePathMouseLeave}
                />
              );
            })}
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
            {selection.active && (
              <rect
                x={Math.min(selection.startSvgX, selection.currentSvgX)}
                y={0}
                width={Math.abs(selection.currentSvgX - selection.startSvgX)}
                height={innerHeight}
                fill="currentColor"
                fillOpacity={0.1}
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
          onLabelClick={toggleSeries}
        />
      )}
    </div>
  );
};
