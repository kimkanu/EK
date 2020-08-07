import {
  BrowserWindow, ipcMain, WebContents,
} from 'electron'; // eslint-disable-line import/no-extraneous-dependencies
import keytar from 'keytar';
import {
  Credential, tryToLogIn,
} from 'src/api/kakao';
import state, { ChatList } from 'src/state';
import {
  ChatChannel, ChatUserInfo, Chat, Long, AuthStatusCode, TalkClient,
} from '@storycraft/node-kakao';
import { lazyNotLoaded, lazyLoaded, LazyLoaded } from 'src/models/lazy';

declare const LOGIN_WEBPACK_ENTRY: string;
const SERVICE_NAME = 'ELECTRON_KAKAO';
const CREDENTIALS_EXIST = 'CREDENTIALS_EXIST';
const REQUEST_CREDENTIAL = 'REQUEST_CREDENTIAL';
const WRONG_CREDENTIAL = 'WRONG_CREDENTIAL';

async function onceReady(webContents: WebContents): Promise<void> {
  return new Promise((resolve) => {
    webContents.once('dom-ready', () => {
      resolve();
    });
  });
}

async function requestCredential(): Promise<Credential> {
  return new Promise((resolve) => {
    ipcMain.once(REQUEST_CREDENTIAL, (event, credential: Credential) => {
      resolve(credential);
    });
  });
}

//                                             logInWindow, credential, isRegistered
async function createLogInWindow(
  talkClient: TalkClient,
): Promise<[BrowserWindow, Credential, boolean]> {
  const logInWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  logInWindow.loadURL(LOGIN_WEBPACK_ENTRY);

  if (process.env.NODE_ENV !== 'production') {
    logInWindow.webContents.openDevTools();
  }

  await onceReady(logInWindow.webContents);

  const credentials = await keytar.findCredentials(SERVICE_NAME);
  let credential: Credential | null = null;
  if (credentials.length > 0) {
    logInWindow.webContents.send(CREDENTIALS_EXIST, true, credentials);
    logInWindow.webContents.send(REQUEST_CREDENTIAL);
    credential = await requestCredential();
  } else {
    logInWindow.webContents.send(CREDENTIALS_EXIST, false, null);
    credential = null;
  }

  ipcMain.on(CREDENTIALS_EXIST, (event) => {
    if (credentials.length > 0) {
      event.sender.send(CREDENTIALS_EXIST, true, credentials);
    } else {
      logInWindow.webContents.send(CREDENTIALS_EXIST, false, []);
    }
  });

  /* eslint-disable no-await-in-loop */
  for (;;) {
    let isValid = credential !== null;
    let isRegistered = false;
    if (credential !== null) {
      const logInResult = await tryToLogIn(talkClient, credential);
      isValid = logInResult.type === 'ok' || (logInResult.type === 'err' && logInResult.inner.status === AuthStatusCode.DEVICE_NOT_REGISTERED);
      isRegistered = logInResult.type === 'ok';

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

          const { account, password } = credential;

          await keytar.setPassword(SERVICE_NAME, account, password);
        }
        return [logInWindow, credential, isRegistered];
      }
    }

    if (credential !== null) {
      logInWindow.webContents.send(WRONG_CREDENTIAL, credential);
    }

    logInWindow.webContents.send(REQUEST_CREDENTIAL);
    credential = await requestCredential();
  }
  /* eslint-enable no-await-in-loop */
}

export default createLogInWindow;
