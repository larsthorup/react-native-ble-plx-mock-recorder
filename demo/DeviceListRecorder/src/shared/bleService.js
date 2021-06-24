import { State as BleState } from 'react-native-ble-plx';

export const startScanning = (bleManager, scanListener, stateListener) => {
  bleManager.onStateChange((powerState) => {
    if (stateListener) stateListener(powerState);
    if (powerState === BleState.PoweredOn) {
      const uuidList = null;
      const scanOptions = null;
      bleManager.startDeviceScan(uuidList, scanOptions, (error, device) => {
        // console.log('startDeviceScan', error, device.id, device.name);
        scanListener(error, device);
      });
    } else if (powerState === BleState.PoweredOff) {
      console.error('Phone Bluetooth is disabled');
    }
  }, true);
};
