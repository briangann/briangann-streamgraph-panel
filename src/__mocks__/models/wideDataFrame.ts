import { toDataFrame } from '@grafana/data';

export const wideDataFrame = toDataFrame({
  fields: [
    { name: 'time', type: 'time', values: [1000, 2000, 3000, 4000, 5000] },
    { name: 'Series A', type: 'number', values: [1, 2, 3, 2, 1] },
    { name: 'Series B', type: 'number', values: [4, 3, 2, 3, 4] },
    { name: 'Series C', type: 'number', values: [2, 2, 2, 2, 2] },
  ],
});
