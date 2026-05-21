import React from 'react';
import { render } from '@testing-library/react';
import { scaleTime } from 'd3-scale';
import { grafanaTimeFormat, XAxis } from './Axis';

// ─── grafanaTimeFormat ────────────────────────────────────────────────────────

describe('grafanaTimeFormat', () => {
  it('returns HH:MM:SS for ≤ 45 seconds per tick', () => {
    expect(grafanaTimeFormat(1)).toBe('%H:%M:%S');
    expect(grafanaTimeFormat(45)).toBe('%H:%M:%S');
  });

  it('returns HH:MM for 46–7200 seconds per tick', () => {
    expect(grafanaTimeFormat(46)).toBe('%H:%M');
    expect(grafanaTimeFormat(7200)).toBe('%H:%M');
  });

  it('returns MM/DD HH:MM for 7201–80000 seconds per tick', () => {
    expect(grafanaTimeFormat(7201)).toBe('%m/%d %H:%M');
    expect(grafanaTimeFormat(80000)).toBe('%m/%d %H:%M');
  });

  it('returns MM/DD for 80001–2419200 seconds per tick', () => {
    expect(grafanaTimeFormat(80001)).toBe('%m/%d');
    expect(grafanaTimeFormat(2419200)).toBe('%m/%d');
  });

  it('returns YYYY-MM for > 2419200 seconds per tick', () => {
    expect(grafanaTimeFormat(2419201)).toBe('%Y-%m');
    expect(grafanaTimeFormat(999999999)).toBe('%Y-%m');
  });
});

// ─── XAxis component ──────────────────────────────────────────────────────────

describe('XAxis', () => {
  const makeScale = (from: number, to: number, widthPx = 600) =>
    scaleTime().domain([new Date(from), new Date(to)]).range([0, widthPx]);

  it('renders an x-axis group', () => {
    const { container } = render(
      <svg>
        <XAxis xScale={makeScale(0, 3600_000)} innerWidth={600} innerHeight={300} />
      </svg>
    );
    expect(container.querySelector('.x-axis')).toBeInTheDocument();
  });

  it('renders at least 2 tick groups', () => {
    const { container } = render(
      <svg>
        <XAxis xScale={makeScale(0, 3600_000)} innerWidth={600} innerHeight={300} />
      </svg>
    );
    const ticks = container.querySelectorAll('.x-axis g');
    expect(ticks.length).toBeGreaterThanOrEqual(2);
  });

  it('positions the axis at innerHeight via transform', () => {
    const { container } = render(
      <svg>
        <XAxis xScale={makeScale(0, 3600_000)} innerWidth={600} innerHeight={250} />
      </svg>
    );
    const axisGroup = container.querySelector('.x-axis') as SVGGElement;
    expect(axisGroup.getAttribute('transform')).toBe('translate(0,250)');
  });

  it('renders HH:MM tick labels for a 1-hour range', () => {
    const { container } = render(
      <svg>
        <XAxis xScale={makeScale(0, 3600_000)} innerWidth={600} innerHeight={300} />
      </svg>
    );
    const texts = Array.from(container.querySelectorAll('.x-axis text'));
    // HH:MM format: digits colon digits
    expect(texts.some((t) => /^\d{2}:\d{2}$/.test(t.textContent ?? ''))).toBe(true);
  });
});
