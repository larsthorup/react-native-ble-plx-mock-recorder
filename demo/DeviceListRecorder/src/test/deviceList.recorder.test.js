import { expect } from 'chai';

import { BleManager } from 'react-native-ble-plx';

import * as bleService from '../shared/bleService';
import { characteristic, nameFromUuid, service } from '../shared/bleConstants';

import { base64FromUint8, uint8FromBase64 } from '../shared/base64';
import { BleRecorder } from 'react-native-ble-plx-mock-recorder';

const recordingName = 'deviceList';

describe(recordingName, () => {
  let bleManager;
  let bleRecorder;
  let device;
  const deviceMap = {
    expected: {
      '00:12:6F:BA:A7:74': {
        name: 'BeoPlay A1',
        recordId: '12-34-56-78-9A-BC',
      },
    },
    record: {
      '12-34-56-78-9A-BC': {
        name: 'The Speaker',
      },
    },
  };

  before(() => {
    bleRecorder = new BleRecorder({
      bleManager: new BleManager(),
      recordingName,
      deviceMap,
      nameFromUuid,
    });
    bleRecorder.spec.deviceScan = { keep: 1 };
    bleManager = bleRecorder.bleManagerSpy;
  });

  after(() => {
    bleRecorder.close();
  });

  it('should receive scan result', async () => {
    device = await new Promise((resolve, reject) => {
      bleService.startScanning(bleManager, (error, d) => {
        if (!error && bleRecorder.isExpected(d)) {
          resolve(d);
        } else if (error) {
          console.log('error in startDeviceScan', error);
          reject(error);
        } else {
          console.log(`(unexpected device "${d.name}", ignoring)`);
        }
      });
    });
    bleRecorder.label('scanned');
  });

  it('should connect to device', async () => {
    const { id, name } = device;
    console.log(`(actual device: {id: '${id}', name: '${name}'})`);
    expect(name).to.equal(deviceMap.expected[id].name);
    await bleManager.connectToDevice(id);
    await bleManager.discoverAllServicesAndCharacteristicsForDevice(id);
  });

  it('should read battery level', async () => {
    const { id } = device;
    const services = await bleManager.servicesForDevice(id);
    expect(services.find((s) => s.uuid.toLowerCase() === service.battery.uuid.toLowerCase())).to.exist;
    bleRecorder.queueRecordValue(base64FromUint8(42));
    const { value } = await bleManager.readCharacteristicForDevice(id, service.battery.uuid, characteristic.batteryLevel.uuid);
    const batteryLevel = uint8FromBase64(value);
    console.log(`(actual batteryLevel = ${batteryLevel})`);
    expect(batteryLevel).to.be.at.least(0);
    expect(batteryLevel).to.be.at.most(100);
  });

  it('should read signal strength', async () => {
    const { id } = device;
    bleRecorder.recordRssi = -42;
    const { rssi } = await bleManager.readRSSIForDevice(id);
    console.log(`(actual rssi = ${rssi})`);
    expect(rssi).to.be.below(0);
    expect(rssi).to.be.above(-127);
  });
});
