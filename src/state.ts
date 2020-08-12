/* eslint-disable max-classes-per-file */

import {
  TalkClient,
  ChatChannel,
  Chat,
  Long,
  ChatUser,
  ChatType,
  ChatFeed,
  FeedType,
  SinglePhotoChat,
  VideoChat,
  SharpContentType,
  StaticEmoticonChat,
  SharpSearchChat,
  ReplyChat,
  PhotoAttachment,
  MultiPhotoChat,
} from '@storycraft/node-kakao';
import { EventEmitter } from 'events';
import Credential from 'src/models/credential';
import SortedMap from 'src/models/sortedMap';
import {
  CREATE_CHANNEL, UPDATE_CHAT_LIST, REMOVE_CHANNEL,
} from './constants';

export type SerializedChatUser<T = {}> = {
  id: string; // serialized long
  nickname: string;
  profileImage: string;
} & T;
function serializeUser(user: ChatUser, chatChannel: ChatChannel): SerializedChatUser | null {
  const userInfo = chatChannel.getUserInfo(user);
  if (!userInfo) {
    return null;
  }
  return {
    id: userInfo.Id.toString(),
    nickname: userInfo.Nickname,
    profileImage: userInfo.FullProfileImageURL,
  };
}

export type SerializedChat = SerializedChatCommonData & SerializedChatSpecializedData;
export interface SerializedChatCommonData {
  channelId: string; // serialized long
  sender: SerializedChatUser | null;
  logId: string; // serialized long
  prevLogId: string; // serialized long
  messageId: number;
  sendTime: number;
  updatedAt: number;
}

// TODO: implement all the others
export type SerializedChatSpecializedData =
  | SerializedUnknownChatData // -1
  | SerializedFeedChatData // 0
  | SerializedTextChatData // 1
  | SerializedPhotoChatData // 2
  | SerializedVideoChatData // 3
  // | SerializedContactChatData // 4
  // | SerializedAudioChatData // 5
  // | SerializedDitemEmoticonChatData // 6
  // | SerializedDitemGiftChatData // 7
  // | SerializedDitemImgChatData // 8
  // | SerializedKakaoLinkV1ChatData // 9
  // | SerializedAvatarChatData // 11
  | SerializedStickerChatData // 12
  // | SerializedScheduleChatData // 13
  // | SerializedVoteChatData // 14
  // | SerializedLotteryChatData // 15
  // | SerializedMapChatData // 16
  // | SerializedProfileChatData // 17
  // | SerializedFileChatData // 18
  | SerializedStickerAniChatData // 20
  // | SerializedNudgeChatData // 21
  // | SerializedActionconChatData // 22
  | SerializedSearchChatData // 23
  // | SerializedPostChatData // 24
  | SerializedStickerGifChatData // 25
  | SerializedReplyChatData // 26
  | SerializedMultiPhotoChatData; // 27
