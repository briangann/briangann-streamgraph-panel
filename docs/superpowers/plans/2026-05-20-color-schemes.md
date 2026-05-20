# Color Palette Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 new d3-scale-chromatic gradient palettes and a theme-aware Grafana categorical palette to the streamgraph color scheme option, and replace custom color math with Grafana SDK equivalents.

**Architecture:** New enum values are added to `ColorScheme`; `SCHEME_MAP` in `StreamGraph.tsx` gains 6 new d3 interpolators; a separate code path handles `ColorScheme.GRAFANA` using `useTheme2()` to pull `theme.visualization.palette`. `autoContrastColor` in `bandLabels.ts` is replaced with `getTextColorForBackground` from `@grafana/ui`; the custom `parseRgb` helper is replaced with `decomposeColor` from `@grafana/data`.

**Tech Stack:** React, TypeScript, d3-scale-chromatic, @grafana/data (createTheme, decomposeColor), @grafana/ui (useTheme2, getTextColorForBackground)

---

### Task 1: Branch setup and enum additions

**Files:**

- Create branch: `feat/color-schemes`
- Modify: `src/types.ts`

- [ ] **Step 1: Create branch**

```bash
git checkout main && git pull
git checkout -b feat/color-schemes
```

- [ ] **Step 2: Add new ColorScheme values**

In `src/types.ts`, update the `ColorScheme` enum:

```typescript
export enum ColorScheme {
  CIVIDIS = 'cividis',
  TURBO = 'turbo',
  VIRIDIS = 'viridis',
  SPECTRAL = 'spectral',
  PLASMA = 'plasma',
  INFERNO = 'inferno',
  MAGMA = 'magma',
  COOL = 'cool',
  WARM = 'warm',
  RAINBOW = 'rainbow',
  GRAFANA = 'grafana',
}
```

- [ ] **Step 3: Run typecheck — expect errors in StreamGraph.tsx and module.ts (SCHEME_MAP and select are not yet updated)**

```bash
npm run typecheck 2>&1 | grep -c "error"
```

Expected: errors reported (that's fine — we'll fix them in subsequent tasks).

- [ ] **Step 4: Commit**

```bash
git add src/types.ts
git commit -m "feat(color-schemes): add 7 new ColorScheme enum values"
```

---

### Task 2: d3 gradient additions

**Files:**

- Modify: `src/components/StreamGraph.tsx`
- Modify: `src/module.ts`
- Test: `src/components/StreamGraph.test.tsx`

- [ ] **Step 1: Write failing tests for new d3 schemes**

In `src/components/StreamGraph.test.tsx`, add after the existing imports and `mockOptions`:

```typescript
import { ColorScheme } from '../types';
```

(It should already be imported. If so, skip. Then add this test block after the existing tests:)

```typescript
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
});
```

- [ ] **Step 2: Run tests — expect failures (imports not yet added)**

```bash
npx jest src/components/StreamGraph.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: test suite fails.

- [ ] **Step 3: Add d3 interpolators to StreamGraph.tsx**

Update the `d3-scale-chromatic` import at line 18:

```typescript
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
```

Update `SCHEME_MAP` (currently at line ~75):

```typescript
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
```

Note: `ColorScheme.GRAFANA` is intentionally absent — it uses a separate path in Task 3.

- [ ] **Step 4: Add new options to module.ts**

In `src/module.ts`, update the `colorScheme` addSelect options array:

```typescript
settings: {
  options: [
    { value: ColorScheme.CIVIDIS, label: 'Cividis' },
    { value: ColorScheme.TURBO, label: 'Turbo' },
    { value: ColorScheme.VIRIDIS, label: 'Viridis' },
    { value: ColorScheme.SPECTRAL, label: 'Spectral' },
    { value: ColorScheme.PLASMA, label: 'Plasma' },
    { value: ColorScheme.INFERNO, label: 'Inferno' },
    { value: ColorScheme.MAGMA, label: 'Magma' },
    { value: ColorScheme.COOL, label: 'Cool' },
    { value: ColorScheme.WARM, label: 'Warm' },
    { value: ColorScheme.RAINBOW, label: 'Rainbow' },
    { value: ColorScheme.GRAFANA, label: 'Grafana' },
  ],
},
```

- [ ] **Step 5: Run tests — expect passing**

```bash
npx jest src/components/StreamGraph.test.tsx --no-coverage 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Step 6: Run typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

Expected: no errors (GRAFANA will be handled next task).

- [ ] **Step 7: Commit**

```bash
git add src/components/StreamGraph.tsx src/module.ts src/components/StreamGraph.test.tsx
git commit -m "feat(color-schemes): add Plasma, Inferno, Magma, Cool, Warm, Rainbow palettes"
```

