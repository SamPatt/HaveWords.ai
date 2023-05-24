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
    this.newSlot("messageContentElement", null);
    this.newSlot("loadingContainer", null);
    this.newSlot("imageContainer", null);
    this.newSlot("requestId", null);
    this.newSlot("imageGenButton", null);
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
    this.setMessageContentElement(messageContent);

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

    // avatar name and wrapper
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

    
    // loading animation
    const loadingContainer = document.createElement("div");
    loadingContainer.className = "messageImageContainer"
    loadingContainer.innerHTML = this.dotsHtml();
    loadingContainer.style.display = "none";
    this.setLoadingContainer(loadingContainer);
    messageWrapper.appendChild(loadingContainer)

    // attached image
    const imageContainer = document.createElement("div");
    imageContainer.className = "messageImageContainer"
    this.setImageContainer(imageContainer);
    messageWrapper.appendChild(imageContainer);
    return this;
  }

  setIsStreaming (aBool) {
    this.loadingContainer().display = aBool ? "flex" : "none";
    return this;
  }

  dotsHtml () {
    return `<span class="dots"><span class="dot dot1">.</span><span class="dot dot2">.</span><span class="dot dot3">.</span>`;
  }

  centerDotsHtml () {
    return `<span class="dots"><span class="dot dot3">.</span><span class="dot dot2">.</span><span class="dot dot1">.</span><span class="dot dot2">.</span><span class="dot dot3">.</span>`;
  }

  setImageUrl (imageUrl) {
    if (!imageUrl) {
      this.setImageContainerText("Generating image" + this.dotsHtml());
    } else {
      const iv = ImageMessageView.clone().setImageUrl(imageUrl).setIsUser(false);
      this.imageContainer().innerHTML = "";
      this.imageContainer().appendChild(iv.element());
    }
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

  contentOfFirstElementOfClass(className) {
    const matches = this.element().querySelectorAll('.' + className); 
    if (matches.length) {
      return matches[0].innerHTML;
    }
    return undefined;
  }

  // --- helpers to get bits of tagged content ---

  chapterNumber () {
    return this.contentOfFirstElementOfClass('chapterNumber'); 
  }

  chapterTitle () {
    return this.contentOfFirstElementOfClass('chapterTitle'); 
  }

  bookTitle () {
    return this.contentOfFirstElementOfClass('bookTitle'); 
  }

  // isUser - this is duplicated in ImageMessageView

  setIsUser (aBool) {
    if (!aBool) {
      this.element().className += " aiMessage";
    } else {
      this.element().className += " nonAiMessage";
    }
    return this;
  }

  // --------------------------------

  addImageGenButton () {
    const button = this.newImageGenImageButton();
    this.setImageGenButton(button);
    this.element().appendChild(button);
    return this;
  }

  newImageGenImageButton () {
    assert(this.requestId());

    const button = document.createElement("button");
    button.className = "generate-image-prompt-button";
    button.setAttribute(
      "data-tooltip",
      "Generate image for this scene."
    );

    const buttonView = Button.clone().setElement(button);
    buttonView.setIconPath("resources/icons/image.svg");
    buttonView.iconElement().style.opacity = 0.5;

    button.style.width = "1.5em";
    button.style.height = "1.5em";
    button.style.position = "absolute";
    button.style.top = "1em";

    button.addEventListener("click", () => {
      this.setImageUrl(null); // to add loading animation
      ImageBot.shared().setSceneDescription(this.text()).setRequestId(this.requestId()).trigger();
      // Hide the button after it has been clicked
      this.hideImageGenButton();
    });

    return button
  }

  hideImageGenButton () {
    button.style.opacity = "none";
  }

  showImageGenButton () {
    button.style.display = "block";
  }

  updateImageProgressJson(json) {
    //debugger;
    if (json.status.includes("error")) {
      this.setImageContainerText("Error generating image: \"" + json.errorMessage + "\"");
      this.showImageGenButton();
    } else {
      if (json.percentage > 0) {
        this.setImageContainerText("Generating image " + json.percentage + "%" + this.dotsHtml());
      }
    }
  }

  setImageContainerText (text) {
    this.imageContainer().innerHTML = "<span style=\"opacity:0.5;\">" + text + "</span>";
    return this;
  }

}.initThisClass());

