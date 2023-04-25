"use strict";

/* 
    Sounds

*/

(class Sounds extends Base {
  initPrototypeSlots () {
    //this.newSlot("idb", null)
  }

  init () {
    super.init();
  }

  playOminousSound () {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    const notes = [110, 123.47, 130.81, 146.83]; // Frequencies for notes A2, B2, C3, and D3

    notes.forEach((note, index) => {
      const startTime = audioContext.currentTime + index * 0.5;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.frequency.value = note;
      oscillator.type = index % 2 === 0 ? "sine" : "triangle";
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    });
  }

  playSendBeep () {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = context.createGain();

    gainNode.gain.setValueAtTime(0.02, context.currentTime);
    gainNode.connect(context.destination);

    const notes = [330, 290]; // Lower frequencies for the send beep

    notes.forEach((note, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        note,
        context.currentTime + index * 0.1
      );

      oscillator.connect(gainNode);
      oscillator.start(context.currentTime + index * 0.1);
      oscillator.stop(context.currentTime + index * 0.1 + 0.1);
    });
  }

  playReceiveBeep () {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = context.createGain();

    gainNode.gain.setValueAtTime(0.02, context.currentTime);
    gainNode.connect(context.destination);

    const notes = [290, 330]; // Lower frequencies for the receive beep

    notes.forEach((note, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        note,
        context.currentTime + index * 0.1
      );

      oscillator.connect(gainNode);
      oscillator.start(context.currentTime + index * 0.1);
      oscillator.stop(context.currentTime + index * 0.1 + 0.1);
    });
  }
  
}.initThisClass());
