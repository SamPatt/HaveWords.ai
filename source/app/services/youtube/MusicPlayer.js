"use strict";

/* 
    Music


*/

(class MusicPlayer extends Base {
  initPrototypeSlots() {
    this.newSlot("tracksMap", null);
    this.newSlot("currentTrack", null);
  }

  init() {
    super.init();
    this.setTracksMap(new Map());
    this.selectPlaylistWithName("DnD");
    this.setIsDebugging(true);
  }

  trackNames() {
    return this.tracksMap().keysArray();
  }

  selectPlaylistWithName(name) {
    this.selectPlaylistsWithNames([name]);
    return this;
  }

  selectPlaylistsWithNames(names) {
    this.tracksMap().clear();
    names.forEach((name) => {
      const playlistMap = MusicLibrary.shared().playlistWithName(name);
      playlistMap.forEachKV((k, v) => {
        this.tracksMap().set(k, v);
      });
    });
    return this;
  }

  playTrackWithName(name) {
    const yt = YouTubeAudioPlayer.shared();

    this.debugLog("playTrackWithName('" + name + "')");
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
