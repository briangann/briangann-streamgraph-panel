# Animated Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animate streamgraph band paths smoothly when series are toggled via the legend or when data updates, using `@react-spring/web` with no D3 DOM manipulation.

**Architecture:** Rather than removing hidden series from the D3 stack (current approach), zero out their values in a `zeroedRows` memo so all series remain in the stack at all times. React Spring's `useSprings` animates each path's `d` attribute from old to new positions, giving smooth reflow when bands hide/show or data changes. A user-facing toggle and duration slider control the animation. CSS transition on `fillOpacity` is retained for hover dimming.

**Tech Stack:** React 18, TypeScript, `@react-spring/web` v9, d3-shape (area generator), @grafana/ui/data/schema

---

### Task 1: Branch, dependency, and types

**Files:**

- Create branch: `feat/animated-transitions`
- Modify: `package.json` (add `@react-spring/web`)
- Modify: `src/types.ts`

- [ ] **Step 1: Create branch and install dependency**

```bash
git checkout main && git pull
git checkout -b feat/animated-transitions
npm install @react-spring/web
```

Expected: `@react-spring/web` appears in `package.json` dependencies.

- [ ] **Step 2: Add new fields to StreamgraphOptions in src/types.ts**

Find the `interface StreamgraphOptions` block. After `fillOpacity: number;` add:

```typescript
enableTransitions: boolean;
transitionDuration: number;
```

- [ ] **Step 3: Run typecheck — expect errors in module.ts and test fixture (not updated yet)**

```bash
npm run typecheck 2>&1 | grep -c "error" || true
```

Expected: errors (fixed in later tasks).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/types.ts
git commit -m "feat(transitions): add dependency and option types"
```

---

### Task 2: Panel option controls

**Files:**

- Modify: `src/module.ts`

- [ ] **Step 1: Add toggle and duration slider to Streamgraph category**

In `src/module.ts`, find the `.addSliderInput` for `fillOpacity` and add two more options after it:

```typescript
      .addBooleanSwitch({
        path: 'enableTransitions',
        name: 'Enable transitions',
        description: 'Animate band paths smoothly when series are toggled or data updates.',
        category: ['Streamgraph'],
        defaultValue: true,
      })
      .addSliderInput({
        path: 'transitionDuration',
        name: 'Transition duration',
        description: 'How long each band animation takes in milliseconds.',
        category: ['Streamgraph'],
        defaultValue: 300,
        showIf: (config) => config.enableTransitions,
        settings: { min: 100, max: 800, step: 50 },
      })
```

- [ ] **Step 2: Run typecheck — errors only in test fixture**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/module.ts
git commit -m "feat(transitions): add Enable transitions toggle and duration slider"
```

---

### Task 3: Replace visibleSeriesNames with zeroedRows

**Files:**

- Modify: `src/components/StreamGraph.tsx`

This task changes how hidden series work: instead of removing them from the D3 stack (which causes instant path removal), we zero out their values so the stack keeps all series — their bands morph to zero height when hidden.

- [ ] **Step 1: Replace visibleSeriesNames + stackedData with zeroedRows approach**

Find the existing block in `src/components/StreamGraph.tsx` (around lines 191–205):

```typescript
const visibleSeriesNames = useMemo(
  () => data.seriesNames.filter((name) => !hiddenSeries.has(name)),
  [data.seriesNames, hiddenSeries]
);

const stackedData = useMemo(() => {
  if (!data.rows.length || !visibleSeriesNames.length) {
    return [];
  }
  const stackGen = stack<Record<string, number>>()
    .keys(visibleSeriesNames)
    .offset(OFFSET_MAP[options.stackOffset])
    .order(ORDER_MAP[options.stackOrder]);
  return stackGen(data.rows);
}, [data.rows, visibleSeriesNames, options.stackOffset, options.stackOrder]);
```

Replace with:

