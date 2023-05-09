"use strict";

/* 
    Music

*/

(class Music extends Base {
  static tracksMap () {
    // dictionary with description as keys and youtube video id as values
    const dict = {
      "Sleeping in Narnia": "kS4jfQM0Nok", // Sleeping in Narnia | Calming Chronicles of Narnia Music & Ambience
      "Halloween at Hogwarts": "qhRLcxW9_hQ", // Harry Potter Music & Ambience | Halloween at Hogwarts - Common Rooms
      "The Elder Scrolls": "7odiKMVXw-M", // The Elder Scrolls Music & Ambience | Autumn in Skryim
      "Lord of the Rings | Gondor Music": "8vnHJNjwuqg", // Lord of the Rings | Gondor Music & Ambience
    }
    return new Map(Object.entries(dict));
  }

  initPrototypeSlots () {
    this.newSlot("tracksMap", null)
    this.newSlot("currentTrack", null)
  }

  init () {
    super.init();
    this.setTracksMap(Music.tracksMap());
    this.setIsDebugging(true);
  }

  trackNames () {
    return this.tracksMap().keysArray();
  }

  playTrackWithName (name) {
    const yt = YouTubeAudioPlayer.shared();

    this.debugLog("playTrackWithName('" + name + "')");
    const vid = this.tracksMap().get(name);

    if (!vid) {
      this.debugLog("missing track with name '" + name + "'");
      return;
    }

    if (vid && vid !== yt.videoId()) {
      if (!yt.isPlaying()) {
        yt.setVideoId(vid).play();
      }
    } 
  }

}.initThisClass());
