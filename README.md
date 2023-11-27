# RingCentral Softphone 2

This is a complete rewrite of the official RingCentral Softphone project.

## Highlights

It focuses on servers only, it doesn't support browsers anymore. Because for browsers you could use the webphone SDK.

It drops the wrtc (node-webrtc) dependency. It uses [node-datachannel](https://github.com/murat-dogan/node-datachannel) instead.

It supports inbound call only. Because it is the most used scenario.


## Notes

- ref: https://github.com/paullouisageneau/libdatachannel/blob/master/examples/media-receiver/main.cpp
- tsx instead of ts-node: https://gist.github.com/khalidx/1c670478427cc0691bda00a80208c8cc
