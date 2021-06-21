import * as fs from 'fs';
import readline from 'readline';

import chalk from 'chalk';
import { parseTestRunnerEvent } from 'react-native-ble-plx-mock-recorder-mocha-core';
import { parseBleRecorderEvent, parseBleRecord } from 'react-native-ble-plx-mock-recorder';

const lineTransformer = (input) => readline.createInterface({ input });

export const launch = async ({ appName, env, exec, expectedFailCount, log, spawn }) => {

  // get platform version
  const { stdout: roBuildVersionRelease } = await exec('adb shell getprop ro.build.version.release');
  const platformVersion = parseInt(roBuildVersionRelease);
  log(`Android version detected: ${platformVersion}`);

  // clear adb log
  await exec('adb logcat -c');

  // start adb logcat
  const logcat = spawn('adb', ['logcat', '-v', 'raw', '-s', 'ReactNativeJS:V']);
  const logCatIgnorePrefixList = [
    '--------- beginning of ',
    `Running "${appName}" with `,
  ];

  // stop app, if already running
  try {
    await exec(`adb shell pm clear ${env.PACKAGE_NAME}`);
  } catch (error) {
    log('(failed to clear app, continuing)');
  }

  // launch
  log('Launching test runner on device...');
  await exec(`adb shell am start -n '${env.PACKAGE_NAME}/.MainActivity'`);

  // allow location permission required to use BLE on phone
  log('Allowing app to run with necessary permissions');
  do {
    const { stdout: dumpOutput } = await exec('adb shell uiautomator dump');
    const viewRemotePathMatch = dumpOutput.match(/[^ ]+.xml/);
    const viewRemotePath = viewRemotePathMatch[0];
    fs.mkdirSync('./output', { recursive: true });
    const viewLocalPath = './output/view.xml';
    await exec(`adb pull ${viewRemotePath} ${viewLocalPath}`, {
      env: {
        ...env,
        MSYS_NO_PATHCONV: '1', // Note: for windows git bash: https://github.com/git-for-windows/git/issues/577#issuecomment-166118846
      },
    });
    const view = fs.readFileSync(viewLocalPath, 'utf-8');
    const resourceId = platformVersion < 10 ? 'com.android.packageinstaller:id\\/permission_allow_button' : 'com.android.permissioncontroller:id\\/permission_allow_foreground_only_button';
    const boundsPattern = `resource-id="${resourceId}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`;
    const viewMatch = view.match(new RegExp(boundsPattern));

    if (viewMatch) {
      const [x1str, y1str, x2str, y2str] = viewMatch.slice(1);
      const [x1, y1, x2, y2] = [x1str, y1str, x2str, y2str].map((str) => Number(str));
      const x = Math.trunc((x1 + x2) / 2);
      const y = Math.trunc((y1 + y2) / 2);
      await exec(`adb shell input tap ${x} ${y}`);
      break;
    } else {
      log('(permission dialog not found, retrying)');
    }
  } while (true);

  let bleRecording = null;
  let failCount = 0;
  // wait for event: complete
  await new Promise((resolve) => {
    lineTransformer(logcat.stdout).on('line', (line) => {
      const runnerEvent = parseTestRunnerEvent(line);
      const bleRecord = parseBleRecord(line);
      const bleRecorderEvent = parseBleRecorderEvent(line);
      if (runnerEvent) {
        const { duration, event, message, name } = runnerEvent;
        switch (event) {
          case 'complete':
            log('Done!');
            resolve();
            break;
          case 'fail':
            ++failCount;
            log(`  ${chalk.red('X')} ${name}: ${message} (${duration} ms)`);
            break;
          case 'pass':
            log(`  ${chalk.green('√')} ${name} (${duration} ms)`);
            break;
          case 'pending':
            log(`  ${chalk.yellow('-')} ${name}`);
            break;
          case 'start':
            log('Running tests...');
            break;
          case 'suite:complete':
            if (name) {
              log(`> ${name} - complete`);
            } else {
              log('> complete');
            }
            break;
          case 'suite:start':
            log(`> ${name}`);
            break;
        }
      } else if (bleRecord) {
        bleRecording.records.push(bleRecord);
      } else if (bleRecorderEvent) {
        const { event, name, version } = bleRecorderEvent;
        switch (event) {
          case 'init':
            bleRecording = {
              records: [],
              version,
            };
            break;
          case 'save':
            fs.mkdirSync('./artifact', { recursive: true });
            const recordingPath = `./artifact/${name}.recording.json`;
            fs.writeFileSync(recordingPath, JSON.stringify(bleRecording, null, 2));
            log(`(BLE recording file saved in ${recordingPath}: ${bleRecording.records.length} records)`);
            break;
        }
      } else if (logCatIgnorePrefixList.some((prefix) => line.startsWith(prefix))) {
        // skip
      } else {
        log(`    ${chalk.grey(line)}`);
      }
    });
  });

  // stop adb logcat
  logcat.kill();

  // summary
  if (expectedFailCount === 0) {
    if (failCount > 0) {
      log(`${failCount} ${failCount > 1 ? 'tests' : 'test'} failed!`);
    } else {
      log('Success!');
    }
    return { exitCode: failCount };
  } else {
    if (expectedFailCount !== failCount) {
      log(`Expected number of failed tests to be ${expectedFailCount} but was ${failCount}`);
      return { exitCode: 1 };
    } else {
      log(`Success (${failCount} test failed as expected)!`);
      return { exitCode: 0 };
    }
  }
};