---

### Task 3: Grafana categorical palette

**Files:**

- Modify: `src/components/StreamGraph.tsx`
- Test: `src/components/StreamGraph.test.tsx`

- [ ] **Step 1: Write failing test for Grafana categorical scheme**

Add to the `describe('color schemes')` block in `src/components/StreamGraph.test.tsx`:

```typescript
it('renders without crashing with Grafana categorical scheme', () => {
  const { container } = render(
    <StreamGraph
      data={mockData}
      width={800}
      height={400}
      options={{ ...mockOptions, colorScheme: ColorScheme.GRAFANA }}
      seriesCalcs={emptyCalcs}
    />
  );
  expect(container.querySelector('svg')).toBeInTheDocument();
  expect(container.querySelectorAll('path')).toHaveLength(2);
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
npx jest src/components/StreamGraph.test.tsx -t "Grafana categorical" --no-coverage 2>&1 | tail -10
```

Expected: test fails (no Grafana path in colorScale yet).

- [ ] **Step 3: Add useTheme2 to StreamGraph.tsx imports**

Add `useTheme2` to the `@grafana/ui` import:

```typescript
import { SeriesTable, VizLegend, VizTooltip, useTheme2 } from '@grafana/ui';
```

- [ ] **Step 4: Add theme hook and split colorScale useMemo**

Inside `StreamGraph` component, add the hook after the existing state declarations (before `innerWidth`):

```typescript
const theme = useTheme2();
```

Replace the existing `colorScale` useMemo with:

```typescript
const colorScale = useMemo((): ((i: number) => string) => {
  if (options.colorScheme === ColorScheme.GRAFANA) {
    const palette = theme.visualization.palette;
    if (!palette || palette.length === 0) {
      // fallback: Cividis sequential
      return (i: number) =>
        scaleSequential(interpolateCividis).domain([0, Math.max(1, data.seriesNames.length - 1)])(i);
    }
    const resolvedColors = palette.map((name) => theme.visualization.getColorByName(name));
    return (i: number) => resolvedColors[Math.round(i) % resolvedColors.length];
  }
  const interpolator = SCHEME_MAP[options.colorScheme] ?? interpolateCividis;
  return scaleSequential(interpolator).domain([0, Math.max(1, data.seriesNames.length - 1)]);
}, [options.colorScheme, data.seriesNames.length, theme]);
```

Add `interpolateCividis` to the fallback import if not already present (it is — already in SCHEME_MAP).

- [ ] **Step 5: Run tests**

```bash
npm run test:ci 2>&1 | tail -10
```

Expected: all tests pass. Note: `useTheme2` is auto-mocked by the Grafana jest setup; the mock returns a default theme with a valid palette.

If `useTheme2` mock is missing, add to `jest-setup.js`:

```javascript
jest.mock('@grafana/ui', () => ({
  ...jest.requireActual('@grafana/ui'),
  useTheme2: () => ({
    visualization: {
      palette: ['blue', 'green', 'red', 'orange', 'purple'],
      getColorByName: (name) => name,
    },
  }),
}));
```

- [ ] **Step 6: Run typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/StreamGraph.tsx src/components/StreamGraph.test.tsx jest-setup.js
git commit -m "feat(color-schemes): add theme-aware Grafana categorical palette"
```

---

### Task 4: Replace custom color math with Grafana SDK

**Files:**

- Modify: `src/data/bandLabels.ts`
- Test: `src/data/bandLabels.test.ts`

The changes:

1. `autoContrastColor(rgb)` → `getTextColorForBackground(color)` from `@grafana/ui/colors`
   - Returns `"rgb(32, 34, 38)"` (dark) or `"rgb(247, 248, 250)"` (light) instead of pure black/white
2. `parseRgb(rgb)` → `decomposeColor(rgb)` from `@grafana/data`
   - Returns `{ type: 'rgb', values: [r, g, b] }` instead of `[r, g, b] | null`
   - Throws on invalid input; use try/catch instead of null check

- [ ] **Step 1: Update auto contrast color tests**

In `src/data/bandLabels.test.ts`, update the `describe('label color modes')` auto contrast tests. The Grafana function returns slightly different near-black/near-white values:

```typescript
it('auto contrast picks black on a light band', () => {
  // rgb(200, 200, 200) luminance ≈ 0.78 → dark text
  const labels = computeBandLabels(oneBand, xScale, yScale, () => 'rgb(200, 200, 200)', innerWidth, innerHeight, {
    ...defaultOptions,
    colorMode: BandLabelColor.AUTO,
  });
  // Grafana's getTextColorForBackground returns near-black, not pure black
  expect(labels[0].color).toBe('rgb(32, 34, 38)');
});

