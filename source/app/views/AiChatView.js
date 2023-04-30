"use strict";

/* 
    AiChatView

*/

(class AiChatView extends View {
  initPrototypeSlots() {
    this.newSlot("messageInput", null)
    this.newSlot("messageInputRemote", null)
    //this.newSlot("usernameField", null)
  }

  init() {
    super.init();
    this.setId("userPanel");
    //this.setUsernameField(UsernameView.shared())
    this.setupMessageInput()
    this.setupMessageInputRemote()
  }

  setupMessageInput () {
    const textArea = TextAreaInputView.clone().setId("messageInput").setSubmitFunc(() => { 
      addPrompt();
    });

    this.setMessageInput(textArea)
  }

  setupMessageInputRemote () {
    const textArea = TextAreaInputView.clone().setId("messageInputRemote").setSubmitFunc(() => { 
      guestSendPrompt();
    });

    this.setMessageInputRemote(textArea)
  }


}.initThisClass());

AiChatView.shared() // so a shared instance gets created

const loadingAnimation = document.getElementById("loadingHost");


function addMessage(type, message, nickname) {
  // If the string is empty, don't add it
  if (message === "" || message === undefined) {
    return;
  }

  const messageContent = document.createElement("div");
  let icon;
  let isUser = false;
  if (type === "prompt") {
    loadingAnimation.style.display = "inline";
    icon = "👤";
    isUser = true;
  } else if (type === "ai-response") {
    loadingAnimation.style.display = "none";
    icon = "🤖";
    // Check if in session, then if host, and if so, add a button to generate an image prompt
    
      if (Peers.shared().isHost() && Session.shared().inSession()) {
        // Create a new icon/button element for the AI responses
        const generateImagePromptButton = document.createElement("button");
        generateImagePromptButton.textContent = "🎨";
        generateImagePromptButton.className = "generate-image-prompt-button";
        generateImagePromptButton.setAttribute("data-tooltip", "Show this scene");

        // Add an event listener to the icon/button
        generateImagePromptButton.addEventListener("click", () => {
          addMessage("image-gen", "Generating image...", "Host");
          triggerImageBot(sanitizedHtml);
          // Optional: Hide the button after it has been clicked
          generateImagePromptButton.style.display = "none";
        });

      // Append the icon/button to the message content
      messageContent.appendChild(generateImagePromptButton);
    }
  } else if (type === "image-gen") {
    loadingAnimation.style.display = "inline";
    icon = "🎨";  }
  else if (type === "system-message") {
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

  messageContent.className = "message-content";

  if (!isUser) {
    messageWrapper.className += " aiMessage";
  }

  const messageNickname = document.createElement("div");
  messageNickname.className = "message-nickname";
  messageNickname.textContent = nickname;
  messageContent.appendChild(messageNickname);

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
      startSession(Session.shared().groupSessionType(), Session.shared().groupSessionDetails());
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

function addImage(imageURL) {
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


async function addAIReponse(response) {
  Sounds.shared().playReceiveBeep();
  addMessage("ai-response", response, selectedModelNickname);
}


async function addPrompt() {
  Sounds.shared().playSendBeep();
  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  if (message === "") return;
  input.value = "";
  Session.shared().addToHistory({
    type: "prompt",
    data: message,
    id: Session.shared().localUserId(),
    nickname: Session.shared().hostNickname(),
  });
  addMessage("prompt", message, Session.shared().hostNickname());
  sendPrompt(message);
}

async function guestAddPrompt(data) {
  Sounds.shared().playReceiveBeep();
  addMessage("prompt", data.message, data.nickname);
}

async function guestAddSystemMessage(data) {
  Sounds.shared().playReceiveBeep();
  addMessage("system-message", data.message, data.nickname);
}

async function guestAddLocalPrompt(prompt) {
  Sounds.shared().playSendBeep();
  addMessage("prompt", prompt, Session.shared().guestNickname());
}

async function guestAddHostAIResponse(response, nickname) {
  Sounds.shared().playReceiveBeep();
  addMessage("ai-response", response, nickname);
}




async function sendAIResponse(message, nickname) {
  // Get AI Response and post locally
  
  const response = await OpenAiChat.shared().asyncFetch(message);

  addAIReponse(response);

  Peers.shared().broadcast({
    type: "ai-response",
    id: Session.shared().localUserId(),
    message: response,
    nickname: selectedModelNickname,
  });
}
