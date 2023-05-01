"use strict";

/* 
    App

*/

(class Peerable extends Base {
    initPrototypeSlots () {
        this.newSlot("peer", null);
        this.newSlot("connections", null);
        this.newSlot("dataChannels", null);
        this.newSlot("retryCount", 0);
        this.newSlot("maxRetries", 5);
        this.newSlot("connToHost", null);
    }

    init () {
        super.init()
        this.setIsDebugging(true)
    }

}.initThisClass());
