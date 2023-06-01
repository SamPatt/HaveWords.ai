"use strict";

/* 
    AiChatColumn

*/

(class AiChatColumn extends View {
  initPrototypeSlots() {
    this.newSlot("messageInput", null);
    this.newSlot("messageInputRemote", null);
    this.newSlot("sessionTitle", null);
    this.newSlot("copyTranscriptButton", null);
    this.newSlot("requestIdToMessageMap", null);
    this.newSlot("scrollView", null);
  }

  init() {
    super.init();
    this.setId("AiChatColumn");
    this.setRequestIdToMessageMap(new Map());
    this.setupMessageInput();
    this.setupMessageInputRemote();
    this.setSessionTitle(View.clone().setId("SessionDescription"));
    this.setCopyTranscriptButton(Button.clone().setId("CopyTranscriptButton").setTarget(this));

    this.setScrollView(ScrollView.clone().setId("aiScrollingOutput"));
  }

  onSubmit_CopyTranscriptButton () {
    const s = this.transcript();
    s.copyToClipboard();
  }

  transcript () {
    const texts = []
    const className = "message-content"; //"message-text";
    const messageContentElements = this.scrollView().contentView().element().querySelectorAll('.' + className);
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
        this.addPrompt();
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

  addAIReponse(text, requestId) {
    Sounds.shared().playReceiveBeep();

    const messageView = this.addMessage(
      "aiResponse",
      text,
      SessionOptionsView.shared().selectedModelNickname(),
      "AiAvatar",
      requestId
    );
  }

  updateAIResponse(requestId, text) {
    const shouldScroll = this.scrollView().isScrolledToBottom()
    const messageView = this.requestIdToMessageMap().get(requestId);
    if (!messageView) {
      console.warn("missing messageView for requestId: ", requestId);
      return;
    }
    messageView.setText(text);
    if (shouldScroll) {
      this.scrollView().scrollToBottom();
    }
  }

  // ========================================================

  addMessage(type, message, nickname, userId, requestId) {
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
    m.setRequestId(requestId);
    this.addMessageView(m);

    if (requestId) {
      this.requestIdToMessageMap().set(requestId, m);
    }

    // ---------

    let isUser = true;
    if (type === "prompt") {
      m.setIsUser(true);

    } else if (type === "aiResponse") {
      m.setIsUser(false);

      if (App.shared().isHost() && Session.shared().inSession()) {
        if (SessionOptionsView.shared().allowsImageGen()) {
          m.addImageGenButton();
        }
      }
    } else if (type === "systemMessage") {
      m.setIsUser(false);

    } 

    this.addMessageView(m);
    return m
  }

  onAiResponseCompleteText (text, requestId) {
    const m = this.requestIdToMessageMap().get(requestId);

    if (m) {
      // update book/chapter/etc if found
      if (m.chapterNumber() && m.chapterTitle()) {
        this.sessionTitle().setString(m.chapterNumber() + ": " + m.chapterTitle());
      } else if(m.bookTitle()) {
        this.sessionTitle().setString(m.bookTitle());
      }
    } else {
      console.warn("onAiResponseCompleteText couldn't find message for requestId:" + requestId);
    }

    // Trigger music only if host and in session
    if (App.shared().isHost() && Session.shared().inSession() && text) {
      OpenAiMusicBot.shared().setSceneDescription(text).trigger();
    }

    AzureTextToSpeech.shared().asyncSpeakTextIfAble(text);
  }

  // --------------------------------------------------------

  addMessageView(aView) {
    this.scrollView().addItemView(aView);
    setTimeout(() => {
      this.scrollView().scrollToBottom();
    }, 10);
  }

  clearMessages () {
    this.scrollView().contentView().clear(); 
    this.requestIdToMessageMap().clear();
  }

  // ----------------------------------------------------------------

  updateImageProgressJson (json) {
    const messageView = this.requestIdToMessageMap().get(json.requestId);
    messageView.updateImageProgressJson(json);
  }

  addImage(imageUrl, requestId) {
    const messageView = this.requestIdToMessageMap().get(requestId);
    messageView.setImageUrl(imageUrl);
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
    this.addMessage(
      "prompt",
      message,
      LocalUser.shared().nickname(),
      LocalUser.shared().id()
    );
    HostSession.shared().sendPrompt(message);
  }

  guestAddPrompt(data) {
    Sounds.shared().playReceiveBeep();
    this.addMessage(
      "prompt",
      data.message,
      data.nickname,
      data.id
    );
  }

  guestAddSystemMessage(data) {
    Sounds.shared().playReceiveBeep();
    this.addMessage(
      "systemMessage",
      data.message,
      data.nickname,
      data.id
    );
  }

  guestAddLocalPrompt(prompt) {
    Sounds.shared().playSendBeep();
    this.addMessage(
      "prompt",
      prompt,
      LocalUser.shared().nickname(),
      LocalUser.shared().id()
    );
  }

  guestAddHostAIResponse(json) {
    Sounds.shared().playReceiveBeep();
    const messageView = this.addMessage(
      "aiResponse",
      json.message,
      json.nickname,
      "AiAvatar",
      json.requestId
    );
  }
}).initThisClass();

AiChatColumn.shared(); // so a shared instance gets created

