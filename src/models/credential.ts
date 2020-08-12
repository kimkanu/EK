interface Credential {
  name: string;
  account: string;
  password: string;
}

export interface CredentialWithoutName {
  account: string;
  password: string;
}

export default Credential;
