"use strict";

/* 
    AiChatView

*/

(class AiChatView extends View {
  initPrototypeSlots() {
    this.newSlot("messageInput", null);
    this.newSlot("messageInputRemote", null);
  }

  init() {
    super.init();
    this.setId("userPanel");
    this.setupMessageInput();
    this.setupMessageInputRemote();
  }

  setupMessageInput() {
    const textArea = TextAreaInputView.clone()
      .setId("messageInput")
      .setSubmitFunc(() => {
        AiChatView.shared().addPrompt();
      });

    this.setMessageInput(textArea);
    if (App.shared().isHost()) {
      textArea.unhide()
    }
  }

  setupMessageInputRemote() {
    const textArea = TextAreaInputView.clone()
      .setId("messageInputRemote")
      .setSubmitFunc(() => {
        GuestSession.shared().sendGuestPrompt();
      });

    this.setMessageInputRemote(textArea);

    if (!App.shared().isHost()) {
      textArea.unhide()
    }
  }

  addAIReponse(response) {
    Sounds.shared().playReceiveBeep();
    AiChatView.shared().addMessage(
      "aiResponse",
      response,
      SessionOptionsView.shared().selectedModelNickname(),
      "AiAvatar"
    );
  }

  loadingAnimation () {
    return document.getElementById("loadingHost");
  }

  setShowLoading (aBool) {
    this.loadingAnimation().style.display = aBool ? "inline" : "none";
    return this;
  }

  isShowingLoading () {
    return this.loadingAnimation().style.display !== "none";
  }

  // ========================================================

  genImageButtonFor (sanitizedHtml) {
    // Create a new icon/button element for the AI responses
    const button = document.createElement("button");
    button.textContent = "🎨";
    button.className = "generate-image-prompt-button";
    button.setAttribute(
      "data-tooltip",
      "Show this scene"
    );

    // Add an event listener to the icon/button
    button.addEventListener("click", () => {
      AiChatView.shared().addMessage(
        "image-gen",
        "Generating image...",
        "Host",
        LocalUser.shared().id()
      );
      OpenAiImageBot.shared().setSceneDescription(sanitizedHtml).trigger();
      // Optional: Hide the button after it has been clicked
      button.style.display = "none";
    });

    return button
  }

  addMessage(type, message, nickname, userId) {
    assert(message);

    let avatar;
    if (type === "aiResponse") {
      avatar = 'resources/icons/AI-avatar.png';
    } else {
      avatar = Session.shared().getUserAvatar(userId);
    }

    const m = MessageView.clone();
    m.setAvatar(avatar);
    m.setNickname(nickname);
    m.setText(message);
    this.addMessageElement(m.element());

  // ---------

    let isUser = false;
    if (type === "prompt") {
      this.setShowLoading(true)
      isUser = true;
    } else if (type === "aiResponse") {
      this.setShowLoading(false);
      if (App.shared().isHost() && Session.shared().inSession()) {
        m.element().appendChild(this.genImageButtonFor(m.text()));
      }
    } else if (type === "image-gen") {
      this.setShowLoading(true);
    } else if (type === "systemMessage") {
    } 

    if (!isUser) {
      m.element().className += " aiMessage";
    }

    this.addMessageElement(m.element());

    OpenAiMusicBot.shared().setSceneDescription(m.text()).trigger();
  }

  // --------------------------------------------------------

  scrollViewContentElement () {
    return document.querySelector(".messages");
  }

  addMessageElement(element) {
    this.scrollViewContentElement().appendChild(element);
    setTimeout(() => {
      this.scrollToBottom();
    }, 10);
  }

  scrollToBottom () {
    const sc = this.scrollViewContentElement();
    const scrollView = sc.parentNode;
    scrollView.scrollTop = scrollView.scrollHeight;
  }

  // ----------------------------------------------------------------

  //addMusicTrack(

  addImage(imageURL) {
    const iv = ImageMessageView.clone().setImageUrl(imageURL).setIsUser(false);
    this.addMessageElement(iv.element());
  }

  addPrompt() {
    Sounds.shared().playSendBeep();
    const input = document.getElementById("messageInput");
    const message = input.value.trim();
    if (message === "") return;
    input.value = "";
    Session.shared().addToHistory({
      type: "prompt",
      data: message,
      id: LocalUser.shared().id(),
      nickname: LocalUser.shared().nickname(),
    });
    AiChatView.shared().addMessage(
      "prompt",
      message,
      LocalUser.shared().nickname(),
      LocalUser.shared().id()
    );
    HostSession.shared().sendPrompt(message);
  }

  guestAddPrompt(data) {
    Sounds.shared().playReceiveBeep();
    AiChatView.shared().addMessage(
      "prompt",
      data.message,
      data.nickname,
      data.id
    );
  }

  guestAddSystemMessage(data) {
    Sounds.shared().playReceiveBeep();
    AiChatView.shared().addMessage(
      "systemMessage",
      data.message,
      data.nickname,
      data.id
    );
  }

  guestAddLocalPrompt(prompt) {
    Sounds.shared().playSendBeep();
    AiChatView.shared().addMessage(
      "prompt",
      prompt,
      LocalUser.shared().nickname(),
      LocalUser.shared().id()
    );
  }

  guestAddHostAIResponse(response, nickname) {
    Sounds.shared().playReceiveBeep();
    AiChatView.shared().addMessage(
      "aiResponse",
      response,
      nickname,
      "AiAvatar"
    );
  }
}).initThisClass();

AiChatView.shared(); // so a shared instance gets created

