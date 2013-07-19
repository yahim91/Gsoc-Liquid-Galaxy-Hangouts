;
(function() {
	var localVideoStream,
	localScreenStream,
	selectedVideo,
	participants,
	userid,
	screenShareButton,
    localStream,
	userInfo,
    room,
	mainChannel,
	isReady,
	initiator,
	slaves,
	ownChannel,
	slaveNum,
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
				'type' : 'new_participant'
			});
			isReady = true;
			addVideoTag(localStream.stream, {
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
					/*if (userInfo.type !== 'regular') {
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
					}*/
					participants[user] = new Participant(participantConfig);

					if (user < userid) {
						participants[user].call();
					}
					
					for (slave in slaves) {
						if (slaves[slave].remoteConnection === false) {
							slaves[slave].channel.send({'type': 'new_participant', 'userid': user});
							slaves[slave].remoteConnection = true;
							participants[user].channel.send({'userid': userid, 'data':{'type': 'slaveId', 'slaveId': slave}});
							break;
						}
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
        userid = createId();
        getLocalUserMedia();
		
		document.getElementById('start-button').onclick = start;
		document.getElementById('input_slave_1').addEventListener('keydown', addSlave, false);
		
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
		
		console.log("User Id is : " + userid);
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
	function getLocalUserMedia() {
        localStream = Erizo.Stream({audio:true, video: true, data: true, attributes: {userid:userid}});
        localStream.init();
        localStream.addEventListener('access-accepted', function(event) {
            addVideoTag(localStream.stream, {
				'muted' : true,
				'controls' : false,
				'id' : userid
			});
            
        });
		localStream.addEventListener('access-denied', function(event) {
            
        });
	}
    
	function enableStartButton() {
		
	}

	
    
    function removeVideoTag(stream) {
        var streamId = stream.getAttributes().userid;
        var toBeRemoved = document.getElementById(streamId);
		toBeRemoved.parentNode.removeChild(toBeRemoved);
		if (selectedVideo.videoId === streamId) {
			selectedVideo[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? localStream.stream
					: webkitURL.createObjectURL(localStream.stream);
			selectedVideo.videoId = userid;
			selectedVideo.muted = true;
		}
    }

	function addVideoTag(stream, configuration) {
        var container = document.createElement('figure');
        container.className = 'video-tile-figure';
        var caption = document.createElement('figcaption');
        caption.className = 'video-tile-caption';
        var muteButton = document.createElement('img');
        if (configuration.muted === true) {
            muteButton.src = '/assets/muted.png';
        } else {
            muteButton.src = '/assets/unmuted.png';
        }
        muteButton.className='mute';
        caption.appendChild(muteButton);
		var mediaElement = document.createElement('video');
		mediaElement[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? stream
				: webkitURL.createObjectURL(stream);
		mediaElement.className = "tile-video";
		mediaElement.stream = stream;
		mediaElement.autoplay = true;
		mediaElement.controls = configuration.controls;
		mediaElement.muted = configuration.muted;
		mediaElement.play();
		mediaElement.onclick = function() {
			selectedVideo[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? mediaElement.stream
					: webkitURL.createObjectURL(mediaElement.stream);
			selectedVideo.videoId = configuration.id;
			selectedVideo.autoplay = true;
			selectedVideo.muted = configuration.muted;
			selectedVideo.play();
		};
		mediaElement.replaceStream = function(stream) {
			mediaElement[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? stream
					: webkitURL.createObjectURL(stream);
			mediaElement.stream = stream;
		}
        muteButton.onclick = function () {
            if (mediaElement.muted === false) {
                mediaElement.muted = true;
                muteButton.src = '/assets/muted.png';
            } else {
                mediaElement.muted = false;
                muteButton.src = '/assets/unmuted.png';
            }
        }
        container.appendChild(mediaElement);
        container.appendChild(caption);
		var remoteMediaStreams = document.getElementById('remote-videos');
        var li = document.createElement('li');
        li.id = configuration.id;
        li.appendChild(container);
		remoteMediaStreams.appendChild(li);
		mediaElement.onclick();
	}
	window.onload = initialize;
	
	function addSlave(event) {
		if (event.keyCode != 13) {
			return;
		}
		if (slaveNum == 5) {
			return;
		}
		slaveNum++;
		console.log('slave added' + event.srcElement.value);
		slaves[event.srcElement.value].idCase = event.srcElement;
		slaves[event.srcElement.value].removeParticipant = function() {
		};
		
		var input = document.createElement("input");
		input.type = 'text';
		input.className = 'slave-input';
		input.addEventListener("keydown", addSlave, false);
		input.placeholder = 'Add a slave!';
		event.srcElement.parentNode.appendChild(input);
		input.focus();
	}
    
    var createToken = function(callback) {
        var xhr = new XMLHttpRequest();
        var url = '/createToken/';
        var body = {'username': userid, 'role': {}};
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                callback(xhr.responseText);
            }
        }
        
        xhr.open('POST', url, true);
        xhr.send(JSON.stringify(body));
    }
    
    var subscribeToStreams = function(streams) {
        for (var index in streams) {
            var stream = streams[index];
            if (localStream.getID() !== stream.getID()) {
                room.subscribe(stream);
            } 
        }
    };
	
	function start() {
        var streams = [];
		createToken(function(token){
            console.log(token);
            room = Erizo.Room({'token': token});
            room.addEventListener('room-connected', function(roomEvent) {
                console.log('room-connected');
                room.publish(localStream);
                subscribeToStreams(roomEvent.streams);
            });
            
            room.addEventListener('stream-added', function (roomEvent) {
                if (localStream.getID() === roomEvent.stream.getID()) {
                    console.log('local stream published id: '+ localStream.getID());
                    return;
                } else {
                    room.subscribe(roomEvent.stream);
                }
            });
            
            room.addEventListener('stream-removed', function(roomEvent){
                removeVideoTag(roomEvent.stream);
            });
            
            room.addEventListener('stream-subscribed', function(roomEvent) {
                streams.push(roomEvent.stream);
                addVideoTag(roomEvent.stream.stream, {
                    'muted' : false,
				    'controls' : false,
				    'id' : roomEvent.stream.getAttributes().userid
                });
            });
            room.connect();
        });
	}
}());