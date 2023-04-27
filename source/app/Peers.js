"use strict";

/* 
    Peers


    Peers.shared().broadcast(json)
    Peers.shared().broadcastExceptTo(json, id)
*/

(class Peers extends Base {
  initPrototypeSlots() {}

  init() {
    super.init();
    this.setIsDebugging(true);
  }

  broadcast(json) {
    for (const guestId in dataChannels) {
      if (dataChannels.hasOwnProperty(guestId)) {
        dataChannels[guestId].conn.send(json);
      }
    }
  }

  broadcastExceptTo(json, excludeId) {
    for (const guestId in dataChannels) {
      if (dataChannels.hasOwnProperty(guestId)) {
        if (guestId !== excludeId) {
          dataChannels[guestId].conn.send(json);
        }
      }
    }
  }
}.initThisClass());
