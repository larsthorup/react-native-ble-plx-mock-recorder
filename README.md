# react-native-ble-plx-mock-recorder

Mock recorder tool for [react-native-ble-plx](https://www.npmjs.com/package/react-native-ble-plx).
Enables fast and robust integration tests for your Bluetooth/BLE app UI.

## Overview

This tool is targeted developers of React Native apps that talks to Bluetooth/BLE devices.

If you can run your UI tests with _pre-recorded_ BLE traffic, you get very _fast and robust_ tests, that are actual _integration tests_, since you are not writing your mocks by hand.

You will create a seperate mock recorder app, using the "react-native-ble-plx-mock-recorder-mocha-template" template for React Native to occasionally record actual trafic needed by your tests.

Then use this library to play back the BLE traffic every time you run your Jest UI tests, and enjoy the speed of up to 100 of tests per second.

## Getting started

Prerequisites

- A Bluetooth/BLE device
- A react-native app talking to the BLE device
- An Android phone (support for iPhone is planned)
- Setup your React Native environment: https://reactnative.dev/docs/environment-setup
- Have bash in your path

## Contribute
