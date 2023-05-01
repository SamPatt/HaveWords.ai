"use strict";

/* 
    App

*/

(class Peerable extends Base {
  initPrototypeSlots() {
    this.newSlot("peer", null);
    this.newSlot("connections", null);
    this.newSlot("dataChannels", null);
    this.newSlot("retryCount", 0);
    this.newSlot("maxRetries", 5);
    this.newSlot("connToHost", null);
  }

  init() {
    super.init();
    this.setIsDebugging(true);
  }

  setupPeer() {
    /*
    // Local peerjs server
    const newPeer = new Peer(id, {
      host: "localhost",
      port: 9000,
      path: "/myapp",
    });
    */

    // Deployed peerjs server
    const newPeer = new Peer(Session.shared().localUserId(), {
      host: "peerjssignalserver.herokuapp.com",
      path: "/peerjs",
      secure: true,
      port: 443,
    });

    this.setPeer(newPeer);

    newPeer.on("open", () => {
      this.onOpenPeer();
    });

    newPeer.on("error", (error) => {
      this.onPeerError(error);
    });

    newPeer.on("call", (call) => {
      this.onPeerCall(call);
    });

    return this;
  }

  onOpenPeer() {
    console.log(
      "PeerJS client is ready. Peer ID:",
      Session.shared().localUserId()
    );

    if (LocalHost.shared().isHost()) {
      //Session.shared().load() // loadSessionData();
      displaySessionHistory();
      if (!Session.shared().hostNickname()) {
        Session.shared().setHostNickname(
          Nickname.generateHostNickname() + " (host)"
        );
        UsernameView.shared().setString(Session.shared().hostNickname());
      } else {
        console.log(
          "Host nickname is already set:",
          Session.shared().hostNickname()
        );
      }
      if (Session.shared().hostWelcomeMessage() === false) {
        LocalHost.shared().asyncSetupHostSession(); // Call the function to set up the host session
        Session.shared().setHostWelcomeMessage(true);
      }
    } else {
      if (!Session.shared().guestNickname()) {
        Session.shared().setGuestNickname(Nickname.generateNickname());
        UsernameView.shared().setString(Session.shared().guestNickname());
        console.log("Guest nickname:", Session.shared().guestNickname());
      } else {
        console.log(
          "Guest nickname is already set:",
          Session.shared().guestNickname()
        );
      }
      RemoteHost.shared().asyncSetupJoinSession(); // Call the function to set up the join session
    }
  }

  onPeerError(err) {
    console.log("PeerJS error:", err);

    if (this.retryCount() < this.maxRetries()) {
      setTimeout(() => {
        console.log("Attempting to reconnect to PeerJS server...");
        this.peer().reconnect();
        this.setRetryCount(this.retryCount() + 1);
      }, 5000);
    } else {
      console.log(
        "Reached maximum number of retries. Displaying system message."
      );
      // Display a system message here, e.g. by updating the UI
      addChatMessage(
        "system-message",
        `Connection to peer server lost. Your existing connections still work, but you won't be able to make new connections or voice calls.`,
        "System"
      );
    }
  }

  onPeerCall(call) {
    // Answer incoming voice call
    const acceptCall = confirm(
      `Incoming call. Do you want to accept the call?`
    );

    if (acceptCall) {
      call.answer(Microphone.shared().userAudioStream());
      console.log("Answering incoming call from:", call.peer);

      call.on("stream", (remoteStream) => {
        handleRemoteStream(remoteStream);
        updateCalleeVoiceRequestButton(call.peer, call);
      });

      call.on("close", () => {
        // Handle call close event
        console.log("Call with peer:", call.peer, "has ended");
      });
    } else {
      console.log("Call from", call.peer, "rejected");
    }
  }
}.initThisClass());
