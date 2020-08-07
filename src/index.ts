import { app, BrowserWindow } from 'electron'; // eslint-disable-line import/no-extraneous-dependencies
import { setTimeout } from 'timers';
import { ChatChannel, Chat, TalkClient } from '@storycraft/node-kakao';
import createLogInWindow from './pages/login/main';
import createRegisterWindow from './pages/register/main';
import state from './state';
import { fetchChatsAndSetState } from './api/kakao/fetch';
import { lazyLoaded, LazyLoaded } from './models/lazy';
import { getDeviceInfo } from './api/kakao';
import createChannelListWindow from './pages/channel_list/main';

declare const VOID_WEBPACK_ENTRY: string;

const INCREMENTAL_FETCH_TIME = 60 * 1000; // 60 seconds

require('dotenv-flow').config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

async function initialize(): Promise<void> {
  const deviceInfo = getDeviceInfo();
  const talkClient = new TalkClient(deviceInfo.name, deviceInfo.uuid);
  // log in screen
  const [logInWindow, credential, isRegistered] = await createLogInWindow(talkClient);
  console.log('isRegistered:', isRegistered);

  setTimeout(() => {
    logInWindow.close();
  }, 0);

  if (!isRegistered) {
    // register
    const [registerWindow, isSucceeded] = await createRegisterWindow(talkClient, credential);

    setTimeout(() => {
      registerWindow.close();
    }, 0);

    if (!isSucceeded) {
      return initialize();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { ChannelManager: channelManager } = talkClient!;
  {
    const channelList = channelManager.getChannelList();

    // load the chat lists, WITHOUT awaiting
    Promise.all(channelList.map((channel) => fetchChatsAndSetState(state, channel)));
  }

  const interval = setInterval(() => {
    if (state.channels) {
      state.channels.forEachAsync(async ({ chatChannel, lastConfirmedLogId }) => {
        await fetchChatsAndSetState(state, chatChannel, lastConfirmedLogId);
      });
    } else {
      clearInterval(interval);
    }
  }, INCREMENTAL_FETCH_TIME);

  // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define
  const channelListWindow = await createChannelListWindow();
  setTimeout(() => {
    channelListWindow.close();
  }, 0);

  state.initialize();
  return initialize();
}

app.on('ready', async () => {
  try {
    await initialize();
  } catch (e) {
    console.log(e);
    await initialize();
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    initialize();
  }
});
