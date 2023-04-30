"use strict";

/* 
    PeerConnection

*/

(class PeerConnection extends Base {
  initPrototypeSlots() {
    this.newSlot("connToHost", null);
  }

  init() {
    super.init();

    this.setIsDebugging(true);
  }

  async asyncSetupJoinSession() {
    console.log("Setting up join session");
    displayGuestHTMLChanges();
    const inviteId = Peers.shared().inviteId();

    console.log("Attempting to connect to host with inviteId:", inviteId); // Add this line

    conn = Peers.shared().peer().connect(inviteId);
    //Peers.shared().setConnToHost(conn)

    conn.on("open", () => {
      console.log("Connection opened:", conn);
      Peers.shared().connections().set(inviteId, conn);
      Peers.shared().dataChannels().set(inviteId, conn);
      console.log(`Connected to host: ${inviteId}`);
      conn.send({
        type: "nickname",
        id: Session.shared().localUserId(),
        nickname: Session.shared().guestNickname(),
        token: Peers.shared().guestToken(),
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
          Peers.shared().setGuestUserList(
            data.guestUserList.filter(
              (guest) => guest.id !== Session.shared().localUserId()
            )
          );
          console.log("Received guestUserList:", data.guestUserList);
          UsersView.shared().displayGuestUserList(); // Call a function to update the UI with the new guestUserList
          guestDisplayHostSessionHistory(data.history);
        }

        if (data.type === "nickname-update") {
          Peers.shared().setGuestUserList(
            data.guestUserList.filter(
              (guest) => guest.id !== Session.shared().localUserId()
            )
          );
          UsersView.shared().displayGuestUserList();
          addChatMessage("chat", data.message, data.nickname);
        }

        if (data.type === "system-message") {
          guestAddSystemMessage(data);
        }

        if (data.type === "image-link") {
          addImage(data.message);
        }

        if (data.type === "game-launch") {
          startRoleplaySession();
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
          Peers.shared().setGuestUserList(newGuestUserList);
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
          Peers.shared().setGuestUserList(newGuestUserList);
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
        Peers.shared().connections().delete(inviteId);
        Peers.shared().dataChannels().delete(inviteId);
        console.log(`Disconnected from host: ${inviteId}`);
      });
    });
  }
}.initThisClass());
