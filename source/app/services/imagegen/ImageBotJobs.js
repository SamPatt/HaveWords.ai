"use strict";

/* 
    ImageBotJobs.js

*/

(class ImageBotJobs extends Base {
  initPrototypeSlots() {
    this.newSlot("jobsSet", null);
    this.newSlot("imageGen", null);
  }

  init () {
    super.init();
    this.setJobsSet(new Set());
    return this;
  }

  newJob () {
    const job = ImageBotJob.clone();
    job.setManager(this);
    this.jobsSet().add(job);
    return job;
  }

  endJob (aJob) {
    this.jobsSet().delete(aJob);
    return this;
  }

}).initThisClass();
