/**
 * @format
 */

import { AppRegistry } from 'react-native';
import MochaRunnerScreen from 'react-native-ble-plx-mock-recorder-mocha-core/MochaRunnerScreen';
import { name as appName } from './app.json';
import mocha from './src/lib/mochaLoader';

// Note: importing all files in directory, supported by "babel-plugin-wildcard"
import * as test from './src/test'; // eslint-disable-line no-unused-vars

MochaRunnerScreen.mocha = mocha;
AppRegistry.registerComponent(appName, () => MochaRunnerScreen);
