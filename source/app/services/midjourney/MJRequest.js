"use strict";

/* 
    MJRequest

    Wrapper for API request

*/

(class MJRequest extends Base {
  /*
  initPrototypeSlots () {
    this.newSlot("apiUrl", null);
    this.newSlot("apiKey", null);
    this.newSlot("body", null); // this will contain the model choice and messages
  }

  init () {
    super.init();
    this.setIsDebugging(true)
  }

  setBodyJson (json) {
    this.setBody(JSON.stringify(json));
    return this
  }

  requestOptions () {
    const apiKey = this.apiKey()
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: this.body(),
    };
  }

  async asyncSend () {
    const requestOptions = this.requestOptions()
    let data = undefined;

    if (!this.apiUrl()) {
      throw new Error(this.type() + " apiUrl missing")
    }

    if (!this.apiKey()) {
      throw new Error(this.type() + " apiKey missing")
    }

      console.log(">>>>>>>>>> send request:", this.apiUrl(), requestOptions)
      const response = await fetch(this.apiUrl(), requestOptions);
      data = await response.json();

    return data;
  }

  description () {
    return this.type() + " url:" + this.apiUrl() + " request:" + JSON.stringify(this.requestOptions());
  }

  reportError (error) {
    console.error(this.type() + " error fetching response:", error, " for url: " + this.apiUrl() + " request:", this.requestOptions());

    AiChatView.shared().addMessage(
      "systemMessage",
      "Error fetching AI response. Make sure the model is selected and the API key is correct.",
      "Host"
    );
  }
  */

}.initThisClass());


