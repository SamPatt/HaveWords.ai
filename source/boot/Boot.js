"use strict";

class Boot extends Object {

  files () {
    return [
      "source/boot/getGlobalThis.js",
      "source/boot/Base.js",
      "source/app/App.js",
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
      this.loadScript(file, () => this.loadNext())
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
      console.log(error)
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