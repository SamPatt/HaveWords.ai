"use strict";

/* 
    App

*/

(class App extends Base {
    initPrototypeSlots () {
        //this.newSlot("idb", null)
    }

    init () {
        super.init()
        this.setIsDebugging(true)
    }

    static launch () {
        console.log("App launch")
    }

}.initThisClass());
