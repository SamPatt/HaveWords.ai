"use strict";

/* 
    Music


*/


(class Music extends Base {
  static tracksMap() {
    // dictionary with description as keys and youtube video id as values
    return new Map(Object.entries(rpgAmbienceTracksDict()));
  }

  initPrototypeSlots() {
    this.newSlot("tracksMap", null);
    this.newSlot("currentTrack", null);
  }

  init() {
    super.init();
    this.setTracksMap(Music.tracksMap());
    this.setIsDebugging(true);
  }

  trackNames() {
    return this.tracksMap().keysArray();
  }

  playTrackWithName(name) {
    const yt = YouTubeAudioPlayer.shared();

    this.debugLog("playTrackWithName('" + name + "')");
 //   debugger;
    const vid = this.tracksMap().get(name);

    if (!vid) {
      this.debugLog("missing track with name '" + name + "'");
      return;
    }

    if (vid) {
      if (vid !== yt.videoId() || !yt.isPlaying()) {
        yt.setVideoId(vid).play();
      }
    }
  }
}).initThisClass();
