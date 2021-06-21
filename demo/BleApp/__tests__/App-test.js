import * as fs from 'fs';

import 'react-native';
import React from 'react';
import { render } from '@testing-library/react-native';

import App from '../App';
import { getBleManager } from '../ble.js';
import { act } from 'react-test-renderer';

const expectedLocalName = 'BeoPlay A1'; // TODO: change to name of your own device

describe('App', () => {
  it('should show device names', async () => {
    const recording = JSON.parse(fs.readFileSync('../BleAppRecorder/artifact/default.recording.json'));
    const { blePlayer } = getBleManager();
    blePlayer.mockWith(recording);

    // when: render the app
    const { queryByText } = render(<App />);

    // then: device is NOT shown
    expect(queryByText(`- ${expectedLocalName}`)).toBeFalsy();

    // when: simulating BLE scan responses
    act(() => {
      blePlayer.playUntil('scanned'); // Note: causes re-render, so act() is needed
    });

    // then: device IS shown
    expect(queryByText(`- ${expectedLocalName}`)).toBeTruthy();
  });
});