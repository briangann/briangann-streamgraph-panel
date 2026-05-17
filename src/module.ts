import { PanelPlugin } from '@grafana/data';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode } from '@grafana/schema';

import { StreamGraphPanel } from './components/StreamGraphPanel';
import {
  ColorScheme,
  CurveType,
  DEFAULT_LEGEND_CALCS,
  StackOffset,
  StackOrder,
  StreamgraphOptions,
} from './types';

export const plugin = new PanelPlugin<StreamgraphOptions>(StreamGraphPanel).setPanelOptions(
  (builder) => {
    return builder
      .addSelect({
        path: 'stackOffset',
        name: 'Stack offset',
        category: ['Streamgraph'],
        defaultValue: StackOffset.WIGGLE,
        settings: {
          options: [
            { value: StackOffset.WIGGLE, label: 'Wiggle' },
            { value: StackOffset.SILHOUETTE, label: 'Silhouette' },
            { value: StackOffset.ZERO, label: 'Zero (stacked)' },
            { value: StackOffset.EXPAND, label: 'Expand (normalized)' },
          ],
        },
      })
      .addSelect({
        path: 'stackOrder',
        name: 'Stack order',
        category: ['Streamgraph'],
        defaultValue: StackOrder.INSIDE_OUT,
        settings: {
          options: [
            { value: StackOrder.INSIDE_OUT, label: 'Inside out' },
            { value: StackOrder.ASCENDING, label: 'Ascending' },
            { value: StackOrder.DESCENDING, label: 'Descending' },
            { value: StackOrder.NONE, label: 'None' },
          ],
        },
      })
      .addSelect({
        path: 'curveType',
        name: 'Curve type',
        category: ['Streamgraph'],
        defaultValue: CurveType.SMOOTH,
        settings: {
          options: [
            { value: CurveType.SMOOTH, label: 'Smooth' },
            { value: CurveType.LINEAR, label: 'Linear' },
            { value: CurveType.STEP, label: 'Step' },
          ],
        },
      })
      .addSelect({
        path: 'colorScheme',
        name: 'Color scheme',
        category: ['Streamgraph'],
        defaultValue: ColorScheme.CIVIDIS,
        settings: {
          options: [
            { value: ColorScheme.CIVIDIS, label: 'Cividis' },
            { value: ColorScheme.TURBO, label: 'Turbo' },
            { value: ColorScheme.VIRIDIS, label: 'Viridis' },
            { value: ColorScheme.SPECTRAL, label: 'Spectral' },
          ],
        },
      })
      .addSliderInput({
        path: 'fillOpacity',
        name: 'Fill opacity',
        category: ['Streamgraph'],
        defaultValue: 0.8,
        settings: { min: 0, max: 1, step: 0.1 },
      })
      .addBooleanSwitch({
        path: 'showXAxis',
        name: 'Show X axis',
        category: ['Axis'],
        defaultValue: true,
      })
      .addSelect({
        path: 'tooltip.mode',
        name: 'Tooltip mode',
        category: ['Tooltip'],
        defaultValue: TooltipDisplayMode.Single,
        settings: {
          options: [
            { value: TooltipDisplayMode.Single, label: 'Single' },
            { value: TooltipDisplayMode.Multi, label: 'All series' },
            { value: TooltipDisplayMode.None, label: 'Hidden' },
          ],
        },
      })
      .addSelect({
        path: 'tooltip.sort',
        name: 'Sort order',
        category: ['Tooltip'],
        defaultValue: SortOrder.None,
        showIf: (config) => config.tooltip?.mode === TooltipDisplayMode.Multi,
        settings: {
          options: [
            { value: SortOrder.None, label: 'None' },
            { value: SortOrder.Ascending, label: 'Ascending' },
            { value: SortOrder.Descending, label: 'Descending' },
          ],
        },
      })
      .addBooleanSwitch({
        path: 'legend.showLegend',
        name: 'Show legend',
        category: ['Legend'],
        defaultValue: true,
      })
      .addSelect({
        path: 'legend.displayMode',
        name: 'Legend mode',
        category: ['Legend'],
        defaultValue: LegendDisplayMode.List,
        showIf: (config) => config.legend?.showLegend,
        settings: {
          options: [
            { value: LegendDisplayMode.List, label: 'List' },
            { value: LegendDisplayMode.Table, label: 'Table' },
          ],
        },
      })
      .addSelect({
        path: 'legend.placement',
        name: 'Legend placement',
        category: ['Legend'],
        defaultValue: 'bottom',
        showIf: (config) => config.legend?.showLegend,
        settings: {
          options: [
            { value: 'bottom', label: 'Bottom' },
            { value: 'right', label: 'Right' },
          ],
        },
      })
      .addMultiSelect({
        path: 'legend.calcs',
        name: 'Legend values',
        category: ['Legend'],
        defaultValue: DEFAULT_LEGEND_CALCS,
        showIf: (config: StreamgraphOptions) => config.legend?.showLegend && config.legend?.displayMode === LegendDisplayMode.Table,
        settings: {
          options: [
            { value: 'min', label: 'Min' },
            { value: 'max', label: 'Max' },
            { value: 'mean', label: 'Mean' },
            { value: 'sum', label: 'Sum' },
            { value: 'count', label: 'Count' },
            { value: 'first', label: 'First' },
            { value: 'firstNotNull', label: 'First *' },
            { value: 'last', label: 'Last' },
            { value: 'lastNotNull', label: 'Last *' },
          ],
        },
      } as any);
  }
);
