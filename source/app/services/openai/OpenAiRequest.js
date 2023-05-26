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

    // streaming
    this.newSlot("isStreaming", false); // external read-only
    this.newSlot("streamTarget", null); // will receive onStreamData and onStreamComplete messages
    this.newSlot("xhr", null); 
    this.newSlot("xhrResolve", null); 
    this.newSlot("xhrReject", null); 
    this.newSlot("requestId", null); 
    this.newSlot("readIndex", 0);
    this.newSlot("readLines", null);

    this.newSlot("fullContent", null); 
    this.newSlot("lastContent", "");
    this.newSlot("error", null);
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
      console.warn(this.type() + " ERROR:", json.error.message);
    }
  }

  // --- normal response --- 

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

  // --- helpers ---


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

  // --- streaming response --- 

  assertReadyToStream () {
    const streamTarget = this.streamTarget();
    // verify streamTarget and that protocol is implemented by it
    assert(streamTarget);
    assert(streamTarget.onStreamData);
    assert(streamTarget.onStreamComplete);
  }

  async asyncSendAndStreamResponse () {
    this.assertValid();
    assert(!this.xhr());

    this.assertReadyToStream();
    
    this.setIsStreaming(true);
    this.bodyJson().stream = true;
    this.setReadLines([]);

    const xhr = new XMLHttpRequest();
    this.setXhr(xhr);
    xhr.open("POST", this.apiUrl());

    // set headers
    const options = this.requestOptions();
    for (const header in options.headers) {
      const value = options.headers[header];
      xhr.setRequestHeader(header, value);
    }

    xhr.responseType = ""; // "" or "text" is required for streams

    this.setFullContent("");

    // why false arg? see https://stackoverflow.com/questions/51204603/read-response-stream-via-xmlhttprequest
    xhr.addEventListener("progress", (event) => this.onXhrProgress(event), false);
    xhr.addEventListener("loadend", (event) => this.onXhrLoadEnd(event));
    xhr.addEventListener("error", (event) => this.onXhrError(event));
    xhr.addEventListener("abort", (event) => this.onXhrAbort(event));

    const promise = new Promise((resolve, reject) => {
      this.setXhrResolve(resolve);
      this.setXhrReject(reject);
    });

    //const s = JSON.stringify(options, 2, 2);
    //this.debugLog("SENDING REQUEST BODY:", options.body)
    xhr.send(options.body);

    return promise;
  }

  onXhrProgress (event) {
    this.onXhrRead();
  }

  onXhrLoadEnd (event) {
    this.onXhrRead();
    this.streamTarget().onStreamComplete(this);
    if (this.service().onRequestComplete) {
      this.service().onRequestComplete(this)
    }
    this.xhrResolve()(this.fullContent()); 
  }

  setError (e) {
    this._error = e;
    if (e) {
      console.warn(this.debugType() + " " + e.message);
    }
    return this;
  }

  onXhrError (event) {
    debugger;
    const xhr = this.xhr();
    // error events don't contain messages - need to look at xhr and guess at what happened
    let s = "got an error on xhr requestId" + this.requestId() + ":";
    s += "  xhr.status:     " + xhr.status; // e.g. 404 = file not found
    s += "  xhr.statusText: '" + xhr.statusText + "'";
    s += "  xhr.readyState: ", xhr.readyState; // e.g.. 4 === DONE
    const error = new Error(s);
    this.setError(error);
    this.streamTarget().onStreamComplete(this);
    this.xhrReject()(error);
  }

  onXhrAbort (event) {
    debugger;
    this.streamTarget().onStreamComplete(this);
    this.xhrReject()(new Error("aborted"));
  }

  readNextXhrLine () {
    const xhr = this.xhr();
    const unread = xhr.responseText.substr(this.readIndex());
    const newLineIndex = unread.indexOf("\n");

    if (newLineIndex === -1) {
      return undefined; // no new line found
    }

    const newLine = unread.substr(0, newLineIndex);
    this.setReadIndex(this.readIndex() + newLineIndex+1); // advance the read index
    return newLine;
  }

  onXhrRead () {
    try {
      let line = this.readNextXhrLine();

      while (line !== undefined) {
        line = line.trim()
        if (line.length === 0) {
          // emplty line - ignore
        } else if (line.startsWith("data:")) {
          const s = line.after("data:");
          if (line.includes("[DONE]")) {
            // stream is done and will close
          } else {
            // we should expect json
            const json = JSON.parse(s);
            this.onStreamJsonChunk(json);
          }
        } 
        line = this.readNextXhrLine();
      }
    } catch(error) {
      this.setError(error);
      console.warn(this.type() + " ERROR:", error);
      debugger;
      this.xhrReject()(new Error(error));
    }
  }

  onStreamJsonChunk (json) {
    /*
    example error:
    {"error":{"message":"Request failed due to server shutdown","type":"server_error","param":null,"code":null}}
    */

    if (json.error) {
      console.warn("ERROR:" + json.error.message);
      debugger;
      this.xhrReject()(new Error(json.error.message));
    } else if (
        json.choices &&
        json.choices.length > 0 &&
        json.choices[0].delta &&
        json.choices[0].delta.content
      ) {
        const newContent = json.choices[0].delta.content;
        this.setFullContent(this.fullContent() + newContent);
        this.streamTarget().onStreamData(this, newContent);
    } else {
      if (json.id) {
        // this is the header chunk - TODO: save anything importent in some request slots?
      } else {
        console.warn("WARNING: don't know what to do with this JsonChunk", json);
      }
    }
  }

}).initThisClass();
