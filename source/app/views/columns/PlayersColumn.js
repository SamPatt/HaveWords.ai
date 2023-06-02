"use strict";

/* 
    PlayersColumn

*/

(class PlayersColumn extends View {
  initPrototypeSlots() {
    this.newSlot("guestUserList", null)
    this.newSlot("scrollView", null)
  }

  init() {
    super.init();
    this.setId("PlayersColumn");
    this.setScrollView(ScrollView.clone().setId("PlayersColumn_ScrollView"));
  }

  setGuestUserList(aList) {
    //const ownId = LocalUser.shared().id();
    this._guestUserList = aList; //aList.filter((guest) => guest.id !== ownId);
    this.display();
    return this;
  }

  display () {
    this.scrollView().removeAllItems();

    this.guestUserList().forEach((guest) => {
        const playerView = PlayerView.clone().create().setGuestDict(guest);
        this.scrollView().addItemView(playerView);
    });
  }

  updateUserName(newNickname) { // update from UI
    const oldNickname = LocalUser.shared().nickname();
    if (newNickname === "" || oldNickname === newNickname) {
      return;
    }
    LocalUser.shared().setNickname(newNickname)

    if (App.shared().isHost()) {
      GroupChatColumn.shared().addChatMessage(
        "chat",
        `${oldNickname} is now <b>${LocalUser.shared().nickname()}</b>.`,
        LocalUser.shared().nickname(),
        LocalUser.shared().id()
      );

      const json = {
        type: "nicknameUpdate",
        userId: LocalUser.shared().id(),
        message: `${oldNickname} is now <b>${LocalUser.shared().nickname()}</b>.`,
        nickname: LocalUser.shared().nickname(),
        oldNickname: oldNickname,
        newNickname: LocalUser.shared().nickname(),
        guestUserList: HostSession.shared().calcGuestUserlist(),
      };

      HostSession.shared().broadcast(json);
      HostSession.shared().updateGuestUserlist();
    } else {
      GuestSession.shared().sendNicknameUpdate(newNickname);
    }
  }

}.initThisClass());
