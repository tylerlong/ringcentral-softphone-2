import RingCentral from '@rc-ex/core';
import { v4 as uuid } from 'uuid';
import WebSocket from 'ws';
import { PeerConnection, DescriptionType } from 'node-datachannel';

import { SipMessage } from './sip-message';
import { branch, generateResponse } from './utils';

const callerId = uuid();
const fromTag = uuid();
const fakeDomain = uuid() + '.invalid';
const fakeEmail = uuid() + '@' + fakeDomain;
let cseq = Math.floor(Math.random() * 10000);

const rc = new RingCentral({
  server: process.env.RINGCENTRAL_SERVER_URL,
  clientId: process.env.RINGCENTRAL_CLIENT_ID,
  clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET,
});

const main = async () => {
  await rc.authorize({
    jwt: process.env.RINGCENTRAL_JWT_TOKEN!,
  });
  const sipProvision = await rc
    .restapi()
    .clientInfo()
    .sipProvision()
    .post({
      sipInfo: [{ transport: 'WSS' }],
    });
  const sipInfo = sipProvision.sipInfo![0];
  console.log(JSON.stringify(sipInfo, null, 2));
  await rc.revoke();

  const onMessage = async (message: string) => {
    const sipMessage = SipMessage.fromString(message);
    if (sipMessage.subject === 'SIP/2.0 401 Unauthorized') {
      const wwwAuth = (sipMessage.headers['Www-Authenticate'] || sipMessage.headers['WWW-Authenticate']) as string;
      if (wwwAuth && wwwAuth.includes(', nonce="')) {
        // authorization required
        const nonce = wwwAuth.match(/, nonce="(.+?)"/)![1];
        const registerMessage = new SipMessage(`REGISTER sip:${sipInfo.domain} SIP/2.0`, {
          'Call-ID': callerId,
          'User-Agent': 'ringcentral-softphone-2',
          Contact: `<sip:${fakeEmail};transport=ws>;expires=600`,
          Via: `SIP/2.0/WSS ${fakeDomain};branch=${branch()}`,
          From: `<sip:${sipInfo.username}@${sipInfo.domain}>;tag=${fromTag}`,
          To: `<sip:${sipInfo.username}@${sipInfo.domain}>`,
          CSeq: `${++cseq} REGISTER`,
          'Max-Forwards': 70,
          Authorization: `Digest algorithm=MD5, username="${sipInfo.authorizationId}", realm="${
            sipInfo.domain
          }", nonce="${nonce}", uri="sip:${sipInfo.domain}", response="${generateResponse(
            sipInfo.authorizationId!,
            sipInfo.password!,
            sipInfo.domain!,
            'REGISTER',
            `sip:${sipInfo.domain}`,
            nonce,
          )}"`,
        });
        send(registerMessage);
      }
    } else if (sipMessage.subject.startsWith('INVITE sip:')) {
      const sdp = sipMessage.body;
      const peer = new PeerConnection('callee', {
        iceServers: sipInfo.stunServers!.map((s) => `stun:${s}`),
      });
      await peer.setRemoteDescription(sdp, DescriptionType.Offer);

      // todo: answer the call
    }
  };

  const ws = new WebSocket('wss://' + sipInfo!.outboundProxy, 'sip', {
    rejectUnauthorized: false,
  });
  const send = (sipMessage: SipMessage) => {
    const message = sipMessage.toString();
    console.log('Sending...');
    console.log(message);
    ws.send(message);
  };
  ws.on('error', console.error);
  ws.on('message', (e: Buffer) => {
    const data = e.toString('utf-8');
    console.log('Receiving...');
    console.log(data);
    onMessage(data);
  });
  ws.on('open', () => {
    const registerMessage = new SipMessage(`REGISTER sip:${sipInfo.domain} SIP/2.0`, {
      'Call-ID': callerId,
      'User-Agent': 'ringcentral-softphone-2',
      Contact: `<sip:${fakeEmail};transport=ws>;expires=600`,
      Via: `SIP/2.0/WSS ${fakeDomain};branch=${branch()}`,
      From: `<sip:${sipInfo.username}@${sipInfo.domain}>;tag=${fromTag}`,
      To: `<sip:${sipInfo.username}@${sipInfo.domain}>`,
      CSeq: `${++cseq} REGISTER`,
      'Max-Forwards': 70,
    });
    send(registerMessage);
  });
};

main();
