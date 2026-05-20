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

  test.describe('color schemes', () => {
    const newSchemes = ['Plasma', 'Inferno', 'Magma', 'Cool', 'Warm', 'Rainbow'];

    for (const scheme of newSchemes) {
      test(`renders correctly with ${scheme} color scheme`, async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
        const dashboard = await readProvisionedDashboard({ fileName: 'band-labels.json' });
        const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
        const content = page.getByTestId('data-testid panel content');
        await panelEditPage.getCustomOptions('Streamgraph').getSelect('Color scheme').selectOption(scheme);
        await expect(content.locator('svg')).toBeVisible();
        await expect(content.locator('svg path')).toHaveCount(5);
      });
    }

    test('renders correctly with Grafana categorical palette', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
      const dashboard = await readProvisionedDashboard({ fileName: 'band-labels.json' });
      const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
      const content = page.getByTestId('data-testid panel content');
      await panelEditPage.getCustomOptions('Streamgraph').getSelect('Color scheme').selectOption('Classic');
      await expect(content.locator('svg')).toBeVisible();
      await expect(content.locator('svg path')).toHaveCount(5);
    });
  });
});
