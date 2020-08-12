// import readline from 'readline';
import {
  tryToLogIn,
  // tryToRegisterDevice,
} from 'src/api';
import getDeviceInfo from 'src/utils/device-info';
import Credential, { CredentialWithoutName } from 'src/models/credential';

import { TalkClient } from '@storycraft/node-kakao';

require('dotenv-flow').config();

/* eslint-disable @typescript-eslint/no-non-null-assertion */
const credential: CredentialWithoutName = {
  account: process.env.EMAIL!,
  password: process.env.PASSWORD!,
};
/* eslint-enable @typescript-eslint/no-non-null-assertion */

test('login', async () => {
  const deviceInfo = getDeviceInfo();
  const talkClient = new TalkClient(deviceInfo.name, deviceInfo.uuid);
  const tryToLogInResult = await tryToLogIn(talkClient, credential);
  expect(tryToLogInResult.type).toBe('ok');
});

// async function question(q: string): Promise<string> {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });
//   return new Promise((resolve) => {
//     rl.question(q, (answer: string) => {
//       resolve(answer);
//     });
//   });
// }

// test('register', async () => {
//   const callbackResult = await tryToRegisterDevice(user);
//   if (callbackResult.type === 'err') {
//     return;
//   }
//   const callback = callbackResult.inner;

//   const passcode = await question('passcode? \n');
//   const result = await callback(passcode);
//   expect(result.type).toBe('ok');
// });
