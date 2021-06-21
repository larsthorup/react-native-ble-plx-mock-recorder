import * as util from 'util';
import { bufferFromBase64, isPrintableFromBase64, printableFromBase64 } from './base64.js';
import { stringifyBleRecorderEvent, stringifyBleRecord } from './bleRecorderJsonProtocol.js';

/** @typedef { import('react-native-ble-plx').Base64 } Base64 */
/** @typedef { import('react-native-ble-plx').BleManager } BleManager */
/** @typedef { import('react-native-ble-plx').DeviceId } DeviceId */
/** @typedef { import('react-native-ble-plx').ConnectionOptions } ConnectionOptions */
/** @typedef { import('react-native-ble-plx').UUID } UUID */

/** @typedef { import('./recording').BleRecord } BleRecord */
/** @typedef { import('./recording').CharacteristicListener } CharacteristicListener */
/** @typedef { import('./recording').Device } Device */
/** @typedef { import('./recording').DeviceDisconnectedListener } DeviceDisconnectedListener */
/** @typedef { import('./recording').DeviceScanListener } DeviceScanListener */
/** @typedef { import('./recording').EventProps } EventProps */
/** @typedef { import('./recording').ScanOptions } ScanOptions */
/** @typedef { import('./recording').Spec } Spec */
/** @typedef { import('./recording').StateChangeListener } StateChangeListener */


const recordingFileFormatVersion = '1.0.0';

/** @param { Base64 } value */
const formattedFromBase64 = (value) => {
  const valueBufferFormatted = util.format(bufferFromBase64(value));
  if (isPrintableFromBase64(value)) {
    return `${valueBufferFormatted} '${printableFromBase64(value)}'`;
  } else {
    return valueBufferFormatted;
  }
};

export class BleManagerSpy {
  /**
   * @param { BleRecorder } recorder 
   * @param { BleManager } bleManager 
   */
  constructor(recorder, bleManager) {
    /** @type { BleRecorder } */
    this._recorder = recorder;
    /** @type { BleManager } */
    this._bleManager = bleManager;
  }

  destroy() {
    this._bleManager.destroy();
  }

  async state() {
    const state = await this._bleManager.state();
    this._recorder._record({
      type: 'command',
      command: 'state',
      request: {},
      response: state,
    });
    return state;
  }

  /** @typedef { import('./recording').OnStateChangeRequest } OnStateChangeRequest */

  /** @param { StateChangeListener } listener */
  onStateChange(listener, emitCurrentState = false) {
    /** @type OnStateChangeRequest */
    const request = {
      emitCurrentState,
    };
    /** @type BleRecord */
    const record = {
      type: 'command',
      command: 'onStateChange',
      request,
      response: undefined,
    };
    this._recorder._record(record);
    this._bleManager.onStateChange((powerState) => {
      this._recorder._recordEvent({ event: 'stateChange', args: { powerState } });
      listener(powerState);
    }, emitCurrentState);
  }

  /**
   * @param { UUID[] | null } uuidList 
   * @param { ScanOptions | null } scanOptions 
   * @param { DeviceScanListener } listener 
   */
  startDeviceScan(uuidList, scanOptions, listener) {
    this._recorder._reportedDeviceIdList = [];
    this._recorder._record({
      type: 'command',
      command: 'startDeviceScan',
      request: {
        uuidList,
        scanOptions,
      },
      response: undefined,
    });
    this._bleManager.startDeviceScan(uuidList, scanOptions, (error, device) => {
      if (error) {
        const { message } = error;
        this._recorder._recordEvent({ event: 'deviceScan', args: { device: null, error: { message } } });
        listener(error, device);
      } else if (device) {
        if (this._recorder.deviceMap) {
          if (this._recorder.isExpected(device)) {
            this._recorder._recordEvent({
              event: 'deviceScan',
              args: {
                device: this._recorder._recordDevice(device.id),
                error: null,
              },
            });
            listener(error, device);
          } else {
            if (this._recorder._reportedDeviceIdList.indexOf(device.id) < 0) {
              this._recorder._log(`(ignoring device with id ${device.id} named ${device.name}. ManufacturerData: ${device.manufacturerData})`);
              this._recorder._reportedDeviceIdList.push(device.id);
            }
            // Note: exclude unexpected scan responses from recording file for now as they are usually quite noisy
            // TODO: use filter mechanism for this
            const { id, localName, manufacturerData, mtu, name, rssi } = device;
            this._recorder._exclude({
              type: 'event',
              event: 'deviceScan',
              args: {
                device: { id, localName, manufacturerData, mtu, name, rssi },
                error: null,
              },
              autoPlay: false,
            });
          }
        } else {
          const { id, localName, manufacturerData, mtu, name, rssi } = device;
          this._recorder._recordEvent({
            event: 'deviceScan',
            args: {
              device: { id, localName, manufacturerData, mtu, name, rssi },
              error: null,
            },
          });
          listener(error, device);
        }
      }
    });
  }

