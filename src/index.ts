import RingCentral from '@rc-ex/core';
import { v4 as uuid } from 'uuid';
import { SipMessage } from './sip-message';
import { branch } from './utils';

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
  console.log(JSON.stringify(sipProvision, null, 2));
  const sipInfo = sipProvision.sipInfo![0];
  await rc.revoke();

  const sipMessage = new SipMessage(`REGISTER sip:${sipInfo.domain} SIP/2.0`, {
    'Call-ID': callerId,
    'User-Agent': 'ringcentral-softphone-2',
    Contact: `<sip:${fakeEmail};transport=ws>;expires=600`,
    Via: `SIP/2.0/WSS ${fakeDomain};branch=${branch()}`,
    From: `<sip:${sipInfo.username}@${sipInfo.domain}>;tag=${fromTag}`,
    To: `<sip:${sipInfo.username}@${sipInfo.domain}>`,
    CSeq: `${++cseq} REGISTER`,
    'Max-Forwards': 70,
  });
  console.log(sipMessage.toString());
};

main();
