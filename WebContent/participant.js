function Participant(participantConfig) {
	var self = this;
	this.slaves = {};
	this.participantConfig = participantConfig;
	this.localUserId = participantConfig.localUserId;
	this.userid = participantConfig.userid;
	this.firstCall = true;
	this.peerConnection = new RTCPeerConnection(
			participantConfig.peerConnectionConfig,
			participantConfig.peerConnectionConstraints);
	if (participantConfig.stream) {
		this.peerConnection.addStream(participantConfig.stream);
	}
	this.peerConnection.onnegotiationneeded = function(event) {
		console.log('negotiation nedeed');
		/*
		 * if (!self.firstCall) { console.log('negotiation nedeed');
		 * self.call(); } else { self.firstCall = false; }
		 */
	};
	this.peerConnection.onremovestream = function() {
		console.log('stream removed');
	};
	this.peerConnection.onicecandidate = function(event) {
		if (event.candidate) {
			self.channel.send({'userid': participantConfig.localUserId, 'data' :{
				type : 'candidate',
				label : event.candidate.sdpMLineIndex,
				id : event.candidate.sdpMid,
				candidate : event.candidate.candidate
			}});
		} else {
			console.log("End of candidates.");
		}
	};
	this.peerConnection.onaddstream = function(event) {
		participantConfig.onaddstream(event, self.userid);
	};

	this.channel = new Channel({
		url : 'https://liquid-galaxy.firebaseio.com/'
				+ participantConfig.userid,
		onmessage : participantConfig.onmessage ? participantConfig.onmessage : function(msg) {
			if (msg.userid === participantConfig.localUserId) {
				return;
			} else {
				msg = msg.data;
			}
			if (msg.type === 'slaveId') {
				self.slaves[msg.slaveId] = new Participant(
						{
							localUserId : self.localUserId,
							userid : merge(self.localUserId, msg.slaveId),
							peerConnectionConfig : {
								iceServers : [ {
									"url" : "stun:stun.l.google.com:19302"
								} ]
							},
							peerConnectionConstraints : {
								optional : [ {
									"DtlsSrtpKeyAgreement" : true
								} ]
							},
							onaddstream : function(event,
									remoteuserid) {
							},
							mediaConfiguration : {
								'mandatory' : {
									'OfferToReceiveAudio' : true,
									'OfferToReceiveVideo' : true
								}
							},
							onopen: function (participant) {
								participant.peerConnection.addStream(self.participantConfig.stream);
								participant.call();
							}
						});
			} else if (msg.type == 'offer') {
				console.log('offer: ' + JSON.stringify(msg));
				self.peerConnection
						.setRemoteDescription(new RTCSessionDescription(msg));
				self.answer();
				console.log("Set remote description.");
			} else if (msg.type === 'answer') {
				self.peerConnection
						.setRemoteDescription(new RTCSessionDescription(msg));
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
	if (participantConfig.onopen) {
		participantConfig.onopen(this);
	}
}

Participant.prototype.call = function() {
	var self = this;
	console.log("Sending offer to peer");
	this.peerConnection.createOffer(function(sessionDescription) {
		self.peerConnection.setLocalDescription(sessionDescription);
		self.channel.send({'userid': self.localUserId, 'data': sessionDescription});
	}, null, this.participantConfig.mediaConfiguration);
};

Participant.prototype.answer = function() {
	var self = this;
	console.log("Sending answer to peer");
	this.peerConnection.createAnswer(function(sessionDescription) {
		self.peerConnection.setLocalDescription(sessionDescription);
		self.channel.send({'userid': self.localUserId, 'data': sessionDescription});
	});
};