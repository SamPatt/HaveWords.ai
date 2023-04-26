"use strict";

/* 
    OpenAi

*/

(class OpenAi extends Base {
  initPrototypeSlots () {
    //this.newSlot("idb", null)
  }

  init () {
    super.init();
  }

}.initThisClass());



/* --- being openai calls --- */

// Calls the OpenAI LLM API and returns the response
async function fetchOpenAITextResponse(prompt) {
  const apiKey = localStorage.getItem("openai_api_key");
  if (!apiKey) {
    console.error("API key is missing.");
    addMessage("system-message", "API key is missing.", "System");
    return;
  }

  const apiUrl = "https://api.openai.com/v1/chat/completions";

  const aiModelSelect = document.getElementById("aiModel");
  const selectedModel = aiModelSelect.value;

  // Add the user's message to the conversation history
  conversationHistory.push({
    role: "user",
    content: prompt,
  });

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: conversationHistory,
    }),
  };

  try {
    const response = await fetch(apiUrl, requestOptions);
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Add the assistant's response to the conversation history
    conversationHistory.push({
      role: "assistant",
      content: aiResponse,
    });
    // Save the conversation history to local storage
    const sessionData = loadSessionData();
    sessionData.history.push({
      type: "ai-response",
      data: aiResponse,
      id: id,
      nickname: selectedModelNickname,
    });
    saveSessionData(sessionData);

    return aiResponse;
  } catch (error) {
    console.error("Error fetching AI response:", error);
    addMessage(
      "system-message",
      "Error fetching AI response. Make sure the model is selected and the API key is correct.",
      "Host"
    );
  }
}

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
    "\n\n Image description: ";
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
  const imageURL = await fetchOpenAIImageResponse(
    imageDescription,
    groupSessionType,
    groupSessionDetails
  );
  sendImage(imageURL);
  addImage(imageURL);
  console.log(`Image description: ${imageDescription}`);
}

