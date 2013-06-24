;(function() {
	var localStream = null,
	peerConnection = null,
	localVideo = null,
	config = {
		media : {
			audio : true,
			video : true
		},
		peerConnectionConfig: {
			iceServers: [{"url" : "stun:stun.l.google.com:19302"}]
		},
		peerConnectionConstraints: {
			optional: [{"DtlsSrtpKeyAgreement": true}]
		}
	};
	function initialize() {
		localVideo = document.getElementById("localVideo");
		getLocalUserMedia();
	}

	// Get user media
	function getLocalUserMedia() {
		getUserMedia(config.media, function(stream) {
			attachMediaStream(localVideo, stream);
			localStream = stream;
			createPeerConnection();
		}, function() {
			throw new Error('Failed to get user media');
		});
	}
	

	function createPeerConnection() {
		peerConnection = new RTCPeerConnection(config.peerConnectionConfig, config.peerConnectionConstraints);
		peerConnection.addStream(localStream);
		peerConnection.onicecandidate = onIceCandidate;
		peerConnection.onaddstream = onRemoteStreamAdded;
	}
	
	function onIceCandidate(event) {
		if(event.candidate) {
			
		} else {
			console.log("End of candidates");
		}
	}
	
	function onRemoteStreamAdded(stream) {
		
	}
	
	function onChannelMessage(message) {
		processSignalingMessage(message);
	}
	
	function processSignalingMessage(message) {
		var msg = JSON.parse(message);
		if (msg.type == 'offer') {
	          peerConnection.setRemoteDescription(new RTCSessionDescription(msg));
	          answer();
	          console.log("Set remote description.");
	      } else if (msg.type === 'answer') {
	        peerConnection.setRemoteDescription(new RTCSessionDescription(msg));
	      } else if (msg.type === 'candidate') {
	        var candidate = new RTCIceCandidate({sdpMLineIndex:msg.label, candidate:msg.candidate});
	        peerConnection.addIceCandidate(candidate);
	      } else if (msg.type === 'bye' && started) {
	          onRemoteHangup();
	      }
	}
	
	function answer() {
		console.log("sending answer to peer");
		peerConnection.createAnswer(setLocalAndSendMessage);
	}
	
	function setLocalAndSendMessage(sessionDescription) {
        sessionDescription.sdp = sessionDescription.sdp;
        peerConnection.setLocalDescription(sessionDescription);
        sendMessage(sessionDescription);
	}

	function sendMessage(message) {
		var msgString = JSON.stringify(message);
		console.log('C->S: ' + msgString);
		socket.send(msgString);
	}
	
	function Channel() {
		var url = 'https://liquid-galaxy.firebaseio.com',
		channel = null;
		
		channel = new  Firebase(url);
		channel.on("child_added", function(event) {
			onChannelMessage(event.val());
		});
		channel.onDisconnect.remove();
		console.log('Channel opened');
	}


	Channel.prototype.send = function(message) {
		this.channel.push(message);
	}
	setTimeout(initialize, 1);
}());