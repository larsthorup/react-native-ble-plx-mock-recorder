import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text } from 'react-native';
import { MochaEventReporter } from './MochaEventReporter.js';
import { stringifyTestRunnerEvent } from './testRunnerJsonProtocol.js';

const MochaRunnerScreen = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState([]);
  useEffect(() => {
    const logger = runnerEvent => {
      console.log(stringifyTestRunnerEvent(runnerEvent));
      setProgress(prev => prev.concat([runnerEvent]));
    };
    if (!isRunning) {
      setIsRunning(true);
      MochaRunnerScreen.mocha.reporter(MochaEventReporter, { logger });
      MochaRunnerScreen.mocha.run();
    }
  }, [isRunning]);
  return (
    <SafeAreaView style={{ backgroundColor: 'black' }}>
      <StatusBar />
      <ScrollView>
        <Text style={styles.heading}>Test Runner</Text>
        {progress.map(({ duration, event, name, message }, eventNumber) => {
          const text = (() => {
            switch (event) {
              case 'complete':
                return 'Done!';
              case 'fail':
                return `  X ${name}: ${message} (${duration} ms)`;
              case 'pass':
                return `  √ ${name} (${duration} ms)`;
              case 'pending':
                return `  - ${name}`;
              case 'start':
                return 'Running tests...';
              case 'suite:complete':
                if (name) {
                  return `> ${name} - complete`;
                } else {
                  return '> complete';
                }
              case 'suite:start':
                return `> ${name}`;
            }
          })();
          return (
            <Text
              style={{ ...styles.progress, ...styles[`progress.${event}`] }}
              key={eventNumber}>
              <>{text}</>
            </Text>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  heading: {
    color: 'lightgrey',
    padding: 20,
    fontSize: 24,
    fontWeight: '600',
  },
  progress: {
    padding: 3,
  },
  'progress.complete': {
    color: 'grey',
  },
  'progress.fail': {
    color: 'red',
  },
  'progress.pass': {
    color: 'green',
  },
  'progress.pending': {
    color: 'yellow',
  },
  'progress.start': {
    color: 'grey',
  },
  'progress.suite:complete': {
    color: 'lightblue',
  },
  'progress.suite:start': {
    color: 'lightblue',
  },
});

export default MochaRunnerScreen;
