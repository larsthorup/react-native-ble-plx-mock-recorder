# react-native-ble-plx-mock-recorder

[![Build Status](https://github.com/larsthorup/react-native-ble-plx-mock-recorder/actions/workflows/ci.yml/badge.svg)](https://github.com/larsthorup/react-native-ble-plx-mock-recorder/actions/workflows/ci.yml)

Mock recorder and playback tool for [react-native-ble-plx](https://www.npmjs.com/package/react-native-ble-plx).
Enables fast and robust integration tests for your Bluetooth/BLE app UI.

## Overview

This tool is targeted developers of React Native apps that talks to Bluetooth/BLE devices.

If you can run your UI tests with _pre-recorded_ BLE traffic, you get very _fast and robust_ tests, that are actual _integration tests_, since you are not writing your mocks by hand.

You will create a seperate mock recorder app, using the "react-native-ble-plx-mock-recorder-mocha-template" template for React Native to occasionally record actual trafic needed by your tests.

Then use this library to play back the BLE traffic every time you run your Jest UI tests, and enjoy the speed of up to 100 of tests per second.

## Prerequisites

Prerequisites

- A Bluetooth/BLE device, powered on, nearby, not connected to a phone
- A react-native app talking to the BLE device
- An Android phone (support for iPhone is planned), plugged into your computer
- Your React Native environment: https://reactnative.dev/docs/environment-setup
- Bash in your path

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

## Contribute

Contributions are welcome!

## Publish new version

```bash
# git commit && git push
# wait for CI to pass
test -z "$(git status --porcelain)" || echo clean workspace first
git checkout main
git pull
npm run test:e2e
npm run bump
npm run publish
# git commit && git push
```

Then verify react-native-ble-plx-mock-recorder-mocha-template and publish it
