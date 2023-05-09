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
    localStorage.setItem("openai_api_key", key)
    return this
  }

  apiKey () {
    return localStorage.getItem("openai_api_key")
  }

  validateKey (s) {
    return s.length === 51 && s.startsWith("sk-");
  }

}.initThisClass());
