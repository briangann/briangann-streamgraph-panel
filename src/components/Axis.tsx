import { axisBottom } from 'd3-axis';
import { ScaleTime } from 'd3-scale';
import { Selection } from 'd3-selection';
import { timeFormat } from 'd3-time-format';

interface AxisProps {
  svg: Selection<SVGGElement, unknown, null, undefined>;
  xScale: ScaleTime<number, number>;
  innerWidth: number;
  innerHeight: number;
}

function grafanaTimeFormat(secondsPerTick: number): string {
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

export function renderAxis({ svg, xScale, innerWidth, innerHeight }: AxisProps): void {
  const [t0, t1] = xScale.domain();
  const rangeSeconds = (t1.getTime() - t0.getTime()) / 1000;
  const tickCount = Math.max(2, Math.floor(innerWidth / 80));
  const secondsPerTick = rangeSeconds / tickCount;
  const fmt = grafanaTimeFormat(secondsPerTick);

  svg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(
      axisBottom(xScale)
        .ticks(tickCount)
        .tickFormat((d) => timeFormat(fmt)(d as Date))
    )
    .select('.domain')
    .remove();
}
