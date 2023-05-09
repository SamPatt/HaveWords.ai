"use strict";

/* 
    

*/

(class OpenAiMusicBot extends OpenAiService {
  initPrototypeSlots() {
    this.newSlot("sceneDescription", null);
  }

  init() {
    super.init();
  }

  newRequest() {
    const request = OpenAiRequest.clone();
    request.setApiUrl("https://api.openai.com/v1/chat/completions");
    request.setApiKey(this.apiKey());
    return request;
  }

  // ImageBot function it triggered when the host requests an image description of the current scene
  async trigger() {
    assert(this.sceneDescription());
    assert(this.apiKey());

    const request = this.newRequest().setBodyJson({
      model: SessionOptionsView.shared().aiModel(), //"gpt-3.5-turbo",
      messages: [{ 
        role: "user", 
        content: this.prompt() 
      }]
    });
    console.log("music bot prompt: '" + this.prompt()  + "'");

    const data = await request.asyncSend();
    const response = data.choices[0].message.content;
    console.log("music bot response: '" + response + "'");
    this.handlePromptResponse(response);
    //HostSession.shared().broadcastMusic(Music.shared().trackId());
  }

  prompt () {
    assert(this.sceneDescription());

    let s = "Which one of the following music track names:";
    s += Music.shared().trackNames().map(s => '"' + s + '"').join(",");
    s += " do you feel would be most appropriate for the following content:\n\n"
    s += "[[" + this.sceneDescription() + "]]";
    s += "\n\nPlease only respond with the words \"play track:\" followed by the track name you chose in double quotes.";
    return s;
  }

  handlePromptResponse(response) {
    this.debugLog("handlePromptResponse('" + response + "'");
    if (response.startsWith("play track:")) {
      const parts = response.split("play track:");
      const quoted = parts[1].trim();
      const quotedParts = quoted.split('"');
      const trackName = quotedParts[1];
      Music.shared().playTrackWithName(trackName);
    }
    return this;
  }

}).initThisClass();
