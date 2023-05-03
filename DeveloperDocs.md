# HaveWords Developer Documentation

The app works differently depending on whether it is launched as a host or a guest.

### Host Mode

When the app is launched as a host (without an invite link):

The host app connects to a designated peerjs rendezvous server using:

	PeerServer.shared().setup()

And tells it to use GuestConnection instances for each guest connection it receives:

      PeerServer.shared().setPeerConnectionClass(GuestConnection);

The HostSession object is then setup up to configure and manage the host behaviors.

      HostSession.shared().setupHostSession();

Each connection the host receives will set up a GuestConnection instance to manage it. 
This object's onData() method maps the data.type to a corresponding method in the GuestConnection, so it's easy to add new guest behaviors.

### Guest Mode

If an invite link is found in page URL parameters, the app will be launched as a guest.

Like the host, it connects to the peerjs server using:

	PeerServer.shared().setup()

But then it runs:

      GuestSession.shared().joinSession(this.inviteId());

To set up the GuestSession object to configure and manage guest behaviors. 

To connect it calls:

	const conn = PeerServer.shared().connectToPeerId(this.hostId());
	conn(this);
	this.setHostConnection(conn);

This will connect to the host and set the resulting PeerConnection object's delegate to itself, so messages like onData() will be sent to it, and it's onData method will map these to methods in a manner similar to how it works in GuestConnection e.g. onData({type: "kick", ...}) gets mapped to call onReceived_kick(data).





