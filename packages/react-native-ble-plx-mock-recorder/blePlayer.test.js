import { expect } from 'chai';

import { BleManagerMock } from './blePlayer.js';
import { recordingFileFormatVersion } from './recording.js';

/** @typedef { import('./recording.js').Recording } Recording */

const version = recordingFileFormatVersion;

describe(BleManagerMock.name, () => {
  it(BleManagerMock.prototype.monitorCharacteristicForDevice.name, async () => {
    const bleManager = new BleManagerMock();
    const { blePlayer } = bleManager;
    blePlayer.mockWith({
      records: [
        {
          type: 'command',
          command: 'monitorCharacteristicForDevice',
          request: {
            id: 'some-device-id',
            serviceUUID: 'Some-Service-Uuid',
            characteristicUUID: 'Some-Characteristic-Uuid',
          },
          response: undefined,
        },
        {
          type: 'event',
          event: 'characteristic',
          args: {
            characteristic: {
              // Note: test case insensitive listener lookup
              serviceUUID: 'some-service-UUID',
              uuid: 'some-characteristic-UUID',
              value: 'some-value',
            },
            error: null,
          },
          autoPlay: true,
        },
        {
          type: 'label',
          label: 'characteristic-received',
        },
      ],
      version,
    });
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
      serviceUUID: 'some-service-UUID',
      uuid: 'some-characteristic-UUID',
      value: 'some-value',
    });
  });

  it(BleManagerMock.prototype.onDeviceDisconnected.name, async () => {
    const bleManager = new BleManagerMock();
    const { blePlayer } = bleManager;
    blePlayer.mockWith({
      records: [
        {
          type: 'command',
          command: 'onDeviceDisconnected',
          request: {
            id: '12-34-56-78-9A-BC'
          },
          response: undefined,
        },
        {
          type: 'event',
          event: 'deviceDisconnected',
          args: {
            device: {
              id: '12-34-56-78-9A-BC',
              localName: null,
              manufacturerData: null,
              mtu: 0,
              name: null,
              rssi: null,
            },
            error: null,
          },
          autoPlay: true,
        },
        {
          type: 'label',
          label: 'device-disconnected',
        },
      ],
      version,
    });
    const [device, subscription] = await new Promise((resolve) => {
      const s = bleManager.onDeviceDisconnected('12-34-56-78-9A-BC', (error, d) => {
        resolve([d, s]);
      });
      blePlayer.playUntil('device-disconnected');
    });
    expect(device.id).to.equal('12-34-56-78-9A-BC');
    subscription.remove();
    // TODO: verify multiple subscriptions
  });
});

describe('BlePlayer', () => {
  it('should report error by line number', async () => {
    const bleManager = new BleManagerMock();
    const { blePlayer } = bleManager;
    /** @type Recording */
    const recording = {
      records: [
        {
          type: 'command',
          command: 'monitorCharacteristicForDevice',
          request: {
            id: 'some-device-id',
            serviceUUID: 'some-service-uuid',
            characteristicUUID: 'some-characteristic-uuid',
          },
          response: undefined,
        },
        {
          type: 'event',
          event: 'characteristic',
          args: {
            characteristic: {
              serviceUUID: 'some-service-uuid',
              uuid: 'some-characteristic-uuid',
              value: 'some-value',
            },
            error: null,
          },
          autoPlay: false,
        },
        {
          type: 'label',
          label: 'characteristic-received',
        },
      ],
      version,
    };
    blePlayer.mockWith(recording);
    const subscription = bleManager.monitorCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid', () => { });

    const expectedLineNumber = 12;
    expect(JSON.stringify(recording, null, 2).split('\n').slice(expectedLineNumber - 1, expectedLineNumber + 2)).to.deep.equal([
      '    {',
      '      "type": "event",',
      '      "event": "characteristic",',
    ]);
    expect(() => blePlayer.expectFullCoverage()).to.throw(`Expected recording to be fully covered but last 2 records since line ${expectedLineNumber} (index 1) were not played`);
  });
});
