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

  test('displays X axis', async ({ gotoPanelEditPage, readProvisionedDashboard, page }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    await gotoPanelEditPage({ dashboard, id: '1' });
    const content = page.getByTestId('data-testid panel content');
    await expect(content.locator('svg .x-axis')).toBeVisible();
  });
});
