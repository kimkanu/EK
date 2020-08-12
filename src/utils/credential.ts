import keytar from 'keytar';
import { SERVICE_NAME } from 'src/constants';
import Credential, { CredentialWithoutName } from 'src/models/credential';

export async function saveCredential(credential: Credential): Promise<void> {
  return keytar.setPassword(SERVICE_NAME, `${credential.name}@${credential.account}`, credential.password);
}
export function parseCredential(
  { account: keytarAccount, password }: CredentialWithoutName,
): Credential {
  const i = keytarAccount.indexOf('@');
  const [name, account] = [keytarAccount.slice(0, i), keytarAccount.slice(i + 1)];
  return {
    name, account, password,
  } as Credential;
}
export async function deleteCredential(credential: Credential): Promise<boolean> {
  return keytar.deletePassword(SERVICE_NAME, `${credential.name}@${credential.account}`);
}
