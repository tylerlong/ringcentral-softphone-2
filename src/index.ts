import type SipInfoResponse from '@rc-ex/core/lib/definitions/SipInfoResponse';
import net from 'net';
import { v4 as uuid } from 'uuid';

import { SipMessage } from './sip-message';
import { branch, generateResponse } from './utils';

const sipInfo: SipInfoResponse = {
  domain: process.env.SIP_INFO_DOMAIN,
  password: process.env.SIP_INFO_PASSWORD,
  outboundProxy: process.env.SIP_INFO_OUTBOUND_PROXY,
  authorizationId: process.env.SIP_INFO_AUTHORIZATION_ID,
  username: process.env.SIP_INFO_USERNAME,
};

const client = new net.Socket();
const tokens = sipInfo.outboundProxy!.split(':');
client.connect(parseInt(tokens[1], 10), tokens[0], () => {
  sendMessage(registerMessage);
});

const userAgent = 'RingCentral.Softphone.Node/2.0';
const fakeDomain = `${uuid()}.invalid`;
const fakeEmail = `${uuid()}@${fakeDomain}`;

const registerMessage = new SipMessage(`REGISTER sip:${sipInfo.domain} SIP/2.0`, {
  'Call-ID': uuid(),
  'User-Agent': userAgent,
  Contact: `<sip:${fakeEmail};transport=ws>;expires=600`,
  Via: `SIP/2.0/TCP ${fakeDomain};branch=${branch()}`,
  From: `<sip:${sipInfo.username}@${sipInfo.domain}>;tag=${uuid()}`,
  To: `<sip:${sipInfo.username}@${sipInfo.domain}>`,
  CSeq: '8082 REGISTER',
  'Max-Forwards': 70,
});

client.on('data', (data) => {
  const message = data.toString('utf-8');
  console.log('Receiving...\n' + message);
  const sipMesage = SipMessage.fromString(message);
  if (sipMesage.subject.startsWith('SIP/2.0 401 Unauthorized')) {
    const wwwAuth = (sipMesage.headers['Www-Authenticate'] || sipMesage.headers['WWW-Authenticate']) as string;
    const nonce = wwwAuth.match(/, nonce="(.+?)"/)![1];
    registerMessage.headers.Authorization = `Digest algorithm=MD5, username="${sipInfo.authorizationId}", realm="${
      sipInfo.domain
    }", nonce="${nonce}", uri="sip:${sipInfo.domain}", response="${generateResponse(
      sipInfo.authorizationId!,
      sipInfo.password!,
      sipInfo.domain!,
      'REGISTER',
      `sip:${sipInfo.domain}`,
      nonce,
    )}"`;
    registerMessage.headers.CSeq = '8083 REGISTER';
    registerMessage.headers.Via = `SIP/2.0/TCP ${fakeDomain};branch=${branch()}`;
    sendMessage(registerMessage);
  }
});

const sendMessage = (sipMesage: SipMessage) => {
  const message = sipMesage.toString();
  console.log('Sending...\n' + message);
  client.write(message);
};
