const bleRecordPrefix = 'BleRecord: ';
const bleRecorderPrefix = 'BleRecorder: ';

/** @param { string } line */
export const parseBleRecorderEvent = (line) => {
  if (line.startsWith(bleRecorderPrefix)) {
    const bleRecorderEvent = JSON.parse(line.substr(bleRecorderPrefix.length));
    return bleRecorderEvent;
  } else {
    return undefined;
  }
};

/** @param { string } line */
export const parseBleRecord = (line) => {
  if (line.startsWith(bleRecordPrefix)) {
    const bleRecord = JSON.parse(line.substr(bleRecordPrefix.length));
    return bleRecord;
  } else {
    return undefined;
  }
};

/** @param { import("./bleRecorder").RecorderEvent } recorderEvent */
export const stringifyBleRecorderEvent = (recorderEvent) => {
  return `${bleRecorderPrefix}${JSON.stringify(recorderEvent)}`;
};

/** @param { import("./bleRecorder").BleRecord } record */
export const stringifyBleRecord = (record) => {
  return `${bleRecordPrefix}${JSON.stringify(record)}`;
};