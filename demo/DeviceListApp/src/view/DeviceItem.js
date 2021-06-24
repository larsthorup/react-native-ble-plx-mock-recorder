import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { deviceConnecting } from '../service/deviceConnecting';
import { bleDevicePolling } from '../state';

const DeviceItem = ({ id }) => {
  const dispatch = useDispatch();
  const [selected, setSelected] = useState(false);
  const { name } = useSelector((state) => state.ble.device[id].device);
  const connecting = useSelector((state) => state.ble.device[id].connecting);
  const batteryLevel = useSelector((state) => state.ble.device[id].batteryLevel);
  const signal = useSelector((state) => state.ble.device[id].signal);
  const toggleSelected = () => {
    if (!selected) {
      dispatch(deviceConnecting({ id }));
      dispatch(bleDevicePolling({ id, polling: true }));
      setSelected(true);
    } else {
      dispatch(bleDevicePolling({ id, polling: false }));
      setSelected(false);
    }
  };
  const style = {
    ...styles.deviceItem,
    ...(selected && styles.deviceItemSelected),
  };
  const pressableLabel = selected ? `Disconnect from "${name}"` : `Connect to "${name}"`;
  return (
    <Pressable
      accessibilityLabel={pressableLabel}
      onPress={toggleSelected}
    >
      <View
        accessibilityLabel="BLE device"
        style={style}
      >
        <Text
          style={styles.deviceName}
        >
          {name}
        </Text>
      </View>
      {selected && connecting && (
        <ActivityIndicator
          accessibilityLabel={`Connecting to "${name}"`}
          color={styles.deviceItemLoading.color}
          size="small"
        />
      )}
      {selected && batteryLevel && (
        <Text
          accessibilityLabel={`"${name}" battery level`}
          style={styles.deviceProp}
        >
          {`🔋 ${batteryLevel}%`}
        </Text>
      )}
      {selected && signal && (
        <Text
          accessibilityLabel={`"${name}" signal`}
          style={styles.deviceProp}
        >
          {`📶 ${signal}`}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  deviceItem: {
    backgroundColor: '#444444',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
  },
  deviceItemLoading: {
    color: 'lightyellow',
  },
  deviceItemSelected: {
    backgroundColor: '#555555',
  },
  deviceName: {
    color: 'lightyellow',
  },
  deviceProp: {
    color: 'lightgreen',
    padding: 20,
  },
});

export default DeviceItem;
