import { toDataFrame } from '@grafana/data';

// Series A has timestamps 1000, 3000 (missing 2000); value at 3000 is null
// Series B has timestamps 2000, 3000 (missing 1000)
export const sparseDataFrames = [
  toDataFrame({
    name: 'Series A',
    fields: [
      { name: 'time', type: 'time', values: [1000, 3000] },
      { name: 'value', type: 'number', values: [1, null] },
    ],
  }),
  toDataFrame({
    name: 'Series B',
    fields: [
      { name: 'time', type: 'time', values: [2000, 3000] },
      { name: 'value', type: 'number', values: [5, 6] },
    ],
  }),
];
