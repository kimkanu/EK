import { ipcRenderer } from 'electron'; // eslint-disable-line import/no-extraneous-dependencies

import './style.css';
import { REQUEST_PASSCODE, WRONG_PASSCODE } from 'src/constants';

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
