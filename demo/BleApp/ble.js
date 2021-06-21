import { BleManager } from 'react-native-ble-plx';

const bleManager = new BleManager();

// Note: share singleton between app and test
export const getBleManager = () => {
  return bleManager;
};