import { ipcRenderer } from 'electron'; // eslint-disable-line import/no-extraneous-dependencies
import {
  REQUEST_CREDENTIAL,
  CREDENTIALS_EXIST,
  WRONG_CREDENTIAL,
} from 'src/constants';
import Credential, { CredentialWithoutName } from 'src/models/credential';
import { validateEmail } from 'src/utils/validation';

import { hot } from 'react-hot-loader';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { store, view } from '@risingstack/react-easy-state';
import LabeledInput from 'src/components/LabeledInput';
import Divider from 'src/components/Divider';
import FullWidthButton from 'src/components/FullWidthButton';
import HorizontalScroll from './HorizontalScroll';
import CredentialButton from './CredentialButton';

import './style.css';

interface StoreData {
  waiting: boolean;
  isCredentialRequested: boolean;
  credentials: Credential[] | null;
}
interface StoreActions {
  markCredentialRequested: (requested: boolean) => void;
  setCredentials: (credentials: Credential[]) => void;
  deleteCredential: (credential: Credential) => void;
  wait: () => void;
  endWaiting: () => void;
}
type StoreModel = StoreData & StoreActions;
const state = store<StoreModel>({
  waiting: false,
  isCredentialRequested: true,
  credentials: null,
  markCredentialRequested(requested: boolean) {
    state.isCredentialRequested = requested;
  },
  setCredentials(credentials: Credential[]) {
    state.credentials = credentials;
  },
  deleteCredential(credential: Credential) {
    if (state.credentials === null) {
      return;
    }
    const index = state.credentials.findIndex((c) => (
      c.account === credential.account
        && c.name === credential.name
        && c.password === credential.password
    ));
    if (index < 0) {
      return;
    }
    state.credentials.splice(index, 1);
  },
  wait() {
    state.waiting = true;
  },
  endWaiting() {
    state.waiting = false;
  },
});

interface FormData {
  email: string;
  password: string;
}
const App: React.FC = () => {
  useEffect(() => {
    ipcRenderer.send(CREDENTIALS_EXIST);

    ipcRenderer.on(CREDENTIALS_EXIST, (event, credentials: Credential[]) => {
      state.setCredentials(credentials);
    });

    ipcRenderer.on(REQUEST_CREDENTIAL, (event) => {
      state.markCredentialRequested(true);
      state.endWaiting();
    });

    ipcRenderer.on(WRONG_CREDENTIAL, (event, credential) => {
      if ((state.credentials?.findIndex((c) => c.account === credential.account) ?? -1) >= 0) {
        state.deleteCredential(credential);
      } else {
        alert('wrong account info!');
      }
    });
  }, []);

  const {
    register, handleSubmit, watch, errors,
  } = useForm<FormData>();
  const isFormInvalid = !validateEmail(watch('email')) || !watch('password') || !!errors.email || !!errors.password;
  const onSubmit = handleSubmit(({ email, password }) => {
    if (!state.isCredentialRequested) {
      return;
    }
    const credential: CredentialWithoutName = {
      account: email, password,
    };
    ipcRenderer.send(REQUEST_CREDENTIAL, credential);

    state.markCredentialRequested(false);
  });

  return (
    <div className="py-8">
      {/* logo */}
      <div className="h-20 mb-4 px-8 text-5xl text-center">
        <span
          role="img"
          aria-label="Electron-Kakao: a cross-platform KakaoTalk client"
          title="Electron-Kakao: a cross-platform KakaoTalk client"
        >
          ⚛️🍫
          <sup>
            <span
              role="img"
              aria-label="Electron-Kakao: a cross-platform KakaoTalk client"
              title="Electron-Kakao: a cross-platform KakaoTalk client"
            >
              💬
            </span>
          </sup>
        </span>
      </div>
      {/* saved credentials */}
      <HorizontalScroll>
        {state.credentials === null
          ? 'loading...'
          : state.credentials.length === 0
            ? 'no creds'
            : state.credentials.map((credential, i) => (
              <CredentialButton
                key={credential.account}
                displayName={credential.name}
                email={credential.account}
                tabIndex={i}
                onClick={() => {
                  if (state.isCredentialRequested) {
                    ipcRenderer.send(REQUEST_CREDENTIAL, JSON.parse(JSON.stringify(credential)));
                    state.markCredentialRequested(false);
                    state.wait();
                  }
                }}
                last={i === (state.credentials?.length ?? 0) - 1}
              />
            ))}
      </HorizontalScroll>
      <div className="px-16 py-8">
        <Divider />
      </div>
      {/* email and pass */}
      <div className="w-full px-8">
        <form onSubmit={onSubmit}>
          <LabeledInput
            type="email"
            label="Email"
            placeholder="john.doe@kakao.com"
            ref={register({
              required: true,
              validate: validateEmail,
            })}
          />
          <LabeledInput
            type="password"
            label="Password"
            placeholder="●●●●●●●●"
            ref={register({
              required: true,
            })}
          />
          {state.isCredentialRequested ? (
            <FullWidthButton
              label="Sign in"
              disabled={isFormInvalid}
              textClassName={isFormInvalid ? 'text-gray-700' : 'text-white'}
            />
          ) : (
            <FullWidthButton
              label="Logging in..."
              disabled
              textClassName={isFormInvalid ? 'text-gray-700' : 'text-white'}
            />
          )}
        </form>
      </div>
    </div>
  );
};

export default hot(module)(view(App));
