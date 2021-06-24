import React from 'react';
import { useSelector } from 'react-redux';
import {
  FlatList,
} from 'react-native';

import DeviceItem from './DeviceItem';

const DeviceList = () => {
  const deviceSet = useSelector((state) => state.ble.deviceSet);
  const deviceIdList = Object.keys(deviceSet).sort();
  return (
    <FlatList
      accessibilityLabel="BLE device list"
      data={deviceIdList}
      renderItem={({ item }) => (<DeviceItem id={item} />)}
      keyExtractor={(item) => item}
    />
  );
};

export default DeviceList;
