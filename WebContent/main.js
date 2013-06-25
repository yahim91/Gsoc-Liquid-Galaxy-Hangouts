;(function() {
	var localStream,
	peerConnection,
	localVideo,
	userid,
	mainChannel,
	localChannel,
	initiator,
	channelConfig,
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
		channelConfig = {
				url: 'https://liquid-galaxy.firebaseio.com/main',
				onmessage: function (data) {
					if(data.userid === userid) {
						return;
					}
					console.log('S -> C:' + JSON.stringify(data));
					if (data.type === 'new_room') {
						var startButton = document.getElementById("startButton");
						startButton.parentNode.removeChild(startButton);
						initiator = false;
						joinRoom();
					}
					
					if(data.type === 'new_participant' && initiator) {
						handleNewParticipant(data.userid);
					}
				},
				onopen: function () {
					enableStartButton();
				}
		}
		userid = createId();
		getLocalUserMedia();
		mainChannel = new Channel(channelConfig);
	}
	
	function createId() {
		return (Math.random() * new Date().getTime()).toString().toUpperCase().replace('.', '-');
	}

	// Get user media
	function getLocalUserMedia() {
		getUserMedia(config.media, function(stream) {
			attachMediaStream(localVideo, stream);
			localStream = stream;
		}, function() {
			throw new Error('Failed to get user media');
		});
	}
	
	function enableStartButton() {
		var startButton = document.getElementById("startButton");
		startButton.disabled = false;
		startButton.onclick = function () {
			this.parentNode.removeChild(this);
			mainChannel.channel.onDisconnect().remove();
			mainChannel.send({'userid': userid, 'type': 'new_room'});
			initiator = true;
		};
	}
	
	function handleNewParticipant(userid) {
		var userChannelConfig = {
				url : 'https://liquid-galaxy.firebaseio.com/' + userid,
				onmessage : processSignalingMessage,
				onopen : function() {}
			};
		var userChannel = new Channel(userChannelConfig);
		if (!peerConnection) {
			createPeerConnection();
		}
	}

	function joinRoom() {
		// open own channel
		localChannelConfig = {
			url : 'https://liquid-galaxy.firebaseio.com/' + userid,
			onmessage : processSignalingMessage,
			onopen : function() {}
		};
		localChannel = new Firebase(localChannelConfig);
		// send request
		mainChannel.send({'userid': userid, 'type': 'new_participant'});
	}

	function createPeerConnection() {
		peerConnection = new RTCPeerConnection(config.peerConnectionConfig, config.peerConnectionConstraints);
		if (localStream) {
			peerConnection.addStream(localStream);
		}
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

	function processSignalingMessage(msg) {
		if (msg.type == 'offer') {
			peerConnection.setRemoteDescription(new RTCSessionDescription(msg));
			answer();
			console.log("Set remote description.");
		} else if (msg.type === 'answer') {
			peerConnection.setRemoteDescription(new RTCSessionDescription(msg));
		} else if (msg.type === 'candidate') {
			var candidate = new RTCIceCandidate({
				sdpMLineIndex : msg.label,
				candidate : msg.candidate
			});
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
	
	function Channel(channelConfig) {
		this.channel = new Firebase(channelConfig.url);
		channelConfig.onopen();
		this.channel.on("child_added", function(event) {
			channelConfig.onmessage(event.val());
		});
		console.log('Channel opened');
	}


	Channel.prototype.send = function(message) {
		this.channel.push(message);
	}
	setTimeout(initialize, 1);
}());