# Architecture of BLE mock recorder for react-native-ble-plx

## Diagram

![](./media/ble-mock-recorder-diagram.gif)

- Light green: 3rd party code
- Dark green: part of this tool
- Purple: your code
- Grey: generated data

## Overview

When the app is running normally on the phone, it uses react-native-ble-plx to communicate over Bluetooth BLE with devices.

When testing the app, the react-native-ble-plx module is mocked with a version that playbacks traffic from a recording. This mock implements the same interface as the original module, plus a few methods to specify which recording to use, when to playback events, and optionally verify that the entire recording has been used when a test is complete. In this way you can use Jest and Testing Library like normally to test components and services that interacts with the device.

To make a recording, the react-native-ble-plx module is wrapped in a recorder, so that all commands and events are not only propagated to and from the original module, but also persisted in a recording file. The wrapper implements the same interface as the original module, plus a few methods to insert labels into recordings. You will create a recorder app, which can run through a number of scenarios, and create recordings for each.

To prevent recordings from having device-specific values in the recorded traffic, the wrapper also enables configuration of mappings for device names, characteristic values, etc. Through the wrapper you can also specify names for services and characteristics, which will be added to the recordings for easier debugging.

To create a recorder app, you can use the React Native template provided by this project. This will create a Mocha test runner app that can run on a phone connected to the device. You then write each of your recording scenarios as a Mocha test. Mocha was chosen for ease of embedding into a React Native app. When Jest Core has matured enough, it would make sense to add the option of using Jest instead of Mocha.

You will typicall add the recordings to git, so they are awailable for running app tests on your CI server. You will want to run the recording app whenever you change the set of scenarios, or the BLE protocol of the device changes. A good approach might be to generate new recordings on a weekly basis, plus as needed per feature branch.