// Calls the OpenAI Image API and returns the image URL
async function fetchOpenAIImageResponse(prompt, sessionType, sessionDetails) {
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
        "A cute animated still from Spirited Away (2001) showing " + prompt;
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

/* // Sends AI responses from fetchOpenAITextResponse to ChatGPT to determine if it should trigger actions
async function triggerBot(response, sessionType, sessionDetails) {
  const apiKey = localStorage.getItem('openai_api_key');
  if (!apiKey) {
    console.error("API key is missing.");
    addMessage("system-message", "API key is missing.", "System");
    return;
  }
  const fantasyRoleplayPrompt = `Respond only with JSON.\n\nMy friends and I are playing a roleplaying fantasy game. We will send our game messages to you. I will refer to the messages as scenes.\n\nYour job is to trigger certain actions if you identify certain events happening in the scenes. Your message should never include two "Trigger:" messages, only one. If you respond with "Trigger: Yes" you must also include an "Image: Description" response with a description of the scene. This description will generate an image, so keep your description brief and only include words which are simple to represent visually, do not include the names of the characters in the prompt. Here are the events you are looking for, and the actions to trigger:\n\n1) EVENT:  A new monster, new player character, or new non-player character is being introduced in the scene. ACTION: Respond with a "Trigger: Yes" section in your JSON and an "Image: Description" section, where Description is replaced with a prompt you've created to describe the new monster or character being introduced.\n\n2) EVENT: Combat has started, or a serious threat has been introduced in the scene. ACTION: Respond with a "Trigger: Yes" section in your JSON, and an "Image: Description" section describing the scene.\n\n3) EVENT: The party has defeated a monster and ended combat, or otherwise completed an impressive achievement in the scene. ACTION: Respond with a "Trigger: Yes" section in your JSON, and an "Image: Description" describing the scene.\n\n4) EVENT: The party has entered a tavern, inn, or celebrating with a large group in the scene. ACTION: Respond with a "Trigger: Yes" section in your JSON, and an "Image: Description" section describing the scene.\n\n5) EVENT:  The setting in the scene changes significantly, and the new scenery is being described. ACTION: Respond with a "Trigger: Yes" section in your JSON and an "Image: Description" section, where Description is replaced with a prompt you've created to describe the new scene being introduced. This prompt will be used to generate a new image, so make the prompt as descriptive as you can given the information from the scene.\n\nIf multiple events occur within the same scene, respond with multiple actions.\n\nIf you detect none of these happening in the scene, respond with a "Trigger: No" section in your JSON.\n\nExamples\n\nScene: A group of gnolls approaches. The gnolls are humanoid creatures with the head of a hyena and the body of a human. They stand about 7 feet tall and with their wiry builds, they can move quickly and gracefully. You can see from their sharpened teeth and claws that they are fierce predators, and their beady eyes gleam with hunger and malice.\n\nYour response:\n\n{\n"Trigger": "Yes",\n"Image": "A group of 7-foot-tall gnolls with the head of a hyena and the body of a human approach with sharpened teeth and claws, gleaming with hunger and malice."\n}\n\nScene: You met a dozen villagers or so - mostly women, children, and elderly - sheltering behind hastily erected barricades, wielding whatever makeshift weapons they could find. They are dressed in simple clothes and have weathered faces, evidence of the harsh desert terrain they live in. They are relieved and grateful as you approach them, thanking you repeatedly for your help.\n\n{\n"Trigger": "Yes",\n"Image": "A group of women, children, and elderly villagers dressed in simple, ragged clothes, living in the desert, showing gratitude"\n}\n\nScene: You bid farewell to the grateful villagers and decide to continue your journey through the vast desert of Avaloria. As you walk, the sandy dunes seem to stretch endlessly before you, and the sun beats down relentlessly. You find a rocky outcropping where you can rest and eat. You notice that there is a winding path that seems to lead up the outcropping. Do you investigate or continue walking through the desert?\n\n{\n"Trigger": "Yes",\n"Image": "A rocky outcropping in the desert with a winding path leading up to it"\n}\n\n\nScene: You decide to rest for a while in the shade of the rocky outcropping. As you settle in, you notice that there are some signs of a recent fire nearby. Do you investigate the fire or continue resting?\n\n{\n"Trigger": "No"\n}\n\nScene: You approach the sealed doors of the ancient temple and inspect them closely. It seems that the doors have been sealed for centuries, and it will require a great deal of strength to move the stone blocks that have been placed there.\n\nDo you want to try and move the blocks yourself or investigate the surrounding area for clues on how to open the doors?\n\n{\n"Trigger": "No"\n}\n\nScene:`
  let triggerPrompt;
  if(sessionType === "fantasyRoleplay") {
    triggerPrompt = fantasyRoleplayPrompt;
    } else {
      // other session types later
      console.log("No session type for triggerBot found.")
    }  
  const message = triggerPrompt + response;
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      "model": "gpt-3.5-turbo",
      "messages": [{"role": "user", "content": message}]
    }),
  };
  const AIresponse = await fetch(apiUrl, requestOptions);
  const data = await AIresponse.json();
  const rawTrigger = data.choices[0].message.content;
  let trigger;
  if (isValidJSON(rawTrigger)) {
    const cleanedResponse = removeWhitespace(rawTrigger);
    trigger = JSON.parse(cleanedResponse);

    // Rest of the code...
  } else {
    console.error("Invalid JSON data:", response);
  }
  // If an image is triggered, send the image prompt to the image API
  if (trigger["Trigger"] === "Yes") {
    if ("Image" in trigger) {
      const imageDescription = trigger["Image"];
      const imageURL = await fetchOpenAIImageResponse(imageDescription, "fantasyRoleplay", sessionDetails);
      console.log("event triggered, image: " + imageURL);
      sendImage(imageURL);
      addImage(imageURL);
      console.log(`Image description: ${imageDescription}`);
    }
  } else {
    console.log("No event triggered");
  }
  
} */

/* -- end openai calls --- */