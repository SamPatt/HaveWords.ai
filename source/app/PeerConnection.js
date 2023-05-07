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

  shortId () {
    const id = this.id() 
    return id ? this.id().slice(6) + "..." : "null";
  }

  debugTypeId () {
    return this.type() + " " + this.shortId();
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
    this.debugLog("opened connection to " + this.shortId());
    this.sendDelegateMessage("onOpen");
  }

  onData(data) {
    this.sendDelegateMessage("onData", [data]);
  }

  onError(error) {
    this.debugLog("error:", error);
    this.sendDelegateMessage("onError", [error]);
  }

  onClose() {
    this.debugLog("onClose " + this.shortId());
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
    console.log(this.type() + " " + this.shortId() + " shutdown");
    this.server().removePeerConnection(this);
    this.setConn(null);
  }
}).initThisClass();
