"use strict";

/* 
    Job.js

*/

(class ImageBotJob extends Base {
  initPrototypeSlots() {
    this.newSlot("jobBanager", null);
    this.newSlot("jobId", null); 

    this.newSlot("startDate", null);  
    this.newSlot("endDate", null);
    this.newSlot("timeoutInMs", null);

    this.newSlot("progress", null);
    this.newSlot("status", null); 
    this.newSlot("error", null); 
  }

  init () {
    super.init();
    return this;
  }

  onChange() {
    // subclasses can override
  }

  errorMessage () { 
    const error = this.error();
    return error ? error.message : null;
  }

  timeTaken () { 
    const start = this.startDate();
    return start ? new Date().getTime() - start : 0;
  }

  throwError(error) {
    console.warn(error.message);
    this.setError(error);
    this.setStatus("error: " + error.message);
    this.onChange();
    throw error;
  }

}).initThisClass();
