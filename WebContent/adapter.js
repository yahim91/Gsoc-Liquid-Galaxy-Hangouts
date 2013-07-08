var RTCPeerConnection = null,
getUserMedia = null,
attachMediaStream = null,
browser = null,
MediaStream = null;

if (navigator.mozGetUserMedia) {
	console.log("Firefox browser");
	browser = "firefox";
	RTCPeerConnection = mozRTCPeerConnection;
	RTCSessionDescription = mozRTCSessionDescription;
	RTCIceCandidate = mozRTCIceCandidate;
	getUserMedia = navigator.mozGetUserMedia.bind(navigator);
	MediaStream = window.MediaStream;

	// Attach media stream to an element
	attachMediaStream = function(element, stream) {
		element.mozSrcObject = stream;
		element.play();
	};

	MediaStream.prototype.getVideoTracks = function() {
		return [];
	};

	MediaStream.prototype.getAudioTracks = function() {
		return [];
	};
} else if (navigator.webkitGetUserMedia) {
	console.log("Chrome browser");
	browser = "chrome";
	RTCPeerConnection = webkitRTCPeerConnection;
	getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
	MediaStream = window.webkitMediaStream;

	// Attach media stream to an element
	attachMediaStream = function(element, stream) {
		element.autoplay = true;
		element.src = webkitURL.createObjectURL(stream);
	};

	// The representation of tracks in a stream is changed in M26.
	// Unify them for earlier Chrome versions in the coexisting period.
	if (!webkitMediaStream.prototype.getVideoTracks) {
		webkitMediaStream.prototype.getVideoTracks = function() {
			return this.videoTracks;
		};
		webkitMediaStream.prototype.getAudioTracks = function() {
			return this.audioTracks;
		};
	}

	// New syntax of getXXXStreams method in M26.
	if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
		webkitRTCPeerConnection.prototype.getLocalStreams = function() {
			return this.localStreams;
		};
		webkitRTCPeerConnection.prototype.getRemoteStreams = function() {
			return this.remoteStreams;
		};
	}
} else {
	console.log("Browser does not support webrtc");
}

function merge(s1, s2) {
	return s1 < s2 ? s1 + '+' + s2 : s2 + '+' + s1;
}
