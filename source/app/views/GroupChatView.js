"use strict";

/* 
    GroupChatView

*/

(class GroupChatView extends View {
  initPrototypeSlots() {}

  init() {
    super.init();
    this.setId("chatMessages");
  }
}.initThisClass());

function sendChatMessage() {
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
      addLocalChatMessage(message);
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
      guestAddLocalChatMessage(message);
    }
  }
}

// Disables the chat send button until the data channel is open
const chatSendButton = document.getElementById("chatSendButton");
chatSendButton.addEventListener("click", sendChatMessage);

// --- chat input ---

const chatInput = document.getElementById("chatInput");
chatInput.addEventListener("keypress", (event) => {
  const enterKeyCode = 13;
  if (event.keyCode === enterKeyCode && !event.shiftKey) {
    event.preventDefault(); // prevent new line
    sendChatMessage();
  }
});

// --- username ---


async function addLocalChatMessage(message) {
  Session.shared().addToHistory({
    type: "chat",
    data: message,
    id: Session.shared().localUserId(),
    nickname: Session.shared().hostNickname(),
  });
  addChatMessage("chat", message, Session.shared().hostNickname(), Session.shared().localUserId());
}

async function guestAddLocalChatMessage(message) {
  addChatMessage("chat", message, Session.shared().guestNickname(), Session.shared().localUserId());
}

function addChatMessage(type, message, nickname, userId) {
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
  const avatar = Session.shared().getUserAvatar(userId);
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
  messageContent.appendChild(messageNickname);

  const messageText = document.createElement("div");
  messageText.className = "message-text";
  messageText.innerHTML = sanitizedHtml;
  messageContent.appendChild(messageText);

  const img = document.createElement('img');
  img.className = 'message-avatar';
  img.width = 50;
  img.height = 50;
  img.src = avatar || 'resources/icons/default-avatar.png'; // Use a default avatar image if the user doesn't have one
   messageContent.appendChild(img);

  messageWrapper.appendChild(iconDiv);
  messageWrapper.appendChild(messageContent);
  messagesDiv.appendChild(messageWrapper);
  const scrollView = messagesDiv.parentNode;
  scrollView.scrollTop = scrollView.scrollHeight;
}
