"use strict";

/* 
    OpenAiImageGen

    fetchOpenAIImageResponse() ->

    OpenAiImageGen.shared().asyncFetch(

*/

(class OpenAiImageGen extends Base {
  initPrototypeSlots() {}

  init() {
    super.init();
  }

  // Calls the OpenAI Image API and returns the image URL
  // fetchOpenAIImageResponse
  async asyncFetch (prompt, sessionType, sessionDetails) {
    const apiKey = localStorage.getItem("openai_api_key");
    if (!apiKey) {
      console.error("API key is missing.");
      addMessage("system-message", "API key is missing.", "System");
      return;
    }
    const apiUrl = "https://api.openai.com/v1/images/generations";
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
    } else {
      // other session types later
    }
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        n: 1,
        size: "512x512",
      }),
    };
    const response = await fetch(apiUrl, requestOptions);
    const responseData = await response.json();
    const imageURL = responseData.data[0].url;
    return imageURL;
  }
}.initThisClass());

/*
(class OpenAiImageRequest extends Base {
  initPrototypeSlots () {

  }

  init () {
    super.init();
  }

  
}.initThisClass());
*/

// ImageBot function it triggered when the host requests an image description of the current scene
async function triggerImageBot(response) {
  const apiKey = localStorage.getItem("openai_api_key");
  if (!apiKey) {
    console.error("API key is missing.");
    addMessage("system-message", "API key is missing.", "System");
    return;
  }
  const message =
    "We are playing a roleplaying game and need a description of the current scene in order to generate an image. I will give you the background information for the characters and setting, and then the details of the current scene. Using what you know of the background, describe the current scene in a single sentence using simple language which can be used to generate an image. Do not use character's names, or location names. No proper nouns. Here is the background for the scene: \n\n" +
    groupSessionFirstAIResponse +
    "\n\nHere is the current scene: \n\n " +
    response +
    "\n\n Image description of current scene: ";
  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    }),
  };
  const AIresponse = await fetch(apiUrl, requestOptions);
  const data = await AIresponse.json();
  const imageDescription = data.choices[0].message.content;
  const imageURL = await OpenAiImageGen.shared().asyncFetch(
    imageDescription,
    groupSessionType,
    groupSessionDetails
  );
  sendImage(imageURL);
  addImage(imageURL);
  console.log(`Image description: ${imageDescription}`);
}
