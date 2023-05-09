"use strict";

/* 

    MessageView



*/

(class MessageView extends Base {
  initPrototypeSlots() {
    this.newSlot("element", null);
    this.newSlot("avatarElement", null);
    this.newSlot("nicknameElement", null);
    this.newSlot("textElement", null);
  }

  init() {
    super.init();
    this.setupElement()
  }

  setupElement () {
    // element
    const messageWrapper = document.createElement("div");
    messageWrapper.className = "message-wrapper";
    this.setElement(messageWrapper);

    // content
    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    // nickname
    const nicknameElement = document.createElement("div");
    this.setNicknameElement(nicknameElement);
    nicknameElement.className = "message-nickname";

    // avatar
    const img = document.createElement("img");
    img.className = "message-avatar";
    img.width = 50;
    img.height = 50;
    img.src = "resources/icons/default-avatar.png"; // Use a default avatar image if the user doesn't have one
    this.setAvatarElement(img);

    const avatarAndNameWrapper = document.createElement("div");
    avatarAndNameWrapper.className = "avatar-and-name-wrapper";
    avatarAndNameWrapper.appendChild(img);
    avatarAndNameWrapper.appendChild(nicknameElement);

    messageContent.appendChild(avatarAndNameWrapper);

    // text content
    const messageText = document.createElement("div");
    messageText.className = "message-text";
    messageContent.appendChild(messageText);
    this.setTextElement(messageText);

    messageWrapper.appendChild(messageContent);
    return this;
  }

  // after creating the instance, these methods can be used to set bits of it's content

  setAvatar (imgSrc) {
    if (imgSrc) {
      this.avatarElement().src = imgSrc;
    }
    return this;
  }

  setNickname (aString) {
    this.nicknameElement().textContent = aString;
    return this;
  }

  setText (aString) {
    const formatted = aString.convertToParagraphs();
    const sanitizedHtml = DOMPurify.sanitize(formatted);
    this.textElement().innerHTML = sanitizedHtml;
    return this;
  }

  text () {
    return this.textElement().innerHTML;
  }

}.initThisClass());

