"use strict";

/* 
    GroupChatView

*/

(class GroupChatView extends View {
  initPrototypeSlots() {
    this.newSlot("chatInput", null);
  }

  init() {
    super.init();
    this.setId("chatMessages");
    this.setupMessageInput();
  }

  setupMessageInput() {
    const textArea = TextAreaInputView.clone()
      .setId("chatInput")
      .setSubmitFunc(() => {
        this.sendChatMessage();
      });

    this.setChatInput(textArea);
  }

  addChatMessage(type, message, nickname, userId) {
    // If the string is empty, don't add it
    if (message === "") {
      return;
    }

    const avatar = Session.shared().getUserAvatar(userId);

    const m = MessageView.clone()
    m.setAvatar(avatar)
    m.setNickname(nickname)
    m.setText(message)
    this.addMessageElement(m.element());
  }

  scrollViewContentElement () {
    return document.querySelector(".chatMessages");
  }

  addMessageElement(element) {
    const sc = this.scrollViewContentElement();
    sc.appendChild(element);
    const scrollView = sc.parentNode;
    scrollView.scrollTop = scrollView.scrollHeight;
  }

  // ----------------------------------------------

  sendChatMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value;
    Sounds.shared().playSendBeep();

    if (message.trim() !== "") {
      input.value = "";

      if (App.shared().isHost()) {
        // Add chat to chat history
        Session.shared().addToHistory({
          type: "chat",
          data: message,
          id: LocalUser.shared().id(),
          nickname: LocalUser.shared().nickname(),
        });
        // Display chat message
        this.addLocalChatMessage(message);
        // Broadcast chat message to all connected guests

        HostSession.shared().broadcast({
          type: "chat",
          id: LocalUser.shared().id(),
          message: message,
          nickname: LocalUser.shared().nickname(),
        });
      } else {
        // Send chat message to host
        GuestSession.shared().send({
          type: "chat",
          id: LocalUser.shared().id(),
          message: message,
          nickname: LocalUser.shared().nickname(),
        });
        this.guestAddLocalChatMessage(message);
      }
    }
  }

  addLocalChatMessage(message) {
    Session.shared().addToHistory({
      type: "chat",
      data: message,
      id: LocalUser.shared().id(),
      nickname: LocalUser.shared().nickname(),
    });
    GroupChatView.shared().addChatMessage(
      "chat",
      message,
      LocalUser.shared().nickname(),
      LocalUser.shared().id()
    );
  }

  guestAddLocalChatMessage(message) {
    GroupChatView.shared().addChatMessage(
      "chat",
      message,
      LocalUser.shared().nickname(),
      LocalUser.shared().id()
    );
  }
}.initThisClass());

GroupChatView.shared();
