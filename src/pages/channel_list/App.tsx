// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcRenderer, shell } from 'electron';
import { ChatType } from '@storycraft/node-kakao';

import { hot } from 'react-hot-loader';
import React, { useEffect } from 'react';
import { store, view } from '@risingstack/react-easy-state';

import {
  CREATE_CHANNEL,
  CREATE_CHANNELS,
  UPDATE_CHAT_LIST,
  REMOVE_CHANNEL,
  CONNECTION_LOST,
  LOGOUT,
  UPDATE_CHANNELS_ORDER,
  MY_INFO,
} from 'src/constants';
import { SerializedChat, SerializedChatUser } from 'src/state';
import ChannelInfo, { defaultChannelInfo } from 'src/models/channel-info';
import SortedMap from 'src/models/sortedMap';
import { validateURL } from 'src/utils/validation';

import defaultProfileImage from '../../assets/images/img_profile.png';

import './style.css';
import VerticalScroll from './VerticalScroll';

interface ChannelState {
  info: ChannelInfo;
  chatList: SerializedChat[] | null;
}

interface StoreData {
  channels: [string, ChannelState][] | null;
  me: SerializedChatUser<{email: string}> | null;
}
interface StoreActions {
  setMe: (me: SerializedChatUser<{email: string}>) => void;
  setChannels: (param: [string, ChannelState][]) => void;
}
type StoreModel = StoreData & StoreActions;
const channelStateMap = new SortedMap<string, ChannelState>(
  (a, b) => b.info.updatedAt - a.info.updatedAt,
);
const state = store<StoreModel>({
  channels: null,
  me: null,
  setMe(me: SerializedChatUser<{email: string}>) {
    state.me = me;
  },
  setChannels(param: [string, ChannelState][]) {
    state.channels = param;
  },
});
function updateChannels(): void {
  state.setChannels(channelStateMap.toArray().map(([key, val]) => [key, val ?? {
    info: defaultChannelInfo,
    chatList: null,
  }]));
}

interface RoomThumbnailImageProps {
  images: string[];
}
const RoomThumbnailImage: React.FC<RoomThumbnailImageProps> = ({ images }) => (
  <div className="flex flex-shrink-0 flex-wrap w-12 h-12 p-1">
    {images.length === 0 ? (
      <img className="w-10 h-10 box-border rounded-full" style={{ padding: 3 }} src={defaultProfileImage} aria-label="thumbnail image of the room" />
    ) : images.length === 1 ? (
      <img className="w-10 h-10 box-border rounded-full" style={{ padding: 3 }} src={images[0]} aria-label="thumbnail image of the room" />
    ) : images.map((image, i) => (
      <img key={i} className="w-5 h-5 box-border rounded-full" style={{ padding: 1 }} src={image} aria-label="thumbnail image of the room" />
    ))}
  </div>
);

// TODO: implement keyboard inputs to support a11y
/* eslint-disable jsx-a11y/click-events-have-key-events */
interface LinkIfPossibleProps{
  string: string;
  tabIndex?: number;
}
const LinkIfPossible: React.FC<LinkIfPossibleProps> = ({ string, tabIndex = 0 }) => (
  validateURL(string) ? (
    <span className="block outline-none cursor-pointer underline text-indigo-600" onClick={() => shell.openExternal(string)} role="link" tabIndex={tabIndex}>{string}</span>
  ) : (
    <>{string}</>
  )
);

interface ChatPreviewProps {
  chat: SerializedChat;
}
const ChatPreview: React.FC<ChatPreviewProps> = ({ chat }) => {
  if (chat === null) {
    return null;
  }
  switch (chat.type) {
    case ChatType.Text: {
      return <LinkIfPossible string={chat.text} />;
    }
    case ChatType.Reply: {
      return <LinkIfPossible string={chat.text} />;
    }
    default: {
      return <>not implemented</>;
    }
  }
};

