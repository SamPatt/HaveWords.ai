"use strict";

/* 
    Peers


    Peers.shared().broadcast(json)
    Peers.shared().broadcastExceptTo(json, id)
*/

(class Peers extends Base {
  initPrototypeSlots() {}

  init() {
    super.init();
    this.setIsDebugging(true);
  }

  broadcast(json) {
    for (const guestId in dataChannels) {
      if (dataChannels.hasOwnProperty(guestId)) {
        dataChannels[guestId].conn.send(json);
      }
    }
  }

  broadcastExceptTo(json, excludeId) {
    for (const guestId in dataChannels) {
      if (dataChannels.hasOwnProperty(guestId)) {
        if (guestId !== excludeId) {
          dataChannels[guestId].conn.send(json);
        }
      }
    }
  }
}.initThisClass());

// -----------------------------------------------------

// If the user is a guest this will set the room id to the one in the url
const urlParams = new URLSearchParams(window.location.search);
const inviteId = urlParams.get("room");
let isHost;

if (inviteId) {
  isHost = false;
} else {
  isHost = true;
}
let id;
let hostNickname;
let guestNickname;
let hostWelcomeMessage = false;
let groupSessionType;
let groupSessionDetails;
let groupSessionFirstAIResponse;
let inSession = false;

// If user is host, check if there is an existing hostId in local storage
if (isHost) {
  const existingHostId = localStorage.getItem("hostId");
  const existingHostNickname = localStorage.getItem("hostNickname");
  if (existingHostId) {
    // If there is an existing hostId, set the hostId to the existing one
    id = existingHostId;
    hostNickname = existingHostNickname;
  } else {
    // If there is no existing hostId, generate a new one and save it to local storage
    id = generateId();
    localStorage.setItem("hostId", id);
  }
} else {
  // If user is guest, generate a new id
  const existingGuestId = localStorage.getItem("guestId");
  const existingGuestNickname = localStorage.getItem("guestNickname");
  if (existingGuestId) {
    // If there is an existing guestId, set the guestId to the existing one
    id = existingGuestId;
    guestNickname = existingGuestNickname;
  } else {
    // If there is no existing guestId, generate a new one and save it to local storage
    id = generateId();
    localStorage.setItem("guestId", id);
  }
}


let gameMode = false;
let fantasyRoleplay = false;

const connections = {};
const dataChannels = {};
const bannedGuests = [];
let conn;
let guestUserList = [];

/* // Local peerjs server
const peer = new Peer(id,{
  host: "localhost",
  port: 9000,
  path: "/myapp",
}); */


// Deployed peerjs server
const peer = new Peer(id, {
    host: "peerjssignalserver.herokuapp.com",
    path: "/peerjs",
    secure: true,
    port: 443,
  });
  