"use strict";

/* 
    UsersView

    UsersView.shared().updateUserList()
*/

(class UsersView extends View {
  initPrototypeSlots() {}

  init() {
    super.init();
    this.setId("userList");
    this.initAvatar();
  }
  
  initAvatar() {
    console.log("Setting up avatar section")
    const avatarSection = document.getElementById("avatarSection");
    
    // Add a label for the avatar file input
    this.avatarInputLabel = document.createElement("label");
    this.avatarInputLabel.innerHTML = "Upload Avatar";
    this.avatarInputLabel.htmlFor = "avatarInput";
    avatarSection.appendChild(this.avatarInputLabel);
  
    // Avatar input
    this.avatarInput = document.createElement("input");
    this.avatarInput.type = "file";
    this.avatarInput.id = "avatarInput";
    this.avatarInput.accept = "image/*";
    this.avatarInput.addEventListener("change", this.handleAvatarChange.bind(this));
    avatarSection.appendChild(this.avatarInput);
    // Avatar display
    this.avatarDisplay = document.createElement("img");
    this.avatarDisplay.width = 50;
    this.avatarDisplay.height = 50;
    this.avatarDisplay.style.display = "none";
    this.avatarDisplay.addEventListener("click", () => {
      this.avatarInput.click();
    });
    avatarSection.appendChild(this.avatarDisplay);
    // Check if there's already an avatar in localStorage
    if (localStorage.getItem("avatar")) {
      this.avatarDisplay.src = localStorage.getItem("avatar");
      this.avatarDisplay.style.display = "block";
      this.avatarInputLabel.style.display = "none";
      this.avatarInput.style.display = "none";
    }
  }
  
  updateUserList() {
    const userList = document.getElementById("userList");
    userList.innerHTML = "";

    LocalHost.shared()
      .dataChannels()
      .forEachKV((guestId, channel) => {
        const guestToken = channel.token;
        const aGuestNickname = channel.nickname;

        // Create a container for the user and their actions
        const userContainer = document.createElement("div");
        userContainer.classList.add("user-container");

        // Create the user list item and add an arrow indicator
        const listItem = document.createElement("li");
        listItem.textContent = aGuestNickname;
        listItem.setAttribute("data-id", guestId);
        listItem.setAttribute("data-token", guestToken);

        const arrowIndicator = document.createElement("span");
        arrowIndicator.textContent = " ▼";
        arrowIndicator.classList.add("arrow-indicator");
        listItem.appendChild(arrowIndicator);

        // Create user action buttons
        const userActions = document.createElement("div");
        userActions.classList.add("user-actions");

        // AI Access button
        const canSendPromptsButton = document.createElement("button");
        canSendPromptsButton.textContent = channel.canSendPrompts
          ? "Revoke AI access"
          : "Grant AI access";
        canSendPromptsButton.onclick = () => {
          channel.canSendPrompts = !channel.canSendPrompts;

          canSendPromptsButton.textContent = channel.canSendPrompts
            ? "Revoke AI access"
            : "Grant AI access";

          if (channel.canSendPrompts) {
            channel.conn.send({ type: "grant-ai-access" });
          } else {
            channel.conn.send({ type: "revoke-ai-access" });
          }
        };
        userActions.appendChild(canSendPromptsButton);

        userContainer.appendChild(listItem);

        // Voice request button
        handleVoiceRequestButton(userActions, guestId);

        // Kick button
        const kickButton = document.createElement("button");
        kickButton.textContent = "Kick";
        kickButton.onclick = () => {
          LocalHost.shared().kickUser(guestId);
        };
        userActions.appendChild(kickButton);

        const muteButton = document.createElement("button");
        muteButton.textContent = "Mute";
        muteButton.onclick = () => {
          // Mute logic
        };
        userActions.appendChild(muteButton);

        const banButton = document.createElement("button");
        banButton.textContent = "Ban";
        banButton.onclick = () => {
          // Ban logic
          LocalHost.shared().banUser(guestId, guestToken);
        };
        userActions.appendChild(banButton);

        // Add user actions to the user container and set it to be hidden by default
        userActions.style.display = "none";
        userContainer.appendChild(userActions);

        // Show or hide user actions when the arrow indicator is clicked
        arrowIndicator.onclick = () => {
          if (userActions.style.display === "none") {
            userActions.style.display = "block";
          } else {
            userActions.style.display = "none";
          }
        };

        // Add the user container to the user list
        userList.appendChild(userContainer);
      });
  }

  // These functions update the list of connected guests and display the user actions menu

  displayGuestUserList() {
    const userList = document.getElementById("userList");
    userList.innerHTML = "";

    LocalHost.shared()
      .guestUserList()
      .forEach((guestUser, id) => {
        const aGuestNickname = guestUser.nickname;

        // Create a container for the user and their actions
        const userContainer = document.createElement("div");
        userContainer.classList.add("user-container");

        // Create the user list item and add an arrow indicator
        const listItem = document.createElement("li");
        listItem.textContent = aGuestNickname;
        listItem.setAttribute("data-id", guestUser.id);

        const arrowIndicator = document.createElement("span");
        arrowIndicator.textContent = " ▼";
        arrowIndicator.classList.add("arrow-indicator");
        listItem.appendChild(arrowIndicator);

        userContainer.appendChild(listItem);

        // Create user action buttons
        const userActions = document.createElement("div");
        userActions.classList.add("user-actions");

        // Voice request button

        handleVoiceRequestButton(userActions, guestUser.id);

        // Mute button
        const muteButton = document.createElement("button");
        muteButton.textContent = "Mute";
        muteButton.onclick = () => {
          // Mute logic
        };
        userActions.appendChild(muteButton);

        // Add user actions to the user container and set it to be hidden by default
        userActions.style.display = "none";
        userContainer.appendChild(userActions);

        // Show or hide user actions when the arrow indicator is clicked
        arrowIndicator.onclick = () => {
          if (userActions.style.display === "none") {
            userActions.style.display = "block";
          } else {
            userActions.style.display = "none";
          }
        };

        // Add the user container to the user list
        userList.appendChild(userContainer);
      });
  }

  displayKickedMessage() {
    const chatOutput = document.getElementById("chatOutput");
    const kickedMessage = document.createElement("li");
    kickedMessage.classList.add("kicked-message");
    kickedMessage.textContent = "You've been kicked.";
    chatOutput.appendChild(kickedMessage);

    const chatSendButton = document.getElementById("chatSendButton");
    chatSendButton.disabled = true;
  }

  updateUserName() { // update from UI
    const username = UsernameView.shared().string();
    if (username.trim() !== "") {
      if (LocalHost.shared().isHost()) {
        // Set new host nickname and send to all guests
        const oldNickname = Session.shared().hostNickname();
        if (oldNickname === username) {
          return;
        }
        Session.shared().setHostNickname(username);
        GroupChatView.shared().addChatMessage(
          "chat",
          `${oldNickname} is now ${Session.shared().hostNickname()}.`,
          Session.shared().hostNickname(),
          Session.shared().localUserId()
        );

        const json = {
          type: "nickname-update",
          message: `${oldNickname} is now ${Session.shared().hostNickname()}.`,
          nickname: Session.shared().hostNickname(),
          oldNickname: oldNickname,
          newNickname: Session.shared().hostNickname(),
          guestUserList: LocalHost.shared().updateGuestUserlist(),
        };

        LocalHost.shared().broadcast(json)

        /*
        LocalHost.shared()
          .dataChannels()
          .forEachKV((guestId, channel) => {
            channel.conn.send(json);
          });
          */
      } else {
        // Set new guest nickname and send to host
        Session.shared().setGuestNickname(username);
        RemoteHost.shared().sendUsername(username);
      }
    }
  }

  updateAvatar(avatar) { // update from UI
    if (avatar !== "") {
      if (LocalHost.shared().isHost()) {
        // Update host avatar and send to all guests
        const oldAvatar = Session.shared().hostAvatar();
        if (oldAvatar === avatar) {
          return;
        }
        Session.shared().setHostAvatar(avatar);
        LocalHost.shared().updateHostAvatar(oldAvatar, avatar);
      } else {
        // Set new guest avatar and send to host
        Session.shared().setGuestAvatar(avatar);
        RemoteHost.shared().sendAvatar(avatar);
      }
    }
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
    Session.shared().setLocalUserAvatar(base64Image);
        
    // If the user is the host, update the host avatar
    if (LocalHost.shared().isHost()) {
      LocalHost.shared().updateHostAvatar(base64Image);
    } else {
      // If the user is a guest, send the avatar update to the host
      RemoteHost.shared().sendAvatar(base64Image);
    }
  }
  

  displayAvatar(base64Image) {
    this.avatarDisplay.src = base64Image;
    this.avatarDisplay.style.display = "block";
    this.avatarInputLabel.style.display = "none";
    this.avatarInput.style.display = "none";
  }


}.initThisClass());
