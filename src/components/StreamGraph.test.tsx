import React from 'react';
import { render, fireEvent } from '@testing-library/react';
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
  showCrosshair: true,
  hoverDimming: true,
  hoverDimmingOpacity: 0.3,
  showBandLabels: false,
  bandLabelColor: BandLabelColor.INVERSE,
  bandLabelMinFontSize: 8,
  bandLabelMaxFontSize: 48,
  bandLabelMinBandHeight: 8,
  bandLabelFontScaleFactor: 0.7,
  bandLabelStrokeWidth: 0,
  bandLabelOpacityFade: true,
  tooltip: {
    mode: TooltipDisplayMode.Single,
    sort: SortOrder.None,
    hideZeros: false,
    maxWidth: undefined,
    maxHeight: undefined,
  },
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

describe('tooltip', () => {
  // Fire a mousemove over the first SVG path. JSDOM returns 0 for getBoundingClientRect
  // so mouseX = clientX - 0 = clientX. The xScale maps [1000,3000] → [0, 780].
  // clientX=390 lands near the midpoint, giving timeValue ≈ 2000.
  function hoverFirstPath(container: HTMLElement) {
    const path = container.querySelector('path')!;
    fireEvent.mouseMove(path, { clientX: 390, clientY: 200 });
  }

  it('renders tooltip rows after hovering a path', () => {
    const { container } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    hoverFirstPath(container);
    // Tooltip renders into document.body via Portal
    expect(document.body.querySelectorAll('[data-testid="SeriesTableRow"]').length).toBeGreaterThan(0);
  });

  it('shows a timestamp header when hovering in Single mode', () => {
    const { container } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    hoverFirstPath(container);
    expect(document.body.querySelector('[aria-label="Timestamp"]')).toBeInTheDocument();
  });

  it('shows one series row in Single mode', () => {
    const { container } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    hoverFirstPath(container);
    expect(document.body.querySelectorAll('[data-testid="SeriesTableRow"]')).toHaveLength(1);
  });

  it('shows all series rows in All series mode', () => {
    const { container } = render(
      <StreamGraph
        data={mockData}
        width={800}
        height={400}
        options={{ ...mockOptions, tooltip: { ...mockOptions.tooltip, mode: TooltipDisplayMode.Multi } }}
        seriesCalcs={emptyCalcs}
      />
    );
    hoverFirstPath(container);
    expect(document.body.querySelectorAll('[data-testid="SeriesTableRow"]')).toHaveLength(2);
  });

  it('does not show tooltip when mode is Hidden', () => {
    const { container } = render(
      <StreamGraph
        data={mockData}
        width={800}
        height={400}
        options={{ ...mockOptions, tooltip: { ...mockOptions.tooltip, mode: TooltipDisplayMode.None } }}
        seriesCalcs={emptyCalcs}
      />
    );
    hoverFirstPath(container);
    expect(document.body.querySelectorAll('[data-testid="SeriesTableRow"]')).toHaveLength(0);
  });

  it('applies maxWidth to the tooltip wrapper when set', () => {
    const { container } = render(
      <StreamGraph
        data={mockData}
        width={800}
        height={400}
        options={{ ...mockOptions, tooltip: { ...mockOptions.tooltip, maxWidth: 300 } }}
        seriesCalcs={emptyCalcs}
      />
    );
    hoverFirstPath(container);
    const timestamp = document.body.querySelector('[aria-label="Timestamp"]');
    const wrapper = timestamp?.closest('div[style]') as HTMLElement | null;
    expect(wrapper?.style.maxWidth).toBe('300px');
  });

  it('applies maxHeight and overflowY to the inner div when set', () => {
    const { container } = render(
      <StreamGraph
        data={mockData}
        width={800}
        height={400}
        options={{ ...mockOptions, tooltip: { ...mockOptions.tooltip, maxHeight: 150 } }}
        seriesCalcs={emptyCalcs}
      />
    );
    hoverFirstPath(container);
    const timestamp = document.body.querySelector('[aria-label="Timestamp"]');
    const scrollWrapper = timestamp?.parentElement as HTMLElement | null;
    expect(scrollWrapper?.style.maxHeight).toBe('150px');
    expect(scrollWrapper?.style.overflowY).toBe('auto');
  });

  it('does not apply scroll style when maxHeight is unset', () => {
    const { container } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    hoverFirstPath(container);
    const timestamp = document.body.querySelector('[aria-label="Timestamp"]');
    const scrollWrapper = timestamp?.parentElement as HTMLElement | null;
    // style is undefined when maxHeight is not set — no overflowY constraint
    expect(scrollWrapper?.style.maxHeight).toBeFalsy();
    expect(scrollWrapper?.style.overflowY).toBeFalsy();
  });
});

describe('hover dimming', () => {
  function hoverFirstPath(container: HTMLElement) {
    const path = container.querySelector('path')!;
    fireEvent.mouseMove(path, { clientX: 390, clientY: 200 });
  }

  it('dims non-hovered paths on hover', () => {
    const { container } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    hoverFirstPath(container);
    const paths = container.querySelectorAll('path');
    // first path is the hovered series — keeps full fillOpacity
    expect(paths[0].getAttribute('fill-opacity')).toBe(String(mockOptions.fillOpacity));
    // second path is non-hovered — dimmed to hoverDimmingOpacity
    expect(paths[1].getAttribute('fill-opacity')).toBe(String(mockOptions.hoverDimmingOpacity));
  });

  it('uses the configured hoverDimmingOpacity value', () => {
    const { container } = render(
      <StreamGraph
        data={mockData}
        width={800}
        height={400}
        options={{ ...mockOptions, hoverDimmingOpacity: 0.1 }}
        seriesCalcs={emptyCalcs}
      />
    );
    hoverFirstPath(container);
    const paths = container.querySelectorAll('path');
    expect(paths[1].getAttribute('fill-opacity')).toBe('0.1');
  });

  it('does not dim when hoverDimming is off', () => {
    const { container } = render(
      <StreamGraph
        data={mockData}
        width={800}
        height={400}
        options={{ ...mockOptions, hoverDimming: false }}
        seriesCalcs={emptyCalcs}
      />
    );
    hoverFirstPath(container);
    const paths = container.querySelectorAll('path');
    // all paths keep full fillOpacity when dimming is disabled
    paths.forEach((path) => {
      expect(path.getAttribute('fill-opacity')).toBe(String(mockOptions.fillOpacity));
    });
  });

  it('restores full opacity on mouse leave', () => {
    const { container } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    const firstPath = container.querySelector('path')!;
    hoverFirstPath(container);
    fireEvent.mouseLeave(firstPath);
    const paths = container.querySelectorAll('path');
    paths.forEach((path) => {
      expect(path.getAttribute('fill-opacity')).toBe(String(mockOptions.fillOpacity));
    });
  });
});

describe('legend series toggle', () => {
  function clickFirstLegendItem(container: HTMLElement) {
    // VizLegendListItem renders a <button> inside the testid wrapper; click the button.
    const button = container.querySelector('[data-testid*="VizLegend series"] button');
    if (button) {
      fireEvent.click(button);
    }
  }

  it('hides a series when its legend item is clicked', () => {
    const { container } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    expect(container.querySelectorAll('path')).toHaveLength(2);
    clickFirstLegendItem(container);
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });

  it('shows the series again when clicked a second time', () => {
    const { container } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    clickFirstLegendItem(container);
    expect(container.querySelectorAll('path')).toHaveLength(1);
    clickFirstLegendItem(container);
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });
});
