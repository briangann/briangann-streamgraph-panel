import { BandLabelColor } from '../types';

const RGB_REGEX = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;

export function invertColor(rgb: string): string {
  const match = rgb.match(RGB_REGEX);
  if (!match) {
    return 'rgb(255, 255, 255)';
  }
  const r = 255 - Number(match[1]);
  const g = 255 - Number(match[2]);
  const b = 255 - Number(match[3]);
  return `rgb(${r}, ${g}, ${b})`;
}

// ITU-R BT.601 perceived luminance — >0.5 means band is light, use dark text
function autoContrastColor(rgb: string): string {
  const match = rgb.match(RGB_REGEX);
  if (!match) {
    return 'rgb(255, 255, 255)';
  }
  const luminance = (0.299 * Number(match[1]) + 0.587 * Number(match[2]) + 0.114 * Number(match[3])) / 255;
  return luminance > 0.5 ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
}

const DEFAULT_MIN_FONT = 8;
const DEFAULT_MAX_FONT = 48;
const DEFAULT_MIN_BAND_HEIGHT = 8;
const DEFAULT_FONT_SCALE_FACTOR = 0.7;
const FADE_RANGE = 8; // px above minBandHeight over which opacity ramps 0→1
const FONT_HEIGHT_SCALE = 0.13; // innerHeight × this → panel-height font cap
const FONT_WIDTH_SCALE = 0.06; // innerWidth × this → panel-width font cap
const CHAR_WIDTH_FACTOR = 0.6; // fontSize × this ≈ average character width
const TEXT_PADDING = 8; // horizontal padding on each side of label
const CAP_HEIGHT_FACTOR = 0.65; // fontSize × this = visual ascender height for y clamping
const PEAK_NUDGE = 0.3; // fraction toward next point to align with curveBasis visual peak
const Y_SMOOTH_RANGE = 2; // points averaged on each side of peak for y position

export interface BandLabel {
  seriesName: string;
  x: number;
  y: number;
  fontSize: number;
  opacity: number;
  color: string;
}

export interface BandLabelComputeOptions {
  colorMode: BandLabelColor;
  minFontSize: number;
  maxFontSize: number;
  minBandHeight: number;
  fontScaleFactor: number;
  opacityFade: boolean;
}

