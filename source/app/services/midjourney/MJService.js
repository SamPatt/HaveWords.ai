"use strict";

/* 
    MJService

*/

(class MJService extends Base {
  initPrototypeSlots () {
  }

  init () {
    super.init();
  }

  // --- api key ---

  storagePrefix () {
    return "midjourney";
  }

  setApiKey (v) {
    localStorage.setItem(this.storagePrefix() + "_api_key", v)
    return this
  }

  apiKey () {
    return localStorage.getItem(this.storagePrefix() + "_api_key")
  }

  validateKey (s) {
    // this just check's it's format, but can't tell if it actually works
    if (!s) {
      return false;
    }
    return s.length === 32 && s.isHexadecimal();
  }

  hasApiAccess () {
    return this.validateKey(this.apiKey());
  }

}.initThisClass());
