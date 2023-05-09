"use strict";

/* 
    AzureService

*/

(class AzureService extends Base {
  initPrototypeSlots () {
  }

  init () {
    super.init();
    if (!this.region()) {
      this.setRegion("eastus");
    }
  }

  // --- api key ---

  setApiKey (v) {
    localStorage.setItem("azure_api_key", v)
    return this
  }

  apiKey () {
    return localStorage.getItem("azure_api_key")
  }

  validateKey (s) {
    if (!s) {
      return false;
    }
    return s.length === 32 && s.isHexadecimal();
  }

  // --- region ---

  setRegion (v) {
    localStorage.setItem("azure_region", v)
    return this
  }

  region () {
    return localStorage.getItem("azure_region")
  }

  validateRegion (s) {
    if (!s) {
      return false;
    }

    const isLowercaseOrUnderscore = (str) => {
      return /^[a-z_]+$/.test(str);
    }
    return isLowercaseOrUnderscore(s);
  }

  // --- api check ---

  hasApiAccess () {
    return this.validateKey(this.apiKey()) && this.validateRegion(this.region())
  }

}.initThisClass());
