"use strict";

/* 
    OpenAiRequest

    Wrapper for request to OpenAi API

*/

(class OpenAiRequest extends Base {
  initPrototypeSlots () {
    this.newSlot("body", null)
    this.newSlot("apiKey", null)
    this.newSlot("apiUrl", "https://api.openai.com/v1/chat/completions")
  }

  init () {
    super.init();
    this.setIsDebugging(true)
  }

  requestOptions () {
    const apiKey = this.apiKey()
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: this.body(),
    };
  }

  async asyncSend () {
    const requestOptions = this.requestOptions()
    //this.debugLog("send request:", this.apiUrl(), requestOptions)
    const response = await fetch(this.apiUrl(), requestOptions);
    const data = await response.json();
    return data;
  }

}.initThisClass());