// | SerializedVoipChatData // 51
// | SerializedLiveTalkChatData // 52
// | SerializedCustomChatData // 71
// | SerializedAlimChatData // 72
// | SerializedPlusFriendChatData // 81
// | SerializedPlusEventChatData // 82
// | SerializedPlusFriendViralChatData // 83
// | SerializedOpenVoteChatData // 97
// | SerializedOpenPostChatData; // 98
export interface SerializedUnknownChatData {
  type: typeof ChatType.Unknown;
}
export interface SerializedTextChatData {
  type: typeof ChatType.Text;
  text: string;
}
export interface SerializedFeedChatData {
  type: typeof ChatType.Feed;
  feed: ChatFeed<FeedType>;
}
export interface SerializedPhotoChatData {
  type: typeof ChatType.Photo;
  photo: SerializedPhotoAttachment | null;
}
interface SerializedPhotoAttachment {
  keyPath: string;
  width: number;
  height: number;
  imageURL: string;
  size: string; // serialized long
  mediaType: string;
  thumbnailURL: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
}
export interface SerializedVideoChatData {
  type: typeof ChatType.Video;
  video: SerializedVideoAttachment | null;
}
interface SerializedVideoAttachment {
  keyPath: string;
  width: number;
  height: number;
  duration: number;
  videoURL: string;
  size: string; // serialized long
}
export interface SerializedStickerChatData {
  type: typeof ChatType.Sticker;
  emoticon: SerializedEmoticonAttachment | null;
}
interface SerializedEmoticonAttachment {
  name: string;
  path: string;
  type: string;
  stopAt: number;
  sound: string;
  width: number;
  height: number;
  description: string;
  emoticonURL: string;
}
// export interface SerializedFileChatData {
//   type: typeof ChatType.File;
// }
export interface SerializedStickerAniChatData {
  type: typeof ChatType.StickerAni;
  emoticon: SerializedEmoticonAttachment | null;
}
export interface SerializedSearchChatData {
  type: typeof ChatType.Search;
  sharp: SerializedSharpAttachment | null;
}
interface SerializedSharpAttachment {
  question: string;
  redirectURL: string;
  contentType: SharpContentType;
  contentList: unknown[];
  mainImage?: SerializedSharpImageFragment;
  footer?: SerializedSharpButtonListContent;
}
interface SerializedSharpImageFragment {
  imageURL: string;
  imageWidth: number;
  imageHeight: number;
}
interface SerializedSharpButtonListContent {
  buttonList: SerializedSharpButtonFragment[];
}
interface SerializedSharpButtonFragment {
  text: string;
  redirectLink: string;
  icon: string;
}
// export interface SerializedPostChatData {
//   type: typeof ChatType.Post;
// }
export interface SerializedStickerGifChatData {
  type: typeof ChatType.StickerGif;
  emoticon: SerializedEmoticonAttachment | null;
}
export interface SerializedReplyChatData {
  type: typeof ChatType.Reply;
  text: string;
  reply: SerializedReplyAttachment | null;
}
interface SerializedReplyAttachment {
  sourceType: ChatType;
  sourceLogId: string; // serialized long
  sourceUserId: string; // serialized long
  attachOnly: boolean;
  sourceMessage: string;
  sourceMentionList: SerializedMentionContentList[];
  sourceLinkId: string; // serialized long
}
interface SerializedMentionContentList {
  userId: string; // serialized long
  length: number;
  indexList: number[];
}
export interface SerializedMultiPhotoChatData {
  type: typeof ChatType.MultiPhoto;
  photoList: SerializedPhotoAttachment[];
}

