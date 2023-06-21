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
      "source/external/json-stable-stringify/json-stable-stringify.js",
      "source/boot/getGlobalThis.js",
      "source/boot/Base.js",
      "source/app/helpers.js",

      "source/app/App.js",
      "source/app/node/Node.js",

      "source/app/Sounds.js",

      "source/app/user/CryptoIdentity.js",
      "source/app/user/LocalUser.js",
      "source/app/user/Nickname.js",

      "source/app/players/Player.js",
      "source/app/players/Players.js",

      "source/app/Session.js",
      "source/app/Sessions.js",

      "source/app/PeerConnection.js",
      "source/app/PeerServer.js",
      "source/app/GuestConnection.js",
      "source/app/HostSession.js",
      "source/app/GuestSession.js",
      
      "source/app/voice/VoiceChat.js",

      // services

      "source/app/services/azure/AzureService.js",
      "source/app/services/azure/AzureTextToSpeech.js",
      "source/app/services/azure/AzureVoices.js",
      "source/app/services/azure/AzureRegions.js",

      "source/app/services/Job.js",
      "source/app/services/Jobs.js",
      "source/app/services/imagegen/ImageBotJobs.js",
      "source/app/services/imagegen/ImageBotJob.js",
      "source/app/services/imagegen/ImageGenOptions.js",
      
      "source/app/services/midjourney/MJRequest.js",
      "source/app/services/midjourney/MJService.js",
      "source/app/services/midjourney/MJImageJob.js",
      "source/app/services/midjourney/MJImageJobs.js",

      "source/app/services/openai/OpenAiRequest.js",
      "source/app/services/openai/OpenAiService.js",
      "source/app/services/openai/OpenAiChatModel.js",
      "source/app/services/openai/OpenAiChat.js",
      "source/app/services/openai/OpenAiImageGen.js",
      "source/app/services/openai/OpenAiMusicBot.js",

      "source/app/services/youtube/YouTubeAudioPlayer.js",
      "source/app/services/youtube/MusicLibrary.js",
      "source/app/services/youtube/MusicPlayer.js",

      // views

      "source/app/views/View.js",
      "source/app/views/organizers/HView.js",
      "source/app/views/organizers/VView.js",
      "source/app/views/organizers/KVView.js",

      "source/app/views/buttons/Button.js",
      "source/app/views/buttons/RadioButton.js",
      "source/app/views/buttons/InviteButton.js",

      "source/app/views/inputs/OptionsView.js",
      "source/app/views/inputs/TextAreaInputView.js",
      "source/app/views/inputs/TextFieldView.js",
      "source/app/views/inputs/CheckboxView.js",

      { src: "source/app/views/dicerolls/DiceBoxView.js", type: "module" },
      { src: "source/app/views/dicerolls/RollPanelView.js", type: "module" },
      "source/app/views/dicerolls/RollRequest.js",
      "source/app/views/dicerolls/RollRequestView.js",

      // view columns
      "source/app/views/columns/JsonViews/JsonView.js",
      "source/app/views/columns/JsonViews/ArrayView.js",
      "source/app/views/columns/JsonViews/ObjectView.js",
      "source/app/views/columns/JsonViews/StringView.js",
      "source/app/views/columns/JsonViews/NumberView.js",

      "source/app/views/columns/ScrollView.js",
      "source/app/views/columns/ColumnView.js",
      "source/app/views/columns/AiChatColumn.js",
      "source/app/views/columns/GroupChatColumn.js",
      "source/app/views/columns/PlayerView.js",
      "source/app/views/columns/PlayersColumn.js",
      "source/app/views/SessionOptionsConfig.js",
      "source/app/views/SessionOptionsView.js",
      "source/app/views/MessageView.js",
      "source/app/views/ImageMessageView.js",
      "source/app/views/inputs/AvatarPickerView.js",

      "source/app/voice/Microphone.js",
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

  loadScript (propertiesOrSrc, callback) {
    console.log("Boot loading '" + (propertiesOrSrc.src || propertiesOrSrc) + "'")
    const head = document.getElementsByTagName('head')[0];
    const script = document.createElement('script');
    script.type = propertiesOrSrc.type || 'text/javascript';

    script.src = propertiesOrSrc.src || propertiesOrSrc;
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
});