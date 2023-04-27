"use strict";

/* 
    OpenAiService

*/

(class OpenAiService extends Base {
  initPrototypeSlots () {
    //this.newSlot("activeRequests", null)
  }

  init () {
    super.init();
  }

  setApiKey (key) {
    localStorage.setItem("openai_api_key", key)
    return this
  }

  apiKey () {
    return localStorage.getItem("openai_api_key")
  }

}.initThisClass());
