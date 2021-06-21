/** @typedef { import('react-native-ble-plx').Base64 } Base64 */
/** @typedef { Pick<import('react-native-ble-plx').BleError, 'message'> } BleError */
/** @typedef { Pick<import('react-native-ble-plx').Characteristic, 'serviceUUID' | 'uuid' | 'value'> } Characteristic */
/** @typedef { import('react-native-ble-plx').ConnectionOptions } ConnectionOptions */
/** @typedef { Pick<import('react-native-ble-plx').Device, 'id' | 'localName' | 'name' | 'manufacturerData' | 'mtu' | 'rssi'> } Device */
/** @typedef { import('react-native-ble-plx').DeviceId } DeviceId */
/** @typedef { import('react-native-ble-plx').ScanOptions } ScanOptions */
/** @typedef { Pick<import('react-native-ble-plx').Service, 'uuid'> } Service */
/** @typedef { import('react-native-ble-plx').State } State */
/** @typedef { import('react-native-ble-plx').UUID } UUID */

/*
  Should we use `null` or `undefined` for missing property values?
  1) react-native-ble-plx uses `null` - so it seems easier to mirror that
  2) if we use `undefined` we can leave out irrelevant property values making code and capture files leaner
  3) har file format specifies all properties
  Decision: use `null` for reason 1) and 3)
*/

/** @typedef { { id: DeviceId , serviceUUID: UUID } } CharacteristicsForDeviceRequest */
/** @typedef { { command: 'characteristicsForDevice', request: CharacteristicsForDeviceRequest, response: Characteristic[] } } CharacteristicsForDeviceCommandProps */

/** @typedef { { serviceUUIDs: UUID[] } } ConnectedDevicesRequest */
/** @typedef { { command: 'connectedDevices', request: ConnectedDevicesRequest, response: Device[] } } ConnectedDevicesCommandProps */

/** @typedef { { id: DeviceId, options: ConnectionOptions } } ConnectToDeviceRequest */
/** @typedef { { command: 'connectToDevice', request: ConnectToDeviceRequest, response: Device } } ConnectToDeviceCommandProps */

/** @typedef { { command: 'devices', request: { deviceIdentifiers: DeviceId[] }, response: Device[] } } DevicesCommandProps */

/** @typedef { { command: 'discoverAllServicesAndCharacteristicsForDevice', request: { id: DeviceId }, response: void } } DiscoverAllServicesAndCharacteristicsForDeviceCommandProps */

/** @typedef { { command: 'isDeviceConnected', request: { id: DeviceId }, response: boolean} } IsDeviceConnectedCommandProps */

/** @typedef { { characteristicUUID: UUID, id: DeviceId, serviceUUID: UUID } } MonitorCharacteristicForDeviceRequest */
/** @typedef { { command: 'monitorCharacteristicForDevice', request: MonitorCharacteristicForDeviceRequest, response: void } } MonitorCharacteristicForDeviceCommandProps */

/** @typedef { { command: 'onDeviceDisconnected', request: { id: DeviceId }, response: void } } OnDeviceDisconnectedCommandProps */

/** @typedef { { uuidList: UUID[] | null, scanOptions: ScanOptions | null } } StartDeviceScanRequest */
/** @typedef { { command: 'startDeviceScan', request: StartDeviceScanRequest, response: void } } StartDeviceScanCommandProps */

/** @typedef { { emitCurrentState: boolean } } OnStateChangeRequest */
/** @typedef { { command: 'onStateChange', request: OnStateChangeRequest, response: void } } OnStateChangeCommandProps */

/** @typedef { { characteristicUUID: UUID, id: DeviceId, serviceUUID: UUID } } ReadCharacteristicForDeviceRequest */
/** @typedef { { command: 'readCharacteristicForDevice', request: ReadCharacteristicForDeviceRequest, response: Characteristic} } ReadCharacteristicForDeviceCommandProps */

/** @typedef { { command: 'readRSSIForDevice', request: { id: DeviceId }, response: Device } } ReadRSSIForDeviceCommandProps */

