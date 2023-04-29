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
  }

  updateUserList() {
    const userList = document.getElementById("userList");
    userList.innerHTML = "";

    Peers.shared()
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
          Peers.shared().kickUser(guestId);
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
          Peers.shared().banUser(guestId, guestToken);
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

    Peers.shared()
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

  updateUserName() {
    const username = UsernameView.shared().string();
    if (username.trim() !== "") {
      if (Peers.shared().isHost()) {
        // Set new host nickname and send to all guests
        const oldNickname = Session.shared().hostNickname();
        if (oldNickname === username) {
          return;
        }
        Session.shared().setHostNickname(username);
        addChatMessage(
          "chat",
          `${oldNickname} is now ${Session.shared().hostNickname()}.`,
          Session.shared().hostNickname()
        );

        Peers.shared()
          .dataChannels()
          .forEachKV((guestId, channel) => {
            channel.conn.send({
              type: "nickname-update",
              message: `${oldNickname} is now ${Session.shared().hostNickname()}.`,
              nickname: Session.shared().hostNickname(),
              oldNickname: oldNickname,
              newNickname: Session.shared().hostNickname(),
              guestUserList: Peers.shared().updateGuestUserlist(),
            });
          });
      } else {
        // Set new guest nickname and send to host
        Session.shared().setGuestNickname(username);
        Peers.shared().sendUsername(username);
      }
    }
  }
}.initThisClass());
