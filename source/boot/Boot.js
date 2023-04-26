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
      "source/app/App.js",
      "source/app/Nickname.js",
      "source/app/Sounds.js",
      "source/app/Microphone.js",
      "source/app/OpenAiChat.js",
      //"source/app/Session.js",
      //"source/app/OpenAiImageGen.js",
      "app.js"
    ]
  }

  start () {
    this._queue = this.files().slice()
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
      console.log("Boot ERROR loading: '" + this.src + "'")
    }
    head.appendChild(script);
  }

  didFinish () {
    console.log("Boot: ready to run app")
    App.launch();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("Boot.start() after document load")
  new Boot().start()
})