/** @typedef { { id: DeviceId, mtu: number} } RequestMTUForDeviceRequest */
/** @typedef { { command: 'requestMTUForDevice', request: RequestMTUForDeviceRequest, response: Device } } RequestMTUForDeviceCommandProps */

/** @typedef { { command: 'servicesForDevice', request: { id: DeviceId }, response: Service[] } } ServicesForDeviceCommandProps */

/** @typedef { { command: 'state', request: {}, response: State } } StateCommandProps*/

/** @typedef { { command: 'stopDeviceScan', request: {}, response: void } } StopDeviceScanCommandProps */

/** @typedef { { id: DeviceId, serviceUUID: UUID, characteristicUUID: UUID, value: Base64 } } WriteCharacteristicWithResponseForDeviceRequest */
/** @typedef { { command: 'writeCharacteristicWithResponseForDevice', request: WriteCharacteristicWithResponseForDeviceRequest, response: Characteristic } } WriteCharacteristicWithResponseForDeviceCommandProps */

/** 
  @typedef { 
    | CharacteristicsForDeviceCommandProps
    | ConnectedDevicesCommandProps
    | ConnectToDeviceCommandProps
    | DevicesCommandProps
    | DiscoverAllServicesAndCharacteristicsForDeviceCommandProps
    | IsDeviceConnectedCommandProps
    | MonitorCharacteristicForDeviceCommandProps 
    | OnDeviceDisconnectedCommandProps
    | OnStateChangeCommandProps 
    | ReadCharacteristicForDeviceCommandProps
    | ReadRSSIForDeviceCommandProps
    | RequestMTUForDeviceCommandProps
    | ServicesForDeviceCommandProps
    | StartDeviceScanCommandProps
    | StateCommandProps 
    | StopDeviceScanCommandProps
    | WriteCharacteristicWithResponseForDeviceCommandProps
  } CommandProps 
*/

/** @typedef { { characteristic: Characteristic | null, error: BleError | null } } CharacteristicEventArgs */
/** @typedef { { event: 'characteristic', args: CharacteristicEventArgs } } CharacteristicEventProps */

/** @typedef { { device: Device | null, error: BleError | null } } DeviceDisconnectedEventArgs */
/** @typedef { { event: 'deviceDisconnected', args: DeviceDisconnectedEventArgs } } DeviceDisconnectedEventProps */

/** @typedef { { device: Device | null, error: BleError | null } } DeviceScanEventArgs */
/** @typedef { { event: 'deviceScan', args: DeviceScanEventArgs } } DeviceScanEventProps */

/** @typedef { { powerState: State } } StateChangeEventArgs */
/** @typedef { { event: 'stateChange', args: StateChangeEventArgs } } StateChangeEventProps */

/**
  @typedef { 
    | CharacteristicEventProps 
    | DeviceDisconnectedEventProps
    | DeviceScanEventProps 
    | StateChangeEventProps 
  } EventProps 
*/

/** @typedef { { keep: number } } EventSpec */
/** @typedef { { [key: string]: EventSpec } } Spec */

/** @typedef { { type: 'command' } & CommandProps } CommandRecord */
/** @typedef { { type: 'event', autoPlay: boolean, spec?: EventSpec } & EventProps } EventRecord */
/** @typedef { { type: 'label', label: string } } LabelRecord */

/** @typedef { CommandRecord | EventRecord | LabelRecord } BleRecord */

/** @typedef { { records: BleRecord[], version: string } } Recording */

/** @typedef { (error: BleError | null, characteristic: Characteristic | null) => void } CharacteristicListener */
/** @typedef { (error: BleError | null, device: Device | null) => void } DeviceDisconnectedListener */
/** @typedef { (error: BleError | null, scannedDevice: Device | null) => void } DeviceScanListener */
/** @typedef { (newState: State) => void } StateChangeListener */

export const recordingFileFormatVersion = '1.0.0';
