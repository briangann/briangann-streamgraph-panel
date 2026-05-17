import { PanelPlugin } from '@grafana/data';

import { StreamGraphPanel } from './components/StreamGraphPanel';
import {
  ColorScheme,
  CurveType,
  LegendPlacement,
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
        defaultValue: 0.8,
        settings: { min: 0, max: 1, step: 0.1 },
      })
      .addBooleanSwitch({
        path: 'showXAxis',
        name: 'Show X axis',
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'showTooltip',
        name: 'Show tooltip',
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'showLegend',
        name: 'Show legend',
        defaultValue: true,
      })
      .addSelect({
        path: 'legendPlacement',
        name: 'Legend placement',
        defaultValue: LegendPlacement.BOTTOM,
        showIf: (config) => config.showLegend,
        settings: {
          options: [
            { value: LegendPlacement.BOTTOM, label: 'Bottom' },
            { value: LegendPlacement.RIGHT, label: 'Right' },
          ],
        },
      });
  }
);
