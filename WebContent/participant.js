function Participant(participantConfig) {
	var self = this;
	this.userid = participantConfig.userid;
	this.firstCall = true;
	this.peerConnection = new RTCPeerConnection(
			participantConfig.peerConnectionConfig,
			participantConfig.peerConnectionConstraints);
	this.peerConnection.addStream(participantConfig.localVideoStream);
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
		participantConfig.onaddstream(event, self.userid);
	};

	this.channel = new Channel({
		url : 'https://liquid-galaxy.firebaseio.com/'
				+ participantConfig.userid,
		onmessage : function(msg) {
			if (msg.type == 'offer') {
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
}

Participant.prototype.call = function(configuration) {
	var self = this;
	console.log("Sending offer to peer");
	this.peerConnection.createOffer(function(sessionDescription) {
		self.peerConnection.setLocalDescription(sessionDescription);
		self.channel.send(sessionDescription);
	}, null, configuration);
};

Participant.prototype.answer = function() {
	var self = this;
	console.log("Sending answer to peer");
	this.peerConnection.createAnswer(function(sessionDescription) {
		self.peerConnection.setLocalDescription(sessionDescription);
		self.channel.send(sessionDescription);
	});
};