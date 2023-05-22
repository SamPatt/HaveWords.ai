"use strict";

/* 
    ImageBot.js
*/

(class ImageBot extends Base {
  initPrototypeSlots() {
    this.newSlot("sceneDescription", null);
    this.newSlot("imageGen", null);
  }

  // ImageBot function it triggered when the host requests an image description of the current scene
  async trigger() {
    assert(this.sceneDescription());

    const request = OpenAiRequest.clone();
    request.setApiUrl("https://api.openai.com/v1/chat/completions");
    request.setApiKey(OpenAiService.shared().apiKey());
    request.setBodyJson({
        model: SessionOptionsView.shared().aiModel(),
        messages: [{ 
            role: "user", 
            content: this.prompt() 
        }]
    });

    const data = await request.asyncSend();
    const imageDescription = data.choices[0].message.content;

    const fullImageDescription = SessionOptionsView.shared().artPromptPrefix() + " " + imageDescription + SessionOptionsView.shared().artPromptSuffix();
    console.log("Image description: " + fullImageDescription);

    this.imageGen().setPrompt(fullImageDescription);
    const imageURL = await this.imageGen().asyncFetch();
    HostSession.shared().broadcastImage(imageURL);
    AiChatView.shared().addImage(imageURL);
  }

  prompt() {
    return (
      `We are playing a roleplaying game and need a description of the current scene in order to generate an image. 
    I will give you the background information for the characters and setting, and then the details of the current scene. 
    Using what you know of the background, describe the current scene in a single sentence using simple language which can be used to generate an image. 
    Do not use character's names, or location names. 
    No proper nouns.\n\n${this.imageGen().systemInstructions()}Here is the current scene: \n\n ` +
      this.sceneDescription()
    );
  }
}).initThisClass();
