import { ScaleLinear, scaleLinear } from 'd3-scale';

/**
 * Builds a linear Y scale for a streamgraph from pre-stacked D3 data.
 * Scans all series to find the full y-extent, then maps that range to
 * SVG pixel space (top = 0, bottom = innerHeight).
 * Falls back to [0, 1] when data is empty or all values are non-finite.
 */
// D3's Series type uses complex generics that don't align with simple tuples;
// any[] accepts the real runtime shape without fighting the type system.
export function buildStreamgraphYScale(
  stackedData: any[],
  innerHeight: number
): ScaleLinear<number, number> {
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
}