export function computeBandLabels(
  stackedData: any[],
  xScale: (time: number) => number,
  yScale: (val: number) => number,
  colorFn: (index: number) => string,
  innerWidth: number,
  innerHeight: number,
  labelOptions: BandLabelComputeOptions
): BandLabel[] {
  const { colorMode, opacityFade } = labelOptions;
  const effectiveMinFont =
    Number.isFinite(labelOptions.minFontSize) && labelOptions.minFontSize >= 1
      ? Math.round(labelOptions.minFontSize)
      : DEFAULT_MIN_FONT;
  const effectiveMaxFont =
    Number.isFinite(labelOptions.maxFontSize) && labelOptions.maxFontSize > effectiveMinFont
      ? Math.round(labelOptions.maxFontSize)
      : Math.max(effectiveMinFont + 1, DEFAULT_MAX_FONT);
  const effectiveMinBandHeight =
    Number.isFinite(labelOptions.minBandHeight) && labelOptions.minBandHeight >= 1
      ? labelOptions.minBandHeight
      : DEFAULT_MIN_BAND_HEIGHT;
  const effectiveScaleFactor =
    Number.isFinite(labelOptions.fontScaleFactor) && labelOptions.fontScaleFactor > 0
      ? labelOptions.fontScaleFactor
      : DEFAULT_FONT_SCALE_FACTOR;

  const labels: BandLabel[] = [];

  for (let i = 0; i < stackedData.length; i++) {
    const series = stackedData[i];
    const seriesName = (series as any).key as string;

    let maxHeight = 0;
    const maxIndices: number[] = [];
    let bandStartX = Infinity;
    let bandEndX = -Infinity;
    for (let j = 0; j < series.length; j++) {
      const dataHeight = series[j][1] - series[j][0];
      if (dataHeight > maxHeight) {
        maxHeight = dataHeight;
        maxIndices.length = 0;
        maxIndices.push(j);
      } else if (dataHeight === maxHeight) {
        maxIndices.push(j);
      }
      const pointPixelHeight = Math.abs(yScale(series[j][0]) - yScale(series[j][1]));
      if (pointPixelHeight > effectiveMinBandHeight) {
        const pointX = xScale(series[j].data['time']);
        if (pointX < bandStartX) {
          bandStartX = pointX;
        }
        if (pointX > bandEndX) {
          bandEndX = pointX;
        }
      }
    }
    if (maxIndices.length === 0) { continue; }
    const maxIdx = maxIndices[Math.floor(maxIndices.length / 2)];

    const point = series[maxIdx];
    const pixelHeight = Math.abs(yScale(point[0]) - yScale(point[1]));

    const opacity = opacityFade
      ? Math.min(1, Math.max(0, (pixelHeight - effectiveMinBandHeight) / FADE_RANGE))
      : pixelHeight > effectiveMinBandHeight
        ? 1
        : 0;
    if (opacity === 0) {
      continue;
    }

    const bandWidth = bandEndX - bandStartX;
    const baseFontSize = Math.min(effectiveMaxFont, Math.max(effectiveMinFont, pixelHeight * effectiveScaleFactor));
    const maxFontFromWidth =
      bandWidth > TEXT_PADDING * 2
        ? (bandWidth - TEXT_PADDING * 2) / (seriesName.length * CHAR_WIDTH_FACTOR)
        : baseFontSize;
    const fontSize = Math.max(
      effectiveMinFont,
      Math.min(baseFontSize, maxFontFromWidth, innerHeight * FONT_HEIGHT_SCALE, innerWidth * FONT_WIDTH_SCALE)
    );

    const peakX = xScale(point.data['time']);
    const rawX =
      maxIdx > 0 && maxIdx < series.length - 1
        ? peakX + (xScale(series[maxIdx + 1].data['time']) - peakX) * PEAK_NUDGE
        : peakX;

    const halfTextWidth = (fontSize * CHAR_WIDTH_FACTOR * seriesName.length) / 2 + TEXT_PADDING;
    const minLabelX = Math.max(halfTextWidth, bandStartX + halfTextWidth);
    const maxLabelX = Math.min(innerWidth - halfTextWidth, bandEndX);
    const x = minLabelX <= maxLabelX ? Math.max(minLabelX, Math.min(maxLabelX, rawX)) : (minLabelX + maxLabelX) / 2;

    const smoothStart = Math.max(0, maxIdx - Y_SMOOTH_RANGE);
    const smoothEnd = Math.min(series.length - 1, maxIdx + Y_SMOOTH_RANGE);
    let ySum = 0;
    for (let k = smoothStart; k <= smoothEnd; k++) {
      ySum += (yScale(series[k][0]) + yScale(series[k][1])) / 2;
    }
    const rawY = ySum / (smoothEnd - smoothStart + 1);

    // Binary search: data points are time-ordered, xScale is monotonic
    let low = 0;
    let high = series.length - 1;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (xScale(series[mid].data['time']) < x) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    // low is the first index where xScale >= x; compare with its left neighbor to find nearest
    const nearestIdx =
      low > 0 && Math.abs(xScale(series[low - 1].data['time']) - x) <= Math.abs(xScale(series[low].data['time']) - x)
        ? low - 1
        : low;
    const nearestPoint = series[nearestIdx];
    const bandTop = Math.min(yScale(nearestPoint[0]), yScale(nearestPoint[1]));
    const bandBottom = Math.max(yScale(nearestPoint[0]), yScale(nearestPoint[1]));
    const halfFont = fontSize * CAP_HEIGHT_FACTOR;
    const y = Math.max(bandTop + halfFont, Math.min(bandBottom - halfFont, rawY));

    const bandColor = colorFn(i);
    let color: string;
    switch (colorMode) {
      case BandLabelColor.WHITE:
        color = 'rgb(255, 255, 255)';
        break;
      case BandLabelColor.BLACK:
        color = 'rgb(0, 0, 0)';
        break;
      case BandLabelColor.AUTO:
        color = autoContrastColor(bandColor);
        break;
      default:
        color = invertColor(bandColor); // INVERSE
    }

    labels.push({ seriesName, x, y, fontSize, opacity, color });
  }

  return labels;
}
