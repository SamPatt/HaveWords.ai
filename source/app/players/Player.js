"use strict";

/* 

    Player

      nickname
      id
      avatar

      LocalUser ref?
      PeerConnection ref?
      
*/

(class Player extends Base {
  initPrototypeSlots() {
    this.newSlot("info", null);
    this.newSlot("localUser", null);
    this.newSlot("guestConnection", null);
  }

  init() {
    super.init();
  }

}.initThisClass());

