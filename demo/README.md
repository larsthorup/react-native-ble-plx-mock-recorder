# Demo

This demo shows how to create a React Native app (which will display name of neaby BLE devices),
and then write fast and robust integration tests for this app using [react-native-ble-plx-mock-recorder](https://www.npmjs.com/package/react-native-ble-plx-mock-recorder/).

This is a fairly minimal demo, so several features of the mock recorder is not shown. See the API documentation for details.

## Prerequisites

See [main README](../README.md#prerequisites).

## Bootstrap the app

We need an app, so that we have something to test. Bootstrap the app with React Native and install the react-native-ble-plx library so the app can talk with BLE devices:

```bash
mkdir ble-demo
cd ble-demo
npx react-native init BleApp
cd BleApp
npm install react-native-ble-plx
```

## Code the app

Then we write the code needed to actually talk with BLE devices:

- [`BleApp/App.js`](./BleApp/App.js)
- [`BleApp/ble.js`](./BleApp/ble.js)

## Run the app

We can now run the app (which will open a seperate terminal window with the React Native metro bundler):

```bash
npm run android
```

Your phone should show something like this, with names of BLE devices near you:

![](./media/bleApp.png)

## Bootstrap the recorder test app

Now, before we can write a test for our app, we will create a BLE traffic recorder app. We will use a dedicated React Native template to bootstrap this recorder app:

```bash
cd ble-demo
npx react-native init BleAppRecorder --template react-native-ble-plx-mock-recorder-mocha-template
cd BleAppRecorder
```

## Code the recorder test

To be able to record traffic, we will add a "test" to replicate the trafic that we need for testing our real app:

- [`BleAppRecorder/src/test/app.recorder.test.js`](./BleAppRecorder/src/test/app.recorder.test.js)
- Change `expectedLocalName` to match your BLE device

## Run the recorder test

First, stop the "metro" terminal window that popped up when we ran BleApp in a previous step. Then, run the recorder app to record traffic:

```bash
npm test
```

Your phone will ask for the location permission, but do not click it, as the test runner will click it automatically.

Then your phone should show something like this:

![](./media/bleAppRecorder.png)

If your phone is slow, you might get a timeout, you can increase it in [`BleAppRecorder/src/test/setup.test.js`](./BleAppRecorder/src/test/setup.test.js).

And a [recording file](./BleAppRecorder/artifact/default.recording.json) will have been created in `BleAppRecorder/artifact/default.recording.json`.

## Set up the app test

To enable us to write a test for our real app, we must install the mock recorder tool, and we will also use [Testing Library](https://testing-library.com/):

```bash
cd BleApp
npm install react-native-ble-plx-mock-recorder
npm install @testing-library/react-native
```

For the benefit of `react-native-ble-plx`, we also have to modify the Jest configuration in `BleApp/package.json` to this:

```json
  "jest": {
    "preset": "react-native",
    "transformIgnorePatterns": [
      "node_modules/(?!(react-native|@react-native|react-native-ble-plx|react-native-ble-plx-mock-recorder)/)"
    ]
  }
```

And add a Jest mock for `react-native-ble-plx`:

- [`BleApp/__mocks__/react-native-ble-plx.js`](./BleApp/__mocks__/react-native-ble-plx.js).

## Code the app test

Now we can write a test for our app, and have it use the recording we made earlier:

- [`BleApp/__tests__/App-test.js`](./BleApp/__tests__/App-test.js).
- Change `expectedLocalName` to match your BLE device.

## Run the app test

Finally we can run our app test (we can now also disconnect the phone and power down our BLE device as they are now being mocked by the recording we made):

```bash
npm test
```

Your terminal should show something like this:

![](./media/App-test.png)
