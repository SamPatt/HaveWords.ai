"use strict";

/* 
    OpenAiRequest

    Wrapper for request to OpenAi API

*/

(class OpenAiRequest extends Base {

  static initThisClass () {
    super.initThisClass();
    this.newClassSlot("requestCount", 0);
  }

  static incrementRequestCount() {
    this.setRequestCount(this.requestCount() + 1);
    return this.requestCount();
  }

  initPrototypeSlots() {
    this.newSlot("service", null); // optional reference to service object that owns request e.g. OpenAiChat - will receive onRequestComplete message if it responds to it
    this.newSlot("apiUrl", null);
    this.newSlot("apiKey", null);
    this.newSlot("bodyJson", null); // this will contain the model choice and messages
    this.newSlot("response", null);
    this.newSlot("json", null);
    this.newSlot("isStreaming", false); // external read-only
    this.newSlot("streamTarget", null); // will receive onStreamData and onStreamComplete messages
    this.newSlot("requestId", null); 
    this.newSlot("fullContent", null); 
    this.newSlot("lastContent", "");
  }

  init() {
    super.init();
    this.setIsDebugging(true);
    this.setRequestId(this.thisClass().incrementRequestCount());
    this.setLastContent("");
  }

  body() {
    return JSON.stringify(this.bodyJson());
  }

  requestOptions() {
    const apiKey = this.apiKey();
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(this.bodyJson()),
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

  showRequest () {
    /*
    const body = this.bodyJson();
    const model = body.model;
    const content = body.messages[0].content;
    this.debugLog(
      " request " +
      this.requestId() +
      " apiUrl: " +
        this.apiUrl() +
        " model: '" +
        model +
        "' prompt: '" +
        content +
        "'"
    );
    */

    this.debugLog(
      " request " +
      this.requestId() +
      " apiUrl: " +
        this.apiUrl() +
        " body: " + 
        JSON.stringify(this.bodyJson()) +
        "'"
    );
  }

  showResponse () {
    const json = this.json();
    this.debugLog(" response json: ", json);
    if (json.error) {
      console.log(this.type() + " ERROR:", json.error.message);
    }
  }

  /* --- normal response --- */

  async asyncSend () {
    this.setIsStreaming(false);

    this.assertValid();
    if (this.isDebugging()) {
      this.showRequest();
    }

    this.setResponse(await fetch(this.apiUrl(), this.requestOptions()));
    const json = await this.response().json();
    this.setJson(json);
    this.showResponse();
    return json;
  }

  /* --- streaming response --- */


  async asyncSendAndStreamResponse () {
    this.assertValid();

    const streamTarget = this.streamTarget();

    // verify streamTarget and that protocol is implemented by it
    assert(streamTarget);
    assert(streamTarget.onStreamData);
    assert(streamTarget.onStreamComplete);
    
    this.setIsStreaming(true);
    this.bodyJson().stream = this.isStreaming();

    const xhr = new XMLHttpRequest();
    xhr.open("POST", this.apiUrl());
    const options = this.requestOptions();
    for (const header in options.headers) {
      const value = options.headers[header];
      xhr.setRequestHeader(header, value);
    }

    xhr.responseType = ""; // "" or "text" is required for streams

    let readIndex = 0;
    this.setFullContent("");

    const onChunk = () => {
      const newLength = xhr.responseText.length;
      const chunk = xhr.responseText.substr(readIndex);
      readIndex = xhr.responseText.length;
      if (chunk.length) {

        if (chunk.includes("[DONE]")) {
          console.log("skipping chunk:" + chunk);
          return;
        }

        const result = chunk
        .replace(/data:\s*/g, "")
        .replace(/[\r\n\t]/g, "")
        .split("}{")
        .join("},{");
        const cleanedJsonString = `[${result}]`;
        const parsedJson = JSON.parse(cleanedJsonString);

        /*  

        example error:
        data: {"error":{"message":"Request failed due to server shutdown","type":"server_error","param":null,"code":null}}

        */
        let newContent = "";
        parsedJson.forEach(item => {
          if (
            item.choices &&
            item.choices.length > 0 &&
            item.choices[0].delta &&
            item.choices[0].delta.content
          ) {
            newContent += item.choices[0].delta.content;
          }
        });

        //console.log("CHUNK:", chunk);
        //console.log("CONTENT: ", newContent);
        this.setFullContent(this.fullContent() + newContent);
        streamTarget.onStreamData(this, newContent);
      }
    }

    xhr.addEventListener("progress", (event) => {
      onChunk();
    });

    const promise = new Promise((resolve, reject) => {

      xhr.addEventListener("loadend", (event) => {
        onChunk();
        streamTarget.onStreamComplete(this);
        // we already sent all the chunks, but just to be consistent with other API, return the json
        // in this way, we may only need one fetch method
        if (this.service().onRequestComplete) {
          this.service().onRequestComplete(this)
        }
        resolve(this.fullContent()); 
      });

      xhr.addEventListener("error", (event) => {
        if (event.constructor === ProgressEvent) {
          console.warn("got a ProgressEvent as an xhr error. Why?");
          debugger;
          return;
        }
        debugger;
        streamTarget.onStreamComplete(this);
        reject(event);
      });

      xhr.addEventListener("abort", (event) => {
        streamTarget.onStreamComplete(this);
        reject(new Error("aborted"));
      });
      
    });

    const s = JSON.stringify(options, 2, 2);
    //this.debugLog("SENDING REQUEST BODY:", options.body)
    xhr.send(options.body);

    return promise;
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
