;(function() {
	var localStream,
	localParticipant,
	selectedVideo,
	participants,
	userid,
	mainChannel,
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
		participants = {};
		selectedVideo = document.getElementById('selectedVideo');
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
		mainChannel = new Channel(channelConfig);
	}
	
	function createId() {
		return (Math.random() * new Date().getTime()).toString().toUpperCase().replace('.', '-');
	}

	// Get user media
	function getLocalUserMedia(callback) {
		getUserMedia(config.media, function(stream) {
			localStream = stream;
			callback();
		}, function() {
			throw new Error('Failed to get user media');
		});
	}
	
	function enableStartButton() {
		var startButton = document.getElementById("startButton");
		startButton.disabled = false;
		startButton.onclick = function() {
			this.parentNode.removeChild(this);
			mainChannel.channel.onDisconnect().remove();
			getLocalUserMedia(function() {
				mainChannel.send({
					'userid' : userid,
					'type' : 'new_room'
				});
				
				var mediaElement = document.createElement('video');
				mediaElement.src = webkitURL.createObjectURL(localStream);
				mediaElement.style.width = "200px";
				mediaElement.style.height = "150px";
				mediaElement.autoplay=true;
				mediaElement.controls=true;
				mediaElement.muted=true;
				mediaElement.play();
				mediaElement.onclick = function() {
					selectedVideo.src = webkitURL.createObjectURL(localStream);
					selectedVideo.autoplay=true;
					selectedVideo.controls=true;
					selectedVideo.muted = true;
					selectedVideo.play();
				};
				var remoteMediaStreams = document.getElementById('remoteVideos');
				remoteMediaStreams.appendChild(mediaElement);
				
			});
			initiator = true;
		};
	}
	
	function handleNewParticipant(userid) {
		participants[userid] = new Participant(userid);
		participants[userid].call();
	}

	function joinRoom() {
		// create local participant
		getLocalUserMedia(function() {
			localParticipant = new Participant(userid);
			mainChannel.send({
				'userid' : userid,
				'type' : 'new_participant'
			});
		})
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
	
	function Participant(userid) {
		var self = this;
		this.userid = userid;
		this.peerConnection = new RTCPeerConnection(
				config.peerConnectionConfig, config.peerConnectionConstraints);
		if (localStream) {
			this.peerConnection.addStream(localStream);
		}
		this.peerConnection.onicecandidate = function(event) {
			if (event.candidate) {
				self.channel.send({
					type : 'candidate',
					label : event.candidate.sdpMLineIndex,
					id : event.candidate.sdpMid,
					candidate : event.candidate.candidate
				});
			} else {
				console.log("End of candidates.");
			}
		};
		this.peerConnection.onaddstream = this.onRemoteStreamAdded;
		this.peerConnection.onnegotationneeded = this.negotiationNeeded;
		this.channel = new Channel({
			url : 'https://liquid-galaxy.firebaseio.com/' + userid,
			onmessage: function (msg) {
				if (msg.type == 'offer') {
					self.peerConnection.setRemoteDescription(new RTCSessionDescription(msg));
					self.answer();
					console.log("Set remote description.");
				} else if (msg.type === 'answer') {
					self.peerConnection.setRemoteDescription(new RTCSessionDescription(msg));
				} else if (msg.type === 'candidate') {
					var candidate = new RTCIceCandidate({
						sdpMLineIndex : msg.label,
						candidate : msg.candidate
					});
					self.peerConnection.addIceCandidate(candidate);
				} else if (msg.type === 'bye' && started) {
					//onRemoteHangup();
				}
			},
			onopen: function () {}
		});
		this.channel.channel.onDisconnect().remove();
	}
	
	Participant.prototype.onRemoteStreamAdded = function (event) {
		console.log("remote stream added");
		var mediaElement = document.createElement('video');
		mediaElement.src = webkitURL.createObjectURL(event.stream);
		mediaElement.style.width = "200px";
		mediaElement.style.height = "150px";
		mediaElement.autoplay=true;
		mediaElement.controls=true;
		mediaElement.play();
		mediaElement.onclick = function() {
			selectedVideo.src = webkitURL.createObjectURL(event.stream);
			selectedVideo.autoplay=true;
			selectedVideo.controls=true;
			selectedVideo.muted=false;
			selectedVideo.play();
		};
		var remoteMediaStreams = document.getElementById('remoteVideos');
		remoteMediaStreams.appendChild(mediaElement);
		mediaElement.onclick();
	};

	Participant.prototype.answer = function() {
		var self = this;
		console.log("Sending answer to peer");
		this.peerConnection.createAnswer(function(sessionDescription) {
			self.peerConnection.setLocalDescription(sessionDescription);
			self.channel.send(sessionDescription);
		});
	};

	Participant.prototype.call = function() {
		var self = this;
		console.log("Sending offer to peer");
		this.peerConnection.createOffer(function(sessionDescription) {
			self.peerConnection.setLocalDescription(sessionDescription);
			self.channel.send(sessionDescription);
		}, null, {
			'mandatory' : {
				'OfferToReceiveAudio' : true,
				'OfferToReceiveVideo' : true
			}
		});
	};
	setTimeout(initialize, 1);
}());