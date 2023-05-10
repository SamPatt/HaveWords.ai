"use strict";

/* 
    AvatarPickerView
*/

(class AvatarPickerView extends View {
  initPrototypeSlots() {
    this.newSlot("label", null);
    this.newSlot("input", null);
    this.newSlot("image", null);
  }

  init() {
    super.init();
    this.setId("avatarPicker");
    //debugger;

    const e = this.element()
    e.style.width = "fit-content";
    e.style.height = "fit-content";
    //e.style.border = "1px dashed red";

    this.setSubmitFunc(() => {
      UsersView.shared().updateUserName();
    });

    // Add a label for the avatar file input
    const label = document.createElement("label");
    this.setLabel(label);
    label.innerHTML = "Upload Avatar";
    label.htmlFor = "avatarInput";
    this.element().appendChild(label);

    // Avatar input
    const input = document.createElement("input");
    this.setInput(input);
    input.type = "file";
    input.id = "avatarInput";
    input.accept = "image/*";
    input.addEventListener("change", (event) => {
      this.handleAvatarChange(event);
    });
    this.element().appendChild(input);

    // Avatar display
    const image = document.createElement("img");
    this.setImage(image);
    image.className = "message-avatar";
    //image.style.width = "50px";
    //image.style.height = "50px";
    //image.style.borderRadius = "25px";

    e.addEventListener("click", () => {
      this.input().click();
    });
    this.element().appendChild(image);

    // Check if there's already an avatar in localStorage
    let avatar = LocalUser.shared().avatar();
    if (!avatar) {
      avatar = "resources/icons/default-avatar.png";
    }
    this.image().src = avatar;

    this.image().style.display = "block";
    this.input().style.display = "none";
    this.label().style.display = "none";
  }

  setString(s) {
    this.element().value = s;
    return this;
  }

  string() {
    return this.element().value;
  }

  async handleAvatarChange(event) {
    const file = event.target.files[0];
    const maxSizeInBytes = 10 * 1024; // 10 KB
    const targetWidth = 50;
    const targetHeight = 50;

    if (file) {
      const base64Image = await this.resizeImage(
        file,
        targetWidth,
        targetHeight
      );
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
    this.image().src = base64Image;
    /*
    this.avatarDisplay.style.display = "block";
    this.avatarInputLabel.style.display = "none";
    this.avatarInput.style.display = "none";
    */
  }
}).initThisClass();

AvatarPickerView.shared()