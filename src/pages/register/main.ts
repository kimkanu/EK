import {
  BrowserWindow, ipcMain, WebContents,
} from 'electron'; // eslint-disable-line import/no-extraneous-dependencies
import keytar from 'keytar';
import {
  Credential, tryToRegisterDevice,
} from 'src/api/kakao';
import state, { ChatList } from 'src/state';
import {
  Long, AuthStatusCode, TalkClient,
} from '@storycraft/node-kakao';

declare const REGISTER_WEBPACK_ENTRY: string;
const SERVICE_NAME = 'ELECTRON_KAKAO';
const REQUEST_PASSCODE = 'REQUEST_PASSCODE';

async function onceReady(webContents: WebContents): Promise<void> {
  return new Promise((resolve) => {
    webContents.once('dom-ready', () => {
      resolve();
    });
  });
}

async function requestPasscode(): Promise<string> {
  return new Promise((resolve) => {
    ipcMain.once(REQUEST_PASSCODE, (event, passcode: string) => {
      resolve(passcode);
    });
  });
}

async function createRegisterWindow(
  talkClient: TalkClient,
  credential: Credential,
//         registerWindow, isSucceeded
): Promise<[BrowserWindow, boolean]> {
  const registerWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  registerWindow.loadURL(REGISTER_WEBPACK_ENTRY);

  if (process.env.NODE_ENV !== 'production') {
    registerWindow.webContents.openDevTools();
  }

  await onceReady(registerWindow.webContents);

  const callbackResult = await tryToRegisterDevice(talkClient, credential);
  if (
    callbackResult.type === 'err'
    && callbackResult.inner.status !== AuthStatusCode.DEVICE_ALREADY_REGISTERED
  ) {
    return [registerWindow, false];
  }
  if (callbackResult.type === 'err'
  ) {
    return [registerWindow, true];
  }

  const callback = callbackResult.inner;

  /* eslint-disable no-await-in-loop */
  for (;;) {
    registerWindow.webContents.send(REQUEST_PASSCODE, credential);
    const passcode = await requestPasscode();

    const passcodeResult = await callback(passcode);

    if (passcodeResult.type === 'ok' || (
      passcodeResult.type === 'err'
      && passcodeResult.inner.status === AuthStatusCode.DEVICE_ALREADY_REGISTERED
    )) {
      // set the initial state
      const channelList = talkClient.ChannelManager.getChannelList();
      // initialize the state with empty chats
      state.credential = credential;
      state.talkClient = talkClient;
      state.channels.setMultiple(
        channelList.map((chatChannel) => [chatChannel.Id.toString(), {
          chatChannel,
          chatList: new ChatList(chatChannel.Id, state.ee),
          lastConfirmedLogId: Long.ZERO,
        }]),
      );

      await keytar.setPassword(SERVICE_NAME, credential.account, credential.password);

      return [registerWindow, true];
    }

    if (passcodeResult.inner.status !== AuthStatusCode.INCORRECT_PASSCODE) {
      console.log(passcodeResult.inner);
      return [registerWindow, false];
    }
  }
  /* eslint-enable no-await-in-loop */
}

export default createRegisterWindow;
