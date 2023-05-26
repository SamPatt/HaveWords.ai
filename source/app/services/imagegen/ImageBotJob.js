"use strict";

/* 
    ImageBotJob.js

    Takes a scene descriptions:

    Manages 2 jobs:

    1) AI request to turn scene description into image gen prompt

    2) Start image gen job and return result

*/

(class ImageBotJob extends Base {
  initPrototypeSlots() {
    this.newSlot("manager", null);
    this.newSlot("requestId", null); // job // set by creator 
    this.newSlot("startDate", null);  // job
    this.newSlot("endDate", null); // job

    // turning sceneDescription into sceneSummary
    this.newSlot("sceneDescription", null);
    this.newSlot("sceneSummaryRequest", null); // request to open ai for image prompt
    this.newSlot("sceneSummary", null); 

    // turning imagePrompt into imageUrl
    this.newSlot("imagePrompt", null); 
    this.newSlot("imageGenJob", null); 
    this.newSlot("imageUrl", null); 

    this.newSlot("progress", null); // job
    this.newSlot("status", null); // job
    this.newSlot("error", null); // job
  }

  init () {
    super.init();
    return this;
  }

  onChange() { // job
    HostSession.shared().updateImageProgress(this);
  }

  errorMessage () { // job
    const error = this.error();
    return error ? error.message : null;
  }

  timeTaken () { // job
    const start = this.startDate();
    return start ? new Date().getTime() - start : 0;
  }

  assertReady () {
    assert(this.requestId());
    assert(this.sceneDescription());
  }

  // ImageBot function it triggered when the host requests an image description of the current scene
  async trigger() {
    try {
      this.setStartDate(new Date().getTime());
      this.assertReady();
      await this.requestSceneSummary();
      await this.requestImage();
      this.setEndDate(new Date().getTime());
      return this.imageUrl();
    } catch (error) {
      this.throwError(error);
    }
  }

  sceneSummaryRequestPrompt () {
    return `We are playing a roleplaying game and need a description of the current scene in order to generate an image. 
I will give you the background information for the characters and setting, and then the details of the current scene. 
Using what you know of the background, describe the current scene in a single sentence using simple language which can be used to generate an image. 
Do not use character's names, or location names. 
No proper nouns.\n\n${MJImageJob.systemInstructions()} Here is the current scene: \n\n ` +
      this.sceneDescription();
  }

  async requestSceneSummary() {
    this.setStatus("requesting scene summary");
    this.onChange();

    const request = OpenAiRequest.clone();
    this.setSceneSummaryRequest(request);

    request.setApiUrl("https://api.openai.com/v1/chat/completions");
    request.setApiKey(OpenAiService.shared().apiKey());
    request.setBodyJson({
        model: SessionOptionsView.shared().aiModel(),
        messages: [{ 
            role: "user", 
            content: this.sceneSummaryRequestPrompt() 
        }]
    });

    const data = await request.asyncSend();
    if (data.error) {
      this.throwError(new Error(data.error.message));
    }
    const summary = data.choices[0].message.content;
    const imagePrompt = SessionOptionsView.shared().artPromptPrefix() + " " + summary + SessionOptionsView.shared().artPromptSuffix();
    console.log("imagePrompt: [[" + imagePrompt + "]]");
    this.setImagePrompt(imagePrompt);
  }

  async requestImage () {
    this.setStatus("requesting image");
    this.onChange();

    const job = MJImageJobs.shared().newJob();
    job.setPrompt(this.imagePrompt());
    job.setRequestId(this.requestId());
    this.setImageGenJob(job);

    const imageUrl = await job.asyncFetch();
    this.setImageUrl(imageUrl);

    if (imageUrl) {
      HostSession.shared().broadcastImage(imageUrl, this.requestId());
      AiChatView.shared().addImage(imageUrl, this.requestId());
    }
    return imageUrl;
  }

  throwError(error) {
    console.warn(error.message);
    this.setError(error);
    this.setStatus("error: " + error.message);
    this.onChange();
    throw error;
  }


}).initThisClass();
