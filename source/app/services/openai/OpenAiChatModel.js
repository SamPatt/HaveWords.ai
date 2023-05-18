"use strict";

/* 
    OpenAiChatModel

*/

(class OpenAiChatModel extends Base {
  initPrototypeSlots() {
    this.newSlot("name", null);
    this.newSlot("isAvailable", undefined);
    this.newSlot("isChecking", false);
  }

  init() {
    super.init();
  }

  apiKey () {
    return OpenAiService.shared().apiKey();
  }

  async asyncCheckAvailability () {
    if (!this.apiKey()) {
      return null
    }

    assert(this.name());

    const request = this.newRequest().setBodyJson({
      model: this.name(),
      messages: [{
        role: "user",
        content: `Respond only with the word "hello".`,
      }],
      temperature: 0, 
      top_p: 0 
    });

    this.setIsChecking(true);
    const json = await request.asyncSend();
    this.setIsChecking(false);
    if (json.error) {
      /*
        TODO: 
        - add check for "model does not exist" to ensure it's a model error
        - otherwise, retry with backoff?
      */
      this.setIsAvailable(false);
    } else {
      this.setIsAvailable(true);
    }
    return this.isAvailable();
  }

  newRequest() {
    const request = OpenAiRequest.clone();
    request.setApiUrl("https://api.openai.com/v1/chat/completions");
    request.setApiKey(this.apiKey());
    return request;
  }

}.initThisClass());
