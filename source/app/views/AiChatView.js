"use strict";

/* 
    AiChatView

*/

(class AiChatView extends View {
  initPrototypeSlots() {
    this.newSlot("messageInput", null);
    this.newSlot("messageInputRemote", null);
    //this.newSlot("usernameField", null)
  }

  init() {
    super.init();
    this.setId("userPanel");
    //this.setUsernameField(UsernameView.shared())
    
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

  setShowLoading (aBool) {
    const loadingAnimation = document.getElementById("loadingHost");
    loadingAnimation.style.display = aBool ? "inline" : "none";
    return this;
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
      triggerImageBot(sanitizedHtml);
      // Optional: Hide the button after it has been clicked
      button.style.display = "none";
    });

    return button
  }

  addMessage(type, message, nickname, userId) {
    // If the string is empty, don't add it
    if (!message) {
      return;
    }

    const formattedResponse = message.convertToParagraphs();
    const sanitizedHtml = DOMPurify.sanitize(formattedResponse);

    let avatar;
    if (type === "aiResponse") {
      avatar = 'resources/icons/AI-avatar.png';
    } else {
      avatar = Session.shared().getUserAvatar(userId);
    }

    const m = MessageView.clone()
    m.setAvatar(avatar)
    m.setNickname(nickname)
    m.setText(message)
    this.addMessageElement(m.element());

  // ---------

    let isUser = false;
    if (type === "prompt") {
      this.setShowLoading(true)
      isUser = true;
    } else if (type === "aiResponse") {
      this.setShowLoading(false)
      // Check if in session, then if host, and if so, add a button to generate an image prompt

      if (App.shared().isHost() && Session.shared().inSession()) {

        // Append the icon/button to the message content
        m.element().appendChild(this.genImageButtonFor());
      }
    } else if (type === "image-gen") {
      this.setShowLoading(true)
    } else if (type === "systemMessage") {
    } 

    /*

    const messagesDiv = document.querySelector(".messages");
    const messageWrapper = document.createElement("div");
    messageWrapper.className = "message-wrapper";

    const img = document.createElement("img");
    img.className = "message-avatar";
    img.width = 50;
    img.height = 50;
    img.src = avatar || "resources/icons/default-avatar.png"; // Use a default avatar image if the user doesn't have one
    messageContent.appendChild(img);

    messageContent.className = "message-content";
    */

    if (!isUser) {
      m.element().className += " aiMessage";
    }

    this.addMessageElement(m.element());

    /*
    const messageNickname = document.createElement("div");
    messageNickname.className = "message-nickname";
    messageNickname.textContent = nickname;

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
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    //const scrollView = messagesDiv.parentNode
    //scrollView.scrollTop = scrollView.scrollHeight;
    */
  }

  // --------------------------------------------------------

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
    return document.querySelector(".messages");
  }

  addMessageElement(element) {
    this.scrollViewContentElement().appendChild(element);
    this.scrollToBottom()
  }

  scrollToBottom () {
    const sc = this.scrollViewContentElement();
    const scrollView = sc.parentNode;
    scrollView.scrollTop = scrollView.scrollHeight;
  }

  // ----------------------------------------------------------------

  addImage(imageURL) {
    let icon;
    let isUser = false;
    this.setShowLoading(false);
    const messagesDiv = document.querySelector(".messages");
    const messageWrapper = document.createElement("div");
    messageWrapper.className = "message-wrapper";

    const iconDiv = document.createElement("div");
    iconDiv.className = "icon";
    iconDiv.innerHTML = icon;

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    if (!isUser) {
      messageWrapper.className += " aiMessage";
    }

    const imageElement = document.createElement("img");
    imageElement.src = imageURL;
    imageElement.className = "message-image";

    const imageContainer = document.createElement("div"); // Create a new div for the image container
    imageContainer.className = "image-container"; // Set the new class for the image container

    imageContainer.appendChild(imageElement); // Append the image to the image container
    messageContent.appendChild(imageContainer); // Append the image container to the message content

    messageWrapper.appendChild(iconDiv);
    messageWrapper.appendChild(messageContent);

    messagesDiv.appendChild(messageWrapper);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    this.scrollToBottom();
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

