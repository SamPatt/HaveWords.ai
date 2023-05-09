"use strict";

/* 
    

*/

(class OpenAiImageBot extends OpenAiService {
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

    const data = await request.asyncSend();
    const imageDescription = data.choices[0].message.content;

    const fullImageDescription = SessionOptionsView.shared().artPromptPrefix() + imageDescription + SessionOptionsView.shared().artPromptSuffix();
    console.log("Image description: " + fullImageDescription);
    const gen =  OpenAiImageGen.clone().setPrompt(fullImageDescription);
    const imageURL = await gen.asyncFetch();
    HostSession.shared().broadcastImage(imageURL);
    AiChatView.shared().addImage(imageURL);
  }

  prompt() {
    return (
      `We are playing a roleplaying game and need a description of the current scene in order to generate an image. 
    I will give you the background information for the characters and setting, and then the details of the current scene. 
    Using what you know of the background, describe the current scene in a single sentence using simple language which can be used to generate an image. 
    Do not use character's names, or location names. 
    No proper nouns.\n\nHere is the current scene: \n\n ` +
      this.sceneDescription()
    );
  }
}).initThisClass();
