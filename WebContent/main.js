;
(function() {
	var localVideoStream,
	localScreenStream,
	selectedVideo,
	participants,
	userid,
	screenShareButton,
	userInfo,
	mainChannel,
	initiator,
	channelConfig,
	newParticipantMessageRef,
	participantConfig = {
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
		onaddstream : function(event, remoteuserid) {
			var mediaElement = document.getElementById(remoteuserid);
			if (mediaElement) {
				mediaElement[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? event.stream
						: webkitURL.createObjectURL(event.stream);
				mediaElement.autoplay = true;
				mediaElement.stream = event.stream;
				mediaElement.play();
			} else {
				console.log("remote stream added");
				addVideoTag(event.stream, {
					'muted' : false,
					'controls' : true,
					'id' : remoteuserid
				});
			}
		}
	}, config = {
		media : {
			audio : true,
			video : true
		},
		stream : 'localVideoStream',
		callback : function(userInfo) {
			newParticipantMessageRef = mainChannel.send({
				'userid' : userid,
				'type' : userInfo.type === 'regular' ? 'new_participant' : 'new_galaxy_rig'
			});

			addVideoTag(localVideoStream, {
				'muted' : true,
				'controls' : false,
				'id' : userid
			});

			for (user in participants) {
				if (participants[user] === 'waitingMedia') {
					participantConfig.localUserId = userid;
					participantConfig.stream = localVideoStream;
					participantConfig.userid = user < userid ? user + '+'
							+ userid : userid + '+' + user;
					participantConfig.mediaConfiguration = {
						'mandatory' : {
							'OfferToReceiveAudio' : true,
							'OfferToReceiveVideo' : true
						}
					};
					if (userInfo.type !== 'regular') {
						var slaveId = createId();
						participantConfig.onaddstream = function () {};
						participantConfig.onopen = function (participant) {
							participant.channel.send({'userid': userid, 'data':{'type': 'slaveId', 'slaveId': slaveId}});
						}
						// var slaveConfig = participantConfig;
						// slaveConfig.userid = merge(slaveId, userid);
						// slaves[slaveId] = new Participant(slaveConfig);
						// slaves[slaveId].call();
						var url = location.href.split('?')[0];
						url = url.substring(0, url.lastIndexOf('/') + 1)
								+ 'slave.html?';
						url += 'slaveId=' + slaveId;
						url += '&masterId=' + userid;
						url += '&remoteId=' + user;
						window.open(url, 'width=800px, height=600px').focus();
					}
					participants[user] = new Participant(participantConfig);

					if (user < userid) {
						participants[user].call();
					}
				}
			}
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
		participants = {};
		slaves = {};
		if (location.href.split('?').length > 1) {
			userInfo = {
				type : 'galaxy-rig',
				galaxyId : getUrlParam('galaxyId'),
				galaxyRole : getUrlParam('galaxyRole')
			}
		} else {
			userInfo = {
				type : 'regular'
			};
		}
		console.log('User info: ' + JSON.stringify(userInfo));
		selectedVideo = document.getElementById('selectedVideo');
		screenShareButton = document.getElementById('screenShareButton');
		screenShareButton.onclick = function() {
			getLocalUserMedia({
				media : {
					video : {
						mandatory : {
							chromeMediaSource : 'screen'
						}
					}
				},
				callback : function() {
					for (user in participants) {
						if (participants[user] === 'waitingMedia') {
							participantConfig.userid = user < userid ? user
									+ '+' + userid : userid + '+' + user;
							participantConfig.localUserid = userid;
							participantConfig.mediaConfiguration = {
								'mandatory' : {
									'OfferToReceiveAudio' : true,
									'OfferToReceiveVideo' : true
								}
							};
							participants[user] = new Participant(
									participantConfig);

							if (user < userid) {
								participants[user].call();
							}
						} else {
							participants[user].removeStream(localVideoStream);
							participants[user].addStream(localScreenStream);
							localVideoStream.stop();
							participants[user].call();
						}
					}
					var localVideo = document.getElementById(userid);
					if (localVideo) {
						localVideo.replaceStream(localVideoStream);
					}
				},
				stream : 'localScreenStream'
			});
		};
		channelConfig = {
			url : 'https://liquid-galaxy.firebaseio.com/main',
			onmessage : function(data) {
				if (data.userid === userid) {
					return;
				}
				console.log('S -> C:' + JSON.stringify(data));
				if (data.type === 'new_room') {
					initiator = false;
				} else if (data.type === 'new_participant' || data.type === 'new_galaxy_rig') {
					handleNewParticipant(data);
				} else if (data.type === 'leave') {
					removeParticipant(data);
				}

			},
			onopen : function() {
				getLocalUserMedia(config);
			},
			onparticipantleft : function(data) {
				if (data.userid === userid) {
					return;
				}
				if (data.type === 'new_participant' || data.type === 'new_participant') {
					participants[data.userid].close();
					delete participants[data.userid];
				}
			}
		};
		userid = createId();
		mainChannel = new Channel(channelConfig);
	}

	function createId() {
		return (Math.random() * new Date().getTime()).toString().toUpperCase()
				.replace('.', '-');
	}

	function getUrlParam(key) {
		var param_string = location.href.split('?')[1];
		var parameters = param_string.split('&');
		for ( var i in parameters) {
			res = parameters[i].split('=');
			if (res[0] === key) {
				return res[1];
			}
		}
	}

	// Get user media
	function getLocalUserMedia(configuration) {
		getUserMedia(configuration.media, function(stream) {
			if (configuration.stream === 'localScreenStream') {
				localScreenStream = stream;
			} else {
				localVideoStream = stream;
			}
			console.log('Stream id: ' + stream.id);
			configuration.callback(userInfo);
		}, function() {
			throw new Error('Failed to get user media');
		});
	}
	function merge(s1, s2) {
		return s1 < s2 ? s1 + '+' + s2 : s2 + '+' + s1;
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
				addVideoTag(localVideoStream, {
					'muted' : true,
					'controls' : false
				});
			});
			initiator = true;
		};
	}

	function handleNewParticipant(remoteData) {
		var remoteUserid = remoteData.userid;
		var remoteType = remoteData.type;
		if (!participants[remoteUserid]) {
			if (localVideoStream) {
				participantConfig.stream = localVideoStream;
				participantConfig.localUserId = userid;
				participantConfig.userid = remoteUserid < userid ? remoteUserid
						+ '+' + userid : userid + '+' + remoteUserid;
				participantConfig.mediaConfiguration = {
					'mandatory' : {
						'OfferToReceiveAudio' : true,
						'OfferToReceiveVideo' : true
					}
				};
				if (userInfo.type !== 'regular') {
					var slaveId = createId();
					participantConfig.onaddstream = function () {};
					participantConfig.onopen = function (participant) {
						participant.channel.send({'userid': userid, 'data':{'type': 'slaveId', 'slaveId': slaveId}});
					}
					// var slaveConfig = participantConfig;
					// slaveConfig.userid = merge(slaveId, userid);
					// slaves[slaveId] = new Participant(slaveConfig);
					// slaves[slaveId].call();
					var url = location.href.split('?')[0];
					url = url.substring(0, url.lastIndexOf('/') + 1)
							+ 'slave.html?';
					url += 'slaveId=' + slaveId;
					url += '&masterId=' + userid;
					url += '&remoteId=' + remoteUserid;
					window.open(url, 'width=800px, height=600px').focus();
				}
				participants[remoteUserid] = new Participant(participantConfig);
				if (remoteUserid < userid) {
					participants[remoteUserid].call();
				}
			} else {
				participants[remoteUserid] = 'waitingMedia';
			}
		}
	}

	Participant.prototype.removeStream = function(stream) {
		this.peerConnection.removeStream(stream);
	};

	Participant.prototype.close = function() {
		if (userInfo.type === 'galaxy-rig') {
			return;
		}
		var remoteVideo = document.getElementById(this.userid);
		remoteVideo.parentNode.removeChild(remoteVideo);
		this.peerConnection.close();
		if (selectedVideo.videoId === this.userid) {
			selectedVideo[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? localVideoStream
					: webkitURL.createObjectURL(localVideoStream);
			selectedVideo.videoId = userid;
			selectedVideo.muted = true;
		}
	};

	Participant.prototype.addStream = function(stream) {
		this.peerConnection.addStream(stream);
	};

	function addVideoTag(stream, configuration) {
		var mediaElement = document.createElement('video');
		mediaElement[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? stream
				: webkitURL.createObjectURL(stream);
		mediaElement.id = configuration.id;
		mediaElement.stream = stream;
		mediaElement.style.width = "200px";
		mediaElement.style.height = "150px";
		mediaElement.autoplay = true;
		mediaElement.controls = configuration.controls;
		mediaElement.muted = configuration.muted;
		mediaElement.play();
		mediaElement.onclick = function() {
			selectedVideo[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? mediaElement.stream
					: webkitURL.createObjectURL(mediaElement.stream);
			selectedVideo.videoId = configuration.id;
			selectedVideo.autoplay = true;
			// selectedVideo.controls = true;
			selectedVideo.muted = configuration.muted;
			selectedVideo.play();
		};
		mediaElement.replaceStream = function(stream) {
			mediaElement[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? stream
					: webkitURL.createObjectURL(stream);
			mediaElement.stream = stream;
		}
		var remoteMediaStreams = document.getElementById('remoteVideos');
		remoteMediaStreams.appendChild(mediaElement);
		mediaElement.onclick();
	}
	window.onload = initialize;
	window.onbeforeunload = function() {
		newParticipantMessageRef.remove();
	};
}());