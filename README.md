# HaveWords.ai
P2P AI sharing using WebRTC

**In progress, hasn't been tested for security or privacy, use at your own risk. Your API key is stored in localstorage.**

## Overview

AI is fun to use, but it's often done solo. HaveWords.ai lets you connect with your friends and use AI together.

## Details

Statically hosted here, runs from your browser entirely, with only three external calls:

1) To the peerJS signaling server, only to make initial connections to other HaveWords.ai users. Once connected, the server is no longer used, and all messages are sent peer to peer using WebRTC.

2) HaveWords.ai uses two external scripts. One is peerJS, which handles the WebRTC connections. The second is DOMPurify, which ensures that no malicious HTML is displayed. Both are loaded from a CDN link you can inspect in the HTML.

3) The API calls to the AI API. Currently only supporting the OpenAI API.
