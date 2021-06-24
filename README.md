# react-native-ble-plx-mock-recorder

[![Build Status](https://github.com/larsthorup/react-native-ble-plx-mock-recorder/actions/workflows/ci.yml/badge.svg)](https://github.com/larsthorup/react-native-ble-plx-mock-recorder/actions/workflows/ci.yml)

Mock recorder and playback tool for [react-native-ble-plx](https://www.npmjs.com/package/react-native-ble-plx).
Enables fast and robust integration tests for your Bluetooth/BLE app UI.

## Overview

This tool is targeted developers of React Native apps that talks to Bluetooth/BLE devices. Avoid having a lot of slow and fragile end-to-end tests taking more than an hour to run on physical devices connected to a physical CI server!

If you can run your UI tests with _pre-recorded_ BLE traffic, you get very _fast and robust_ tests, that are actual _integration tests_, since you are not writing your mocks by hand.

You will create a seperate mock recorder app, using the "react-native-ble-plx-mock-recorder-mocha-template" template for React Native to occasionally record actual trafic needed by your tests.

Then use this library to play back the BLE traffic every time you run your Jest UI tests, and enjoy the speed of up to 100 of tests per second.

## Prerequisites

- A Bluetooth/BLE device, powered on, nearby, not connected to a phone.
- A react-native app talking to the BLE device.
- An Android phone, plugged into your computer.
  - (Support for iPhone is planned).
- A React Native development environment: https://reactnative.dev/docs/environment-setup.
- [bash](https://www.gnu.org/software/bash/) on your path.
  - If on Windows, consider using Git Bash (https://gitforwindows.org/).

## Demo

```bash
npm install
npm run demo:app
# then close the app and the Metro popup terminal window
npm run demo:recorder
# from here on you can unplug phone and power down BLE device
npm run demo:app:test
```

## Getting started

To get started, read how to [build your own demo](https://github.com/larsthorup/react-native-ble-plx-mock-recorder/demo/README.md) from scratch. Then apply the same steps to the app you would like to test.

## API

TODO

## Architecture

See [ARCHITECTURE.md](https://github.com/larsthorup/react-native-ble-plx-mock-recorder/ARCHITECTURE.md)

![](https://github.com/larsthorup/react-native-ble-plx-mock-recorder/media/ble-mock-recorder-diagram-overview-small.png)

## Contributing

Contributions are welcome! Please open an issue with your suggestions and/or submit a PR. PRs should pass `npm test` and not decrease code coverage.

## Contributors

|                                                                                                                            |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![@larsthorup](https://avatars.githubusercontent.com/u/1202959?s=60&v=4)](https://github.com/larsthorup) <br> @larsthorup | [![@muscapades](https://camo.githubusercontent.com/45f7f93df10d0bd0f9044ccb9a54a4346ddf27560515c37cee2d6e9fc52945fb/68747470733a2f2f312e67726176617461722e636f6d2f6176617461722f36323038636564356562343237653036656566376666306337613237666636353f643d68747470732533412532462532466769746875622e6769746875626173736574732e636f6d253246696d6167657325324667726176617461727325324667726176617461722d757365722d3432302e706e6726723d6726733d3634)](https://github.com/muscapades) <br> @muscapades |

## Publish to npm

```bash
# git commit && git push
# wait for CI to pass
# clean workspace
git checkout main
git pull
npm run test:e2e
npm run bump
npm run publish
# git commit && git push
```

Then [manually verify](https://github.com/larsthorup/react-native-ble-plx-mock-recorder/packages/react-native-ble-plx-mock-recorder-mocha-template/README.md) local react-native-ble-plx-mock-recorder-mocha-template and publish that.
