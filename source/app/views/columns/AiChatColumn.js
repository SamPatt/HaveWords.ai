"use strict";

/* 
    AiChatColumn

*/

(class AiChatColumn extends ColumnView {
  initPrototypeSlots() {
    this.newSlot("messageInput", null);
    this.newSlot("messageInputRemote", null);
    this.newSlot("sessionTitle", null);
    this.newSlot("copyTranscriptButton", null);
    this.newSlot("requestIdToMessageMap", null);
  }

  init() {
    super.init();
    this.setId("AiChatColumn");
    this.setRequestIdToMessageMap(new Map());
    this.setupMessageInput();
    this.setupMessageInputRemote();
    this.setSessionTitle(View.clone().setId("SessionDescription"));
    this.setCopyTranscriptButton(Button.clone().setId("CopyTranscriptButton").setTarget(this));

    this.setScrollView(ScrollView.clone().setId("AiChatColumn_ScrollView"));
    this.scrollView().contentView().setId("AiChatMessages");
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

  updateAIResponseJson(json) {
    const requestId = json.requestId;
    const text = json.message;
    const shouldScroll = this.scrollView().isScrolledToBottom()
    const messageView = this.requestIdToMessageMap().get(requestId);
    if (!messageView) {
      console.warn("missing messageView for requestId: ", requestId);
      return;
    }
    messageView.setText(text);
    messageView.setIsStreaming(!json.isDone);
    if (shouldScroll) {
      this.scrollView().scrollToBottom();
    }

    if (App.shared().isHost()) {
      messageView.requestImageIfSummaryAvailable(); // this should be in a AiResponseMessage object
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

      if (m.playerInfo()) {
        //debugger;
        const json = JSON.parse(m.playerInfo().removedHtmlTags());
        if (json && json.name) {
          const player = App.shared().session().players().playerWithName(json.name);
          if (player) {
            player.setData(json);
            player.generateImageFromAppearance();
            App.shared().session().players().onChange();
          }
        }
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
    if (messageView) {
      messageView.updateImageProgressJson(json);
    } else {
      console.warn("no messageView with id '" + json.requestId + "'");
    }
  }

  addImage(imageUrl, requestId) {
    const messageView = this.requestIdToMessageMap().get(requestId);
    if (messageView) {
      messageView.setImageUrl(imageUrl);
    } else {
      console.warn("no messageView with id '" + json.requestId + "'");
    }
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

  // --- history ---


  displayHistory(history) {
    history.forEach((item) => {
      if (item.type === "prompt") {
        this.addMessage(
          item.type,
          item.data,
          item.nickname,
          item.id
        );
      } else if (item.type === "aiResponse") {
        this.addMessage(
          item.type,
          item.data,
          item.nickname,
          item.id
        );
      } else if (item.type === "systemMessage") {
        this.addMessage(
          item.type,
          item.data,
          item.nickname,
          item.id, 
          item.requestId
        );
      } else if (item.type === "chat") {
        GroupChatColumn.shared().addChatMessage(
          item.type,
          item.data,
          item.nickname,
          item.id
        );
      } else if (item.type === "imageLink") {
        this.addImage(item.data);
      }
    });
  }

  guestDisplayHostSessionHistory(sessionData) {
    this.displayHistory(sessionData);
  }

  displaySessionHistory() {
    this.displayHistory(Session.shared().history());
  }

}).initThisClass();

AiChatColumn.shared(); // so a shared instance gets created

