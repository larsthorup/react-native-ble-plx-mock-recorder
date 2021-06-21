/* global mocha */

import * as path from 'path';
import mocha, { run } from './mochaLoader.js';
import { stringifyTestRunnerEvent } from 'react-native-ble-plx-mock-recorder-mocha-core';

const logger = (runnerEvent) => {
  console.log(stringifyTestRunnerEvent(runnerEvent));
};

// Note: inspired by https://github.com/mochajs/mocha/issues/3006#issuecomment-330738327
const testPath = path.resolve('./test/rnMochaLauncher.test.simulated.js');
mocha.suite.emit('pre-require', global, testPath, mocha);
import * as fileExport from './rnMochaLauncher.test.simulated.js'; // fileExport is used by the exports interface, not sure if anything else; most interfaces act as a side effect of running the file
mocha.suite.emit('post-require', global, testPath, mocha);

run(logger).catch(console.error);