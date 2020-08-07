import { validateEmail } from 'src/utils/validation';
import { ipcRenderer } from 'electron'; // eslint-disable-line import/no-extraneous-dependencies
import { Credential } from 'src/api/kakao';

import './style.css';

const CREDENTIALS_EXIST = 'CREDENTIALS_EXIST';
const REQUEST_CREDENTIAL = 'REQUEST_CREDENTIAL';
const WRONG_CREDENTIAL = 'WRONG_CREDENTIAL';

const $inputEmail = document.getElementById('input__email') as HTMLInputElement;
const $inputPassword = document.getElementById('input__password') as HTMLInputElement;
const $inputSubmit = document.getElementById('input__submit') as HTMLInputElement;

let isCredentialRequested = true;
let credentials: Credential[] = [];

$inputSubmit.addEventListener('click', () => {
  if (!isCredentialRequested) {
    console.log('credential not requested');
    return;
  }

  const email = $inputEmail.value;
  const password = $inputPassword.value;
  const isEmailValid = validateEmail(email);
  const isPasswordValid = !!password;

  if (!isEmailValid || !isPasswordValid) {
    console.log('credential not valid');
    return;
  }

  const credential: Credential = {
    account: email, password,
  };
  ipcRenderer.send(REQUEST_CREDENTIAL, credential);

  isCredentialRequested = false;
});

function createCredentialButton(credential: Credential, div: HTMLDivElement): void {
  const button = document.createElement('button');
  button.innerText = credential.account;
  button.addEventListener('click', () => {
    ipcRenderer.send(REQUEST_CREDENTIAL, credential);
  });
  div.appendChild(button);
}

function showSavedCredentials(exist: boolean): void {
  const div = document.getElementById('div__credentials') as HTMLDivElement;
  if (exist) {
    credentials.forEach((credential) => {
      createCredentialButton(credential, div);
    });
  } else {
    div.innerText = "no saved cred's";
  }
}

ipcRenderer.on(CREDENTIALS_EXIST, (event, exist: boolean, data) => {
  credentials = data;
  showSavedCredentials(exist);
});

ipcRenderer.on(REQUEST_CREDENTIAL, (event) => {
  console.log('requested');
  isCredentialRequested = true;
});

ipcRenderer.on(WRONG_CREDENTIAL, (event) => {
  console.log('WRONG_CREDENTIAL');
});

console.log('👋 This message is being logged by "renderer.js", included via webpack');
