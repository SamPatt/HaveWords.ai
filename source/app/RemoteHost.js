"use strict";

/* 
    RemoteHost

*/

(class RemoteHost extends Base {
  initPrototypeSlots() {
    this.newSlot("connToHost", null);
  }

  init() {
    super.init();

    this.setIsDebugging(true);
  }

  sendUsername(username) {
    // Send chat message to host
    this.connToHost().send({
      type: "nickname-update",
      id: Session.shared().localUserId(),
      newNickname: username,
    });
  }

  sendAvatar(avatar) {
    // Send avatar to host
    this.connToHost().send({
      type: 'avatar-update',
      id: Session.shared().localUserId(),
      nickname: Session.shared().guestNickname(),
      avatar: avatar,
    });
  }

  async asyncSetupJoinSession() {
    console.log("Setting up join session");
    displayGuestHTMLChanges();
    const inviteId = LocalHost.shared().inviteId();

    console.log("Attempting to connect to host with inviteId:", inviteId); // Add this line

    const conn = LocalHost.shared().peer().connect(inviteId);
    this.setConnToHost(conn)

    conn.on("open", () => {
      console.log("Connection opened:", conn);
      LocalHost.shared().connections().set(inviteId, conn);
      LocalHost.shared().dataChannels().set(inviteId, conn);
      console.log(`Connected to host: ${inviteId}`);
      conn.send({
        type: "nickname",
        id: Session.shared().localUserId(),
        nickname: Session.shared().guestNickname(),
        token: LocalHost.shared().guestToken(),
      });

      // Handle receiving messages from the host
      conn.on("data", (data) => {
        console.log(`Message from host:`, data);
        if (data.type === "kick") {
          conn.close();
          console.log("You have been kicked from the session.");
          UsersView.shared().displayKickedMessage();
        }
        if (data.type === "chat") {
          Sounds.shared().playReceiveBeep();
          addChatMessage(data.type, data.message, data.nickname);
        }
        if (data.type === "prompt") {
          guestAddPrompt(data);
        }
        if (data.type === "ai-response") {
          guestAddHostAIResponse(data.message, data.nickname);
        }
        if (data.type === "ban") {
          document.getElementById("chatInput").disabled = true;
          addChatMessage(
            "chat",
            "You have been banned from the session.",
            "System"
          );
        }
        if (data.type === "session-history") {
          console.log("Received session history:", data.history);
          LocalHost.shared().setGuestUserList(
            data.guestUserList.filter(
              (guest) => guest.id !== Session.shared().localUserId()
            )
          );
          console.log("Received guestUserList:", data.guestUserList);
          UsersView.shared().displayGuestUserList(); // Call a function to update the UI with the new guestUserList
          guestDisplayHostSessionHistory(data.history);
        }

        if (data.type === "nickname-update") {
          LocalHost.shared().setGuestUserList(
            data.guestUserList.filter(
              (guest) => guest.id !== Session.shared().localUserId()
            )
          );
          UsersView.shared().displayGuestUserList();
          addChatMessage("chat", data.message, data.nickname);
        }

        if (data.type === "avatar-update") {
          LocalHost.shared().setGuestUserList(
            data.guestUserList.filter(
              (guest) => guest.id !== Session.shared().localUserId()
            )
          );
          UsersView.shared().displayGuestUserList();
          addChatMessage("chat", data.message, data.nickname);
          console.log("Received avatar-update:", data.avatar);
        }
        

        if (data.type === "system-message") {
          guestAddSystemMessage(data);
        }

        if (data.type === "image-link") {
          addImage(data.message);
        }

        if (data.type === "game-launch") {
          Session.shared().setGameMode(true)
          if (data.sessionType === "fantasyRoleplay") {
          startRoleplaySession();
          console.log("Guest sees Fantasy Roleplay Session Started");
          } else if (data.sessionType === "trivia") {
            startTriviaSession();
            console.log("Guest sees Trivia Session Started");
          } else if (data.sessionType === "explore") {
            startExploreSession();
            console.log("Guest sees Explore Session Started");
          } else {
            console.log("Error: Invalid session type");
          }
          addMessage("prompt", data.message, data.nickname);
        }

        if (data.type === "guest-join") {
          addChatMessage("chat", data.message, data.nickname);
          const newGuestUserList = data.guestUserList;
          const index = newGuestUserList.findIndex(
            (guest) => guest.id === Session.shared().localUserId()
          ); // Use a function to test each element
          if (index !== -1) {
            newGuestUserList.splice(index, 1);
          }
          LocalHost.shared().setGuestUserList(newGuestUserList);
          UsersView.shared().displayGuestUserList();
        }

        if (data.type === "guest-leave") {
          addChatMessage("chat", data.message, data.nickname);
          const newGuestUserList = data.guestUserList;
          const index = newGuestUserList.findIndex(
            (guest) => guest.id === Session.shared().localUserId()
          ); // Use a function to test each element
          if (index !== -1) {
            newGuestUserList.splice(index, 1);
          }
          LocalHost.shared().setGuestUserList(newGuestUserList);
          UsersView.shared().displayGuestUserList();
        }

        const messageInputRemote =
          document.getElementById("messageInputRemote");
        if (data.type === "grant-ai-access") {
          messageInputRemote.disabled = false;
          messageInputRemote.placeholder = "Send a prompt to the AI...";
          addChatMessage("chat", "You've been granted AI access!", "Host");
        } else if (data.type === "revoke-ai-access") {
          messageInputRemote.disabled = true;
          messageInputRemote.placeholder = "No prompt permission";
          addChatMessage("chat", "You've lost AI access.", "Host");
        }
      });
      conn.on("error", (err) => {
        console.log("Connection error:", err);
      });
      conn.on("close", () => {
        LocalHost.shared().connections().delete(inviteId);
        LocalHost.shared().dataChannels().delete(inviteId);
        console.log(`Disconnected from host: ${inviteId}`);
      });
    });
  }
}.initThisClass());
