import { startScanning } from '../shared/bleService';

import { bleDeviceScanned, blePowerStateChanged } from '../state';
import { getBleManager } from '../singleton/bleManager';

export const deviceScanning = async (dispatch, getState) => {
  try {
    const bleManager = getBleManager();
    startScanning(bleManager, (error, device) => {
      try {
        if (error) {
          console.error('bleManager.onDeviceScanError', error);
          return;
        }
        // Note: for now, skip devices with no name in scan response
        if (device.name) {
          // const { id, name, localName, manufacturerData, rssi } = device;
          // console.log({ id, name, localName, manufacturerData, rssi });
          dispatch(bleDeviceScanned({ device }));
        }
        // Note: eventually handle device disappearing from scan
      } catch (ex) {
        console.error('bleManager.onDeviceScan exception', ex);
      }
    }, (powerState) => {
      dispatch(blePowerStateChanged({ powerState }));
    });
    // const uuidList = null;
    // const scanOptions = null;
    // bleManager.onStateChange((powerState) => {
    //   dispatch(blePowerStateChanged({ powerState }));
    //   if (powerState === BleState.PoweredOn) {
    //     bleManager.startDeviceScan(uuidList, scanOptions, (error, device) => {
    //       try {
    //         if (error) {
    //           console.error('bleManager.onDeviceScanError', error);
    //           return;
    //         }
    //         // Note: for now, skip devices with no name in scan response
    //         if (device.name) {
    //           // const { id, name, localName, manufacturerData, rssi } = device;
    //           // console.log({ id, name, localName, manufacturerData, rssi });
    //           dispatch(bleDeviceScanned({ device }));
    //         }
    //         // Note: eventually handle device disappearing from scan
    //       } catch (ex) {
    //         console.error('bleManager.onDeviceScan exception', ex);
    //       }
    //     });
    //   }
    // }, true);
  } catch (err) {
    console.error('deviceScanning', err);
  }
};
