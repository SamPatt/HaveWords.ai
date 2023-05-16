"use strict";

/* 
    Music


*/

(class MusicPlayer extends Base {
  initPrototypeSlots() {
    this.newSlot("tracksMap", null);
    this.newSlot("currentTrack", null);
    this.newSlot("isMuted", false);
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
    if (this.isMuted()) {
      this.debugLog("played is muted so not playing");
      return;
    }

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

  setIsMuted (aBool) {
    this._isMuted = aBool;
    YouTubeAudioPlayer.shared().stop();
    return this;
  }

}).initThisClass();
