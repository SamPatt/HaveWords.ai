"use strict";

/* 
    OpenAiService

*/

(class OpenAiService extends Base {
  initPrototypeSlots () {
  }

  init () {
    super.init();
  }

  // --- api key ---

  setApiKey (key) {
    if (key !== this.apiKey()) {
      localStorage.setItem("openai_api_key", key);
      OpenAiChat.shared().clearAvailableModelNames(); // TODO: reorg this!
    }
    return this
  }

  apiKey () {
    return localStorage.getItem("openai_api_key")
  }

  validateKey (s) {
    return s.length === 51 && s.startsWith("sk-");
  }

}.initThisClass());
