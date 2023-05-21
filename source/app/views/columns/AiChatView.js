"use strict";

/* 
    AiChatView

*/

(class AiChatView extends View {
  initPrototypeSlots() {
    this.newSlot("messageInput", null);
    this.newSlot("messageInputRemote", null);
    this.newSlot("sessionTitle", null);
    this.newSlot("copyTranscriptButton", null);
  }

  init() {
    super.init();
    this.setId("aiChatColumn");
    this.setupMessageInput();
    this.setupMessageInputRemote();
    this.setSessionTitle(View.clone().setId("SessionDescription"));
    this.setCopyTranscriptButton(Button.clone().setId("CopyTranscriptButton").setTarget(this));
  }

  onSubmit_CopyTranscriptButton () {
    const s = this.transcript();
    s.copyToClipboard();
  }

  transcript () {
    const texts = []
    const className = "message-content"; //"message-text";
    const messageContentElements = this.scrollViewContentElement().querySelectorAll('.' + className);
    for (const m of messageContentElements) {
      const nicknames = m.querySelectorAll('.message-nickname');
      if (nicknames.length) {
        const nickname = nicknames[0].innerText;
        const messageTexts = m.querySelectorAll('.message-text');
        if (messageTexts.length) {
          let text = messageTexts[0].innerText;
          text = text.replaceAll("\n\n\n", "\n\n");
          text = text.replaceAll("\n\n\n", "\n\n");
          const s = nickname.toUpperCase() + ":\n" + text;
          texts.push(s);
        }
      }
    }
    if (App.shared().isHost()) {
      texts.shift(); // remove the first element which is a welcome message
    }
    return texts.join("\n\n");
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
    //button.textContent = "🎨";
    button.className = "generate-image-prompt-button";
    button.setAttribute(
      "data-tooltip",
      "Show this scene"
    );

    const buttonView = Button.clone().setElement(button);
    buttonView.setIconPath("resources/icons/image.svg");
    buttonView.iconElement().style.opacity = 0.5;

    button.style.width = "1.5em";
    button.style.height = "1.5em";
    button.style.position = "absolute";
    button.style.top = "1em";


    // Add an event listener to the icon/button
    button.addEventListener("click", () => {
      AiChatView.shared().addMessage(
        "image-gen",
        "Generating image...",
        "Host",
        LocalUser.shared().id()
      );
      ImageBot.shared().setSceneDescription(sanitizedHtml).trigger();
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
      nickname = "Narrator";
    } else {
      avatar = Session.shared().getUserAvatar(userId);
    }

    const m = MessageView.clone();
    m.setAvatar(avatar);
    m.setNickname(nickname);
    m.setText(message);
    this.addMessageElement(m.element());

    // ---------

    let isUser = true;
    if (type === "prompt") {

      this.setShowLoading(true)

    } else if (type === "aiResponse") {
      isUser = false;

      // update book/chapter/etc if found
      if (m.chapterNumber() && m.chapterTitle()) {
        this.sessionTitle().setString(m.chapterNumber() + ": " + m.chapterTitle());
      } else if(m.bookTitle()) {
        this.sessionTitle().setString(m.bookTitle());
      }

      this.setShowLoading(false);
      if (App.shared().isHost() && Session.shared().inSession()) {
        if (SessionOptionsView.shared().allowsImageGen()) {
          m.element().appendChild(this.genImageButtonFor(m.text()));
        }
      }
      this.onAiResponseText(m.text());

    } else if (type === "image-gen") {

      this.setShowLoading(true);

    } else if (type === "systemMessage") {
    } 

    m.setIsUser(isUser);

    this.addMessageElement(m.element());

    if(App.shared().isHost()) {
      SessionOptionsView.shared().applySessionUiPrefs();
    }
  }

  onAiResponseText (text) {
      // Trigger music only if host and in session
      if (App.shared().isHost() && Session.shared().inSession()) {
        OpenAiMusicBot.shared().setSceneDescription(text).trigger();
      }

      // Trigger Text to Speech
      AzureTextToSpeech.shared().asyncSpeakTextIfAble(text);
  }

  // --------------------------------------------------------

  scrollViewContentElement () {
    //return document.querySelector(".messages");
    return document.querySelector("#AiChatMessages");
  }

  addMessageElement(element) {
    this.scrollViewContentElement().appendChild(element);
    setTimeout(() => {
      this.scrollToBottom();
    }, 10);
  }

  scrollToBottom () {
    const scrollView = document.querySelector("#aiScrollingOutput");
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

