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

// ----------------------------------------------------------------

async function addLocalChatMessage(message) {
  Session.shared().addToHistory({
    type: "chat",
    data: message,
    id: id,
    nickname: hostNickname,
  });
  addChatMessage("chat", message, hostNickname);
}

async function guestAddLocalChatMessage(message) {
  addChatMessage("chat", message, guestNickname);
}

function addChatMessage(type, message, nickname) {
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
  messageWrapper.appendChild(iconDiv);
  messageWrapper.appendChild(messageContent);
  messagesDiv.appendChild(messageWrapper);
  const scrollView = messagesDiv.parentNode;
  scrollView.scrollTop = scrollView.scrollHeight;
}
