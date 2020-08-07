import os from 'os';
import { machineIdSync } from 'node-machine-id';

import {
  TalkClient, AuthClient, WebApiStatusCode, AuthStatusCode, AuthApiStruct,
} from '@storycraft/node-kakao';
import { Result, ok, err } from 'src/models/result';

export interface Credential {
  account: string;
  password: string;
}
export interface DeviceInfo {
  name: string;
  uuid: string;
}
export function getDeviceInfo(): DeviceInfo {
  return {
    name: os.hostname() ?? 'electron-kakao',
    uuid: Buffer.from(machineIdSync()).toString('base64'),
  };
}

export type KakaoAuthData = {}
export interface KakaoAuthError {
  status: WebApiStatusCode | AuthStatusCode;
  message?: string;
}

export async function tryToLogIn(talkClient: TalkClient, credential: Credential):
  Promise<Result<KakaoAuthData, KakaoAuthError>> {
  try {
    await talkClient.login(credential.account, credential.password);
    return ok({});
  } catch (e_) {
    if (typeof e_.status === 'undefined') {
      return ok({});
    }

    const e = e_ as AuthApiStruct;

    switch (e.status) {
      case AuthStatusCode.LOGIN_FAILED_REASON: {
        return err({
          status: e.status,
          message: (e as unknown as { message: string }).message, // mistyped library
        });
      }
      default: {
        return err({
          status: e.status,
        });
      }
    }
  }
}

type TryToRegisterDeviceCallback = (passcode: string) => Promise<
  Result<KakaoAuthData, KakaoAuthError>
>;
export async function tryToRegisterDevice(talkClient: TalkClient, credential: Credential): Promise<
  Result<TryToRegisterDeviceCallback, KakaoAuthError>
> {
  async function tryToRegisterWithPasscode(passcode: string): Promise<
    Result<KakaoAuthData, KakaoAuthError>
  > {
    const response = await talkClient.Auth.registerDevice(
      passcode,
      credential.account,
      credential.password,
      true, // permanent
    );
    switch (response.status) {
      case WebApiStatusCode.SUCCESS:
      case AuthStatusCode.DEVICE_ALREADY_REGISTERED: {
        return tryToLogIn(talkClient, credential);
      }
      case AuthStatusCode.LOGIN_FAILED_REASON:
      case AuthStatusCode.DEVICE_REGISTER_FAILED: {
        return err({
          status: response.status,
          message: (response as unknown as { message: string }).message,
        });
      }
      default: {
        return err({
          status: response.status,
        });
      }
    }
  }

  const response = await talkClient.Auth.requestPasscode(credential.account, credential.password);

  switch (response.status) {
    case WebApiStatusCode.SUCCESS: {
      return ok(tryToRegisterWithPasscode);
    }
    case AuthStatusCode.LOGIN_FAILED_REASON: {
      return err({
        status: response.status,
        message: (response as unknown as { message: string }).message,
      });
    }
    default: {
      return err({
        status: response.status,
      });
    }
  }
}
