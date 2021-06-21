import { expect } from 'chai';
import * as td from 'testdouble';
import { parseBleRecorderEvent, parseBleRecord } from './bleRecorderJsonProtocol.js';
import { BleRecorder, BleManagerSpy } from './bleRecorder.js';

/** @typedef { import('react-native-ble-plx').BleManager } BleManager */
/** @typedef { import('react-native-ble-plx').Characteristic } Characteristic */
/** @typedef { import('react-native-ble-plx').Device } Device */
/** @typedef { import('react-native-ble-plx').Service } Service */
/** @typedef { import('react-native-ble-plx').State } State */

/** @typedef { import('./bleRecorder.js').BleRecord } BleRecord */
/** @typedef { import('./bleRecorder.js').RecorderEvent } RecorderEvent */

const BleManagerFake = td.constructor(BleManagerSpy);

class LoggerSpy {
  constructor() {
    /** @type { BleRecord[] } */
    this.bleLog = [];
    /** @type { RecorderEvent[] } */
    this.recorderEventLog = [];
    /** @type { (line: string) => void } */
    this.logger = (line) => {
      const bleRecord = parseBleRecord(line);
      const recorderEvent = parseBleRecorderEvent(line);
      if (bleRecord) {
        this.bleLog.push(bleRecord);
      }
      if (recorderEvent) {
        this.recorderEventLog.push(recorderEvent);
      }
    };
  }
}

