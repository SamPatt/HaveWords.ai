"use strict";

/* 
    OpenAiRequest

    Wrapper for request to OpenAi API

*/

(class OpenAiRequest extends Base {
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

  assertValid () {
    if (!this.apiUrl()) {
      throw new Error(this.type() + " apiUrl missing");
    }

    if (!this.apiKey()) {
      throw new Error(this.type() + " apiKey missing");
    }
  }

  async asyncSend () {
    const requestOptions = this.requestOptions()
    let data = undefined;

    this.assertValid()

   // debugger;
    //try {
      //this.debugLog(" send request apiUrl:" +  this.apiUrl() + "options: \n" + JSON.stringify(requestOptions, 2, 2))
      this.debugLog(" send request apiUrl:" +  this.apiUrl() + "options: \n", requestOptions)
      const response = await fetch(this.apiUrl(), requestOptions);
      data = await response.json();
      /*
    } catch (error) {
      this.reportError(error)
    }
    */
    return data;
  }

  description () {
    return this.type() + " url:" + this.apiUrl() + " request:" + JSON.stringify(this.requestOptions());
  }

  /*
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


