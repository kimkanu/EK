import {
  BrowserWindow, ipcMain, WebContents,
} from 'electron'; // eslint-disable-line import/no-extraneous-dependencies
import keytar from 'keytar';
import { tryToLogIn } from 'src/api';
import Credential from 'src/models/credential';
import state, { ChatList } from 'src/state';
import {
  Long, AuthStatusCode, TalkClient,
} from '@storycraft/node-kakao';
import {
  REQUEST_CREDENTIAL,
  SERVICE_NAME,
  CREDENTIALS_EXIST,
  WRONG_CREDENTIAL,
} from 'src/constants';
import {
  saveCredential, parseCredential, deleteCredential,
} from 'src/utils/credential';

declare const LOGIN_WEBPACK_ENTRY: string;

async function onceReady(webContents: WebContents): Promise<void> {
  return new Promise((resolve) => {
    webContents.once('dom-ready', () => {
      resolve();
    });
  });
}

async function requestCredential(): Promise<Credential | null> {
  return new Promise((resolve) => {
    ipcMain.once(CREDENTIALS_EXIST, () => {
      resolve(null);
    });
    ipcMain.once(REQUEST_CREDENTIAL, (event, credential: Credential) => {
      resolve(credential);
    });
  });
}

async function createLogInWindow(
  talkClient: TalkClient,
//            logInWindow, credential, isRegistered
): Promise<[BrowserWindow, Credential, boolean]> {
  const logInWindow = new BrowserWindow({
    height: 638,
    width: 420,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  logInWindow.loadURL(LOGIN_WEBPACK_ENTRY);
  logInWindow.removeMenu();

  if (process.env.NODE_ENV !== 'production') {
    logInWindow.webContents.openDevTools();
  }

  await onceReady(logInWindow.webContents);

  let credentials = (await keytar.findCredentials(SERVICE_NAME)).map(parseCredential);
  let credential: Credential | null = null;
  if (credentials.length > 0) {
    /* eslint-disable no-await-in-loop */
    while (!credential) {
      logInWindow.webContents.send(CREDENTIALS_EXIST, credentials);
      logInWindow.webContents.send(REQUEST_CREDENTIAL);
      credential = await requestCredential();
    }
    /* eslint-enable no-await-in-loop */
  } else {
    logInWindow.webContents.send(CREDENTIALS_EXIST, []);
    credential = null;
  }

  ipcMain.on(CREDENTIALS_EXIST, () => {
    if (credentials.length > 0) {
      logInWindow.webContents.send(CREDENTIALS_EXIST, credentials);
    } else {
      logInWindow.webContents.send(CREDENTIALS_EXIST, []);
    }
  });

  /* eslint-disable no-await-in-loop */
  for (;;) {
    let isValid = credential !== null;
    let isRegistered = false;
    if (credential !== null) {
      console.log('call trytologin');
      const logInResult = await tryToLogIn(talkClient, credential);
      isValid = logInResult.type === 'ok' || (logInResult.type === 'err' && logInResult.inner.status === AuthStatusCode.DEVICE_NOT_REGISTERED);
      isRegistered = logInResult.type === 'ok';
      console.log('called');

      if (isValid) {
        if (logInResult.type === 'ok') {
          const { ChannelManager: channelManager } = talkClient;
          const channelList = channelManager.getChannelList();
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

          await saveCredential({
            ...credential,
            name: talkClient.ClientUser.MainUserInfo.Nickname,
          });
        }
        console.log('login window returned');
        return [logInWindow, credential, isRegistered];
      }
    }

    if (credential !== null) {
      logInWindow.webContents.send(WRONG_CREDENTIAL, credential);
      await deleteCredential(credential);
      credentials = (await keytar.findCredentials(SERVICE_NAME)).map(parseCredential);
    }

    logInWindow.webContents.send(REQUEST_CREDENTIAL);
    credential = await requestCredential();
  }
  /* eslint-enable no-await-in-loop */
}

export default createLogInWindow;
