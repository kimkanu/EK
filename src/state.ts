/* eslint-disable max-classes-per-file */

import {
  TalkClient, ChatChannel, Chat, Long, ChatUser, ChatType,
} from '@storycraft/node-kakao';
import { Credential } from 'src/api/kakao';
import { EventEmitter } from 'events';
import SortedMap from './models/sortedMap';

const CREATE_CHANNEL = 'CREATE_CHANNEL';
const UPDATE_CHAT_LIST = 'UPDATE_CHAT_LIST';
const REMOVE_CHANNEL = 'REMOVE_CHANNEL';

export type SerializedChatUser = {
  id: Long;
  nickname: string;
  profileImage: string;
}
function serializeUser(user: ChatUser, chatChannel: ChatChannel): SerializedChatUser | null {
  const userInfo = chatChannel.getUserInfo(user);
  if (!userInfo) {
    return null;
  }
  return {
    id: userInfo.Id,
    nickname: userInfo.Nickname,
    profileImage: userInfo.FullProfileImageURL,
  };
}

export type SerializedChat = SerializedUnknownChat | SerializedTextChat;
export type SerializedUnknownChat = {
  type: typeof ChatType.Unknown;
  sendTime: number;
  sender: SerializedChatUser | null;
};
export type SerializedTextChat = {
  type: typeof ChatType.Text;
  sendTime: number;
  sender: SerializedChatUser | null;
  text: string;
};

function serializeChat(chat: Chat): SerializedChat {
  switch (chat.Type) {
    case ChatType.Text: {
      return {
        type: ChatType.Text,
        sendTime: chat.SendTime,
        sender: serializeUser(chat.Sender, chat.Channel),
        text: chat.Text,
      };
    }

    default: {
      return {
        type: ChatType.Unknown,
        sendTime: chat.SendTime,
        sender: serializeUser(chat.Sender, chat.Channel),
      };
    }
  }
}

export class ChatList {
  ee: EventEmitter;

  initialized = false;

  id: Long;

  confirmed: Chat[] = [];

  appended: Chat[] = [];

  constructor(id: Long, ee: EventEmitter) {
    this.id = id;
    this.ee = ee;

    this.ee.emit(CREATE_CHANNEL, this.id);
  }

  initialize(...confirmed: Chat[]): boolean {
    if (this.initialized) {
      return false;
    }
    this.initialized = true;
    this.confirmed = confirmed;

    this.ee.emit(UPDATE_CHAT_LIST, this.id);
    return true;
  }

  append(...chats: Chat[]): void {
    this.appended.push(...chats);
    this.ee.emit(UPDATE_CHAT_LIST, this.id);
  }

  appendConfirmed(...chats: Chat[]): void {
    this.confirmed.push(...chats);
    this.appended = [];
    this.ee.emit(UPDATE_CHAT_LIST, this.id);
  }

  remove(): void {
    this.ee.emit(REMOVE_CHANNEL, this.id);
  }

  lastChat(): Chat | null {
    if (this.appended.length > 0) {
      return this.appended[this.append.length - 1];
    }
    return this.confirmed.length > 0 ? this.confirmed[this.confirmed.length - 1] : null;
  }

  isEmpty(): boolean {
    return this.confirmed.length === 0 && this.appended.length === 0;
  }

  isNonEmpty(): boolean {
    return !this.isEmpty();
  }

  getList(): Chat[] {
    return [
      ...this.confirmed,
      ...this.appended,
    ];
  }

  serialize(): SerializedChat[] {
    return this.getList().map(serializeChat);
  }

  get length(): number {
    return this.confirmed.length + this.appended.length;
  }
}

interface ChannelState {
  chatChannel: ChatChannel;
  chatList: ChatList;
  lastConfirmedLogId: Long;
}

export class State {
  ee: EventEmitter = new EventEmitter();

  credential: Credential | null = null;

  talkClient: TalkClient | null = null;

  channels: SortedMap<string, ChannelState> = new SortedMap(
    (a, b) => (b.chatChannel.LastChat?.SendTime ?? 0) - (a.chatChannel.LastChat?.SendTime ?? 0),
  );

  initialize(): void {
    this.ee = new EventEmitter();
    this.credential = null;
    this.talkClient = null;
    this.channels = new SortedMap(
      (a, b) => (b.chatChannel.LastChat?.SendTime ?? 0) - (a.chatChannel.LastChat?.SendTime ?? 0),
    );
  }
}
const state = new State();

export default state;
