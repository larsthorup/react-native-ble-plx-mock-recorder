const testRunnerPrefix = 'TestRunner: ';

export const stringifyTestRunnerEvent = (runnerEvent) => {
  const line = `${testRunnerPrefix}${JSON.stringify(runnerEvent)}`;
  return line;
};

export const parseTestRunnerEvent = (line) => {
  if (line.startsWith(testRunnerPrefix)) {
    const runnerEvent = JSON.parse(line.substr(testRunnerPrefix.length));
    return runnerEvent;
  } else {
    return undefined;
  }
};