"use strict";

/* 
    YouTubeAudioPlayer

*/

(class YouTubeAudioPlayer extends Base {
  initPrototypeSlots() {
    this.newSlot("element", null);
    this.newSlot("player", null); // to store the YouTube player
    this.newSlot("videoId", null);
    this.newSlot("shouldRepeat", true);
    this.newSlot("frameIsReady", null);
  }

  init() {
    super.init();
    this.loadFrameAPI(); // set this up, then we'll set up the player
  }

  loadFrameAPI() {
    // Load the YouTube IFrame Player API asynchronously
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    return this;
  }

  onFrameReady() {
    this.setFrameIsReady(true);
    this.setupPlayer()
    return this;
  }

  setupPlayer() {
    this.debugLog("playing youtube audio id: " + this.videoId());
    const json = {
      height: "0",
      width: "0",
      //videoId: this.videoId(), // Replace 'YOUR_VIDEO_ID' with the ID of the YouTube video you want to play
      events: {
        onReady: (event) => {
          this.onPlayerReady(event);
        },
        onStateChange: (event) => {
          this.onPlayerStateChange(event);
        },
        onError: (event) => {
          this.onPlayerError(event);
        },
      },
      playerVars: {
        autoplay: 1, // Auto-play the video
        controls: 0, // Hide player controls
        showinfo: 0, // Hide video information
        rel: 0, // Do not show related videos
        modestbranding: 1, // Show minimal YouTube branding
      },
    };

    if (this.videoId()) {
      json.videoId = this.videoId();
    }

    const player = new YT.Player("player", json);

    this.setPlayer(player);
    return this;
  }

  play() {
    if (this.player()) {
      this.player().loadVideoById(this.videoId());
    } else {
      console.log("player not set up yet, but video should start when it is");
    }
    return this;
  }

  isPlayerPlaying() {
    const player = this.player();
    if (player) {
      return player.getPlayerState() === YT.PlayerState;
    }
    return false;
  }

  onPlayerError(event) {
    // Handle the error based on the error code
    switch (event.data) {
      case 2: // Invalid parameter
        console.error('Invalid video ID.');
        break;
      case 100: // Video not found
        console.error('Video not found.');
        break;
      case 101: // Playback not allowed
      case 150: // Playback not allowed
        console.error('Playback is not allowed.');
        break;
      case 5: // Video not playable in the embedded player
        console.error('Video not playable in the embedded player.');
        break;
      default: // Unexpected error
        console.error('An unexpected error occurred while loading the video.');
    }
  }

  // The API will call this function when the video player is ready
  onPlayerReady(event) {
    this.player().playVideo();
  }

  // The API calls this function when the player's state changes
  onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
      this.onPlayerEnd(event);
    }
  }

  onPlayerEnd(event) {
    if (this.shouldRepeat()) {
      this.player().playVideo(); // Replay the video when it ends
    }
  }

  stop() {
    const player = this.player();
    if (player) {
      player.stopVideo();
    }
    return this;
  }

  shutdown() {
    const player = this.player();
    if (player) {
      player.stopVideo();
      player.destroy();
      this.setPlayer(null);
    }
    return this;
  }
}).initThisClass();

function onYouTubeIframeAPIReady() {
  // called after API code downloads
  YouTubeAudioPlayer.shared().onFrameReady();
}

YouTubeAudioPlayer.shared()
