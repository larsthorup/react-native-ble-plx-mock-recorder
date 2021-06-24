import { uint8FromBase64 } from '../shared/base64';
import { characteristic, service } from '../shared/bleConstants';

import { getBleManager } from '../singleton/bleManager';
import { bleDeviceBatteryLevel, bleDeviceSignal } from '../state';


export const devicePolling = ({ id }) => async (dispatch, getState) => {
  try {
    const { polling } = getState().ble.device[id];
    if (polling) {
      const bleManager = getBleManager();
      const services = await bleManager.servicesForDevice(id);
      // console.log(services.map(service => service.uuid));
      if (services.find((s) => s.uuid.toLowerCase() === service.battery.uuid.toLowerCase())) {
        // const characteristics = await bleManager.characteristicsForDevice(id, batteryServiceUuid);
        // console.log(characteristics);
        const batteryLevelCharacteristic = await bleManager.readCharacteristicForDevice(id, service.battery.uuid, characteristic.batteryLevel.uuid);
        const batteryLevel = uint8FromBase64(batteryLevelCharacteristic.value);
        dispatch(bleDeviceBatteryLevel({ id, batteryLevel }));
      }
      const { rssi } = await bleManager.readRSSIForDevice(id);
      dispatch(bleDeviceSignal({ id, signal: rssi }));
      setTimeout(async () => {
        dispatch(devicePolling({ id }));
      }, 500); // Note: eventually use monitor characteristic for battery
    }
  } catch (err) {
    // Note: eventually report error to user
    console.error('devicePolling', err);
  }
};
