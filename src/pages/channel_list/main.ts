import {
  BrowserWindow, ipcMain, WebContents,
} from 'electron'; // eslint-disable-line import/no-extraneous-dependencies
import state from 'src/state';
import { Long, ChatChannel } from '@storycraft/node-kakao';

declare const CHANNEL_LIST_WEBPACK_ENTRY: string;
const SERVICE_NAME = 'ELECTRON_KAKAO';
const LOGOUT = 'LOGOUT';

const CREATE_CHANNEL = 'CREATE_CHANNEL';
const CREATE_CHANNELS = 'CREATE_CHANNELS';
const UPDATE_CHAT_LIST = 'UPDATE_CHAT_LIST';
const REMOVE_CHANNEL = 'REMOVE_CHANNEL';

async function onceReady(webContents: WebContents): Promise<void> {
  return new Promise((resolve) => {
    webContents.once('dom-ready', () => {
      resolve();
    });
  });
}

async function logout(): Promise<void> {
  return new Promise((resolve) => {
    ipcMain.once(LOGOUT, () => {
      resolve();
    });
  });
}

interface ChannelInfo {
  displayName: string;
  id: string;
  image: string;
}
function channelToChannelInfo(channel: ChatChannel): ChannelInfo {
  return {
    displayName: channel.getDisplayName(),
    id: channel.Id.toString(),
    image: channel.RoomFullImageURL,
  };
}

async function createChannelListWindow(): Promise<BrowserWindow> {
  const channelListWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  channelListWindow.loadURL(CHANNEL_LIST_WEBPACK_ENTRY);

  if (process.env.NODE_ENV !== 'production') {
    channelListWindow.webContents.openDevTools();
  }

  if (!state.credential || !state.talkClient) {
    return channelListWindow;
  }

  channelListWindow.webContents.on('dom-ready', () => {
    channelListWindow.webContents.send(
      CREATE_CHANNELS,
      state.channels.toArray().map(([, { chatChannel }]) => channelToChannelInfo(chatChannel)),
    );
    state.channels.forEach(({ chatChannel, chatList }) => {
      if (chatList.initialized) {
        channelListWindow.webContents.send(
          UPDATE_CHAT_LIST,
          channelToChannelInfo(chatChannel),
          chatList.serialize(),
        );
      }
    });
  });

  await onceReady(channelListWindow.webContents);

  state.ee.on(CREATE_CHANNEL, (id: Long) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { chatChannel } = state.channels.get(id.toString())!;
    channelListWindow.webContents.send(
      CREATE_CHANNEL,
      channelToChannelInfo(chatChannel),
    );
  });

  state.ee.on(UPDATE_CHAT_LIST, (id: Long) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { chatList, chatChannel } = state.channels.get(id.toString())!;
    channelListWindow.webContents.send(
      UPDATE_CHAT_LIST,
      channelToChannelInfo(chatChannel),
      chatList.serialize(),
    );
  });

  state.ee.on(REMOVE_CHANNEL, (id: Long) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { chatChannel } = state.channels.get(id.toString())!;
    channelListWindow.webContents.send(
      REMOVE_CHANNEL,
      channelToChannelInfo(chatChannel),
    );
  });

  // until logout
  await logout();

  return channelListWindow;
}

export default createChannelListWindow;
