import { BleManager } from 'react-native-ble-plx';
import { BleRecorder } from 'react-native-ble-plx-mock-recorder';

const expectedLocalName = 'BeoPlay A1'; // TODO: change to name of your own device

describe('app', () => {
  it('should receive scan results', async () => {
    const bleRecorder = new BleRecorder({ bleManager: new BleManager() });
    const { bleManagerSpy: bleManager } = bleRecorder;
    await new Promise((resolve, reject) => {
      bleManager.startDeviceScan(null, null, (error, { localName }) => {
        if (!error && localName == expectedLocalName) {
          resolve(d);
        } else if (error) {
          reject(error);
        }
      });
    });
    bleRecorder.label('scanned');
    bleRecorder.close();
  });
});