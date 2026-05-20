import { PanelPlugin } from '@grafana/data';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode } from '@grafana/schema';

import { StreamGraphPanel } from './components/StreamGraphPanel';
import {
  BandLabelColor,
  ColorScheme,
  CurveType,
  DEFAULT_LEGEND_CALCS,
  StackOffset,
  StackOrder,
  StreamgraphOptions,
} from './types';

export const plugin = new PanelPlugin<StreamgraphOptions>(StreamGraphPanel).setPanelOptions((builder) => {
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
          { value: ColorScheme.CIVIDIS, label: 'Cividis', group: 'D3 Gradients' },
          { value: ColorScheme.TURBO, label: 'Turbo', group: 'D3 Gradients' },
          { value: ColorScheme.VIRIDIS, label: 'Viridis', group: 'D3 Gradients' },
          { value: ColorScheme.SPECTRAL, label: 'Spectral', group: 'D3 Gradients' },
          { value: ColorScheme.PLASMA, label: 'Plasma', group: 'D3 Gradients' },
          { value: ColorScheme.INFERNO, label: 'Inferno', group: 'D3 Gradients' },
          { value: ColorScheme.MAGMA, label: 'Magma', group: 'D3 Gradients' },
          { value: ColorScheme.COOL, label: 'Cool', group: 'D3 Gradients' },
          { value: ColorScheme.WARM, label: 'Warm', group: 'D3 Gradients' },
          { value: ColorScheme.RAINBOW, label: 'Rainbow', group: 'D3 Gradients' },
          { value: ColorScheme.GRAFANA_CLASSIC, label: 'Classic', group: 'Grafana Palettes' },
          { value: ColorScheme.GRAFANA_GR_YL_RD, label: 'Green-Yellow-Red', group: 'Grafana Palettes' },
          { value: ColorScheme.GRAFANA_RD_YL_GR, label: 'Red-Yellow-Green', group: 'Grafana Palettes' },
          { value: ColorScheme.GRAFANA_BL_YL_RD, label: 'Blue-Yellow-Red', group: 'Grafana Palettes' },
          { value: ColorScheme.GRAFANA_YL_RD, label: 'Yellow-Red', group: 'Grafana Palettes' },
          { value: ColorScheme.GRAFANA_BL_PU, label: 'Blue-Purple', group: 'Grafana Palettes' },
          { value: ColorScheme.GRAFANA_YL_BL, label: 'Yellow-Blue', group: 'Grafana Palettes' },
          { value: ColorScheme.GRAFANA_BLUES, label: 'Blues', group: 'Grafana Palettes' },
          { value: ColorScheme.GRAFANA_REDS, label: 'Reds', group: 'Grafana Palettes' },
          { value: ColorScheme.GRAFANA_GREENS, label: 'Greens', group: 'Grafana Palettes' },
          { value: ColorScheme.GRAFANA_PURPLES, label: 'Purples', group: 'Grafana Palettes' },
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
    .addBooleanSwitch({
      path: 'showBandLabels',
      name: 'Show labels',
      description: 'Render each series name inside its band at the widest visible point.',
      category: ['Band Labels'],
      defaultValue: false,
    })
    .addSelect({
      path: 'bandLabelColor',
      name: 'Label color',
      description:
        'How label text is colored relative to the band fill. ' +
        'Inverse flips each RGB channel. ' +
        'Auto picks black or white based on perceived luminance (ITU-R BT.601). ' +
        'White and Black are fixed regardless of band color.',
      category: ['Band Labels'],
      defaultValue: BandLabelColor.INVERSE,
      showIf: (config) => config.showBandLabels,
      settings: {
        options: [
          { value: BandLabelColor.INVERSE, label: 'Inverse' },
          { value: BandLabelColor.AUTO, label: 'Auto (contrast)' },
          { value: BandLabelColor.WHITE, label: 'White' },
          { value: BandLabelColor.BLACK, label: 'Black' },
        ],
      },
    })
    .addNumberInput({
      path: 'bandLabelMinFontSize',
      name: 'Min font size',
      description: 'Smallest font size in pixels. Labels never render smaller than this, even on very narrow bands.',
      category: ['Band Labels'],
      defaultValue: 8,
      showIf: (config) => config.showBandLabels,
      settings: { placeholder: '8', integer: true, min: 1 },
    })
    .addNumberInput({
      path: 'bandLabelMaxFontSize',
      name: 'Max font size',
      description: 'Largest font size in pixels. Labels never render larger than this, even on very tall bands.',
      category: ['Band Labels'],
      defaultValue: 48,
      showIf: (config) => config.showBandLabels,
      settings: { placeholder: '48', integer: true, min: 1 },
    })
    .addNumberInput({
      path: 'bandLabelMinBandHeight',
      name: 'Min band height',
      description:
        'Minimum band height in pixels required to show a label. ' +
        'Bands narrower than this threshold are left unlabeled.',
      category: ['Band Labels'],
      defaultValue: 8,
      showIf: (config) => config.showBandLabels,
      settings: { placeholder: '8', integer: true, min: 1 },
    })
    .addSliderInput({
      path: 'bandLabelFontScaleFactor',
      name: 'Font scale',
      description:
        'Font size as a fraction of band height at the label position. ' +
        '0.7 means the text is 70% as tall as the band — reduce for breathing room, increase to fill the band.',
      category: ['Band Labels'],
      defaultValue: 0.7,
      showIf: (config) => config.showBandLabels,
      settings: { min: 0.1, max: 1.5, step: 0.05 },
    })
    .addSliderInput({
      path: 'bandLabelStrokeWidth',
      name: 'Stroke width',
      description:
        'Width in pixels of a contrasting outline drawn behind label text. ' +
        'Useful when the label color alone does not stand out from adjacent bands. Set to 0 to disable.',
      category: ['Band Labels'],
      defaultValue: 0,
      showIf: (config) => config.showBandLabels,
      settings: { min: 0, max: 3, step: 0.5 },
    })
    .addBooleanSwitch({
      path: 'bandLabelOpacityFade',
      name: 'Opacity fade',
      description:
        'When on, labels fade in gradually as bands grow past the minimum height threshold. ' +
        'When off, labels appear at full opacity immediately above the threshold.',
      category: ['Band Labels'],
      defaultValue: true,
      showIf: (config) => config.showBandLabels,
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
      path: 'tooltip.hideZeros',
      name: 'Hide zeros',
      category: ['Tooltip'],
      defaultValue: false,
      showIf: (config) => config.tooltip?.mode === TooltipDisplayMode.Multi,
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
      showIf: (config: StreamgraphOptions) =>
        config.legend?.showLegend && config.legend?.displayMode === LegendDisplayMode.Table,
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
});
