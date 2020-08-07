import { validateEmail } from 'src/utils/validation';
import { ipcRenderer } from 'electron'; // eslint-disable-line import/no-extraneous-dependencies
import { Credential } from 'src/api/kakao';

import './style.css';

const REQUEST_PASSCODE = 'REQUEST_PASSCODE';
const WRONG_PASSCODE = 'WRONG_PASSCODE';

const $inputPasscode = document.getElementById('input__passcode') as HTMLInputElement;
const $inputSubmit = document.getElementById('input__submit') as HTMLInputElement;

let isPasscodeRequested = true;

$inputSubmit.addEventListener('click', () => {
  if (!isPasscodeRequested) {
    console.log('passcode not requested');
    return;
  }

  const passcodeAsNumber = $inputPasscode.valueAsNumber;

  if (Number.isNaN(passcodeAsNumber)) {
    console.log('passcode not valid');
    return;
  }

  const passcode = `${passcodeAsNumber}`.padStart(4, '0');
  ipcRenderer.send(REQUEST_PASSCODE, passcode);

  isPasscodeRequested = false;
});

ipcRenderer.on(REQUEST_PASSCODE, (event) => {
  console.log('requested');
  isPasscodeRequested = true;
});

ipcRenderer.on(WRONG_PASSCODE, (event) => {
  console.log('WRONG_PASSCODE');
});
