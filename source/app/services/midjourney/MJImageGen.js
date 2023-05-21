"use strict";

/* 
    MJImageGen

*/

(class MJImageGen extends MJService {
  initPrototypeSlots() {
    this.newSlot("prompt", null);
    this.newSlot("mjVersion", "5");
  }

  // This function will scrub Midjourney's list of banned words from the prompt
  scrubBannedWords(prompt) {
    const bannedWords = [
      "blood", "bloodbath", "crucifixion", "bloody", "flesh", "bruises", "car crash", "corpse", "crucified", "cutting", "decapitate", "infested", "gruesome", "kill", "infected", "sadist", "slaughter", "teratoma", "tryphophobia", "wound", "cronenberg", "khorne", "cannibal", "cannibalism", "visceral", "guts", "bloodshot", "gory", "killing", "surgery", "vivisection", "massacre", "hemoglobin", "suicide",
      "ahegao", "pinup", "ballgag", "playboy", "bimbo", "pleasure", "bodily fluids", "pleasures", "boudoir", "rule34", "brothel", "seducing", "dominatrix", "seductive", "erotic", "fuck", "sensual", "hardcore", "sexy", "hentai", "shag", "horny", "shibari", "incest", "smut", "jav", "succubus", "jerk off king at pic", "thot", "kinbaku", "transparent", "legs spread", "twerk", "making love", "voluptuous", "naughty", "wincest", "orgy", "sultry", "xxx", "bondage", "bdsm", "dog collar", "slavegirl", "transparent", "translucent",
      "arse", "labia", "ass", "mammaries", "badonkers", "minge", "big ass", "mommy milker", "booba", "nipple", "booty", "oppai", "bosom", "organs", "breasts", "ovaries", "busty", "penis", "clunge", "phallus", "crotch", "sexy female", "dick", "skimpy", "girth", "thick", "honkers", "vagina", "hooters", "veiny", "knob",
      "no clothes", "au naturale", "no shirt", "bare chest", "nude", "barely dressed", "bra", "risqué", "clear", "scantily", "clad", "cleavage", "stripped", "full frontal", "unclothed", "invisible clothes", "wearing nothing", "lingerie", "with no shirt", "naked", "without clothes on", "negligee", "zero clothes",
      "taboo", "fascist", "nazi", "prophet mohammed", "slave", "coon", "honkey",
      "drugs", "cocaine", "heroin", "meth", "crack",
      "torture", "disturbing", "farts", "fart", "poop", "warts", "shit", "brown pudding", "bunghole", "vomit", "voluptuous", "seductive", "sperm", "hot", "sexy", "sensored", "censored", "silenced", "deepfake", "inappropriate", "pus", "waifu", "mp5", "succubus", "1488", "surgery"
    ];


    let result = prompt;
    bannedWords.forEach(word => {
      let regex = new RegExp(word, "gi");
      result = result.replace(regex, "[redacted]"); // replace banned words with "[redacted]"
    });

    return result;
  }

  newRequest () {
    const request = MJRequest.clone();
    request.setService(this);
    return request;
  }

  resultJson() {
    return this.newRequest().setEndpointPath("/imagine").setBody({
      prompt: this.prompt() + " --v " + this.mjVersion()
    }).asyncSend();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Calls the OpenAI Image API and returns the image URL fetchOpenAIImageResponse
  async asyncFetch() {
    assert(this.prompt());
    assert(this.mjVersion());

    // Scrub the prompt of any banned words
    let scrubbedPrompt = this.scrubBannedWords(this.prompt());

    const imagineRequest = this.newRequest().setEndpointPath("/imagine").setBody({
      prompt: scrubbedPrompt
    });

    let json;

    try {
      json = await imagineRequest.asyncSend();
      const taskId = json.taskId;
      if (!taskId) {
        throw "taskId missing from MJ response: " + JSON.stringify(json);
      }

      do {
        await new Promise(r => setTimeout(r, 200));
        json = await this.newRequest().setEndpointPath("/result").setBody({ taskId }).asyncSend();
        console.log(json);
      } while(!json.imageURL);
    } catch (error) {
      debugger;
      console.error("Error fetching AI response:", error);
      AiChatView.shared().addMessage(
        "systemMessage",
        "Error fetching AI response. Make sure the model is selected and the API key is correct.",
        "Host",
        LocalUser.shared().id()
      );
      return undefined
    }

    return json.imageURL;
  }
}.initThisClass());

