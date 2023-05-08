"use strict";

/* 
    AvatarView
*/

class UsernameView extends TextFieldView {
  initPrototypeSlots() {}

  init() {
    super.init();
    this.setId("username");
    this.setSubmitFunc(() => {
      UsersView.shared().updateUserName();
    });

    // Add a label for the avatar file input
    this.avatarInputLabel = document.createElement("label");
    this.avatarInputLabel.innerHTML = "Upload Avatar";
    this.avatarInputLabel.htmlFor = "avatarInput";
    this.element().parentNode.appendChild(this.avatarInputLabel);

    // Avatar input
    this.avatarInput = document.createElement("input");
    this.avatarInput.type = "file";
    this.avatarInput.id = "avatarInput";
    this.avatarInput.accept = "image/*";
    this.avatarInput.addEventListener("change", (event) => { this.handleAvatarChange(event); });
    this.element().parentNode.appendChild(this.avatarInput);

    // Avatar display
    this.avatarDisplay = document.createElement("img");
    this.avatarDisplay.width = "50px";
    this.avatarDisplay.height = "50px";
    
    this.avatarDisplay.style.display = "none";
    this.avatarDisplay.addEventListener("click", () => {
      this.avatarInput.click();
    });
    this.element().parentNode.appendChild(this.avatarDisplay);

    // Check if there's already an avatar in localStorage
    const avatar = LocalUser.shared().avatar()
    if (avatar) {
      this.avatarDisplay.src = avatar;
      this.avatarDisplay.style.display = "block";
      this.avatarInputLabel.style.display = "none";
      this.avatarInput.style.display = "none";
    }
  }

  setString(s) {
    this.element().value = s;
    return this;
  }

  string() {
    return this.element().value;
  }

  onKeyUp(event) {
    super.onKeyUp(event);
    this.resizeWidthToFitContent();
  }

  resizeWidthToFitContent() {
    const e = this.element();

    let size = e.value.length ? e.value.length : e.placeholder.length;
    size *= 1.1;
    e.setAttribute("size", size + "em");
    return this;
  }

  async handleAvatarChange(event) {
    const file = event.target.files[0];
    const maxSizeInBytes = 10 * 1024; // 10 KB
    const targetWidth = 50;
    const targetHeight = 50;

    if (file) {
      const base64Image = await this.resizeImage(file, targetWidth, targetHeight);
      const imageSizeInBytes = atob(base64Image.split(",")[1]).length;

      if (imageSizeInBytes <= maxSizeInBytes) {
        this.storeAvatar(base64Image);
        this.displayAvatar(base64Image);
      } else {
        alert("Image size is too large. Please choose a smaller image.");
      }
    }
  }

  async resizeImage(file, targetWidth, targetHeight) {
    const image = new Image();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    return new Promise((resolve, reject) => {
      image.onload = () => {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        context.drawImage(image, 0, 0, targetWidth, targetHeight);
        const resizedImage = canvas.toDataURL(file.type);
        resolve(resizedImage);
      };
      image.onerror = (error) => {
        reject(error);
      };
      image.src = URL.createObjectURL(file);
    });
  }

  storeAvatar(base64Image) {
    if (LocalUser.shared().avatar() !== base64Image) {
      LocalUser.shared().setAvatar(base64Image).shareAvatar();

      GroupChatView.shared().addChatMessage(
        "chat",
        `You updated your avatar.`,
        LocalUser.shared().nickname(),
        LocalUser.shared().id()
      );
    }
  }
  
  displayAvatar(base64Image) {
    this.avatarDisplay.src = base64Image;
    this.avatarDisplay.style.display = "block";
    this.avatarInputLabel.style.display = "none";
    this.avatarInput.style.display = "none";
  }
}

UsernameView.initThisClass();
