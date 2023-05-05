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

  addMessage(type, message, nickname, userId) {
    // If the string is empty, don't add it
    if (message === "" || message === undefined) {
      return;
    }
    let avatar;
    if (userId === LocalUser.shared().id()) {
      avatar = LocalUser.shared().avatar();
    } else {
      avatar = Session.shared().getUserAvatar(userId);
    }
    const messageContent = document.createElement("div");
    let icon;
    let isUser = false;
    if (type === "prompt") {
      loadingAnimation.style.display = "inline";
      icon = "👤";
      isUser = true;
    } else if (type === "aiResponse") {
      loadingAnimation.style.display = "none";
      icon = "🤖";
      // Check if in session, then if host, and if so, add a button to generate an image prompt

      if (App.shared().isHost() && Session.shared().inSession()) {
        // Create a new icon/button element for the AI responses
        const generateImagePromptButton = document.createElement("button");
        generateImagePromptButton.textContent = "🎨";
        generateImagePromptButton.className = "generate-image-prompt-button";
        generateImagePromptButton.setAttribute(
          "data-tooltip",
          "Show this scene"
        );

        // Add an event listener to the icon/button
        generateImagePromptButton.addEventListener("click", () => {
          AiChatView.shared().addMessage(
            "image-gen",
            "Generating image...",
            "Host",
            LocalUser.shared().id()
          );
          triggerImageBot(sanitizedHtml);
          // Optional: Hide the button after it has been clicked
          generateImagePromptButton.style.display = "none";
        });

        // Append the icon/button to the message content
        messageContent.appendChild(generateImagePromptButton);
      }
    } else if (type === "image-gen") {
      loadingAnimation.style.display = "inline";
      icon = "🎨";
    } else if (type === "systemMessage") {
      icon = "🔧";
    } else {
      icon = "🦔";
    }

    const formattedResponse = message.convertToParagraphs();
    const sanitizedHtml = DOMPurify.sanitize(formattedResponse);
    const messagesDiv = document.querySelector(".messages");
    const messageWrapper = document.createElement("div");
    messageWrapper.className = "message-wrapper";

    const iconDiv = document.createElement("div");
    iconDiv.className = "icon";
    iconDiv.innerHTML = icon;

    const img = document.createElement("img");
    img.className = "message-avatar";
    img.width = 50;
    img.height = 50;
    img.src = avatar || "resources/icons/default-avatar.png"; // Use a default avatar image if the user doesn't have one
    messageContent.appendChild(img);

    messageContent.className = "message-content";

    if (!isUser) {
      messageWrapper.className += " aiMessage";
    }

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
    messageWrapper.appendChild(iconDiv);
    messageWrapper.appendChild(messageContent);

    // Add "Begin Session" button for welcome messages
    if (type === "welcome-message") {
      const beginSessionButton = document.createElement("button");
      beginSessionButton.textContent = "Begin Session";
      beginSessionButton.className = "begin-session-button";
      beginSessionButton.addEventListener("click", () => {
        // Add your desired action when the "Begin Session" button is clicked
        SessionOptionsView.shared().startSession(
          Session.shared().groupSessionType(),
          Session.shared().groupSessionDetails()
        );
        console.log(
          "Begin Session button clicked " +
            Session.shared().groupSessionType() +
            " " +
            Session.shared().groupSessionDetails()
        );
      });
      messageContent.appendChild(beginSessionButton);
    }
    messagesDiv.appendChild(messageWrapper);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    //const scrollView = messagesDiv.parentNode
    //scrollView.scrollTop = scrollView.scrollHeight;
  }

  addImage(imageURL) {
    let icon;
    let isUser = false;
    loadingAnimation.style.display = "none";
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

const loadingAnimation = document.getElementById("loadingHost");
