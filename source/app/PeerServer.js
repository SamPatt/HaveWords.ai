"use strict";

/* 
    PeerServer

*/

(class PeerServer extends Base {
  initPrototypeSlots() {
    this.newSlot("peer", null);
    this.newSlot("retryCount", 0);
    this.newSlot("maxRetries", 5);
    this.newSlot("peerConnectionClass", PeerConnection);
    this.newSlot("peerConnections", null);
    this.newSlot("allowsIncomingConnections", true);
    this.newSlot("delegate", true);
  }

  init() {
    super.init();
    this.setPeerConnections(new Map());
    this.setIsDebugging(true)
    return this
  }

  peerOptions () {
    // Deployed peerjs server
    return {
        host: "peerjssignalserver.herokuapp.com",
        path: "/peerjs",
        secure: true,
        port: 443,
        reliable: true,
        pingInterval: 1000, // 1 second
        debug: false
      }
  }

  localPeerOptions () {
    return {
        host: "localhost",
        port: 9000,
        path: "/myapp",
      }
  }

  onOpen() {
    this.debugLog("open");
    this.delegate().onPeerServerOpen()
  }

  setup() {
    const id = LocalUser.shared().id();
    console.log("connecting to peerjs server with host id:\n", LocalUser.shared().shortId(), "\n")
    const peer = new Peer(id, this.peerOptions());
    this.setPeer(peer);

    peer.on("open", () => this.onOpen() );
    peer.on("error", (error) => this.onError(error) );
    peer.on("call", (call) => this.onCall(call) );
    peer.on("connection", (conn) => this.onConnection(conn) )
    return this;
  }

  onConnection (conn) {
    if (!this.allowsIncomingConnections()) {
      console.log(this.type() + " attempted connection while allowsIncomingConnections is false");
      return this
    }

    const pc = this.peerConnectionClass().clone()
    pc.setServer(this)
    pc.setConn(conn);
    this.peerConnections().set(conn.peer, pc);
    /*
    // better to use onOpenPeerConnection as we can send messages after open
    if (this.delegate().onPeerConnection) {
      this.delegate().onPeerConnection(pc);
    }*/
    return this
  }

  onOpenPeerConnection (conn) {
    // sent by a PeerConnection to it's PeerServer after it opens
    // and is ready for messages
    if (this.delegate().onOpenPeerConnection) {
      this.delegate().onOpenPeerConnection(pc);
    }
  }

  onClosePeerConnection (conn) {
    if (this.delegate().onClosePeerConnection) {
      this.delegate().onClosePeerConnection(pc);
    }
    this.removePeerConnection(conn)
  }

  removePeerConnection (conn) {
    if (this.peerConnections().has(conn.id())) {
      this.peerConnections().delete(conn.id())
      if (this.delegate().onRemovePeerConnection) {
        this.delegate().onRemovePeerConnection(pc);
      }
    }
    return this
  }

  onError(err) {
    this.debugLog("error ", err);

    if (this.retryCount() < this.maxRetries()) {
      setTimeout(() => {
        console.log("Attempting to reconnect to PeerJS server...");
        this.peer().reconnect(); // TODO: will this call onConnection again?
        this.setRetryCount(this.retryCount() + 1);
      }, 5000);
    } else {
      console.warn(
        this.type() +
          "Reached maximum number of retries. Displaying system message."
      );
      // Display a system message here, e.g. by updating the UI
      GroupChatView.shared().addChatMessage(
        "systemMessage",
        `Connection to peer server lost. Your existing connections still work, but you won't be able to make new connections or voice calls.`,
        "System"
      );
    }
  }

  onCall(call) {
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

  connectToPeerId(peerId) {
    const conn = this.peer().connect(peerId);
    const peerConnection = PeerConnection.clone().setConn(conn)
    return peerConnection
  }

  broadcast(json) {
    this.peerConnections().forEachKV((id, peerConnection) => {
      peerConnection.send(json)
    });
  }

  broadcastExceptTo(json, excludeId) {
    this.peerConnections().forEachKV((guestId, peerConnection) => {
        if (guestId !== excludeId) {
          peerConnection.send(json);
        }
      });
  }

  peerConnectionForId (id) {
    return this.peerConnections().get(id)
  }

}.initThisClass());
