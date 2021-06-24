import { BleManager } from 'react-native-ble-plx';

const bleManager = new BleManager();

export const getBleManager = () => {
  return bleManager;
};