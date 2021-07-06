import deepEqual from 'deep-equal';
import { recordingFileFormatVersion } from './recording.js';

/** @typedef { import('react-native-ble-plx').Base64 } Base64 */
/** @typedef { import('react-native-ble-plx').ConnectionOptions } ConnectionOptions */
/** @typedef { import('react-native-ble-plx').DeviceId } DeviceId */
/** @typedef { import('react-native-ble-plx').State } State */
/** @typedef { import('react-native-ble-plx').Subscription } BleSubscription */
/** @typedef { import('react-native-ble-plx').UUID } UUID */

/** @typedef { import('./recording').BleError } BleError */
/** @typedef { import('./recording').Characteristic } Characteristic */
/** @typedef { import('./recording').Device } Device */
/** @typedef { import('./recording').Recording } Recording */
/** @typedef { import('./recording').ScanOptions } ScanOptions */

/** @typedef { import('./recording').CharacteristicListener } CharacteristicListener */
/** @typedef { import('./recording').DeviceDisconnectedListener } DeviceDisconnectedListener */
/** @typedef { import('./recording').DeviceScanListener } DeviceScanListener */
/** @typedef { import('./recording').StateChangeListener } StateChangeListener */

/**
 * @template T
 * @constructor
 * @param { T } listener 
 * @param { SubscriptionSet<T> } subscriptionSet 
 */
function Subscription(listener, subscriptionSet) {
  this.subscriptionSet = subscriptionSet;
  this.listener = listener;
}
Subscription.prototype.remove = function () {
  this.subscriptionSet.remove(this);
};

/**
 * @template T
 * @constructor
 */
function SubscriptionSet() {
  /** @type { Subscription<T>[] } */
  this._set = [];
}
SubscriptionSet.prototype.listeners = function () {
  return this._set.map((s) => s.listener);
};

/**
 * @param { T } listener 
 */
SubscriptionSet.prototype.add = function (listener) {
  const subscription = new Subscription(listener, this);
  this._set.push(subscription);
  return subscription;
};

/**
 * @param { Subscription<T> } subscription 
 */
SubscriptionSet.prototype.remove = function (subscription) {
  this._set = this._set.filter((s) => s !== subscription);
};

export class BlePlayer {
  /** @param { BleManagerMock } bleManagerMock */
  constructor(bleManagerMock) {
    this.bleManagerMock = bleManagerMock;
    /** @type { boolean } */
    this.trace = false;
    /** @type { Record<UUID, Record<UUID, SubscriptionSet<CharacteristicListener>>> } */
    this._characteristicSubscriptions = {};
    /** @type { Record<UUID, SubscriptionSet<DeviceDisconnectedListener>> } */
    this._deviceDisconnectedSubscriptions = {};
    /** @type { SubscriptionSet<DeviceScanListener> } */
    this._deviceScanSubscriptions = new SubscriptionSet();
    /** @type { SubscriptionSet<StateChangeListener> }*/
    this._stateChangeSubscriptions = new SubscriptionSet();
    /** @type { Recording } */
    this._recording = { records: [], version: recordingFileFormatVersion };
    /** @type { number } */
    this._nextRecordIndex = 0;
  }

  _reset() {
    this._characteristicSubscriptions = {};
    this._deviceDisconnectedSubscriptions = {};
    this._deviceScanSubscriptions = new SubscriptionSet();
    this._stateChangeSubscriptions = new SubscriptionSet();
    this._recording = { records: [], version: recordingFileFormatVersion };
    this._nextRecordIndex = 0;
  }

  /** @param { string } message */
  _error(message, skipThrow = false) {
    // Note: exceptions might be swallowed by code-under-test, so we deliberately output the error here as well for visibility
    console.error(message);
    if (!skipThrow) {
      throw new Error(message);
    }
  }

  _peekRecord() {
    if (this._nextRecordIndex >= this._recording.records.length) {
      this._error(`Assertion failed: ${this._nextRecordIndex} < ${this._recording.records.length}`);
    }
    const record = this._recording.records[this._nextRecordIndex];
    return record;
  }

  _popRecord() {
    const record = this._peekRecord();
    ++this._nextRecordIndex;
    if (this.trace) {
      console.trace(`popping: ${JSON.stringify(record)}`);
    }
    return record;
  }

  /** @param { number } index */
  _sincePosition(index) {
    const itemPrefix = '\n    {';
    const recording = JSON.stringify(this._recording, null, 2);
    const position = recording.split(itemPrefix, index + 1).join(itemPrefix).length;
    const lineNumber = recording.substr(0, position).split('\n').length + 1;
    return `since line ${lineNumber} (index ${index})`;
  }

