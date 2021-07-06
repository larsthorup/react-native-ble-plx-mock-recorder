import { expect } from 'chai';
import * as td from 'testdouble';

import { MemoryLogger } from './test/memoryLogger.js';
import { BleRecorder, BleManagerSpy } from './bleRecorder.js';
import { recordingFileFormatVersion } from './recording.js';

import { BleManagerMock } from './blePlayer.js';

/** @typedef { import('./recording.js').Recording } Recording */
/** @typedef { import('react-native-ble-plx').BleManager } BleManager */

const version = recordingFileFormatVersion;

const BleManagerFake = td.constructor(BleManagerSpy);

describe(BleManagerMock.name, () => {
  it(BleManagerMock.prototype.monitorCharacteristicForDevice.name, async () => {
    const bleManagerFake = /** @type { BleManager } */ (/** @type { unknown } */(new BleManagerFake()));
    // given a recording with a characteristic event
    td.when(bleManagerFake.monitorCharacteristicForDevice('some-device-id', 'Some-Service-Uuid', 'Some-Characteristic-Uuid', td.matchers.isA(Function))).thenDo(/** @type { () => void } */(d, s, c, listener) => {
      // given different case in uuid
      listener(null, { uuid: 'some-characteristic-UUID', value: 'some-value' });
    });
    const { recording, logger } = new MemoryLogger();
    const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
    // given a recording with a characteristic listener
    bleRecorder.bleManagerSpy.monitorCharacteristicForDevice('some-device-id', 'Some-Service-Uuid', 'Some-Characteristic-Uuid', () => { });
    bleRecorder.label('characteristic-received');
    bleRecorder.close();
    const bleManager = new BleManagerMock();
    const { blePlayer } = bleManager;
    blePlayer.mockWith(recording);

    const characteristic = await new Promise((resolve, reject) => {
      const subscription = bleManager.monitorCharacteristicForDevice('some-device-id', 'Some-Service-Uuid', 'Some-Characteristic-Uuid', (err, c) => {
        if (err) {
          reject(err);
        } else {
          resolve(c);
        }
      });
      blePlayer.playUntil('characteristic-received');
      subscription.remove();
    });
    expect(characteristic).to.deep.equal({
      serviceUUID: 'Some-Service-Uuid',
      uuid: 'some-characteristic-UUID',
      value: 'some-value',
    });
  });

  it(BleManagerMock.prototype.onDeviceDisconnected.name, async () => {
    const bleManagerFake = /** @type { BleManager } */ (/** @type { unknown } */(new BleManagerFake()));
    // given a recording with a device disconnection event
    td.when(bleManagerFake.onDeviceDisconnected('some-device-id', td.matchers.isA(Function))).thenDo(/** @type { () => void } */(_, listener) => {
      listener(null, { id: 'some-device-id' });
    });
    const { recording, logger } = new MemoryLogger();
    const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
    // given a recording with a device disconnection listener
    bleRecorder.bleManagerSpy.onDeviceDisconnected('some-device-id', () => { });
    bleRecorder.label('device-disconnected');
    bleRecorder.close();
    const bleManager = new BleManagerMock();
    const { blePlayer } = bleManager;
    blePlayer.mockWith(recording);

    const subscription = await new Promise((resolve) => {
      // when listening for device disconnection
      const s = bleManager.onDeviceDisconnected('some-device-id', (error, d) => {
        // then listener is invoked
        resolve(s);
      });

      // when disconnected
      blePlayer.playUntil('device-disconnected');
    });

    // when removing the subscription again
    subscription.remove();
    // TODO: verify multiple subscriptions
  });
});

describe('BlePlayer', () => {
  it('should report error by line number', async () => {
    const bleManagerFake = /** @type { BleManager } */ (/** @type { unknown } */(new BleManagerFake()));
    const { recording, logger } = new MemoryLogger();
    const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
    // given a recording with a few commands
    const { bleManagerSpy } = bleRecorder;
    await bleManagerSpy.connectToDevice('some-device-id', {});
    await bleManagerSpy.isDeviceConnected('some-device-id');
    await bleManagerSpy.state();
    bleRecorder.close();
    const bleManager = new BleManagerMock();
    const { blePlayer } = bleManager;
    blePlayer.mockWith(recording);

    // when invoking the first command
    bleManager.connectToDevice('some-device-id', {});

    // when expecting full coverage
    // then informative error is thrown
    const expectedLineNumber = 18;
    expect(JSON.stringify(recording, null, 2).split('\n').slice(expectedLineNumber - 1, expectedLineNumber + 2)).to.deep.equal([
      '    {',
      '      "type": "command",',
      '      "command": "isDeviceConnected",',
    ]);
    expect(() => blePlayer.expectFullCoverage()).to.throw(`Expected recording to be fully covered but last 2 records since line ${expectedLineNumber} (index 1) were not played`);
  });
});
