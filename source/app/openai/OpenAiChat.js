"use strict";

/* 
    OpenAiChat

*/

(class OpenAiChat extends OpenAiService {
  initPrototypeSlots() {
    this.newSlot("aiModel", null);
    this.newSlot("aiRole", null);
    this.newSlot("conversationHistory", null);
  }

  init() {
    super.init();
    this.setConversationHistory([]);
    //this.setActiveRequests([])
  }

  addToConversation(json) {
    this.conversationHistory().push(json);
    return this;
  }

  clearConversationHistory() {
    this.conversationHistory().clear();
    return this;
  }

  newRequest() {
    const request = OpenAiRequest.clone();
    request.setApiUrl("https://api.openai.com/v1/chat/completions");
    request.setApiKey(this.apiKey());
    //this.activeRequests().push(request)
    return request;
  }

  async asyncFetch(prompt) {
    const aiModelSelect = document.getElementById("aiModel");
    const selectedModel = aiModelSelect.value;

    this.addToConversation({
      role: "user",
      content: prompt,
    });

    const request = this.newRequest().setBodyJson({
      model: selectedModel,
      messages: this.conversationHistory(),
    });

    let json = undefined;
    try {
      json = await request.asyncSend();
    } catch (error) {
      debugger;
      console.error("Error fetching AI response:", error);
      addMessage(
        "system-message",
        "Error fetching AI response. Make sure the model is selected and the API key is correct.",
        "Host"
      );
      return undefined
    }

    const aiResponse = json.choices[0].message.content;

    // Add the assistant's response to the conversation history
    this.addToConversation({
      role: "assistant",
      content: aiResponse,
    });

    // Save the conversation history to local storage
    Session.shared().addToHistory({
      type: "ai-response",
      data: aiResponse,
      id: Session.shared().localUserId(),
      nickname: selectedModelNickname,
    });

    return aiResponse;
  }
}.initThisClass());