  /** 
   * @param { string } command 
   * @param { { [key: string]: any } } request }
   * @returns Response | undefined
   * */
  _expectCommand(command, request, skipThrow = false) {
    const fromRecordIndex = this._nextRecordIndex;
    this.playUntilCommand(); // Note: flush any additionally recorded events
    if (this._nextRecordIndex >= this._recording.records.length) {
      this._error(`BleManagerMock: missing record for command "${command}" with request\n"${JSON.stringify(request)}" ${this._sincePosition(fromRecordIndex)}`, skipThrow);
      return;
    }
    const record = this._popRecord();
    if (record.type !== 'command') {
      this._error(`BleManagerMock: mismatched record type for command "${command}", found ${JSON.stringify(record)} ${this._sincePosition(fromRecordIndex)}`, skipThrow);
      return;
    }
    const { response } = record;
    if (record.command !== command) {
      this._error(`BleManagerMock: missing record for command "${command}" with request "${JSON.stringify(request)}", found ${JSON.stringify(record)} ${this._sincePosition(fromRecordIndex)}`, skipThrow);
      return;
    }
    if (!deepEqual(record.request, request)) {
      this._error(`BleManagerMock: mismatched record for command "${command}" with request\n"${JSON.stringify(request)}" but found\n"${JSON.stringify(record.request)}"`, skipThrow);
      return;
    }
    // console.log(`BleManagerMock: ${command} returning ${JSON.stringify(response)}`);
    return response;
  }

  _autoPlayEvents() {
    while (true) {
      if (this._nextRecordIndex >= this._recording.records.length) {
        break;
      }
      const record = this._peekRecord();
      if (record.type !== 'event') {
        break;
      }
      if (!record.autoPlay) {
        break;
      }
      this.playNext();
    }
  }

  /** @param { Recording } recording */
  mockWith(recording) {
    this._reset();
    this._recording = recording;
  }

  playNext() {
    const record = this._popRecord();
    switch (record.type) {
      case 'label': {
        const { label } = record;
        console.log(`(BleManagerMock: unused label: "${label}")`);
        break;
      }
      case 'event': {
        switch (record.event) {
          case 'characteristic': {
            const { characteristic, error } = record.args;
            if (characteristic) {
              const { serviceUUID, uuid, value } = characteristic;
              const serviceUUIDlower = serviceUUID.toLowerCase();
              const uuidLower = uuid.toLowerCase();
              const subscriptions = (this._characteristicSubscriptions[serviceUUIDlower] || {})[uuidLower];
              const listenerList = subscriptions ? subscriptions.listeners() : [];
              if (listenerList.length > 0) {
                for (const listener of listenerList) {
                  try {
                    const characteristicMock = { serviceUUID, uuid, value };
                    // Note: handle async exception
                    Promise.resolve(listener(error, characteristicMock)).catch(console.error);
                  } catch (err) {
                    // Note: handle sync exception
                    console.error(err);
                  }
                }
              } else {
                console.log(this._characteristicSubscriptions, { serviceUUIDlower, uuidLower });
                console.warn(`BleManagerMock: event cannot be delivered, as bleManager.monitorCharacteristicForDevice has not yet been called: ${JSON.stringify(record)} or subscription was removed`);
              }
            }
            break;
          }
          case 'deviceDisconnected': {
            const { device, error } = record.args;
            const { id } = device;
            const subscriptions = this._deviceDisconnectedSubscriptions[id];
            const listenerList = subscriptions ? subscriptions.listeners() : [];
            if (listenerList.length > 0) {
              for (const listener of listenerList) {
                try {
                  // Note: handle async exception
                  Promise.resolve(listener(error, device)).catch(console.error);
                } catch (err) {
                  // Note: handle sync exception
                  console.error(err);
                }
              }
            } else {
              console.warn(`BleManagerMock: event cannot be delivered, as bleManager.onDeviceDisconnected has not yet been called: ${JSON.stringify(record)}`);
            }
            break;
          }
          case 'deviceScan': {
            const { _deviceScanSubscriptions: subscriptions } = this;
            const listenerList = subscriptions.listeners();
            if (listenerList.length > 0) {
              for (const listener of listenerList) {
                const { device, error } = record.args;
                try {
                  // Note: handle async exception
                  Promise.resolve(listener(error, device)).catch(console.error);
                } catch (err) {
                  // Note: handle sync exception
                  console.error(err);
                }
              }
            } else {
              console.warn(`BleManagerMock: event cannot be delivered, as bleManager.startDeviceScan has not yet been called: ${JSON.stringify(record)}`);
            }
            break;
          }
          case 'stateChange': {
            const { _stateChangeSubscriptions: subscriptions } = this;
            const listenerList = subscriptions.listeners();
            if (listenerList.length > 0) {
              for (const listener of listenerList) {
                const { powerState } = record.args;
                try {
                  // Note: handle async exception
                  Promise.resolve(listener(powerState)).catch(console.error);
                } catch (err) {
                  // Note: handle sync exception
                  console.error(err);
                }
              }
            } else {
              console.warn(`BleManagerMock: event cannot be delivered, as bleManager.onStateChange has not yet been called: ${JSON.stringify(record)}`);
            }
            break;
          }
          default:
            throw new Error(`BleManagerMock: Unrecognized event in record ${JSON.stringify(record)}`);
        }
        break;
      }
      case 'command':
        throw new Error(`BleManagerMock: command "${record.command}" expected but has not yet been called: ${JSON.stringify(record)}`);
    }
  }

