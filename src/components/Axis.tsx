import React from 'react';
import { ScaleTime } from 'd3-scale';
import { timeFormat } from 'd3-time-format';

interface XAxisProps {
  xScale: ScaleTime<number, number>;
  innerWidth: number;
  innerHeight: number;
}

export function grafanaTimeFormat(secondsPerTick: number): string {
  if (secondsPerTick <= 45) {
    return '%H:%M:%S';
  }
  if (secondsPerTick <= 7200) {
    return '%H:%M';
  }
  if (secondsPerTick <= 80000) {
    return '%m/%d %H:%M';
  }
  if (secondsPerTick <= 2419200) {
    return '%m/%d';
  }
  return '%Y-%m';
}

export const XAxis: React.FC<XAxisProps> = ({ xScale, innerWidth, innerHeight }) => {
  const [domainStart, domainEnd] = xScale.domain();
  const rangeSeconds = (domainEnd.getTime() - domainStart.getTime()) / 1000;
  const tickCount = Math.max(2, Math.floor(innerWidth / 80));
  const secondsPerTick = rangeSeconds / tickCount;
  const tickFormat = grafanaTimeFormat(secondsPerTick);
  const ticks = xScale.ticks(tickCount);

  return (
    <g className="x-axis" transform={`translate(0,${innerHeight})`}>
      {ticks.map((tick) => (
        <g key={tick.getTime()} transform={`translate(${xScale(tick)},0)`}>
          <line y2={6} stroke="currentColor" strokeOpacity={0.5} />
          <text y={20} textAnchor="middle" fontSize="11px" fill="currentColor" fillOpacity={0.7}>
            {timeFormat(tickFormat)(tick)}
          </text>
        </g>
      ))}
    </g>
  );
};
