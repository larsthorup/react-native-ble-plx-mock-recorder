import * as fs from 'fs';
import 'react-native';
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import DeviceListScreen from './DeviceListScreen';
import { configureStore } from '../state';
import { withStore } from '../lib/withStore';
import { getBleManager } from '../singleton/bleManager';
import { act } from 'react-test-renderer';

describe('DeviceList', () => {
  // for (const _ of '*'.repeat(1000))
  it('should load and show device info', async () => {
    const spec = JSON.parse(fs.readFileSync('../DeviceListRecorder/artifact/deviceList.recording.json'));
    const { blePlayer } = getBleManager();
    blePlayer.mockWith(spec);

    // when: render the app
    const { getByA11yLabel, queryByA11yLabel } = render(withStore(<DeviceListScreen />, configureStore()));

    // then: no loading indicator is shown
    expect(queryByA11yLabel('Connecting to "The Speaker"')).toBeFalsy();

    // when: simulating BLE scan response
    act(() => {
      blePlayer.playUntil('scanned'); // Note: causes re-render, so act() is needed
    });

    // when: clicking a device
    fireEvent.press(getByA11yLabel('Connect to "The Speaker"'));

    // then: loading indicator is shown
    expect(queryByA11yLabel('Connecting to "The Speaker"')).toBeTruthy();

    // then: eventually battery level is shown
    await waitFor(() => getByA11yLabel('"The Speaker" battery level'));
    expect(getByA11yLabel('"The Speaker" battery level')).toHaveTextContent('🔋 42%');

    // then: eventually signal strength is shown
    expect(getByA11yLabel('"The Speaker" signal')).toHaveTextContent('📶 -42');

    // then: loading indicator is no longer shown
    expect(queryByA11yLabel('Connecting to "The Speaker"')).toBeFalsy();

    // when: clicking the device again
    fireEvent.press(getByA11yLabel('Disconnect from "The Speaker"'));

    // then: battery level is no longer shown
    expect(queryByA11yLabel('"The Speaker" battery level')).toBeFalsy();

    // finally
    blePlayer.expectFullCoverage();
  });
});