  stopDeviceScan() {
    this._bleManager.stopDeviceScan();
    this._recorder._record({
      type: 'command',
      command: 'stopDeviceScan',
      request: {},
      response: undefined,
    });
  }

  /** @param { DeviceId } deviceId */
  async isDeviceConnected(deviceId) {
    const response = await this._bleManager.isDeviceConnected(deviceId);
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'isDeviceConnected',
      request: { id },
      response,
    });
    return response;
  }

  /** @param { DeviceId } deviceId */
  async readRSSIForDevice(deviceId) {
    const response = await this._bleManager.readRSSIForDevice(deviceId);
    const { id, localName, manufacturerData, mtu, name } = this._recorder._recordDevice(deviceId);
    const rssi = this._recorder.recordRssi !== undefined ? this._recorder.recordRssi : response.rssi;
    this._recorder._record({
      type: 'command',
      command: 'readRSSIForDevice',
      request: { id },
      response: { id, localName, manufacturerData, mtu, name, rssi },
    });
    return response;
  }

  /**
   * @param { DeviceId } deviceId 
   * @param { ConnectionOptions } options 
   * @returns 
   */
  async connectToDevice(deviceId, options) {
    const device = await this._bleManager.connectToDevice(deviceId, options);
    const deviceRecord = this._recorder._recordDevice(deviceId);
    const { id } = deviceRecord;
    this._recorder._record({
      type: 'command',
      command: 'connectToDevice',
      request: {
        id,
        options
      },
      response: deviceRecord,
    });
    return device;
  }

  /** @param { UUID[] } serviceUUIDs */
  async connectedDevices(serviceUUIDs) {
    const devices = await this._bleManager.connectedDevices(serviceUUIDs);
    const response = devices.map(({ id }) => this._recorder._recordDevice(id));
    this._recorder._record({
      type: 'command',
      command: 'connectedDevices',
      request: { serviceUUIDs },
      response,
    });
    return devices;
  }

  /**
   * @param { DeviceId } deviceId 
   * @param { DeviceDisconnectedListener } listener 
   * @returns 
   */
  async onDeviceDisconnected(deviceId, listener) {
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'onDeviceDisconnected',
      request: {
        id,
      },
      response: undefined,
    });
    const subscription = await this._bleManager.onDeviceDisconnected(
      deviceId,
      (error, device) => {
        if (error) {
          const { message } = error;
          this._recorder._recordEvent({
            event: 'deviceDisconnected',
            args: {
              device: null,
              error: { message },
            },
          });
        } else if (device) {
          this._recorder._recordEvent({
            event: 'deviceDisconnected',
            args: {
              device: this._recorder._recordDevice(device.id),
              error: null,
            },
          });
        }
        listener(error, device);
      },
    );
    return subscription;
  }

  /**
   * @param { DeviceId } deviceId 
   * @param { number } mtu 
   * @returns 
   */
  async requestMTUForDevice(deviceId, mtu) {
    const device = await this._bleManager.requestMTUForDevice(deviceId, mtu);
    const { id, localName, manufacturerData, name, rssi } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'requestMTUForDevice',
      request: { id, mtu },
      response: {
        id,
        localName,
        manufacturerData,
        mtu: device.mtu,
        name,
        rssi,
      },
    });
    return device;
  }

  /** @param { DeviceId } deviceId */
  async discoverAllServicesAndCharacteristicsForDevice(deviceId) {
    await this._bleManager.discoverAllServicesAndCharacteristicsForDevice(deviceId);
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'discoverAllServicesAndCharacteristicsForDevice',
      request: { id },
      response: undefined,
    });
  }

  /** @param { DeviceId[] } deviceIdentifiers */
  async devices(deviceIdentifiers) {
    const deviceList = await this._bleManager.devices(deviceIdentifiers);
    this._recorder._record({
      type: 'command',
      command: 'devices',
      request: {
        deviceIdentifiers: deviceIdentifiers.map((id) => this._recorder._recordDevice(id).id),
      },
      response: deviceList.map(({ id }) => this._recorder._recordDevice(id)),
    });
    return deviceList;
  }

  /** @param { DeviceId } deviceId */
  async servicesForDevice(deviceId) {
    const services = await this._bleManager.servicesForDevice(deviceId);
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'servicesForDevice',
      request: { id },
      response: services.map(({ uuid }) => ({ uuid })),
    });
    return services;
  }

  /**
   * @param { DeviceId } deviceId 
   * @param { UUID } serviceUUID 
   */
  async characteristicsForDevice(deviceId, serviceUUID) {
    const characteristics = await this._bleManager.characteristicsForDevice(deviceId, serviceUUID);
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'characteristicsForDevice',
      request: { id, serviceUUID },
      response: characteristics.map(({ uuid }) => ({ serviceUUID, uuid, value: null })),
    });
    return characteristics;
  }

  /**
   * @param { DeviceId } deviceId 
   * @param { UUID } serviceUUID 
   * @param { UUID } characteristicUUID 
   * @returns 
   */
  async readCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID) {
    const characteristic = await this._bleManager.readCharacteristicForDevice(
      deviceId,
      serviceUUID,
      characteristicUUID,
    );
    const { id } = this._recorder._recordDevice(deviceId);
    const recordValue = this._recorder._dequeueRecordValue();
    const value = recordValue !== undefined ? recordValue : characteristic.value;
    this._recorder._record({
      type: 'command',
      command: 'readCharacteristicForDevice',
      request: {
        characteristicUUID,
        id,
        serviceUUID,
      },
      response: {
        serviceUUID,
        uuid: characteristicUUID,
        value,
      },
      ...(this._recorder._debugFor(characteristicUUID, serviceUUID, value)),
    });
    return characteristic;
  }

  /**
   * @param { DeviceId } deviceId 
   * @param { UUID } serviceUUID 
   * @param { UUID } characteristicUUID 
   * @param { CharacteristicListener} listener 
   */
  async monitorCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID, listener) {
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'monitorCharacteristicForDevice',
      request: {
        id,
        serviceUUID,
        characteristicUUID,
      },
      response: undefined,
      ...(this._recorder._debugFor(characteristicUUID, serviceUUID)),
    });
    const subscription = await this._bleManager.monitorCharacteristicForDevice(
      deviceId,
      serviceUUID,
      characteristicUUID,
      (error, characteristic) => {
        if (characteristic && !error) {
          const { uuid, value } = characteristic;
          // Note: eventually support using recordValue, maybe stored per characteristic?
          // TODO: support filter here
          this._recorder._record({
            type: 'event',
            event: 'characteristic',
            args: {
              characteristic: {
                serviceUUID,
                uuid,
                value,
              },
              error: null,
            },
            autoPlay: true,
            ...(this._recorder._debugFor(uuid, serviceUUID, value)),
          });
        } else if (error) {
          this._recorder._record({
            type: 'event',
            event: 'characteristic',
            args: {
              characteristic: null,
              error: { message: error.message },
            },
            autoPlay: true,
          });
        }
        listener(error, characteristic);
      },
    );
    return subscription;
  }

  /**
   * @param { DeviceId } deviceId 
   * @param { UUID } serviceUUID 
   * @param { UUID } characteristicUUID 
   * @param { Base64 } value 
   */
  async writeCharacteristicWithResponseForDevice(deviceId, serviceUUID, characteristicUUID, value) {
    const response = await this._bleManager.writeCharacteristicWithResponseForDevice(deviceId, serviceUUID, characteristicUUID, value);
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'writeCharacteristicWithResponseForDevice',
      request: {
        id,
        serviceUUID,
        characteristicUUID,
        value,
      },
      response: {
        serviceUUID,
        uuid: characteristicUUID,
        value: null,
      },
      ...(this._recorder._debugFor(characteristicUUID, serviceUUID, value)),
    });
    return response;
  }
}

