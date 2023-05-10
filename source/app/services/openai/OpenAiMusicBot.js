"use strict";

/* 
    

*/

(class OpenAiMusicBot extends OpenAiService {
  initPrototypeSlots() {
    this.newSlot("sceneDescription", null);
  }

  init() {
    super.init();
    this.setIsDebugging(false);
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
    this.debugLog("music bot prompt: '" + this.prompt()  + "'");

    const data = await request.asyncSend();
    const response = data.choices[0].message.content;
    this.debugLog("music bot response: '" + response + "'");
    this.handlePromptResponse(response);
    //HostSession.shared().broadcastMusic(Music.shared().trackId());
  }

  prompt () {
    assert(this.sceneDescription());
    let s = "Given this scene description:\n"
    s += "[[" + this.sceneDescription() + "]]\n";
    s += "Which one of the following music tracks do you feel would be most appropriate for that scene:";
    s += Music.shared().trackNames().map(s => '"' + s + '"').join(",");
    s += "\nPlease only respond with the track name you chose in double quotes and only suggest a track name from the list provided."
    return s;
  }

  handlePromptResponse(s) {
    this.debugLog("handlePromptResponse('" + s + "'");
    if (s.startsWith("\"") && s.endsWith("\"")) {
      const trackName = s.slice(1, -1); // remove the quotes
      Music.shared().playTrackWithName(trackName);
    } else {
      this.debugLog("ERROR: response not in valid quoted format");
    }
    return this;
  }

}).initThisClass();
