"use strict";

/* 
    PeerConnection

*/

(class PeerConnection extends Base {
  initPrototypeSlots() {
    this.newSlot("server", null);
    this.newSlot("conn", null);
    this.newSlot("info", null);
    this.newSlot("delegate", null);
  }

  id() {
    const conn = this.conn();
    if (conn) {
      return conn.peer;
    }
    return null;
  }

  init() {
    super.init();
    this.setIsDebugging(true);
    return this;
  }

  setConn(conn) {
    this._conn = conn;
    if (conn) {
      this.setup();
    }
    return this;
  }

  setup() {
    const conn = this.conn();
    conn.on("open", () => this.onOpen());
    conn.on("data", (data) => this.onData(data));
    conn.on("error", (error) => this.onError(error));
    conn.on("close", () => this.onClose());
  }

  // --- events ---

  onOpen() {
    this.debugLog("opened connection to " + this.id());
    this.sendDelegateMessage("onOpen");
  }

  onData(data) {
    this.sendDelegateMessage("onData", [data]);
  }

  onError(error) {
    this.debugLog("Connection error:", error);
    this.sendDelegateMessage("onError", [error]);
  }

  onClose() {
    console.log("Disconnected " + this.conn().peer);
    this.server().removePeerConnection(this);
    this.setConn(null);

    this.sendDelegateMessage("onClose");
  }

  // --- delegate ---

  sendDelegateMessage(methodName, args = []) {
    const d = this.delegate();
    if (d) {
      const m = d[methodName];
      if (m) {
        m.apply(d, args);
      }
    }
  }

  // --- sending ---

  send(json) {
    this.conn().send(json);
  }

  sendThenClose(json) {
    this.send(json);
    setTimeout(() => {
      this.shutdown();
    }, 500); // without delay, send doesn't occur
  }

  // --- shutdown ---

  shutdown() {
    this.server().removePeerConnection(this);
    this.setConn(null);
  }
}).initThisClass();
