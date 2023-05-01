"use strict";

/* 
    LocalUser

*/

(class LocalUser extends Base {
  initPrototypeSlots() {
    this.newSlot("cryptoId", null);
    this.newSlot("nickname", null);
  }

  init() {
    super.init();
    this.setCryptoId(CryptoIdentity.clone())
    this.setIsDebugging(true);
  }

}.initThisClass());

