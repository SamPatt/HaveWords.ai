"use strict";

/* 

    RollRequest

*/

(class RollRequest extends Base {
  //Public
  initPublicPrototypeSlots() {
    this.newSlot("id", -1);
    this.newSlot("reason", "Dice Roll");
    this.newSlot("character", "Unspecified Character"); //name
    this.newSlot("count", 1);
    this.newSlot("die", 20);
    this.newSlot("modifier", 0);
    this.newSlot("keepDrop", "k");
    this.newSlot("keepDropHighLow", "h");
    this.newSlot("keepDropCount", 1);
    this.newSlot("target", 0);
    this.newSlot("results", 0);
  }

  setJson(json) { //JSON from GPT function_call
    if (json.reason) {
      this.setReason(json.reason);
    }

    if (json.character) {
      this.setCharacter(json.character);
    }

    if (json.num) {
      this.setCount(json.num);
    }

    if (json.die) {
      this.setDie(json.die);
    }

    if (json.mod) {
      this.setModifier(json.mod);
    }

    if (json.kd) {
      if (json.kd.kd) {
        this.setKeepDrop(json.kd.kd);
      }

      if (json.kd.hl) {
        this.setKeepDropHighLow(json.kd.hl);
      }

      if (json.kd.num) {
        this.setKeepDropCount(json.kd.num);
      }
      else {
        this.setKeepDropCount(this.count());  
      }
    }
    else {
      this.setKeepDropCount(this.count());
    }

    if (json.target) {
      this.setTarget(json.target);
    }

    return this;
  }

  playerCharacter() {
    return App.shared().playerForCharacter(this.character());
  }

  notation() {
    let notation = String(this.count());
    notation += ("d" + String(this.die()));
    notation += (this.keepDrop() + this.setKeepDropHighLow() + String(this.keepDropCount()))
    if (this.modifier()) {
      notation += this.modifier() > 0 ? "+" : "-";
    }
    
    return notation;
  }

  value() {
    return this.results().value;
  }

  hasTarget() {
    return !!this.target();
  }

  hasAdvantage() {
    return this.notation().includes("kh1");
  }

  hasDisadvantage() {
    return this.notation().includes("kl1");
  }

  wasSuccess() {
    return this.results().success;
  }

  wasCritical() {
    return this.wasCriticalSuccess() || this.wasCriticalFailure();
  }

  wasCriticalSuccess() {
    return this.results().critical == "success";
  }

  wasCriticalFailure() {
    return this.results().critical == "failure";
  }

  outcomeDescription() {
    return this.diceDescription() + 
      this.advantageDescription() + 
      ':' + 
      this.rollDescription() +
      this.modifierDescription() +
      this.valueDescription() +
      this.targetDescription() +
      this.successDescription();
  }

  /*
  rollInstructions() {
    let rollInstructions = this.character() + ", roll " + this.count() + "d" + this.die() + this.modifier();
    if (this.rollType()) {
      rollInstructions += " with " + this.rollType();
    }
    if (this.target()) {
      rollInstructions += " with a target of " + this.target() + " or higher";
    }
    rollInstructions += "."
    return rollInstructions;
  }
  */

  //Private

  initPrototypeSlots() {
    this.initPublicPrototypeSlots();
  }

  setResults(diceBoxResults) {
    this._results = diceBoxResults;

    const rolls = this.rolls();
    let highestRoll = { value: Number.MIN_SAFE_INTEGER }
    let lowestRoll = { value: Number.MAX_SAFE_INTEGER }
    rolls.forEach(roll => {
      if (roll.value > highestRoll.value) {
        highestRoll = roll;
      }
      if (roll.value < lowestRoll.value) {
        lowestRoll = roll;
      }
    });

    var self = this;
    rolls.forEach(roll => {
      if (self.hasAdvantage()) {
        roll.ignored = roll != highestRoll;
      }
      else if (self.hasDisadvantage()) {
        roll.ignored = roll != lowestRoll;
      }
      else {
        roll.ignored = false;
      }
    });

    if (this.hasTarget()) {
      const results = this.results();
      results.target = this.target();
      if (this.hasAdvantage()) {
        results.critical = highestRoll.critical;
      }
      else if (this.hasDisadvantage()) {
        results.critical = lowestRoll.critical; 
      }
      else {
        results.critical = highestRoll.critical; 
      }

      if (this.wasCritical()) {
        results.success = this.wasCriticalSuccess();
      }
      else {
        results.success = this.value() >= results.target;
      }
    }
  }

  rolls() {
    switch(this.results().type) {
      case "die":
        return this.results().rolls;
      case "expressionroll":
       return this.results().dice.find(die => die.type == "die").rolls;
    } 
  }

  diceDescription() {
    return ' ' + this.diceCount() + 'd' + this.dieNumber();
  }

  rollInfo() {
    let results = this.results();
    if (results.type == "expressionroll") {
      return results.dice.find(d => d.type == "die");
    }
    else {
      return results;
    }
  }

  diceCount() {
    return this.rollInfo().count.value;
  }

  dieNumber() {
    let results = this.results();
    let die = results;
    if (results.type == "expressionroll") {
      die = results.dice.find(d => d.type == "die");
    }
    return this.rollInfo().die.value;
  }

  advantageDescription() {
    if (this.hasAdvantage()) {
      return ' with Advantage';
    }
    else if (this.hasDisadvantage()) {
      return ' with Disadvantage';
    }
    else {
      return '';
    }
  }

  rollDescription() {
    return " (" + this.rolls().map((roll) => {
      return this.tagForRoll(roll)
    }).join(" + ") + ")"
  }

  tagForRoll(roll) {
    const classForRoll = this.classForRoll(roll);

    if (classForRoll != "") {
      return `<span class='${classForRoll}'>${roll.value}</span>`;
    }
    else {
      return String(roll.value);
    }
  }

  classForRoll(roll) {
    const classes = [];
    if (roll.critical == 'success') {
      classes.push('criticalSuccessRoll');
    }
    else if (roll.critical == 'failure') {
      classes.push('criticalFailureRoll');
    }
    if (roll.ignored) {
      classes.push('ignoredRoll');
    }

    return classes.join(" ");
  }

  modifierDescription() {
    if (this.hasModifier()) {
      const results = this.results();
      return ' ' + results.ops[0] + ' ' + String(results.dice.find(d => d.type == "number").value);
    }
    else {
      return '';
    }
  }

  hasModifier() {
    return this.results().type == "expressionroll";
  }

  valueDescription() {
    let description = ' = ';
    if (this.wasCritical()) {
      const classForValue = this.wasCriticalSuccess() ? 'criticalSuccessRoll' : 'criticalFailureRoll';
      description += `<span class='${classForValue}'>${ this.value() }</span>`
    }
    else {
      description += String(this.value());
    }

    return description;
  }

  targetDescription() {
    if (this.hasTarget()) {
      let description = ' vs ';
      if (this.wasCritical()) {
        description += "<span class='ignoredRoll'>"
      }
      description += String(this.target());
      if (this.wasCritical()) {
        description += "</span>"
      }

      return description;
    }
    else {
      return '';
    }
  }

  successDescription() {
    if (this.hasTarget()) {
      let description = ' (';

      if (this.wasCritical()) {
        description += '<strong>Critical ';
      }
      description += this.wasSuccess() ? 'Success' : 'Failure';
      if (this.wasCritical()) {
        description += '</strong>';
      }

      return description + ')';
    }
    else {
      return '';
    }
  }
}).initThisClass();