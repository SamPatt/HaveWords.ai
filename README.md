# HaveWords.ai
P2P AI sharing using WebRTC

**In progress, hasn't been tested for security or privacy, use at your own risk. Your API key is stored in localstorage.**

## Overview

AI is fun to use, but it's often done solo. HaveWords.ai lets you connect with your friends and use AI together.

## UX

Visiting HaveWords.ai will allow you to act as a host. You input your OpenAI API key, giving you access to ChatGPT and / or GPT-4, and then receive an invite link to send to your friends.

Anyone joining with an invite link is a guest. The host can gives the guests access to the AI, allowing them to send prompts and see the AI responses.

There are several different session types, which allow for fun group experiences, such as fantasy roleplaying, trivia, and exploring fictional worlds.

## Details

The files are statically hosted here, and the site runs from your browser. External calls are as follows:

1) To the peerJS signaling server, to make initial connections and voice calls to other HaveWords.ai users. Once connected, all messages are sent peer to peer using WebRTC.

2) HaveWords.ai uses two external scripts. One is peerJS, which handles the WebRTC connections. The second is DOMPurify, which ensures that no malicious HTML is displayed. Both are loaded from a CDN link you can inspect in the HTML.

3) The API calls to the AI API. Currently only supporting the OpenAI API.

4) If you play a roleplaying session, music will be streamed from YouTube.