  playUntilCommand() {
    try {
      while (true) {
        if (this._nextRecordIndex >= this._recording.records.length) {
          break;
        }
        const record = this._peekRecord();
        if (record.type === 'command' && record.command) {
          break;
        }
        this.playNext();
      }
    } catch (err) {
      console.error(err);
      this._error(`BleManagerMock: failed to playUntilCommand(): ${err.message}`);
    }
  }

  /** @param { string } label */
  playUntil(label) {
    try {
      const fromRecordIndex = this._nextRecordIndex;
      while (true) {
        if (this._nextRecordIndex >= this._recording.records.length) {
          throw new Error(`BleManagerMock: label "${label}" not found in recording ${this._sincePosition(fromRecordIndex)}`);
        }
        const record = this._peekRecord();
        if (record.type === 'label' && record.label === label) {
          this._popRecord();
          break;
        }
        this.playNext();
      }
    } catch (err) {
      console.error(err);
      this._error(`BleManagerMock: failed to playUntil('${label}'): ${err.message}`);
    }
  }

  expectFullCoverage() {
    const remainingRecordCount = this._recording.records.length - this._nextRecordIndex;
    if (remainingRecordCount > 0) {
      throw new Error(`Expected recording to be fully covered but last ${remainingRecordCount} records ${this._sincePosition(this._nextRecordIndex)} were not played`);
    }
  }
}
export class BleManagerMock {
  constructor() {
    this.blePlayer = new BlePlayer(this);
  }

  /** @param { StateChangeListener } listener */
  onStateChange(listener, emitCurrentState = false) {
    this.blePlayer._expectCommand('onStateChange', { emitCurrentState });
    const subscription = this.blePlayer._stateChangeSubscriptions.add(listener);
    return subscription;
  }

  /**
   * @param { UUID[] | null } uuidList 
   * @param { ScanOptions | null } scanOptions 
   * @param { DeviceScanListener } listener 
   */
  startDeviceScan(uuidList, scanOptions, listener) {
    this.blePlayer._expectCommand('startDeviceScan', { uuidList, scanOptions });
    const subscription = this.blePlayer._deviceScanSubscriptions.add(listener);
    return subscription;
  }

  /**
   * 
   * @param { DeviceId } id 
   * @param { DeviceDisconnectedListener } listener 
   * @returns 
   */
  onDeviceDisconnected(id, listener) {
    this.blePlayer._expectCommand('onDeviceDisconnected', { id });
    this.blePlayer._deviceDisconnectedSubscriptions[id] = this.blePlayer._deviceDisconnectedSubscriptions[id] || new SubscriptionSet();
    const subscription = this.blePlayer._deviceDisconnectedSubscriptions[id].add(listener);
    return subscription;
  }

  async state() {
    return this.blePlayer._expectCommand('state', {});
  }

  /** @param { DeviceId } id */
  async isDeviceConnected(id) {
    return this.blePlayer._expectCommand('isDeviceConnected', { id });
  }

  /** @param { DeviceId[] } deviceIdentifiers */
  async devices(deviceIdentifiers) {
    const response = this.blePlayer._expectCommand('devices', { deviceIdentifiers });
    const deviceList = /** @type Device[] */(response);     // TODO
    if (deviceList && Array.isArray(deviceList)) {
      return deviceList.map(({ id }) => {
        // Note: convenience wrappers can safely be implemented here and not mocked
        /** @param { UUID } serviceUUID */
        const characteristicsForService = async (serviceUUID) => this.characteristicsForDevice(id, serviceUUID);
        const services = async () => this.servicesForDevice(id);
        return {
          id,
          services,
          characteristicsForService,
        };
      });
    } else {
      return [];
    }
  }

