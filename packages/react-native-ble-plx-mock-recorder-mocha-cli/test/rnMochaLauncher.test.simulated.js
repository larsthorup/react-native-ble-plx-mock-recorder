/* global describe, it */

import { expect } from 'chai';
import * as td from 'testdouble';

import { BleRecorder, BleManagerSpy } from 'react-native-ble-plx-mock-recorder';

const BleManagerFake = td.constructor(BleManagerSpy);

describe('calc', () => {
  it('should add', () => {
    console.log('2 + 2 === 4');
    expect(2 + 2).to.equal(4);
  });

  it('should fail', () => {
    expect(2 / 2).to.equal(4);
  });

  it.skip('should report pending', () => {
    expect(0 / 0).to.equal(5);
  });
});

describe('state', () => {
  it('should record command with request and response', async () => {
    const recordingName = 'rnMochaLauncher.test.simulated';
    const bleManagerFake = new BleManagerFake();
    const logger = (line) => console.log(line);
    const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, recordingName, logger });
    td.when(bleManagerFake.state()).thenResolve('some-state');
    const bleManager = bleRecorder.bleManagerSpy;
    const state = await bleManager.state();
    expect(state).to.equal('some-state');
    bleRecorder.close();
  });
});