interface ChannelButtonProps {
  info: ChannelInfo;
  lastChat: SerializedChat | null;
  tabIndex?: number;
}
const ChannelButton: React.FC<ChannelButtonProps> = React.memo(
  ({ info, lastChat: chat, tabIndex = 0 }) => (
    <div
      className="flex flex-shrink-0 px-2 py-1 cursor-pointer outline-none hover:bg-gray-500 hover:bg-opacity-25"
      style={{ width: '15rem' }}
      role="button"
      tabIndex={tabIndex}
      onClick={() => {
        console.log(info);
      }}
    >
      <RoomThumbnailImage images={info.images} />
      <div className="ml-2" style={{ width: 152 }}>
        <div className="text-sm font-bold text-gray-800 truncate leading-6 h-6">{info.displayName}</div>
        <div className="text-sm truncate leading-6 h-6">{chat ? <ChatPreview chat={chat} /> : null}</div>
      </div>
    </div>
  ),
);

interface ChatListProps {
  channels: [string, ChannelState][]|null;
}
const ChatList: React.FC<ChatListProps> = ({ channels }) => (
  <VerticalScroll>
    {channels === null ? 'null' : channels.map(([id, channelState], i) => (
      <ChannelButton
        key={id}
        tabIndex={i}
        info={channelState.info}
        lastChat={
        !channelState.chatList || channelState.chatList.length === 0
          ? null
          : channelState.chatList[channelState.chatList.length - 1]
      }
      />
    ))}
  </VerticalScroll>
);

const App: React.FC = () => {
  useEffect(() => {
    ipcRenderer.on(MY_INFO, (event, me: SerializedChatUser<{email: string}>) => {
      state.setMe(me);
    });
    ipcRenderer.on(CREATE_CHANNEL, (event, channelInfo: ChannelInfo) => {
      channelStateMap.set(channelInfo.id, {
        info: channelInfo,
        chatList: null,
      });
      updateChannels();
    });

    ipcRenderer.on(CREATE_CHANNELS, (event, channelInfoList: ChannelInfo[]) => {
      channelStateMap.setMultiple(channelInfoList.map((channelInfo) => [channelInfo.id, {
        info: channelInfo,
        chatList: null,
      }]));
      updateChannels();
    });

    ipcRenderer.on(UPDATE_CHANNELS_ORDER, (event, channelIdList: string[]) => {
      channelStateMap.keyList = channelIdList;
      updateChannels();
    });

    ipcRenderer.on(UPDATE_CHAT_LIST, (
      event, channelInfo: ChannelInfo, chatList: SerializedChat[],
    ) => {
      const channelState = channelStateMap.get(channelInfo.id);
      if (!channelState) {
        return;
      }
      channelStateMap.set(channelInfo.id, {
        info: channelState.info,
        chatList,
      });
      updateChannels();
    });

    ipcRenderer.on(REMOVE_CHANNEL, (event, channelInfo: ChannelInfo) => {
      channelStateMap.delete(channelInfo.id);
      updateChannels();
    });

    ipcRenderer.on(CONNECTION_LOST, () => {
      ipcRenderer.send(LOGOUT);
    });
  }, []);
  return (
    <div className="flex h-full">
      {/* left panel */}
      <div className="w-56 bg-gray-300 h-full">
        {/* profile */}
        <div className="p-8 pb-6">
          <div className="flex justify-center">
            <img src={state.me?.profileImage || defaultProfileImage} className="w-24 h-24 object-cover rounded-full" aria-label="profile image" />
          </div>
          <div className="mt-4 text-lg text-gray-800 h-6 leading-6 text-center">{state.me?.nickname ?? 'Loading...'}</div>
        </div>
        {/* chat list */}
        <ChatList channels={state.channels} />
        <div />
      </div>
      {/* chat region */}
      <div />
    </div>
  );
};

export default hot(module)(view(App));
