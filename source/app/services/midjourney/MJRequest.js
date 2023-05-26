"use strict";

/* 
    MJRequest

    Wrapper for API request

*/

(class MJRequest extends Base {
  initPrototypeSlots () {
    this.newSlot("endpointPath", null);
    this.newSlot("service", null)
    this.newSlot("body", null); // JSON object
    this.newSlot("startTime", null); // JSON object
    this.newSlot("timeoutMs", 120000); 
  }

  init () {
    super.init();
    this.setService(MJService.shared());
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

  /*
  timeoutPromise() {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), this.timeoutMs());
    });
  }
  */

  async asyncSend () {
    this.setStartTime(new Date().getTime());
    this.assertValid()

    const requestOptions = this.requestOptions()

    this.debugLog(" send request endpointUrl:" +  this.endpointUrl() + "options: \n", requestOptions)
    const fetchPromise = fetch(this.endpointUrl(), requestOptions);

    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Request timed out')), this.timeoutMs());
    });

    return Promise.race([timeoutPromise, fetchPromise])
      .then(response => {
        clearTimeout(timeoutId);
        return response.json();
      })
      .catch(error => {
          throw new Error("request timeout after " + this.timeoutMs() + "ms");
      });
  }

  description () {
    return this.type() + " url:" + this.endpointUrl() + " request:" + JSON.stringify(this.requestOptions());
  }

}.initThisClass());


