"use strict";

/* 
    MJImageGen

*/

(class MJImageGen extends MJService {
  initPrototypeSlots() {
    this.newSlot("prompt", null);
  }

  init() {
    super.init();
  }

  newRequest () {
    const request = MJRequest.clone();
    request.setApiUrl("???);
    request.setApiKey(this.apiKey());
    return request;
  }

  // Calls the OpenAI Image API and returns the image URL fetchOpenAIImageResponse
  async asyncFetch() {
    assert(this.prompt());

    const request = this.newRequest().setBodyJson({
      prompt: this.prompt(),
      n: 1,
      size: "512x512",
    });

    let json = undefined;
    try {
      json = await request.asyncSend();
    } catch (error) {
      debugger;
      console.error("Error fetching response:", error);
      AiChatView.shared().addMessage(
        "systemMessage",
        "Error fetching AI response. Make sure the model is selected and the API key is correct.",
        "Host",
        LocalUser.shared().id()
      );
      return undefined
    }

    const imageURL = json.data[0].url;
    return imageURL;
  }
}.initThisClass());

