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

    let icon;
    if (type === "chat") {
      icon = "🗯️";
    } else if (type === "ai-response") {
      icon = "🤖";
    } else {
      icon = "🔧";
    }
    let avatar;
    if (userId === Session.shared().localUserId()) {
      avatar = Session.shared().localUserAvatar();
    } else {
      avatar = Session.shared().getUserAvatar(userId);
    }
    const formattedResponse = message.convertToParagraphs();
    const sanitizedHtml = DOMPurify.sanitize(formattedResponse);
    const messagesDiv = document.querySelector(".chatMessages");
    const messageWrapper = document.createElement("div");
    messageWrapper.className = "message-wrapper";

    const iconDiv = document.createElement("div");
    iconDiv.className = "icon";
    iconDiv.innerHTML = icon;

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

    messageWrapper.appendChild(iconDiv);
    messageWrapper.appendChild(messageContent);
    messagesDiv.appendChild(messageWrapper);
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

      if (LocalHost.shared().isHost()) {
        // Add chat to chat history
        Session.shared().addToHistory({
          type: "chat",
          data: message,
          id: Session.shared().localUserId(),
          nickname: Session.shared().hostNickname(),
        });
        // Display chat message
        this.addLocalChatMessage(message);
        // Broadcast chat message to all connected guests

        LocalHost.shared().broadcast({
          type: "chat",
          id: Session.shared().localUserId(),
          message: message,
          nickname: Session.shared().hostNickname(),
        });
      } else {
        // Send chat message to host
        RemoteHost.shared().connToHost().send({
          type: "chat",
          id: Session.shared().localUserId(),
          message: message,
          nickname: Session.shared().guestNickname(),
        });
        this.guestAddLocalChatMessage(message);
      }
    }
  }

  addLocalChatMessage(message) {
    Session.shared().addToHistory({
      type: "chat",
      data: message,
      id: Session.shared().localUserId(),
      nickname: Session.shared().hostNickname(),
    });
    GroupChatView.shared().addChatMessage(
      "chat",
      message,
      Session.shared().hostNickname(),
      Session.shared().localUserId()
    );
  }

  guestAddLocalChatMessage(message) {
    GroupChatView.shared().addChatMessage(
      "chat",
      message,
      Session.shared().guestNickname(),
      Session.shared().localUserId()
    );
  }
}.initThisClass());

GroupChatView.shared();
