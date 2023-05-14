"use strict";

/* 
    OpenAiChat

*/

(class OpenAiChat extends OpenAiService {
  initPrototypeSlots() {
    //this.newSlot("model", "gpt-3.5-turbo");
    //this.newSlot("role", "user");
    this.newSlot("conversationHistory", null);
    this.newSlot("tokenBuffer", 400); // Buffer to ensure approximation doesn't exceed limit
    this.newSlot("initialMessagesCount", 3); // Number of initial messages to always keep
  }

  init() {
    super.init();
    this.setConversationHistory([]);
  }

  // Function to approximate token count
  approximateTokens(message) {
    return Math.ceil(message.length / 4);
  }

  addToConversation(json) {
    // Check if conversation length exceeds limit
    let currentTokenCount = this.conversationHistory().reduce((count, message) => {
      return count + this.approximateTokens(message.content);
    }, 0);

    const newMessageTokenCount = this.approximateTokens(json.content);

    // If new message would cause token count to exceed limit, remove old messages
    while (this.conversationHistory().length > this.initialMessagesCount() &&
      currentTokenCount + newMessageTokenCount + this.tokenBuffer() > 4096) {
      // Remove the oldest non-initial message
      const removedMessage = this.conversationHistory().splice(this.initialMessagesCount(), 1)[0];
      currentTokenCount -= this.approximateTokens(removedMessage.content);
    }

    this.conversationHistory().push(json);
    return this;
  }

  clearConversationHistory() {
    this.setConversationHistory([]);
    return this;
  }

  modelOptions () {
    return ["gpt-4", "gpt-4-0314", "gpt-4-32k", "gpt-4-32k-0314", "gpt-3.5-turbo", "gpt-3.5-turbo-0301"];
  }

  newRequest() {
    const request = OpenAiRequest.clone();
    request.setApiUrl("https://api.openai.com/v1/chat/completions");
    request.setApiKey(this.apiKey());
    //this.activeRequests().push(request)
    return request;
  }

  async asyncFetch(prompt) {
    const selectedModel = SessionOptionsView.shared().aiModel();
    assert(this.modelOptions().includes(selectedModel));

    this.addToConversation({
      role: "user",
      content: prompt,
    });

    //["gpt-4", "gpt-4-0314", "gpt-4-32k", "gpt-4-32k-0314", "gpt-3.5-turbo", "gpt-3.5-turbo-0301"]

    const request = this.newRequest().setBodyJson({
      model: selectedModel,
      messages: this.conversationHistory(),
      temperature: 0.7, // more creative
      top_p: 0.9 // more diverse
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

    if (json.error) {
      const errorMessage = this.type() + " asyncFetch() ERROR: " + json.error.message;
      console.warn(errorMessage);
      AiChatView.shared().addMessage(
        "systemMessage",
        errorMessage,
        "Host",
        LocalUser.shared().id()
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
      type: "aiResponse",
      data: aiResponse,
      id: LocalUser.shared().id(),
      nickname: SessionOptionsView.shared().selectedModelNickname(),
    });

    return aiResponse;
  }
}.initThisClass());