function serializePhotoAttachment(data: PhotoAttachment): SerializedPhotoAttachment {
  return {
    keyPath: data.KeyPath,
    width: data.Width,
    height: data.Height,
    imageURL: data.ImageURL,
    size: data.Size.toString(),
    mediaType: data.MediaType,
    thumbnailURL: data.ThumbnailURL,
    thumbnailWidth: data.ThumbnailWidth,
    thumbnailHeight: data.ThumbnailHeight,
  };
}
function serializeChat(chat: Chat): SerializedChat {
  const commonData: SerializedChatCommonData = {
    channelId: chat.Channel.Id.toString(),
    sender: serializeUser(chat.Sender, chat.Channel),
    logId: chat.LogId.toString(),
    prevLogId: chat.PrevLogId.toString(),
    messageId: chat.MessageId,
    sendTime: chat.SendTime,
    updatedAt: Math.max(
      chat.SendTime,
      ...chat.Channel.ChannelMetaList.map((meta) => meta.updatedAt),
    ),
  };
  switch (chat.Type) {
    case ChatType.Text: {
      return {
        ...commonData,
        type: ChatType.Text,
        text: chat.Text,
      };
    }

    case ChatType.Feed: {
      try {
        return {
          ...commonData,
          type: ChatType.Feed,
          feed: chat.getFeed(),
        };
      } catch (e) {
        // invalid feed
        return {
          ...commonData,
          type: ChatType.Unknown,
        };
      }
    }

    case ChatType.Photo: {
      const data = (chat as SinglePhotoChat).Photo;
      const photo: SerializedPhotoAttachment | null = data === null
        ? null
        : serializePhotoAttachment(data);
      return {
        ...commonData,
        type: ChatType.Photo,
        photo,
      };
    }

    case ChatType.Video: {
      const data = (chat as VideoChat).Video;
      const video: SerializedVideoAttachment | null = data === null ? null : {
        keyPath: data.KeyPath,
        width: data.Width,
        height: data.Height,
        duration: data.Duration,
        videoURL: data.VideoURL,
        size: data.Size.toString(),
      };
      return {
        ...commonData,
        type: ChatType.Video,
        video,
      };
    }

    case ChatType.Sticker:
    case ChatType.StickerAni:
    case ChatType.StickerGif: {
      const data = (chat as StaticEmoticonChat).Emoticon;
      const emoticon: SerializedEmoticonAttachment | null = data === null ? null : {
        name: data.Name,
        path: data.Path,
        type: data.Type,
        stopAt: data.StopAt,
        sound: data.Sound,
        width: data.Width,
        height: data.Height,
        description: data.Description,
        emoticonURL: data.getEmoticonURL(),
      };

      return {
        ...commonData,
        type: chat.Type,
        emoticon,
      };
    }

    case ChatType.Search: {
      const data = (chat as SharpSearchChat).Sharp;
      const sharp: SerializedSharpAttachment | null = data === null ? null : {
        question: data.Question,
        redirectURL: data.RedirectURL,
        contentType: data.ContentType,
        contentList: data.ContentList.map((x) => x.toString()), // TODO
        mainImage: data.MainImage ? {
          imageURL: data.MainImage.ImageURL,
          imageWidth: data.MainImage.ImageWidth,
          imageHeight: data.MainImage.ImageHeight,
        } : undefined,
        footer: data.Footer ? {
          buttonList: (data.Footer.ButtonList ?? []).map((button) => ({
            text: button.Text,
            redirectLink: button.RedirectLink,
            icon: button.Icon,
          })),
        } : undefined,
      };
      return {
        ...commonData,
        type: ChatType.Search,
        sharp,
      };
    }

    case ChatType.Reply: {
      const data = (chat as ReplyChat).Reply;
      const reply: SerializedReplyAttachment | null = data === null ? null : {
        sourceType: data.SourceType,
        sourceLogId: data.SourceLogId.toString(),
        sourceUserId: data.SourceUserId.toString(),
        attachOnly: data.AttachOnly,
        sourceMessage: data.SourceMessage,
        sourceMentionList: data.SourceMentionList.map((mention) => ({
          userId: mention.UserId.toString(),
          length: mention.Length,
          indexList: mention.IndexList,
        })),
        sourceLinkId: data.SourceLinkId.toString(),
      };
      return {
        ...commonData,
        type: ChatType.Reply,
        text: chat.Text,
        reply,
      };
    }

    case ChatType.MultiPhoto: {
      return {
        ...commonData,
        type: ChatType.MultiPhoto,
        photoList: (chat as MultiPhotoChat).AttachmentList.map(serializePhotoAttachment),
      };
    }

    default: {
      return {
        ...commonData,
        type: ChatType.Unknown,
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

function getUpdatedAt(channel: ChatChannel): number {
  return Math.max(
    channel.LastChat?.SendTime ?? 0,
    ...channel.ChannelMetaList.map((meta) => meta.updatedAt),
  );
}

export class State {
  ee: EventEmitter = new EventEmitter();

  credential: Credential | null = null;

  talkClient: TalkClient | null = null;

  channels: SortedMap<string, ChannelState> = new SortedMap(
    (a, b) => getUpdatedAt(b.chatChannel) - getUpdatedAt(a.chatChannel),
  );

  initialize(): void {
    this.ee = new EventEmitter();
    this.credential = null;
    this.talkClient = null;
    this.channels = new SortedMap(
      (a, b) => getUpdatedAt(b.chatChannel) - getUpdatedAt(a.chatChannel),
    );
  }
}
const state = new State();

export default state;
