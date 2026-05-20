import { test, expect } from '@grafana/plugin-e2e';

test.describe('Streamgraph panel', () => {
  test('renders SVG with data', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    await gotoPanelEditPage({ dashboard, id: '1' });
    const content = page.getByTestId('data-testid panel content');
    await expect(content.locator('svg')).toBeVisible();
    await expect(content.locator('svg path')).toHaveCount(5);
  });

  test('shows "No data" when query returns empty', async ({ gotoPanelEditPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
    await expect(panelEditPage.panel.locator).toContainText('No data');
  });

  test('displays legend with series names', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    await gotoPanelEditPage({ dashboard, id: '1' });
    const content = page.getByTestId('data-testid panel content');
    await expect(content.getByTestId(/VizLegend series/)).toHaveCount(5);
  });

  test('displays band labels when option is enabled', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
    const options = panelEditPage.getCustomOptions('Band Labels');
    const showLabels = options.getSwitch('Show labels');
    await showLabels.check();
    const content = page.getByTestId('data-testid panel content');
    await expect(content.locator('svg text[data-testid="band-label"]')).not.toHaveCount(0);
  });

  test('hides band labels when option is disabled', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'band-labels.json' });
    const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
    const options = panelEditPage.getCustomOptions('Band Labels');
    const showLabels = options.getSwitch('Show labels');
    await showLabels.uncheck();
    const content = page.getByTestId('data-testid panel content');
    await expect(content.locator('svg text[data-testid="band-label"]')).toHaveCount(0);
  });

  test('displays X axis', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    await gotoPanelEditPage({ dashboard, id: '1' });
    const content = page.getByTestId('data-testid panel content');
    await expect(content.locator('svg .x-axis')).toBeVisible();
  });

  test.describe('legend series toggle and transitions', () => {
    test('clicking a legend item keeps all paths in DOM (band collapses to zero height)', async ({
      gotoPanelEditPage,
      readProvisionedDashboard,
      page,
    }) => {
      const dashboard = await readProvisionedDashboard({ fileName: 'animated-transitions.json' });
      await gotoPanelEditPage({ dashboard, id: '1' });
      const content = page.getByTestId('data-testid panel content');
      await expect(content.locator('svg path')).toHaveCount(5);

      // Click first legend item to hide that series
      await content.getByTestId(/VizLegend series/).first().locator('button').click();

      // Path count unchanged — band morphs to zero height, not removed
      await expect(content.locator('svg path')).toHaveCount(5);
    });

    test('hidden series band path d attribute changes after animation completes', async ({
      gotoPanelEditPage,
      readProvisionedDashboard,
      page,
    }) => {
      const dashboard = await readProvisionedDashboard({ fileName: 'animated-transitions.json' });
      await gotoPanelEditPage({ dashboard, id: '1' });
      const content = page.getByTestId('data-testid panel content');

      const dBefore = await content.locator('svg path').first().getAttribute('d');

      await content.getByTestId(/VizLegend series/).first().locator('button').click();
      // Wait for 300ms default transition + buffer
      await page.waitForTimeout(450);

      const dAfter = await content.locator('svg path').first().getAttribute('d');
      expect(dAfter).not.toBe(dBefore);
    });

    test('clicking legend item again re-enables the series in the legend', async ({
      gotoPanelEditPage,
      readProvisionedDashboard,
      page,
    }) => {
      const dashboard = await readProvisionedDashboard({ fileName: 'animated-transitions.json' });
      await gotoPanelEditPage({ dashboard, id: '1' });
      const content = page.getByTestId('data-testid panel content');
      const legendItem = content.getByTestId(/VizLegend series/).first();

      await legendItem.locator('button').click();
      await page.waitForTimeout(450);
      // Emotion appends the label 'LegendLabelDisabled' to the class when disabled
      expect(await legendItem.getAttribute('class')).toContain('Disabled');

      await legendItem.locator('button').click();
      await page.waitForTimeout(450);
      expect(await legendItem.getAttribute('class')).not.toContain('Disabled');
    });

    test('disabling transitions makes legend toggle instant', async ({
      gotoPanelEditPage,
      readProvisionedDashboard,
      page,
    }) => {
      const dashboard = await readProvisionedDashboard({ fileName: 'animated-transitions.json' });
      const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
      const content = page.getByTestId('data-testid panel content');

      await panelEditPage.getCustomOptions('Streamgraph').getSwitch('Enable transitions').uncheck();

      const dBefore = await content.locator('svg path').first().getAttribute('d');
      await content.getByTestId(/VizLegend series/).first().locator('button').click();
      // No wait needed — immediate mode
      const dAfter = await content.locator('svg path').first().getAttribute('d');
      expect(dAfter).not.toBe(dBefore);
    });
  });

  test.describe('color schemes', () => {
    const newSchemes = ['Plasma', 'Inferno', 'Magma', 'Cool', 'Warm', 'Rainbow'];

    for (const scheme of newSchemes) {
      test(`renders correctly with ${scheme} color scheme`, async ({
        gotoPanelEditPage,
        readProvisionedDashboard,
        page,
      }) => {
        const dashboard = await readProvisionedDashboard({ fileName: 'band-labels.json' });
        const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
        const content = page.getByTestId('data-testid panel content');
        await panelEditPage.getCustomOptions('Streamgraph').getSelect('Color scheme').selectOption(scheme);
        await expect(content.locator('svg')).toBeVisible();
        await expect(content.locator('svg path')).toHaveCount(5);
      });
    }

    test('renders correctly with Grafana categorical palette', async ({
      gotoPanelEditPage,
      readProvisionedDashboard,
      page,
    }) => {
      const dashboard = await readProvisionedDashboard({ fileName: 'band-labels.json' });
      const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
      const content = page.getByTestId('data-testid panel content');
      await panelEditPage.getCustomOptions('Streamgraph').getSelect('Color scheme').selectOption('Classic');
      await expect(content.locator('svg')).toBeVisible();
      await expect(content.locator('svg path')).toHaveCount(5);
    });
  });
});
