"use strict";

/* 
    MJImageGen

*/

(class MJImageGen extends MJService {
  initPrototypeSlots() {
    this.newSlot("prompt", null);
  }

  newRequest () {
    const request = MJRequest.clone();
    request.setService(this);
    return request;
  }

  resultJson() {
    return this.newRequest().setEndpointPath("/imagine").setBody({
      prompt: this.prompt()
    }).asyncSend();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Calls the OpenAI Image API and returns the image URL fetchOpenAIImageResponse
  async asyncFetch() {
    assert(this.prompt());

    //this.prompt().copyToClipboard(); // so the user can easily paste it into MidJourney < Rich: Are we sure we want to wipe their clipboard for this?

    const imagineRequest = this.newRequest().setEndpointPath("/imagine").setBody({
      prompt: this.prompt()
    });

    let json;

    try {
      json = await imagineRequest.asyncSend();
      const taskId = json.taskId;
      if (!taskId) {
        throw "taskId missing from MJ response: " + JSON.stringify(json);
      }

      do {
        await new Promise(r => setTimeout(r, 200));
        json = await this.newRequest().setEndpointPath("/result").setBody({ taskId }).asyncSend();
        console.log(json);
      } while(!json.imageURL);
    } catch (error) {
      debugger;
      console.error("Error fetching AI response:", error);
      AiChatView.shared().addMessage(
        "systemMessage",
        "Error fetching AI response. Make sure the model is selected and the API key is correct.",
        "Host",
        LocalUser.shared().id()
      );
      return undefined
    }

    const imageCropper = ImageCropper.clone();
    imageCropper.setImageUrl(json.imageURL);
    imageCropper.setBoundsAsRatios({ x: 0, y: 0, w: 0.5, h: 0.5 }); //image #1
    return await imageCropper.asyncCrop();
  }
}.initThisClass());

