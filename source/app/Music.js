"use strict";

/* 
    Music

*/

(class Music extends Base {
  static tracksMap () {
    // dictionary with description as keys and youtube video id as values
    const dict = {
      "peaceful night": "kS4jfQM0Nok", // Sleeping in Narnia | Calming Chronicles of Narnia Music & Ambience
      "Halloween at Hogwarts": "qhRLcxW9_hQ", // Harry Potter Music & Ambience | Halloween at Hogwarts - Common Rooms
      "sunrise": "7odiKMVXw-M", // The Elder Scrolls Music & Ambience | Autumn in Skryim
      "lord of the rings": "8vnHJNjwuqg", // Lord of the Rings | Gondor Music & Ambience
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
    this.debugLog("playTrackWithName('" + name + "'");
    const trackId = this.tracksMap().get(name);
    if (trackId) {
      YouTubeAudioPlayer.shared().setVideoId(trackId);
    } else {
      console.warn("missing track with name '" + name + "'")
    }
  }

}.initThisClass());
