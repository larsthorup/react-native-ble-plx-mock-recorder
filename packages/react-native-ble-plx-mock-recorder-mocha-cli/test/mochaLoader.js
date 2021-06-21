/* global mocha */
// Note: we need the embeddable version of mocha, not the CLI
import '../node_modules/mocha/mocha.js';
import { MochaEventReporter } from 'react-native-ble-plx-mock-recorder-mocha-core';

global.location = {};
mocha.setup('bdd');

export const run = async (logger) => {
  mocha.reporter(MochaEventReporter, { logger });
  return new Promise((resolve) => {
    mocha.run(resolve);
  });
};

export default mocha;