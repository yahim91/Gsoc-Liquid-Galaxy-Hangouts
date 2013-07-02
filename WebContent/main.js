;
(function() {
	var localStream,
	localParticipant,
	selectedVideo,
	participants,
	userid,
	mainChannel,
	initiator,
	channelConfig,
	newParticipantMessageRef, config = {
		media : {
			audio : true,
			video : true
		},
		peerConnectionConfig : {
			iceServers : [ {
				"url" : "stun:stun.l.google.com:19302"
			} ]
		},
		peerConnectionConstraints : {
			optional : [ {
				"DtlsSrtpKeyAgreement" : true
			} ]
		}
	};

	function initialize() {
		participants = {'size': 0};
		selectedVideo = document.getElementById('selectedVideo');
		channelConfig = {
			url : 'https://liquid-galaxy.firebaseio.com/main',
			onmessage : function(data) {
				if (data.userid === userid) {
					return;
				}
				console.log('S -> C:' + JSON.stringify(data));
				if (data.type === 'new_room') {
					var startButton = document.getElementById("startButton");
					startButton.parentNode.removeChild(startButton);
					initiator = false;
				} else if (data.type === 'new_participant') {
					handleNewParticipant(data.userid);
				} else if (data.type === 'leave') {
					removeParticipant(data);
				}
				
			},
			onopen : function() {
				getLocalUserMedia(function() {
					mainChannel.send({
						'userid' : userid,
						'type' : 'new_participant'
					});
					
					addVideoTag(localStream, {'muted': true, 'controls': false, 'id': userid});
					
					for (user in participants) {
						if (participants[user] === 'waitingMedia') {
							participants[user] = new Participant(
									user < userid ? user + '+' + userid
											: userid + '+' + user);
							participants['size']++;
							if (user < userid) {
								participants[user].call();
							}
						}
					}
				});
			},
			onparticipantleft: function (data) {
				if (data.userid === userid) {
					return;
				}
				if (data.type === 'new_participant') {
					participants[data.userid].close();
					delete participants[data.userid];
				}
			}
		}
		userid = createId();
		mainChannel = new Channel(channelConfig);
	}

	function createId() {
		return (Math.random() * new Date().getTime()).toString().toUpperCase()
				.replace('.', '-');
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
				addVideoTag(localStream, {'muted': true, 'controls': false});
			});
			initiator = true;
		};
	}

	function handleNewParticipant(remoteUserid) {
		if (!participants[remoteUserid]) {
			if (localStream) {
				participants[remoteUserid] = new Participant(
						remoteUserid < userid ? remoteUserid + '+' + userid
								: userid + '+' + remoteUserid);
				participants['size']++;
				if (remoteUserid < userid) {
					participants[remoteUserid].call();
				}
			} else {
				participants[remoteUserid] = 'waitingMedia';
			}
		}
	}

	function Channel(channelConfig) {
		this.channel = new Firebase(channelConfig.url);
		channelConfig.onopen();
		this.channel.on("child_added", function(event) {
			channelConfig.onmessage(event.val());
		});
		this.channel.on("child_removed", function(event) {
			if (event.val().type && event.val().type == 'new_participant') {
				channelConfig.onparticipantleft(event.val());
			}
		});
		console.log('Channel opened');
	}

	Channel.prototype.send = function(message) {
		if (message.type === 'new_participant') {
			newParticipantMessageRef = this.channel.push(message);
		} else {
			this.channel.push(message);
		}
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
		this.peerConnection.onaddstream = function(event) {
			console.log("remote stream added");
			addVideoTag(event.stream, {'muted': false, 'controls': true, 'id': self.userid});
		};
		
		this.peerConnection.onnegotationneeded = this.negotiationNeeded;
		this.channel = new Channel(
				{
					url : 'https://liquid-galaxy.firebaseio.com/' + userid,
					onmessage : function(msg) {
						if (msg.type == 'offer') {
							self.peerConnection
									.setRemoteDescription(new RTCSessionDescription(
											msg));
							self.answer();
							console.log("Set remote description.");
						} else if (msg.type === 'answer') {
							self.peerConnection
									.setRemoteDescription(new RTCSessionDescription(
											msg));
						} else if (msg.type === 'candidate') {
							var candidate = new RTCIceCandidate({
								sdpMLineIndex : msg.label,
								candidate : msg.candidate
							});
							self.peerConnection.addIceCandidate(candidate);
						}
					},
					onopen : function() {
					}
				});
		this.channel.channel.onDisconnect().remove();
	}

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
	
	Participant.prototype.close = function () {
		var remoteVideo = document.getElementById(this.userid);
		remoteVideo.parentNode.removeChild(remoteVideo);
		this.peerConnection.close();
		participants.size--;
		if (selectedVideo.videoId === this.userid) {
			selectedVideo[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? localStream : webkitURL.createObjectURL(localStream);
			selectedVideo.videoId = userid;
			selectedVideo.muted = true;
		}
	}
	
	function addVideoTag(stream, configuration) {
		var mediaElement = document.createElement('video');
		mediaElement[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? stream : webkitURL.createObjectURL(stream);
		mediaElement.id = configuration.id;
		mediaElement.style.width = "200px";
		mediaElement.style.height = "150px";
		mediaElement.autoplay = true;
		mediaElement.controls = configuration.controls;
		mediaElement.muted = configuration.muted;
		mediaElement.play();
		mediaElement.onclick = function() {
			selectedVideo[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? stream : webkitURL.createObjectURL(stream);
			selectedVideo.videoId = configuration.id;
			selectedVideo.autoplay = true;
			//selectedVideo.controls = true;
			selectedVideo.muted = configuration.muted;
			selectedVideo.play();
		};
		var remoteMediaStreams = document.getElementById('remoteVideos');
		remoteMediaStreams.appendChild(mediaElement);
		mediaElement.onclick();
	}
	window.onload = initialize;
	window.onbeforeunload = function () {
		newParticipantMessageRef.remove();
	};
}());