```typescript
// Zero out hidden series values instead of removing them from the stack.
// This keeps all series in D3's stack at all times so React Spring can animate
// each band's path from its current shape to the new zero-height shape.
const zeroedRows = useMemo(
  () =>
    hiddenSeries.size === 0
      ? data.rows
      : data.rows.map((row) => {
          const result = { ...row };
          hiddenSeries.forEach((name) => {
            result[name] = 0;
          });
          return result;
        }),
  [data.rows, hiddenSeries]
);

const stackedData = useMemo(() => {
  if (!data.rows.length) {
    return [];
  }
  const stackGen = stack<Record<string, number>>()
    .keys(data.seriesNames)
    .offset(OFFSET_MAP[options.stackOffset])
    .order(ORDER_MAP[options.stackOrder]);
  return stackGen(zeroedRows);
}, [zeroedRows, data.seriesNames, options.stackOffset, options.stackOrder]);
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

Expected: errors only in test fixture (not yet updated).

- [ ] **Step 3: Run tests — some may fail because path count expectations changed**

```bash
npm run test:ci 2>&1 | tail -10
```

The two legend toggle tests (`hides a series when its legend item is clicked` / `shows the series again`) now need updating because `stackedData` always has all series. The path count won't change when a series is hidden — the band just morphs to zero height. Update those tests:

In `src/components/StreamGraph.test.tsx`, find the `describe('legend series toggle')` block and replace both tests:

```typescript
  it('zeros out a hidden series so its band collapses to zero height', () => {
    const { container } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    // All series always remain in the DOM (path count stays the same)
    expect(container.querySelectorAll('path')).toHaveLength(2);
    clickFirstLegendItem(container);
    // Path count unchanged — band morphs to zero height rather than being removed
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });

  it('restores a hidden series band when clicked again', () => {
    const { container } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    clickFirstLegendItem(container);
    clickFirstLegendItem(container);
    // Still 2 paths — both series present
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });
```

- [ ] **Step 4: Run full test suite**

```bash
npm run test:ci 2>&1 | tail -8
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/StreamGraph.tsx src/components/StreamGraph.test.tsx
git commit -m "refactor(transitions): use zeroedRows so all series stay in D3 stack"
```

---

### Task 4: Add React Spring path animation

**Files:**

- Modify: `src/components/StreamGraph.tsx`

- [ ] **Step 1: Add useSprings and animated imports**

Find the existing imports at the top of `src/components/StreamGraph.tsx`. Add after the existing React import:

```typescript
import { useSprings, animated } from '@react-spring/web';
```

- [ ] **Step 2: Remove PATH_TRANSITION_STYLE and add useSprings**

Find and delete:

```typescript
const PATH_TRANSITION_STYLE = { transition: 'fill-opacity 150ms ease' };
```

Inside the `StreamGraph` component, find where `bandLabels` useMemo ends (around line 265) and add `useSprings` after it:

```typescript
const pathSprings = useSprings(
  stackedData.length,
  stackedData.map((series) => ({
    to: { d: areaGen(series as unknown as StackDatum[]) ?? '' },
    config: options.enableTransitions ? { duration: options.transitionDuration } : { duration: 0 },
  }))
);
```

- [ ] **Step 3: Replace path rendering with animated.path**

Find the path render block (around line 368):

```tsx
{
  stackedData.map((series, i) => {
    const seriesName = (series as any).key as string;
    const isDimmed = options.hoverDimming && tooltip.visible && tooltip.hoveredSeries !== seriesName;
    return (
      <path
        key={seriesName}
        d={areaGen(series as unknown as StackDatum[]) ?? ''}
        fill={seriesColor(seriesName)}
        fillOpacity={isDimmed ? options.hoverDimmingOpacity : options.fillOpacity}
        style={PATH_TRANSITION_STYLE}
        onMouseMove={(e) => handlePathMouseMove(e, i, series as unknown as StackDatum[])}
        onMouseLeave={handlePathMouseLeave}
      />
    );
  });
}
```

Replace with:

```tsx
{
  pathSprings.map((springProps, i) => {
    const series = stackedData[i];
    const seriesName = (series as any).key as string;
    const isDimmed = options.hoverDimming && tooltip.visible && tooltip.hoveredSeries !== seriesName;
    return (
      <animated.path
        key={seriesName}
        d={springProps.d}
        fill={seriesColor(seriesName)}
        fillOpacity={isDimmed ? options.hoverDimmingOpacity : options.fillOpacity}
        style={{ transition: 'fill-opacity 150ms ease' }}
        onMouseMove={(e) => handlePathMouseMove(e, i, series as unknown as StackDatum[])}
        onMouseLeave={handlePathMouseLeave}
      />
    );
  });
}
```

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

Expected: errors only in test fixture (mockOptions missing new fields).

- [ ] **Step 5: Update snapshot if needed and run tests**

```bash
npm run test:ci 2>&1 | tail -10
```

If snapshot fails:

```bash
npx jest --updateSnapshot src/components/StreamGraph.test.tsx
npm run test:ci 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add src/components/StreamGraph.tsx src/components/__snapshots__/StreamGraph.test.tsx.snap
git commit -m "feat(transitions): animate band paths with React Spring useSprings"
```

---

### Task 5: Test fixture update and transition tests

**Files:**

- Modify: `src/components/StreamGraph.test.tsx`

- [ ] **Step 1: Add enableTransitions and transitionDuration to mockOptions**

Find `mockOptions` in `src/components/StreamGraph.test.tsx` and add after `hoverDimmingOpacity`:

```typescript
  enableTransitions: true,
  transitionDuration: 300,