describe('bleRecorder', () => {
  /** @type { BleManager } */
  let bleManagerFake;

  beforeEach(() => {
    bleManagerFake = /** @type { BleManager } */ (/** @type { unknown } */(new BleManagerFake()));
  });

  describe('minimal scenario', () => {
    it('should record an empty recording file', () => {
      const { bleLog, recorderEventLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      bleRecorder.close();
      expect(recorderEventLog).to.deep.equal([
        { event: 'init', name: 'default', version: '1.0.0' },
        { event: 'save', name: 'default' },
      ]);
      expect(bleLog).to.deep.equal([]);
    });
  });

  describe('recordingName', () => {
    it('should name the recording file', () => {
      const recordingName = 'some-recording-name';
      const { bleLog, recorderEventLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, recordingName, logger });
      bleRecorder.close();
      expect(recorderEventLog).to.deep.equal([
        { event: 'init', name: 'some-recording-name', version: '1.0.0' },
        { event: 'save', name: 'some-recording-name' },
      ]);
      expect(bleLog).to.deep.equal([]);
    });
  });

  describe('startDeviceScan', () => {
    const uuidList = ['some', 'uuids'];
    const scanOptions = { allowDuplicates: true };

    describe('minimal settings', () => {
      it('should record commands and events in recording file', () => {
        // given a few device scans
        td.when(bleManagerFake.startDeviceScan(uuidList, scanOptions, td.matchers.isA(Function))).thenDo(/** @type { () => void } */(u, o, listener) => {
          listener(null, { id: 'some-device-id', name: 'some-device-name' });
          listener(null, { id: 'some-other-device-id', name: 'some-other-device-name' });
          listener(null, { id: 'some-device-id', name: 'some-device-name' });
        });

        const { bleLog, logger } = new LoggerSpy();
        const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
        const bleManager = bleRecorder.bleManagerSpy;

        // when starting device scan
        bleManager.startDeviceScan(uuidList, scanOptions, () => { });
        bleRecorder.label('scanned');
        bleRecorder.close();

        // then all scans are recorded
        expect(bleLog).to.deep.equal([
          {
            type: 'command',
            command: 'startDeviceScan',
            request: {
              scanOptions: { allowDuplicates: true },
              uuidList: ['some', 'uuids'],
            },
          },
          {
            type: 'event',
            event: 'deviceScan',
            args: {
              device: { id: 'some-device-id', name: 'some-device-name' },
              error: null,
            },
            autoPlay: false
          },
          {
            type: 'event',
            event: 'deviceScan',
            args: {
              device: { id: 'some-other-device-id', name: 'some-other-device-name' },
              error: null,
            },
            autoPlay: false,
          },
          {
            type: 'event',
            event: 'deviceScan',
            args: {
              device: { id: 'some-device-id', name: 'some-device-name' },
              error: null,
            },
            autoPlay: false,
          },
          {
            type: 'label',
            label: 'scanned',
          },
        ]);
      });
    });

    describe('deviceMap', () => {
      it('should filter and map device id and name in recording file', () => {
        // given a single device scan will happen
        td.when(bleManagerFake.startDeviceScan(uuidList, scanOptions, td.matchers.isA(Function))).thenDo(/** @type { () => void } */(u, o, listener) => {
          listener(null, { id: 'some-device-id', name: 'some-device-name' });
          listener(null, { id: 'some-ignored-device-id', name: 'some-ignored-device-name' });
        });

        // given a map of expected devices and recorded device names and ids
        const deviceMap = {
          expected: {
            'some-device-id': {
              name: 'some-device-name',
              recordId: 'recorded-device-id',
            },
          },
          record: {
            'recorded-device-id': {
              name: 'recorded-device-name',
            },
          },
        };
        const { bleLog, logger } = new LoggerSpy();
        const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, deviceMap, logger });
        const bleManager = bleRecorder.bleManagerSpy;

        bleManager.startDeviceScan(uuidList, scanOptions, () => { });
        bleRecorder.close();

        expect(bleLog).to.deep.equal([
          {
            type: 'command',
            command: 'startDeviceScan',
            request: {
              scanOptions: { allowDuplicates: true },
              uuidList: ['some', 'uuids'],
            },
          },
          {
            type: 'event',
            event: 'deviceScan',
            args: {
              device: { id: 'recorded-device-id', name: 'recorded-device-name', localName: null, manufacturerData: null, rssi: null },
              error: null,
            },
            autoPlay: false,
          },
        ]);
      });
    });

    describe('spec', () => {
      it('should record commands and events in recording file', () => {
        // given a few device scans
        td.when(bleManagerFake.startDeviceScan(uuidList, scanOptions, td.matchers.isA(Function))).thenDo(/** @type { () => void } */(u, o, listener) => {
          listener(null, { id: 'some-device-id', name: 'some-device-name' });
          listener(null, { id: 'some-device-id', name: 'some-device-name' });
        });

        const { bleLog, logger } = new LoggerSpy();
        const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
        const bleManager = bleRecorder.bleManagerSpy;

        // given a number of deviceScan events to keep
        bleRecorder.spec.deviceScan = { keep: 1 };

        // when starting device scan
        bleManager.startDeviceScan(uuidList, scanOptions, () => { });
        bleRecorder.close();

        // then only the specified number of scans are recorded
        expect(bleLog).to.deep.equal([
          {
            type: 'command',
            command: 'startDeviceScan',
            request: {
              scanOptions: { allowDuplicates: true },
              uuidList: ['some', 'uuids'],
            },
          },
          {
            type: 'event',
            event: 'deviceScan',
            args: {
              device: { id: 'some-device-id', name: 'some-device-name' },
              error: null,
            },
            autoPlay: false,
            spec: {
              keep: 1,
            },
          },
        ]);
      });
    });

    describe('scan error', () => {
      it('should record scan error in recording file', () => {

        // given a device scan error
        td.when(bleManagerFake.startDeviceScan(uuidList, scanOptions, td.matchers.isA(Function))).thenDo(/** @type { () => void } */(u, o, listener) => {
          listener({ message: 'some error message' });
        });

        const { bleLog, logger } = new LoggerSpy();
        const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
        const bleManager = bleRecorder.bleManagerSpy;

        // when starting device scan
        bleManager.startDeviceScan(uuidList, scanOptions, () => { });
        bleRecorder.close();

        // then the scan error is recorded
        expect(bleLog).to.deep.equal([
          {
            type: 'command',
            command: 'startDeviceScan',
            request: {
              scanOptions: { allowDuplicates: true },
              uuidList: ['some', 'uuids'],
            },
          },
          {
            type: 'event',
            event: 'deviceScan',
            args: {
              device: null,
              error: { message: 'some error message' },
            },
            autoPlay: false,
          },
        ]);
      });
    });
  });

  describe('readCharacteristicForDevice', () => {
    describe('minimal scenario', () => {
      it('should record literal uuids and values', async () => {
        td.when(bleManagerFake.readCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid')).thenResolve({ value: 'Z2Rj' });
        const { bleLog, logger } = new LoggerSpy();
        const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
        const bleManager = bleRecorder.bleManagerSpy;

        // when
        const characteristic = await bleManager.readCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid');
        expect(characteristic).to.deep.equal({ value: 'Z2Rj' });
        bleRecorder.close();

        // then command is recorded
        expect(bleLog).to.deep.equal([
          {
            type: 'command',
            command: 'readCharacteristicForDevice',
            request: {
              characteristicUUID: 'some-characteristic-uuid',
              id: 'some-device-id',
              serviceUUID: 'some-service-uuid',
            },
            response: {
              serviceUUID: 'some-service-uuid',
              uuid: 'some-characteristic-uuid',
              value: 'Z2Rj',
            },
            debug: {
              value: '<Buffer 67 64 63> \'gdc\'',
            },
          },
        ]);
      });
    });

    describe('queueRecordValue', () => {
      it('should record specified value', async () => {
        td.when(bleManagerFake.readCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid')).thenResolve({ value: 'Kg==' });
        const { bleLog, logger } = new LoggerSpy();
        const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
        const bleManager = bleRecorder.bleManagerSpy;

        // when
        bleRecorder.queueRecordValue('AA==');
        const characteristic = await bleManager.readCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid');
        expect(characteristic).to.deep.equal({ value: 'Kg==' });
        bleRecorder.close();

        // then command is recorded
        expect(bleLog).to.deep.equal([
          {
            type: 'command',
            command: 'readCharacteristicForDevice',
            request: {
              characteristicUUID: 'some-characteristic-uuid',
              id: 'some-device-id',
              serviceUUID: 'some-service-uuid',
            },
            response: {
              serviceUUID: 'some-service-uuid',
              uuid: 'some-characteristic-uuid',
              value: 'AA==',
            },
            debug: {
              value: '<Buffer 00>',
            },
          },
        ]);
      });
    });

    describe('nameFromUuid', () => {
      it('should include names for uuids', async () => {
        td.when(bleManagerFake.readCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid')).thenResolve({ value: 'Kg==' });
        const { bleLog, logger } = new LoggerSpy();

        // given map of name per uuid
        const nameFromUuid = {
          'some-service-uuid': 'some-service-name',
          'some-characteristic-uuid': 'some-characteristic-name',
        };

        const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger, nameFromUUID: nameFromUuid });
        const bleManager = bleRecorder.bleManagerSpy;

        // when
        bleRecorder.queueRecordValue('AA==');
        const characteristic = await bleManager.readCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid');
        expect(characteristic).to.deep.equal({ value: 'Kg==' });
        bleRecorder.close();

        // then command is recorded
        expect(bleLog).to.deep.equal([
          {
            type: 'command',
            command: 'readCharacteristicForDevice',
            request: {
              characteristicUUID: 'some-characteristic-uuid',
              id: 'some-device-id',
              serviceUUID: 'some-service-uuid',
            },
            response: {
              serviceUUID: 'some-service-uuid',
              uuid: 'some-characteristic-uuid',
              value: 'AA==',
            },
            debug: {
              characteristicUUID: 'some-characteristic-name',
              serviceUUID: 'some-service-name',
              value: '<Buffer 00>',
            },
          },
        ]);
      });
    });
  });

  describe('state', () => {
    it('should record command with request and response', async () => {
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.state()).thenResolve(/** @type { State } */('PoweredOn'));
      const bleManager = bleRecorder.bleManagerSpy;
      const state = await bleManager.state();
      expect(state).to.equal('PoweredOn');
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'state',
          request: {},
          response: 'PoweredOn',
        },
      ]);
    });
  });
  describe('onStateChange', () => {
    it('should record commands and events in recording file', () => {
      // given a few device scans
      td.when(bleManagerFake.onStateChange(td.matchers.isA(Function), true)).thenDo(/** @type { () => void } */(listener) => {
        listener('some-state');
      });

      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      const bleManager = bleRecorder.bleManagerSpy;

      // when starting device scan
      bleManager.onStateChange(() => { }, true);
      bleRecorder.close();

      // then all scans are recorded
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'onStateChange',
          request: {
            emitCurrentState: true,
          },
        },
        {
          type: 'event',
          event: 'stateChange',
          args: {
            powerState: 'some-state',
          },
          autoPlay: false,
        },
      ]);
    });
  });
  describe('stopDeviceScan', () => {
    it('should record command', async () => {
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.stopDeviceScan()).thenResolve();
      const bleManager = bleRecorder.bleManagerSpy;
      await bleManager.stopDeviceScan();
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'stopDeviceScan',
          request: {},
        },
      ]);
    });
  });
  describe('isDeviceConnected', () => {
    it('should record command with request and response', async () => {
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.isDeviceConnected('some-device-id')).thenResolve(true);
      const bleManager = bleRecorder.bleManagerSpy;
      const isConnected = await bleManager.isDeviceConnected('some-device-id');
      expect(isConnected).to.be.true;
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'isDeviceConnected',
          request: {
            id: 'some-device-id',
          },
          response: true,
        },
      ]);
    });
  });
  describe('readRSSIForDevice', () => {
    it('should record command with request and response', async () => {
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.readRSSIForDevice('some-device-id')).thenResolve({ rssi: -42 });
      const bleManager = bleRecorder.bleManagerSpy;
      const { rssi } = await bleManager.readRSSIForDevice('some-device-id');
      expect(rssi).to.equal(-42);
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'readRSSIForDevice',
          request: {
            id: 'some-device-id',
          },
          response: {
            id: 'some-device-id',
            localName: null,
            manufacturerData: null,
            name: null,
            rssi: -42,
          },
        },
      ]);
    });
  });
  describe('connectToDevice', () => {
    it('should record command with request and response', async () => {
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.connectToDevice('some-device-id', { autoConnect: false })).thenResolve({
        id: 'some-device-id',
      });
      const bleManager = bleRecorder.bleManagerSpy;
      const device = await bleManager.connectToDevice('some-device-id', { autoConnect: false });
      expect(device.id).to.equal('some-device-id');
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'connectToDevice',
          request: {
            id: 'some-device-id',
            options: {
              autoConnect: false,
            },
          },
          response: {
            id: 'some-device-id',
            localName: null,
            manufacturerData: null,
            name: null,
            rssi: null,
          },
        },
      ]);
    });
  });
  describe('connectedDevices', () => {
    it('should record command with request and response', async () => {
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.connectedDevices(['some-uuid'])).thenResolve([/** @type { Device } */({ id: 'some-device-id' })]);
      const bleManager = bleRecorder.bleManagerSpy;
      const deviceList = await bleManager.connectedDevices(['some-uuid']);
      expect(deviceList).to.deep.equal([{ id: 'some-device-id' }]);
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'connectedDevices',
          request: {
            serviceUUIDs: ['some-uuid'],
          },
          response: [
            {
              id: 'some-device-id',
              localName: null,
              manufacturerData: null,
              name: null,
              rssi: null,
            },
          ],
        },
      ]);
    });
  });
  describe('onDeviceDisconnected', () => {
    it('should record commands and events in recording file', () => {
      // given a few device scans
      td.when(bleManagerFake.onDeviceDisconnected('some-device-id', td.matchers.isA(Function))).thenDo(/** @type { () => void } */(_, listener) => {
        listener(null, { id: 'some-device-id' });
      });

      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      const bleManager = bleRecorder.bleManagerSpy;

      // when starting device scan
      bleManager.onDeviceDisconnected('some-device-id', () => { });
      bleRecorder.close();

      // then all scans are recorded
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'onDeviceDisconnected',
          request: {
            id: 'some-device-id',
          },
        },
        {
          type: 'event',
          event: 'deviceDisconnected',
          args: {
            device: {
              id: 'some-device-id',
              localName: null,
              manufacturerData: null,
              name: null,
              rssi: null,
            },
            error: null,
          },
          autoPlay: false,
        },
      ]);
    });
  });
  describe('requestMTUForDevice', () => {
    it('should record command with request and response', async () => {
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.requestMTUForDevice('some-device-id', 96)).thenResolve({ id: 'some-device-id', mtu: 96 });
      const bleManager = bleRecorder.bleManagerSpy;
      const { mtu } = await bleManager.requestMTUForDevice('some-device-id', 96);
      expect(mtu).to.equal(96);
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'requestMTUForDevice',
          request: {
            id: 'some-device-id',
            mtu: 96,
          },
          response: {
            id: 'some-device-id',
            mtu: 96,
            localName: null,
            manufacturerData: null,
            name: null,
            rssi: null,
          },
        },
      ]);
    });
  });
  describe('discoverAllServicesAndCharacteristicsForDevice', () => {
    it('should record command with request and response', async () => {
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.discoverAllServicesAndCharacteristicsForDevice('some-device-id')).thenResolve(/** @type { Device } */{ id: 'some-device-id' });
      const bleManager = bleRecorder.bleManagerSpy;
      await bleManager.discoverAllServicesAndCharacteristicsForDevice('some-device-id');
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'discoverAllServicesAndCharacteristicsForDevice',
          request: {
            id: 'some-device-id',
          },
        },
      ]);
    });
  });
  describe('devices', () => {
    it('should record command with request and response', async () => {
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.devices(['some-device-id'])).thenResolve([/** @type { Device } */({ id: 'some-device-id' })]);
      const bleManager = bleRecorder.bleManagerSpy;
      const deviceList = await bleManager.devices(['some-device-id']);
      expect(deviceList).to.deep.equal([{ id: 'some-device-id' }]);
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'devices',
          request: {
            deviceIdentifiers: ['some-device-id'],
          },
          response: [
            {
              id: 'some-device-id',
              localName: null,
              manufacturerData: null,
              name: null,
              rssi: null,
            },
          ],
        },
      ]);
    });
  });
  describe('servicesForDevice', () => {
    it('should record command with request and response', async () => {
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.servicesForDevice('some-device-id')).thenResolve([/** @type { Service } */({ uuid: 'some-service-uuid' })]);
      const bleManager = bleRecorder.bleManagerSpy;
      const serviceList = await bleManager.servicesForDevice('some-device-id');
      expect(serviceList).to.deep.equal([{ uuid: 'some-service-uuid' }]);
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'servicesForDevice',
          request: {
            id: 'some-device-id',
          },
          response: [
            { uuid: 'some-service-uuid' },
          ],
        },
      ]);
    });
  });
  describe('characteristicsForDevice', () => {
    it('should record command with request and response', async () => {
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.characteristicsForDevice('some-device-id', 'some-service-uuid')).thenResolve([/** @type { Characteristic } */({ uuid: 'some-characteristic-uuid' })]);
      const bleManager = bleRecorder.bleManagerSpy;
      const characteristicList = await bleManager.characteristicsForDevice('some-device-id', 'some-service-uuid');
      expect(characteristicList).to.deep.equal([{ uuid: 'some-characteristic-uuid' }]);
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'characteristicsForDevice',
          request: {
            id: 'some-device-id',
            serviceUUID: 'some-service-uuid',
          },
          response: [
            {
              serviceUUID: 'some-service-uuid',
              uuid: 'some-characteristic-uuid',
              value: null,
            },
          ],
        },
      ]);
    });
  });
  describe('monitorCharacteristicForDevice', () => {
    it('should record commands and events in recording file', () => {
      // given a few device scans
      td.when(bleManagerFake.monitorCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid', td.matchers.isA(Function))).thenDo(/** @type { () => void } */(d, s, c, listener) => {
        listener(null, { uuid: 'some-characteristic-uuid', value: 'Kg==' });
      });

      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      const bleManager = bleRecorder.bleManagerSpy;

      // when starting device scan
      bleManager.monitorCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid', () => { });
      bleRecorder.close();

      // then all scans are recorded
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'monitorCharacteristicForDevice',
          request: {
            id: 'some-device-id',
            serviceUUID: 'some-service-uuid',
            characteristicUUID: 'some-characteristic-uuid',
          },
        },
        {
          type: 'event',
          event: 'characteristic',
          args: {
            characteristic: {
              serviceUUID: 'some-service-uuid',
              uuid: 'some-characteristic-uuid',
              value: 'Kg==',
            },
            error: null,
          },
          autoPlay: true,
          debug: {
            value: '<Buffer 2a> \'*\'',
          },
        },
      ]);
    });
  });
  describe('writeCharacteristicWithResponseForDevice', () => {
    it('should record literal uuids and values', async () => {
      td.when(bleManagerFake.writeCharacteristicWithResponseForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid', 'Z2Rj')).thenResolve(/** @type { Characteristic} */{});
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      const bleManager = bleRecorder.bleManagerSpy;

      // when
      await bleManager.writeCharacteristicWithResponseForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid', 'Z2Rj');
      bleRecorder.close();

      // then command is recorded
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'writeCharacteristicWithResponseForDevice',
          request: {
            characteristicUUID: 'some-characteristic-uuid',
            id: 'some-device-id',
            serviceUUID: 'some-service-uuid',
            value: 'Z2Rj',
          },
          response: {
            uuid: 'some-characteristic-uuid',
            serviceUUID: 'some-service-uuid',
            value: null,
          },
          debug: {
            value: '<Buffer 67 64 63> \'gdc\'',
          },
        },
      ]);
    });
  });
});
