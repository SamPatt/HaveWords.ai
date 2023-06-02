"use strict";

/* 

    Players

      manages a list of Player objects

      replaces Guestlist
      
*/

(class Players extends Base {
  initPrototypeSlots() {
    this.newSlot("players", null);
  }

  init() {
    super.init();
    this.setPlayers([]);
  }

  asJson () {

  }

  setJson(json) {

  }

}.initThisClass());

