"use strict";

/* 
    MJImageGen

*/

(class MJImageGen extends MJService {
  initPrototypeSlots() {
    this.newSlot("prompt", null);
    this.newSlot("mjVersion", "5");
  }

  newRequest () {
    const request = MJRequest.clone();
    request.setService(this);
    return request;
  }

  resultJson() {
    return this.newRequest().setEndpointPath("/imagine").setBody({
      prompt: this.prompt() + " --v " + this.mjVersion()
    }).asyncSend();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Calls the OpenAI Image API and returns the image URL fetchOpenAIImageResponse
  async asyncFetch() {
    assert(this.prompt());
    assert(this.mjVersion());

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

    return json.imageURL;
  }
}.initThisClass());

