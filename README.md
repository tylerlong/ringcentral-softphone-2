# RingCentral Softphone 2

This is a complete rewrite of the official RingCentral Softphone project.

## Highlights

It focuses on servers only, it doesn't support browsers anymore. Because for browsers you could use the webphone SDK.

It drops the wrtc (node-webrtc) dependency. It uses [node-datachannel](https://github.com/murat-dogan/node-datachannel) instead.