/** @typedef { { bleManager: BleManager, deviceMap?: DeviceMap, logger: Logger, nameFromUUID?: NameFromUUID, recordingName?: string } } BleRecorderOptions */
/** @typedef { { localName?: string, name: string, manufacturerData?: Base64 } } RecordDevice */
/** @typedef { { expected: Record<string, {name: string, recordId: string}>, record: Record<string, RecordDevice>} } DeviceMap */
/** @typedef { (line: string) => void } Logger */
/** @typedef { Record<UUID, string> } NameFromUUID */
/** @typedef { { [key: string]: { seen: number } } } SpecState */

/** @typedef { { event: 'init', name: string, version: string } } InitEvent */
/** @typedef { { event: 'save', name: string } } SaveEvent */
/** @typedef { InitEvent | SaveEvent } RecorderEvent */
export class BleRecorder {
  /**
   * @param { BleRecorderOptions } options
   */
  constructor(options) {
    const { bleManager, deviceMap, logger, nameFromUUID, recordingName } = options;
    this.bleManagerSpy = new BleManagerSpy(this, bleManager);
    this.recordingName = recordingName || 'default';
    this.deviceMap = deviceMap;
    this.nameFromUuid = nameFromUUID || {};
    /** @type { number | undefined } */
    this.recordRssi = undefined;
    /** @type { Spec } */
    this.spec = {};
    this._logger = logger || console.log;
    /** @type { DeviceId[] } */
    this._reportedDeviceIdList = [];
    /** @type { SpecState } */
    this._specState = {
      ['deviceScan']: { seen: 0 },
    };
    /** @type { Base64[] } */
    this._recordValueQueue = [];
    this._logRecorderEvent({ event: 'init', name: this.recordingName, version: recordingFileFormatVersion });
  }

