import { validateEmail } from 'src/utils/validation';
import { ipcRenderer } from 'electron'; // eslint-disable-line import/no-extraneous-dependencies
import { Credential } from 'src/api/kakao';

import { SerializedChat } from 'src/state';
import { Long, ChatType } from '@storycraft/node-kakao';
import { stat } from 'fs/promises';
import SortedMap from 'src/models/sortedMap';

import {
  h, diff, patch,
} from 'virtual-dom';
import createElement from 'virtual-dom/create-element';

import './style.css';

const CREATE_CHANNEL = 'CREATE_CHANNEL';
const CREATE_CHANNELS = 'CREATE_CHANNELS';
const UPDATE_CHAT_LIST = 'UPDATE_CHAT_LIST';
const REMOVE_CHANNEL = 'REMOVE_CHANNEL';

interface ChannelInfo {
  displayName: string;
  id: string;
  image: string;
}
interface ChannelState {
  info: ChannelInfo;
  chatList: SerializedChat[] | null;
}
const channelState = new SortedMap<string, ChannelState>(
  (a, b) => {
    const serializer: (s: ChannelState) => number = (s) => (
      s.chatList === null || s.chatList.length === 0
        ? 0
        : s.chatList[s.chatList.length - 1].sendTime
    );
    return serializer(b) - serializer(a);
  },
);

ipcRenderer.on(CREATE_CHANNEL, (event, channelInfo: ChannelInfo) => {
  channelState.set(channelInfo.id, {
    info: channelInfo,
    chatList: null,
  });
});

ipcRenderer.on(CREATE_CHANNELS, (event, channelInfoList: ChannelInfo[]) => {
  channelState.setMultiple(channelInfoList.map((channelInfo) => [channelInfo.id, {
    info: channelInfo,
    chatList: null,
  }]));
});

ipcRenderer.on(UPDATE_CHAT_LIST, (event, channelInfo: ChannelInfo, chatList: SerializedChat[]) => {
  const state = channelState.get(channelInfo.id);
  if (!state) {
    return;
  }
  channelState.set(channelInfo.id, {
    ...state,
    chatList,
  });
});

ipcRenderer.on(REMOVE_CHANNEL, (event, channelInfo: ChannelInfo) => {
  channelState.delete(channelInfo.id);
});

function renderVdom() {
  return h('div',
    {},
    [
      channelState.toArray().map(([key, channel]) => h('div', {}, [
        h('strong', {}, channel.info.displayName),
        ...(channel.chatList === null ? ['null'] : channel.chatList.map((chat) => ChatType[chat.type])),
      ])),
    ]);
}

let tree = renderVdom();
let rootNode = createElement(tree);
document.body.appendChild(rootNode);

channelState.changeHandlers.set('render', () => {
  const newTree = renderVdom();
  const patches = diff(tree, newTree);
  rootNode = patch(rootNode, patches);
  tree = newTree;
});
