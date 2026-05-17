// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');

const additionalESModules = [
  'd3-array',
  'd3-axis',
  'd3-color',
  'd3-format',
  'd3-interpolate',
  'd3-path',
  'd3-scale',
  'd3-scale-chromatic',
  'd3-selection',
  'd3-shape',
  'd3-time',
  'd3-time-format',
  'internmap',
];

module.exports = {
  ...require('./.config/jest.config'),
  transformIgnorePatterns: [nodeModulesToTransform([...grafanaESModules, ...additionalESModules])],
};
