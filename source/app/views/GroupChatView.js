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
    const messagesDiv = document.querySelector(".chatMessages");

    let avatar;
    if (userId === LocalUser.shared().id()) {
      avatar = LocalUser.shared().avatar();
    } else {
      avatar = Session.shared().getUserAvatar(userId);
    }

    const m = MessageView.clone()
    m.setAvatar(avatar)
    m.setNickname(nickname)
    m.setText(message)
    messagesDiv.appendChild(m.element());

    /*
    const formattedResponse = message.convertToParagraphs();
    const sanitizedHtml = DOMPurify.sanitize(formattedResponse);
    const messageWrapper = document.createElement("div");
    messageWrapper.className = "message-wrapper";

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    const messageNickname = document.createElement("div");
    messageNickname.className = "message-nickname";
    messageNickname.textContent = nickname;

    const img = document.createElement("img");
    img.className = "message-avatar";
    img.width = 50;
    img.height = 50;
    img.src = avatar || "resources/icons/default-avatar.png"; // Use a default avatar image if the user doesn't have one

    const avatarAndNameWrapper = document.createElement("div");
    avatarAndNameWrapper.className = "avatar-and-name-wrapper";
    avatarAndNameWrapper.appendChild(img);
    avatarAndNameWrapper.appendChild(messageNickname);

    messageContent.appendChild(avatarAndNameWrapper);

    const messageText = document.createElement("div");
    messageText.className = "message-text";
    messageText.innerHTML = sanitizedHtml;
    messageContent.appendChild(messageText);

    messageWrapper.appendChild(messageContent);
    messagesDiv.appendChild(messageWrapper);
    */
    const scrollView = messagesDiv.parentNode;
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
