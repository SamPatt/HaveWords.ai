"use strict";

/* 
    OpenAi

    OpenAiChat.shared().conversationHistory()

    OpenAiChat.shared().addToConversation(json)


    fetchOpenAITextResponse

    OpenAiChat.shared().fetch(prompt)

*/

(class OpenAiChat extends Base {
  initPrototypeSlots () {
    this.newSlot("aiModel", null)
    this.newSlot("aiRole", null)
    this.newSlot("conversationHistory", null)
    //this.newSlot("activeRequests", null)
    this.newSlot("apiUrl", "https://api.openai.com/v1/chat/completions")
  }

  init () {
    super.init();
    this.setConversationHistory([])
    //this.setActiveRequests([])
  }

  setApiKey (key) {
    localStorage.setItem("openai_api_key", key)
    return this
  }

  apiKey () {
    return localStorage.getItem("openai_api_key")
  }

  /*
  newRequest () {
    const request = OpenAiChatRequest.clone()
    request.setApiKey(this.apiKey())
    request.send()
    this.activeRequests().push(request)
  }
  */

  addToConversation (json) {
    this.conversationHistory().push(json)
    return this
  }

  clearConversationHistory () {
    this.conversationHistory().clear()
    return this
  }

  async asyncFetch (prompt) {
    const apiKey = this.apiKey();
    if (!apiKey) {
      console.error("API key is missing.");
      addMessage("system-message", "API key is missing.", "System");
      return;
    }
    
    const aiModelSelect = document.getElementById("aiModel");
    const selectedModel = aiModelSelect.value;
  
    this.addToConversation({
      role: "user",
      content: prompt,
    })
  
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: this.conversationHistory(),
      }),
    };
  
    try {
      const response = await fetch(this.apiUrl(), requestOptions);
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
  
      // Add the assistant's response to the conversation history
      this.addToConversation({
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

}.initThisClass());

/* -------------------------------------------------------- */

(class OpenAiChatRequest extends Base {
  initPrototypeSlots () {
    this.newSlot("prompt", null)
    this.newSlot("apiKey", null)
    this.newSlot("apiUrl", "https://api.openai.com/v1/chat/completions")
  }

  init () {
    super.init();
  }


}.initThisClass());


/* --- being openai calls --- */

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
