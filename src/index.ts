import { app, BrowserWindow } from 'electron'; // eslint-disable-line import/no-extraneous-dependencies
import { setTimeout } from 'timers';
import {
  Chat, TalkClient, FeedChat, DeleteAllFeed,
} from '@storycraft/node-kakao';
import createLogInWindow from 'src/pages/login/main';
import createRegisterWindow from 'src/pages/register/main';
import state from 'src/state';
import { fetchChatsAndSetState } from 'src/api';
import getDeviceInfo from 'src/utils/device-info';
import createChannelListWindow from 'src/pages/channel_list/main';
import { INCREMENTAL_FETCH_TIME, UPDATE_CHANNELS_ORDER } from './constants';

require('dotenv-flow').config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// console.log(`${app.getPath('cache')}/${SERVICE_NAME}`);

function attachListener(talkClient: TalkClient): void {
  talkClient.on('message', (chat: Chat) => {
    const channelState = state.channels.get(chat.Channel.Id.toString());
    if (!channelState) {
      return;
    }
    channelState.chatList.append(chat);

    // update channel list order
    state.channels.moveToFront(chat.Channel.Id.toString());
    state.ee.emit(UPDATE_CHANNELS_ORDER, state.channels.keyList);
  });

  talkClient.on('feed', (feed: FeedChat) => {
    console.log(feed.Text);
  });

  talkClient.on('message_deleted', (feed: FeedChat<DeleteAllFeed>) => {
    console.log(feed.Text);
  });
}

async function initialize(): Promise<void> {
  const deviceInfo = getDeviceInfo();
  const talkClient = new TalkClient(deviceInfo.name, deviceInfo.uuid);
  // log in screen
  const [logInWindow, credential, isRegistered] = await createLogInWindow(talkClient);

  setTimeout(() => {
    logInWindow.close();
  }, 0);

  if (!isRegistered) {
    // register
    const [registerWindow, isSucceeded] = await createRegisterWindow(talkClient, credential);

    setTimeout(registerWindow.close, 0);

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

  attachListener(talkClient);

  const interval = setInterval(() => {
    if (state.channels) {
      state.channels.forEachAsync(async ({ chatChannel, lastConfirmedLogId }) => {
        await fetchChatsAndSetState(state, chatChannel, lastConfirmedLogId);
      }).then(() => {
        state.channels.sort();
        state.ee.emit(UPDATE_CHANNELS_ORDER, state.channels.keyList);
      });
    } else {
      clearInterval(interval);
    }
  }, INCREMENTAL_FETCH_TIME);

  // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define
  const channelListWindow = await createChannelListWindow();
  setTimeout(() => {
    channelListWindow.close();
    clearInterval(interval);
  }, 0);

  state.initialize();
  return initialize();
}

app.on('ready', async () => {
  try {
    await initialize();
  } catch (e) {
    console.log(e);
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
