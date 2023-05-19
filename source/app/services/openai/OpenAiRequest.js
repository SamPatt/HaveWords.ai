"use strict";

/* 
    OpenAiRequest

    Wrapper for request to OpenAi API

*/

(class OpenAiRequest extends Base {
  initPrototypeSlots() {
    this.newSlot("apiUrl", null);
    this.newSlot("apiKey", null);
    this.newSlot("body", null); // this will contain the model choice and messages
    this.newSlot("response", null);
    this.newSlot("json", null);
  }

  init() {
    super.init();
    this.setIsDebugging(true);
  }

  setBodyJson(json) {
    this.setBody(JSON.stringify(json));
    return this;
  }

  requestOptions() {
    const apiKey = this.apiKey();
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: this.body(),
    };
  }

  assertValid() {
    if (!this.apiUrl()) {
      throw new Error(this.type() + " apiUrl missing");
    }

    if (!this.apiKey()) {
      throw new Error(this.type() + " apiKey missing");
    }
  }

  async asyncSend() {
    const requestOptions = this.requestOptions();

    this.assertValid();

    if (this.isDebugging()) {
      const body = JSON.parse(requestOptions.body);
      const model = body.model;
      const content = body.messages[0].content;
      this.debugLog(
        " fetch apiUrl: " +
          this.apiUrl() +
          " model: '" +
          model +
          "' prompt: '" +
          content +
          "'"
      );
    }

    const response = await fetch(this.apiUrl(), requestOptions);
    this.setResponse(response);
    const json = await response.json();
    this.debugLog(" response json: ", json);
    if (json.error) {
      console.log(this.type() + " ERROR:", json.error.message)
    }
    return json;
  }

  description() {
    return (
      this.type() +
      " url:" +
      this.apiUrl() +
      " request:" +
      JSON.stringify(this.requestOptions())
    );
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
}).initThisClass();
