import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, Text } from 'react-native';
import { getBleManager } from './ble.js'

const backgroundColor = 'black';
const color = 'lightgreen';

const App = () => {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  useEffect(() => {
    if (!isScanning) {
      setIsScanning(true);
      const bleManager = getBleManager();
      bleManager.startDeviceScan(null, null, (error, { id, localName }) => {
        setDevices(ds => localName && ds.every(d => d.id !== id) ? ds.concat([{ id, localName }]) : ds);
      });
    }
  }, [isScanning, setDevices, setIsScanning]);
  return (
    <SafeAreaView style={{ backgroundColor }}>
      <Text style={{ color }}>Device List</Text>
      <FlatList
        data={devices}
        renderItem={({ item: { localName } }) => (
          <Text style={{ color }}>- {localName}</Text>
        )}
        keyExtractor={({ id }) => id}
      />
    </SafeAreaView>
  );
};

export default App;
