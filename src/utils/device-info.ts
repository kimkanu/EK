import os from 'os';
import { machineIdSync } from 'node-machine-id';

import DeviceInfo from 'src/models/device-info';

function getDeviceInfo(): DeviceInfo {
  return {
    name: os.hostname() ?? 'electron-kakao',
    uuid: Buffer.from(machineIdSync()).toString('base64'),
  };
}

export default getDeviceInfo;