  /** @param { string } line */
  _log(line) {
    this._logger(line);
  }

  /** @param { RecorderEvent } recorderEvent */
  _logRecorderEvent(recorderEvent) {
    this._log(stringifyBleRecorderEvent(recorderEvent));
  }

  /** @param { BleRecord } record */
  _record(record) {
    this._log(stringifyBleRecord(record));
  }

  /** @param { EventProps } props */
  _recordEvent(props) {
    const { event } = props;
    const autoPlay = false;
    // TODO: if exclude filter call _exclude instead
    const spec = this.spec[event];
    if (spec) {
      ++this._specState[event].seen;
      if (this._specState[event].seen > spec.keep) {
        // Note: we have already seen enough of this type of event, so we will exclude this one
        this._exclude({ type: 'event', ...props, autoPlay });
      } else {
        // Note: we might exclude future instances of this event, so we will include the spec in this record
        this._record({ type: 'event', ...props, spec, autoPlay });
      }
    } else {
      this._record({ type: 'event', ...props, autoPlay });
    }
  }

  /** @param { BleRecord } record */
  _exclude(record) {
    // Note: eventually support a "verbose" option for outputting these
    // this._log(`(excluding ${JSON.stringify(record)})`);
  }

  /**
   * @param { UUID } characteristicUUID 
   * @param { UUID } serviceUUID 
   * @param { string | null } value
   */
  _debugFor(characteristicUUID, serviceUUID, value = null) {
    const serviceName = this.nameFromUuid[serviceUUID];
    const characteristicName = this.nameFromUuid[characteristicUUID];
    if (serviceName || characteristicName || value !== null) {
      return {
        debug: {
          ...(serviceName && { serviceUUID: serviceName }),
          ...(characteristicName && { characteristicUUID: characteristicName }),
          ...(value !== null && { value: formattedFromBase64(value) }),
        },
      };
    } else {
      return {};
    }
  }

  /**
   * @param { DeviceId } deviceId 
   * @returns Device
   */
  _recordDevice(deviceId) {
    if (this.deviceMap && this.deviceMap.expected[deviceId]) {
      const { recordId: id } = this.deviceMap.expected[deviceId];
      const { localName, manufacturerData, name } = this.deviceMap.record[id];
      return /** @type Device */ ({
        id,
        localName: localName || null,
        manufacturerData: manufacturerData || null,
        name,
        rssi: null,
      });
    } else {
      // Note: no device mapping for this device
      return /** @type Device */ ({
        id: deviceId,
        localName: null,
        name: null,
        manufacturerData: null,
        rssi: null,
      });
    }
  }

  _dequeueRecordValue() {
    return this._recordValueQueue.shift();
  }

  /** @param { string } label */
  label(label) {
    this._record({ type: 'label', label });
  }

  close() {
    this.bleManagerSpy.destroy();
    this._logRecorderEvent({ event: 'save', name: this.recordingName });
  }

  /** @param { Device } device */
  isExpected(device) {
    return this.deviceMap && this.deviceMap.expected[device.id];
  }

  /** @param { Base64 } value */
  queueRecordValue(value) {
    this._recordValueQueue.push(value);
  }
}
