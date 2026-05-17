import { toDataFrame } from '@grafana/data';

export const multiDataFrames = [
  toDataFrame({
    name: 'Series A',
    fields: [
      { name: 'time', type: 'time', values: [1000, 2000, 3000] },
      { name: 'value', type: 'number', values: [1, 2, 3] },
    ],
  }),
  toDataFrame({
    name: 'Series B',
    fields: [
      { name: 'time', type: 'time', values: [1000, 2000, 3000] },
      { name: 'value', type: 'number', values: [4, 5, 6] },
    ],
  }),
  toDataFrame({
    name: 'Series C',
    fields: [
      { name: 'time', type: 'time', values: [1000, 2000, 3000] },
      { name: 'value', type: 'number', values: [7, 8, 9] },
    ],
  }),
];
