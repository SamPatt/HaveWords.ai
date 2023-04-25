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
        this.setIdb(IndexedDBFolder.clone())
        this.setIsDebugging(false)
    }

    static launch () {
        console.log("App launch")
    }

}.initThisClass());
