import React from 'react';
import { render } from '@testing-library/react';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { StreamGraph } from './StreamGraph';
import { BandLabelColor, ColorScheme, CurveType, StackOffset, StackOrder, StreamgraphOptions } from '../types';

const mockData = {
  rows: [
    { time: 1000, A: 1, B: 2 },
    { time: 2000, A: 2, B: 1 },
    { time: 3000, A: 1, B: 3 },
  ],
  seriesNames: ['A', 'B'],
  timeRange: [1000, 3000] as [number, number],
};

const mockOptions: StreamgraphOptions = {
  stackOffset: StackOffset.WIGGLE,
  stackOrder: StackOrder.INSIDE_OUT,
  curveType: CurveType.SMOOTH,
  colorScheme: ColorScheme.CIVIDIS,
  fillOpacity: 0.8,
  showXAxis: true,
  showBandLabels: false,
  bandLabelColor: BandLabelColor.INVERSE,
  bandLabelMinFontSize: 8,
  bandLabelMaxFontSize: 48,
  bandLabelMinBandHeight: 8,
  bandLabelFontScaleFactor: 0.7,
  bandLabelStrokeWidth: 0,
  bandLabelOpacityFade: true,
  tooltip: { mode: TooltipDisplayMode.Single, sort: SortOrder.None, hideZeros: false },
  legend: { showLegend: true, placement: 'bottom' as const, displayMode: LegendDisplayMode.List, calcs: [] },
};

const emptyCalcs = new Map<string, Array<import('@grafana/data').DisplayValue>>();

describe('StreamGraph', () => {
  it('renders an SVG element', () => {
    const { container } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('SVG has the expected width attribute', () => {
    const { container } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    const svg = container.querySelector('svg')!;
    expect(Number(svg.getAttribute('width'))).toBeGreaterThan(0);
  });

  it('renders legend items when showLegend is true', () => {
    const { getByText } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    expect(getByText('A')).toBeInTheDocument();
    expect(getByText('B')).toBeInTheDocument();
  });

  it('does not render legend when showLegend is false', () => {
    const { queryByText } = render(
      <StreamGraph
        data={mockData}
        width={800}
        height={400}
        options={{ ...mockOptions, legend: { ...mockOptions.legend, showLegend: false } }}
        seriesCalcs={emptyCalcs}
      />
    );
    expect(queryByText('A')).not.toBeInTheDocument();
  });

  it('renders text labels when showBandLabels is true', () => {
    const { container } = render(
      <StreamGraph
        data={mockData}
        width={800}
        height={400}
        options={{ ...mockOptions, showBandLabels: true }}
        seriesCalcs={emptyCalcs}
      />
    );
    const texts = Array.from(container.querySelectorAll('svg text'));
    const bandLabels = texts.filter((t) => t.textContent === 'A' || t.textContent === 'B');
    expect(bandLabels.some((t) => t.textContent === 'A')).toBe(true);
    expect(bandLabels.some((t) => t.textContent === 'B')).toBe(true);
  });

  it('does not render band label text when showBandLabels is false', () => {
    const { container } = render(
      <StreamGraph
        data={mockData}
        width={800}
        height={400}
        options={{ ...mockOptions, showBandLabels: false }}
        seriesCalcs={emptyCalcs}
      />
    );
    const texts = Array.from(container.querySelectorAll('svg text'));
    const bandLabels = texts.filter((t) => t.textContent === 'A' || t.textContent === 'B');
    expect(bandLabels).toHaveLength(0);
  });

  it('matches snapshot', () => {
    const { container } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    expect(container).toMatchSnapshot();
  });
});

describe('color schemes', () => {
  const schemeOptions = [
    ColorScheme.PLASMA,
    ColorScheme.INFERNO,
    ColorScheme.MAGMA,
    ColorScheme.COOL,
    ColorScheme.WARM,
    ColorScheme.RAINBOW,
  ];

  schemeOptions.forEach((scheme) => {
    it(`renders without crashing with ${scheme} color scheme`, () => {
      const { container } = render(
        <StreamGraph
          data={mockData}
          width={800}
          height={400}
          options={{ ...mockOptions, colorScheme: scheme }}
          seriesCalcs={emptyCalcs}
        />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.querySelectorAll('path')).toHaveLength(2);
    });
  });

  it('renders without crashing with Grafana categorical scheme', () => {
    const { container } = render(
      <StreamGraph
        data={mockData}
        width={800}
        height={400}
        options={{ ...mockOptions, colorScheme: ColorScheme.GRAFANA_CLASSIC }}
        seriesCalcs={emptyCalcs}
      />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });
});
