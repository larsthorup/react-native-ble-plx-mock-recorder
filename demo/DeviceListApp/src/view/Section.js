import React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

const Section = ({ children, title }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionDescription}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    color: 'white',
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
});

export default Section;
