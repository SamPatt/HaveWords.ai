"use strict";

/* 
    MJImageJobs

*/

(class MJImageJobs extends MJService {
  initPrototypeSlots() {
    this.newSlot("jobsSet", null);
  }

  init () {
    super.init();
    this.setJobsSet(new Set());
    return this;
  }

  newJob () {
    const job = MJImageJob.clone();
    job.setManager(this);
    this.jobsSet().add(job);
    return job;
  }

  endJob (aJob) {
    this.jobsSet().remove(aJob);
    return this;
  }

}.initThisClass());

