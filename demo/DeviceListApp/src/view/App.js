import React from 'react';

import DeviceListScreen from './DeviceListScreen';
import { configureStore } from '../state';
import { withStore } from '../lib/withStore';

const store = configureStore();

const App = () => {
  return withStore(<DeviceListScreen />, store);
};

export default App;
