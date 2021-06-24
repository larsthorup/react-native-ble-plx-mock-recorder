import React from 'react';
import { useSelector } from 'react-redux';
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
} from 'react-native';

import Section from './Section';
import DeviceList from './DeviceList';

const DeviceListScreen = () => {
  const powerState = useSelector((state) => state.ble.powerState);
  return (
    <SafeAreaView style={styles.top}>
      <StatusBar />
      <Section title="DeviceListApp" />
      <Section title="BLE state">
        <Pressable onPress={() => console.log('press!!')}>
          <Text accessibilityLabel="BLE state" style={styles.deviceState}>
            {powerState}
          </Text>
        </Pressable>
      </Section>
      <Section title="BLE device list" />
      <DeviceList />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  top: {
    backgroundColor: '#888',
    height: '100%',
  },
  deviceState: {
    color: 'white',
  },
});

export default DeviceListScreen;
