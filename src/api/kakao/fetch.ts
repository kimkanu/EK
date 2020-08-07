import {
  Chat, ChatChannel, StatusCode, Long,
} from '@storycraft/node-kakao';
import { Result, err, ok } from 'src/models/result';
import { State } from 'src/state';

interface FetchChatsData {
  chatList: Chat[];
}
type FetchChatsError = {};

export async function fetchChats(chatChannel: ChatChannel, sinceLogId: Long = Long.ZERO):
  Promise<Result<FetchChatsData, FetchChatsError>> {
  const chatList: Chat[] = [];

  /* eslint-disable no-await-in-loop */
  if (!chatChannel.LastChat) {
    return ok({ chatList: [] });
  }

  let lastLogId = sinceLogId;
  for (;;) {
    const response = await chatChannel.Client.ChatManager.getChatListFrom(
      chatChannel.Id,
      lastLogId,
    );

    if (response.status !== StatusCode.SUCCESS) {
      return err({});
    }
    const result: Chat[] = response.result ?? [];
    chatList.push(...result);

    if (result.length > 0) {
      lastLogId = result[result.length - 1].LogId;
    }
    if (
      result.length === 0
      || result[result.length - 1].MessageId === chatChannel.LastChat.MessageId
    ) {
      break;
    }
  }

  return ok({ chatList });
}

export async function fetchChatsAndSetState(
  state: State, channel: ChatChannel, sinceLogId?: Long,
): Promise<void> {
  fetchChats(channel, sinceLogId).then(
    (result) => {
      if (result.type === 'ok') {
        const channelState = state.channels.get(channel.Id.toString());
        if (!channelState) {
          return;
        }
        const prevLength = channelState.chatList.length;
        if (typeof sinceLogId === 'undefined') {
          channelState.chatList.initialize(...result.inner.chatList);
        } else if (result.inner.chatList.length > 0) {
          channelState.chatList.appendConfirmed(...result.inner.chatList);
        }
        if (channelState.chatList.length !== prevLength) {
          state.channels.set(channel.Id.toString(), {
            ...channelState,
            chatList: channelState.chatList,
            lastConfirmedLogId: channelState.chatList.lastChat()?.LogId ?? Long.ZERO,
          });
        }
      }
    },
  );
}
