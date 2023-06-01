"use strict";

/* 
    OpenAiModels

*/

(class OpenAiModels extends Base {
  initPrototypeSlots() {
    this.newSlot("models", null);
    this.newSlot("didModelCheck", false);
  }

  init() {
    super.init();
    const models = this.allModelNames().map(name => OpenAiChatModel.clone().setName(name));
    this.setModels(models);
  }

  // --- accessible models ---

  clearAvailableModelNames () {
    this.setAvailableModelNames(null);
    return this;
  }

  setAvailableModelNames (modelNamesArray) { /* or pass in null to clear the list */
    localStorage.setItem("openai_available_models", JSON.stringify(modelNamesArray));
    return this;
  }

  availableModelNames () {
    const s = localStorage.getItem("openai_available_models");
    try {
      return s ? JSON.parse(s) : null;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async asyncCheckModelsAvailability () {
    const names = this.availableModelNames();
    if (this.apiKey() && names === null || (names && names.length === 0)) {
      for (const model of this.models()) { 
        await model.asyncCheckAvailability();
        this.setAvailableModelNames(this.calcAvailableModelNames());
      }
    }
  }

  calcAvailableModelNames () {
    return this.models().filter(model => model.isAvailable()).map(model => model.name());
  }

  allModelNames () {
    // model names with versions numbers are ones soon to be depricated, 
    // so we don't include those.
    return [
      "gpt-4", 
      "gpt-4-32k", 
      "gpt-3.5-turbo", 
    ];
  }

}.initThisClass());
