import { v4 as uuid } from 'uuid';
import crypto from 'crypto';

export const branch = () => 'z9hG4bK' + uuid();

const md5 = (str: string) => crypto.createHash('md5').update(str).digest('hex');
export const generateResponse = (
  username: string,
  password: string,
  realm: string,
  method: string,
  uri: string,
  nonce: string,
  // eslint-disable-next-line max-params
) => {
  const ha1 = md5(username + ':' + realm + ':' + password);
  const ha2 = md5(method + ':' + uri);
  const response = md5(ha1 + ':' + nonce + ':' + ha2);
  return response;
};