it('auto contrast picks white on a dark band', () => {
  // rgb(0, 32, 81) luminance ≈ 0.09 → light text
  const labels = compute(oneBand, { colorMode: BandLabelColor.AUTO });
  // Grafana's getTextColorForBackground returns near-white, not pure white
  expect(labels[0].color).toBe('rgb(247, 248, 250)');
});
```

- [ ] **Step 2: Run tests — expect failures (behavior not yet changed)**

```bash
npx jest src/data/bandLabels.test.ts --no-coverage 2>&1 | tail -10
```

Expected: 2 auto contrast tests fail.

- [ ] **Step 3: Replace autoContrastColor with getTextColorForBackground**

In `src/data/bandLabels.ts`:

Remove the import at the top and add:

```typescript
import { BandLabelColor } from '../types';
import { getTextColorForBackground } from '@grafana/ui';
import { decomposeColor } from '@grafana/data';
```

Remove the `parseRgb` helper function entirely. Replace `invertColor` to use `decomposeColor`:

```typescript
export function invertColor(rgb: string): string {
  try {
    const { values } = decomposeColor(rgb);
    return `rgb(${255 - values[0]}, ${255 - values[1]}, ${255 - values[2]})`;
  } catch {
    return 'rgb(255, 255, 255)';
  }
}
```

Remove the `autoContrastColor` function entirely.

In the `switch (colorMode)` block, update the AUTO case:

```typescript
case BandLabelColor.AUTO:  color = getTextColorForBackground(bandColor); break;
```

Remove `RGB_REGEX` constant (no longer needed).

- [ ] **Step 4: Run tests — expect passing**

```bash
npm run test:ci 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 5: Run typecheck and lint**

```bash
npm run typecheck 2>&1 | tail -3
npm run lint 2>&1 | tail -3
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/data/bandLabels.ts src/data/bandLabels.test.ts
git commit -m "refactor(band-labels): replace custom color math with Grafana SDK equivalents"
```

---

### Task 5: README and changelogs

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `src/CHANGELOG.md`

- [ ] **Step 1: Update README options table**

In `README.md`, find the `Color scheme` row and update the values column:

```
| Streamgraph | Color scheme      | Cividis, Turbo, Viridis, Spectral, Plasma, Inferno, Magma, Cool, Warm, Rainbow, Grafana |
```

- [ ] **Step 2: Update CHANGELOG.md**

Under `## [Unreleased]` → `### Features / Enhancements`, add:

```markdown
#### Color schemes

- Added Plasma, Inferno, Magma, Cool, Warm, and Rainbow gradient palettes from
  d3-scale-chromatic
- Added Grafana categorical palette — uses the current Grafana theme's series
  colors, adapting automatically when switching between dark and light mode
```

- [ ] **Step 3: Update src/CHANGELOG.md**

Under `## [Unreleased]` → `### Code Quality`, add:

```markdown
#### bandLabels.ts

- Replaced custom autoContrastColor luminance check with Grafana SDK's
  getTextColorForBackground from @grafana/ui
- Replaced custom parseRgb RGB string parser with decomposeColor from
  @grafana/data; removed RGB_REGEX constant
```

Under `### Build / Tooling`, add:

```markdown
#### StreamGraph.tsx

- useTheme2 added to support theme-aware Grafana categorical color palette
- colorScale useMemo split into sequential and categorical paths
```

- [ ] **Step 4: Run markdownlint**

```bash
npm run markdownlint 2>&1 | tail -3
```

If errors, run `npm run lint:fix` to auto-align tables.

- [ ] **Step 5: Commit**

```bash
git add README.md CHANGELOG.md src/CHANGELOG.md
git commit -m "docs: add new color scheme options to README and changelogs"
```

---

### Task 6: Final verification and push

- [ ] **Step 1: Run full test suite**

```bash
npm run test:ci 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 2: Run typecheck and lint**

```bash
npm run typecheck 2>&1 | tail -3
npm run lint 2>&1 | tail -3
npm run spellcheck 2>&1 | tail -3
```

Expected: no errors.

- [ ] **Step 3: Build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds, no TypeScript errors.

- [ ] **Step 4: Manual verification**

Open the panel in Grafana and cycle through all 11 color scheme options. Verify:

- Each d3 gradient renders with distinct colors across series
- Grafana option uses the theme's categorical colors
- Switching Grafana theme between dark/light updates the Grafana palette

- [ ] **Step 5: Push and open draft PR**

```bash
git push -u origin feat/color-schemes
gh pr create --draft \
  --title "feat: expand color palette options" \
  --body "Adds 6 new d3 gradient palettes and a theme-aware Grafana categorical option. Replaces custom color math with Grafana SDK equivalents."
```
