"use strict";

/* 
    OpenAiImageGen

*/

(class OpenAiImageGen extends OpenAiService {
  initPrototypeSlots() {}

  init() {
    super.init();
  }

  newRequest () {
    const request = OpenAiRequest.clone();
    request.setApiUrl("https://api.openai.com/v1/images/generations");
    request.setApiKey(this.apiKey());
    return request;
  }

  // Calls the OpenAI Image API and returns the image URL
  // fetchOpenAIImageResponse
  async asyncFetch(prompt, sessionType, sessionDetails) {
    // Changes prompt based on session type
    let imagePrompt;
    if (sessionType === "fantasyRoleplay") {
      // Change prompt based on session details
      if (sessionDetails === "Studio Ghibli") {
        imagePrompt =
          prompt + " | anime oil painting high resolution ghibli inspired 4k";
      } else if (sessionDetails === "Harry Potter") {
        imagePrompt =
          "Pen and ink sketch of " + prompt + " in a Harry Potter world.";
      } else {
        imagePrompt =
          "Pen and ink sketch of " +
          prompt +
          " in a " +
          sessionDetails +
          " world.";
      }
    } else if (sessionType === "trivia") {
      imagePrompt = "Illustration of a trivia game with a question about " + prompt;
    } else if (sessionType === "explore") {
      imagePrompt = prompt + " | oil painting high resolution 4k"
    } else {
      // other session types later
    }
    const request = this.newRequest().setBodyJson({
      prompt: imagePrompt,
      n: 1,
      size: "512x512",
    });

    let json = undefined;
    try {
      json = await request.asyncSend();
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

    const imageURL = json.data[0].url;
    return imageURL;
  }
}.initThisClass());


/*
(class OpenAiImageRequest extends OpenAiRequest {
  initPrototypeSlots() {}

  init() {
    super.init();
    this.setApiUrl("https://api.openai.com/v1/images/generations");
  }

}.initThisClass());
*/

