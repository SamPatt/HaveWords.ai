"use strict";

class Boot extends Object {

  files () {
    return [
      /*
      "https://unpkg.com/peerjs@1.3.2/dist/peerjs.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.3.3/purify.min.js",
      */
      "source/external/peerjs1.3.2.min.js",
      "source/external/purify2.3.3.min.js",
      "source/boot/getGlobalThis.js",
      "source/boot/Base.js",
      "source/app/helpers.js",

      "source/app/App.js",
      "source/app/Sounds.js",

      "source/app/voice/Microphone.js",

      "source/app/user/CryptoIdentity.js",
      "source/app/user/LocalUser.js",
      "source/app/user/Nickname.js",

      "source/app/Session.js",

      "source/app/PeerConnection.js",
      "source/app/PeerServer.js",
      "source/app/GuestConnection.js",
      "source/app/HostSession.js",
      "source/app/GuestSession.js",
      
      "source/app/voice/VoiceChat.js",

      "source/app/openai/OpenAiRequest.js",
      "source/app/openai/OpenAiService.js",
      "source/app/openai/OpenAiChat.js",
      "source/app/openai/OpenAiImageGen.js",
      "source/app/openai/OpenAiTriggerBot.js",

      "source/app/views/View.js",

      "source/app/views/buttons/Button.js",
      "source/app/views/buttons/InviteButton.js",
      "source/app/views/buttons/SessionResetButton.js",

      "source/app/views/inputs/OptionsView.js",
      "source/app/views/inputs/TextAreaInputView.js",
      "source/app/views/inputs/TextFieldView.js",
      "source/app/views/inputs/UsernameView.js",

      "source/app/views/AiChatView.js",
      "source/app/views/GroupChatView.js",
      "source/app/views/UsersView.js",
      "source/app/views/SessionOptionsView.js",
      "source/app/views/MessageView.js"
    ]
  }

  start () {
    this._queue = this.files().slice()
    console.log("-------")
    this.loadNext()
  }

  loadNext () {
    if (this._queue.length) {
      const file = this._queue.shift()
      this.loadScript(file, () => {
        this.loadNext()
      })
    } else {
      this.didFinish()
    }
  }

  loadScript (url, callback) {
    console.log("Boot loading '" + url + "'")
    const head = document.getElementsByTagName('head')[0];
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onreadystatechange = (event) => {
      callback();
    }
    script.onload = callback;
    script.onerror = (error) => {
      console.log("Boot ERROR loading: '" + error.target.src + "'")
    }
    head.appendChild(script);
  }

  didFinish () {
    console.log("-------")
    //console.log("Boot: ready to run app")
    App.launch();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  new Boot().start()
})

window.addEventListener('beforeunload', () => {
  Session.shared().clearAllAvatars();
});