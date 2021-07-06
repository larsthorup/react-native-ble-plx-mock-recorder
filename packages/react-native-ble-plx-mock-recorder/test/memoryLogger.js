import { parseBleRecorderEvent, parseBleRecord } from '../bleRecorderJsonProtocol.js';
import { recordingFileFormatVersion as version } from '../recording.js';

/** @typedef { import('../bleRecorder.js').Logger } Logger */
/** @typedef { import('../recording.js').Recording } Recording */
/** @typedef { import('../bleRecorder.js').RecorderEvent } RecorderEvent */

export class MemoryLogger {
  constructor() {
    /** @type { Recording } */
    this.recording = { records: [], version };
    /** @type { RecorderEvent[] } */
    this.recorderEventLog = [];
    /** @type { Logger } */
    this.logger = (line) => {
      const bleRecord = parseBleRecord(line);
      const recorderEvent = parseBleRecorderEvent(line);
      if (bleRecord) {
        this.recording.records.push(bleRecord);
      }
      if (recorderEvent) {
        this.recorderEventLog.push(recorderEvent);
      }
    };
  }
}

