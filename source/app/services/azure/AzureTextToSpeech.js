"use strict";

/* 
    AzureTextToSpeech


*/

(class AzureTextToSpeech extends AzureService {
  initPrototypeSlots () {
    //this.newSlot("", null)
  }

  init () {
    super.init();
  }

  async asyncSpeakTextIfAble (text) {
    if (this.hasApiAccess()) {
      await this.asyncSpeakText(text);
    }
  }

  async asyncSpeakText(text) {

    text = text.removedHtmlTags(); // clean up text first

    const ssmlRequest = `
      <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='en-US'>
      <voice name='en-US-TonyNeural'>
        <mstts:express-as style='whispering'>
          <prosody volume='soft' rate='15%' pitch='-10%'>${text}</prosody>
        </mstts:express-as>
      </voice>
    </speak>`;


    console.log("made request")
    const response = await fetch(`https://${this.region()}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.apiKey(),
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
      },
      body: ssmlRequest,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  }
  
}.initThisClass());

