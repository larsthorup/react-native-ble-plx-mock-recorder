import { bleDeviceConnecting } from '../state';
import { getBleManager } from '../singleton/bleManager';
import { devicePolling } from './devicePolling';

export const deviceConnecting = ({ id }) => async (dispatch, getState) => {
  try {
    const { connecting } = getState().ble.device[id] || {};
    if (!connecting) {
      dispatch(bleDeviceConnecting({ id, connecting: true }));
      const bleManager = getBleManager();
      // console.log('deviceConnecting - attempt connect');
      await bleManager.connectToDevice(id);
      // console.log('deviceConnecting - connected');
      await bleManager.discoverAllServicesAndCharacteristicsForDevice(id);
      // console.log('deviceConnecting - services discovered');
      dispatch(bleDeviceConnecting({ id, connecting: false }));
      dispatch(devicePolling({ id }));
      // console.log('deviceConnecting', { batteryLevel });
    }
  } catch (err) {
    console.error('deviceConnecting', err);
  }
};