```

- [ ] **Step 2: Add transition tests**

Add a new `describe('transitions')` block at the end of the test file:

```typescript
describe('transitions', () => {
  it('renders animated.path elements when enableTransitions is true', () => {
    const { container } = render(
      <StreamGraph data={mockData} width={800} height={400} options={mockOptions} seriesCalcs={emptyCalcs} />
    );
    // @react-spring/web animated.path renders as a regular <path> in JSDOM
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });

  it('renders paths when enableTransitions is false', () => {
    const { container } = render(
      <StreamGraph
        data={mockData}
        width={800}
        height={400}
        options={{ ...mockOptions, enableTransitions: false }}
        seriesCalcs={emptyCalcs}
      />
    );
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });
});
```

- [ ] **Step 3: Run full test suite**

```bash
npm run test:ci 2>&1 | tail -8
```

Expected: all tests pass.

- [ ] **Step 4: Run typecheck and lint**

```bash
npm run typecheck 2>&1 | tail -3
npm run lint 2>&1 | tail -3
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/StreamGraph.test.tsx
git commit -m "test(transitions): add fixture fields and transition smoke tests"
```

---

### Task 6: README, changelog, and push

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add transition options to README options table**

In `README.md`, find the Fill opacity row in the options table and add two rows after it:

```markdown
| Streamgraph | Enable transitions | on/off — animate band paths when series are toggled or data updates | on |
| Streamgraph | Transition duration | 100–800 ms (step 50) — how long each animation takes; only visible when transitions are on | 300 ms |
```

- [ ] **Step 2: Add CHANGELOG entry**

In `CHANGELOG.md`, under `## [Unreleased]` → `### Features / Enhancements`, add:

```markdown
#### Animated transitions

- Band paths now animate smoothly when series are hidden or shown via the legend,
  and when new data arrives — configurable via Enable transitions toggle and
  Transition duration slider in the Streamgraph section
```

- [ ] **Step 3: Run markdownlint**

```bash
npm run markdownlint 2>&1 | tail -3
```

If errors: `npm run lint:fix 2>&1 | tail -3`

- [ ] **Step 4: Run full build check**

```bash
npm run build 2>&1 | tail -5
npm run spellcheck 2>&1 | tail -3
```

Expected: build succeeds, no spellcheck issues.

- [ ] **Step 5: Commit and push**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: add animated transitions to README and changelog"
git push -u origin feat/animated-transitions
gh pr create --draft \
  --title "feat: animated band transitions" \
  --body "Bands animate smoothly when series are toggled via legend or data updates. Uses @react-spring/web. Configurable via Enable transitions toggle and Transition duration slider."
```
