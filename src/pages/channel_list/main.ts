import {
  BrowserWindow, ipcMain, WebContents,
} from 'electron'; // eslint-disable-line import/no-extraneous-dependencies
import state, { SerializedChatUser } from 'src/state';
import { Long, ChatChannel } from '@storycraft/node-kakao';
import {
  LOGOUT,
  CREATE_CHANNELS,
  UPDATE_CHAT_LIST,
  CREATE_CHANNEL,
  REMOVE_CHANNEL,
  UPDATE_CHANNELS_ORDER,
  MY_INFO,
} from 'src/constants';
import ChannelInfo from 'src/models/channel-info';

import defaultProfileImage from '../../assets/images/img_profile.png';

declare const CHANNEL_LIST_WEBPACK_ENTRY: string;

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

function getUpdatedAt(channel: ChatChannel): number {
  return Math.max(
    channel.LastChat?.SendTime ?? 0,
    ...channel.ChannelMetaList.map((meta) => meta.updatedAt),
  );
}
function channelToChannelInfo(channel: ChatChannel): ChannelInfo {
  return {
    displayName: channel.getDisplayName(),
    id: channel.Id.toString(),
    images: channel.RoomFullImageURL
      ? [channel.RoomFullImageURL]
      : channel
        .getUserInfoList()
        .slice(0, 5)
        .filter((user) => state.talkClient?.ClientUser.Id?.notEquals(user.Id))
        .slice(0, 4)
        .map((user) => user.FullProfileImageURL || defaultProfileImage),
    updatedAt: getUpdatedAt(channel),
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

  try {
    channelListWindow.loadURL(CHANNEL_LIST_WEBPACK_ENTRY);

    if (process.env.NODE_ENV !== 'production') {
      channelListWindow.webContents.openDevTools();
    }

    if (!state.credential || !state.talkClient) {
      return channelListWindow;
    }

    channelListWindow.webContents.on('dom-ready', () => {
      channelListWindow.webContents.send(
        MY_INFO,
        {
          id: state.talkClient?.ClientUser.MainUserInfo.Id.toString() ?? '',
          nickname: state.talkClient?.ClientUser.MainUserInfo.Nickname ?? '',
          profileImage: state.talkClient?.ClientUser.MainUserInfo.FullProfileImageURL,
          email: state.credential?.account,
        } as SerializedChatUser<{email: string}>,
      );
      channelListWindow.webContents.send(
        CREATE_CHANNELS,
        state.channels.toArray().map(([, channelState]) => {
          if (channelState) return channelToChannelInfo(channelState.chatChannel);
          return {
            displayName: '',
            id: '',
            image: '',
            updatedAt: 0,
          };
        }),
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

    state.ee.on(UPDATE_CHANNELS_ORDER, (channelIdList: string[]) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      channelListWindow.webContents.send(
        UPDATE_CHANNELS_ORDER,
        channelIdList,
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

    // todo: not working
    // const CONNECTION_TIMEOUT = 1000;
    // const connectionCheckInterval = setInterval(() => {
    //   // todo: not working
    //   console.log(state.talkClient?.NetworkManager.disconnected());
    //   if (state.talkClient?.NetworkManager.disconnected()) {
    //     channelListWindow.webContents.send(CONNECTION_LOST);
    //     clearInterval(connectionCheckInterval);
    //   }
    // }, CONNECTION_TIMEOUT);

    // until logout
    await logout();

    return channelListWindow;
  } catch (e) {
    console.log(e);
    return channelListWindow;
  }
}

export default createChannelListWindow;
