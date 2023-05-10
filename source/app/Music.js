"use strict";

/* 
    Music


*/

/*
      // these don't appear to be embeddable
      "Harry Potter - Halloween at Hogwarts": "qhRLcxW9_hQ", 
      "Narnia - Sleeping in Narnia": "kS4jfQM0Nok", 
      "The Elder Scrolls - Autumn": "7odiKMVXw-M", 
      "Lord of the Rings - Gondor Music": "8vnHJNjwuqg", 
      "Harry Potter & Fantastic Beasts | Hogwarts Potions Class Music" : "hnYt0Eq0P1M",
      "Conan - Prologue/Anvil of Crom":"LANHWwEjOAU",
      "Conan - Riddle of Steel/Riders of Doom": "1lKUYAnqxjU",
      "Conan - The Gift of Fury": "FAUW0eq0BLA",
      "Conan - Column of Sadness/Wheel of Pain": "0e4EjeCEbHM",
      "Conan - Atlantean Sword": "G1on_N1R9vc",
      "Conan - Theology/Civilization": "mMVmW0k9jZI",
      "Conan - Love Theme": "TVSRG3kUVn8",
      "Conan - The Search": "dLJ2hurTJKo",
      "Conan - The Orgy": "BOUs6er51bI",
      "Conan - The Funeral Pyre": "vMaK8tBe9SE",
      "Conan - Battle of the Mounds": "3bh63oQKdus",
      "Conan - Orphans of Doom/The Awakening": "W4SXng8EtF0",
*/

(class Music extends Base {
  static tracksMap() {
    // dictionary with description as keys and youtube video id as values
    const dict = {
      "Medieval Tavern/Inn": "roABNwbjZf4", 
      "Celtic Medieval Tavern": "pgLjYsVP4H0",
      "Forest and Windswept Realms": "FdmMCwzyrYk",
      "Winds of Magic": "CdHlpHGmi20",
      "Hogwarts Winter": "58W83H5mLeY",
      "Hogwarts Legacy - A Rainy Spring Night": "972XmlhfLKU",
      "Harry Potter: Hogwarts Myster": "MgkIHQvCJRk", // eh
      "Magical Harry Potter Shop": "jRi6EWnVlgc", // eh
      "Meditating with Conan in Conan The Barbarian": "_fPT-5exKhI",
      "Cimmerian Meditation": "phVfE68wZqc",
      "Unstoppable Army": "QfcN0cgkupI",
      "Pirate Music - The Sea Is Vast": "YUByE72gRiA",
      "Giant Heart beating": "m3qV0ZvHLXU",
      "Lively tavern party": "x3skYa2i6Bg",
      "Careful Exploration": "pE7AwMfNYhM",
      "Violent Storm": "B7PQv77VmSw",
      "Orpheus Odyssey - Legends on Strings": "_bYldqEjOUA",
      "fire, chanting, drums": "sSTVlP1v6-M",
      "Bard singing": "JzRclrjcHV8",
      "Steppe / Savanna (wind, steppe animals, herds, pasture)": "gXJM1L1cFpw",
      "Greek Maritime City": "dhQPzfmbjJE",
      "Rainy Medievel Tavern": "jSKML61NDE8",
      "Shipwreck": "z4sWBPr4wGM",
    };
    return new Map(Object.entries(dict));
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
