"use strict";

/* 
    MJRequest

    Wrapper for API request

*/

(class MJRequest extends Base {
  initPrototypeSlots () {
    this.newSlot("endpointPath", null);
    this.newSlot("service", null)
    this.newSlot("body", null); //JSON object
  }

  init () {
    super.init();
    this.setIsDebugging(false)
  }

  requestOptions () {
    const apiKey = this.service().apiKey();
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": apiKey,
      },
      body: JSON.stringify(this.body()),
    };
  }

  endpointUrl() {
    return this.service().apiBaseUrl() + this.endpointPath();
  }

  assertValid () {
    if (!this.service()) {
      throw new Error(this.type() + " service missing");
    }

    if (!this.service().apiKey()) {
      throw new Error(this.type() + " apiKey missing");
    }

    if (!this.service().apiBaseUrl()) {
      throw new Error(this.type() + " apiBaseUrl missing");
    }
  }

  async asyncSend () {
    const requestOptions = this.requestOptions()
    let data = undefined;

    this.assertValid()

   // debugger;
    //try {
      this.debugLog(" send request endpointUrl:" +  this.endpointUrl() + "options: \n", requestOptions)
      const response = await fetch(this.endpointUrl(), requestOptions);
      data = await response.json();
      /*
    } catch (error) {
      this.reportError(error)
    }
    */
    return data;
  }

  description () {
    return this.type() + " url:" + this.endpointUrl() + " request:" + JSON.stringify(this.requestOptions());
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


