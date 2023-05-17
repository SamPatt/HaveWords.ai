"use strict";

/* 

    ImageMessageView



*/

(class ImageMessageView extends Base {
  initPrototypeSlots() {
    this.newSlot("element", null);
    this.newSlot("imageElement", null);
  }

  init() {
    super.init();
    this.setupElement()
  }

  setupElement () {
    const messageWrapper = document.createElement("div");
    messageWrapper.className = "message-wrapper";
    this.setElement(messageWrapper);

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    const imageElement = document.createElement("img");
    imageElement.className = "message-image";
    this.setImageElement(imageElement);

    const imageContainer = document.createElement("div"); // Create a new div for the image container
    imageContainer.className = "image-container"; // Set the new class for the image container

    imageContainer.appendChild(imageElement); // Append the image to the image container
    messageContent.appendChild(imageContainer); // Append the image container to the message content

    messageWrapper.appendChild(messageContent);

    return this;
  }

  // after creating the instance, these methods can be used to set bits of it's content

  setIsUser (aBool) {
    if (!aBool) {
      this.element().className += " aiMessage";
    } else {
      this.element().className += " nonAiMessage";
    }
    return this;
  }

  setImageUrl (url) {
    this.imageElement().src = url;
    return this;
  }

}.initThisClass());