  stopDeviceScan() {
    // Note: if stopDeviceScan() is called from within an exception handler of the code-under-test,
    // it can mess up that error reporting, so we will skip throwing in this case.
    // Note: eventually consider if this approach needs to be generalized
    this.blePlayer._expectCommand('stopDeviceScan', {}, true);
  }

  /**
   * @param { DeviceId } id 
   * @param { ConnectionOptions } options 
   */
  async connectToDevice(id, options) {
    const request = {
      id,
      ...(options !== undefined && { options }),
    };
    const response = this.blePlayer._expectCommand('connectToDevice', request);
    return response;
  }

  /** @param { UUID[] } serviceUUIDs */
  async connectedDevices(serviceUUIDs) {
    const response = this.blePlayer._expectCommand('connectedDevices', { serviceUUIDs });
    return response;
  }

  /** @param { DeviceId } id */
  async cancelDeviceConnection(id) {
    const response = this.blePlayer._expectCommand('cancelDeviceConnection', { id });
    const device = /** @type Device | undefined */ (response);
    if (device) {
      return { id: device.id };
    }
  }

  /** @param { DeviceId } id */
  async discoverAllServicesAndCharacteristicsForDevice(id) {
    this.blePlayer._expectCommand('discoverAllServicesAndCharacteristicsForDevice', { id });
  }

  /**
   * @param { DeviceId } id 
   * @param { number } mtu 
   * @returns 
   */
  async requestMTUForDevice(id, mtu) {
    const response = this.blePlayer._expectCommand('requestMTUForDevice', { id, mtu });
    return response;
  }

  /** @param { DeviceId } id */
  async servicesForDevice(id) {
    const response = this.blePlayer._expectCommand('servicesForDevice', { id });
    return response;
  }

  /**
   * @param { DeviceId } id 
   * @param { UUID } serviceUUID 
   */
  async characteristicsForDevice(id, serviceUUID) {
    const response = this.blePlayer._expectCommand('characteristicsForDevice', { id, serviceUUID });
    return response;
  }

  /**
   * @param { DeviceId } id 
   * @param { UUID } serviceUUID 
   * @param { UUID } characteristicUUID 
   */
  async readCharacteristicForDevice(id, serviceUUID, characteristicUUID) {
    const response = this.blePlayer._expectCommand('readCharacteristicForDevice', { id, serviceUUID, characteristicUUID });
    return response;
  }

  /**
   * @param { DeviceId } id 
   * @param { UUID } serviceUUID 
   * @param { UUID } characteristicUUID 
   * @param { CharacteristicListener } listener 
   */
  monitorCharacteristicForDevice(id, serviceUUID, characteristicUUID, listener) {
    this.blePlayer._expectCommand('monitorCharacteristicForDevice', { id, serviceUUID, characteristicUUID });
    const serviceUUIDlower = serviceUUID.toLowerCase();
    const characteristicUUIDlower = characteristicUUID.toLowerCase();
    this.blePlayer._characteristicSubscriptions[serviceUUIDlower] = this.blePlayer._characteristicSubscriptions[serviceUUIDlower] || {};
    this.blePlayer._characteristicSubscriptions[serviceUUIDlower][characteristicUUIDlower] = this.blePlayer._characteristicSubscriptions[serviceUUIDlower][characteristicUUIDlower] || new SubscriptionSet();
    const subscription = this.blePlayer._characteristicSubscriptions[serviceUUIDlower][characteristicUUIDlower].add(listener);
    this.blePlayer._autoPlayEvents(); // Note: eventually consider if we should do this on all commands
    return subscription;
  }

  /**
   * @param { DeviceId } id 
   * @param { UUID } serviceUUID 
   * @param { UUID } characteristicUUID 
   * @param { Base64 } value 
   */
  async writeCharacteristicWithResponseForDevice(id, serviceUUID, characteristicUUID, value) {
    const characteristic = this.blePlayer._expectCommand('writeCharacteristicWithResponseForDevice', { id, serviceUUID, characteristicUUID, value });
    this.blePlayer._autoPlayEvents(); // Note: eventually consider if we should do this on all commands
    return characteristic;
  }

  /** @param { DeviceId } id */
  async readRSSIForDevice(id) {
    const response = this.blePlayer._expectCommand('readRSSIForDevice', { id });
    return response;
  }
}
