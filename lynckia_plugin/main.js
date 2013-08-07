;
(function() {
	var selectedVideo,
	participants,
	userid,
	screenShareButton,
    startButton,
    attachButton,
    screenShared,
    screenStream,
    localStream,
    room,
	slaves,
    attachToLG,
    ready,
    streams,
	slaveNum,
    meters,
    audioContext;
    	

	function initialize() {
        screenShared = false;
        ready = false;
        participants = {};
        meters = [];
        audioContext = new AudioContext();

        userid = createId();
        getLocalUserMedia({audio:true, video:true, data:true});
        attachToLG = false;
        /*setInterval(function() {
            for (var i = 0; i < meters.length; i++) {
                var freqByteData = new Uint8Array(meters[i].analyzerNode.frequencyBinCount);
                meters[i].analyzerNode.getByteFrequencyData(freqByteData); 
                var newVol = getAverageVolume(freqByteData.subarray(0,200));
                meters[i].volume = Math.min(newVol, meters[i].volume);
            }
        },
        1000);*/

        /*setInterval(function(){
            for (var i = 0; i < meters.length; i++) {
                updateAnalysers({meter: meters[i].meter, analyzerNode: meters[i].analyzerNode, volume: meters[i].volume});
            }
        }, 1000/60);*/

		var muteMic = document.getElementById('mic');
        muteMic.muted = false;
        muteMic.onclick = function() {
            if (muteMic.muted === false) {
                muteMic.muted = true;
                muteMic.src = "/assets/microphone-muted.png";
                muteMic.title = "Unmute microphone";
                if (localStream) {
                    if (localStream.stream.getAudioTracks()[0].onmute === null) {
                        localStream.stream.getAudioTracks()[0].onmute = showMessage('Microphone muted');
                    }
                    localStream.stream.getAudioTracks()[0].enabled = false;
                }
            } else {
                muteMic.muted = false;
                muteMic.src = "/assets/microphone-mute.png";
                muteMic.title = "Mute microphone";
                if (localStream) {
                    if (localStream.stream.getAudioTracks()[0].onunmute === null) {
                        localStream.stream.getAudioTracks()[0].onunmute = showMessage('Microphone unmuted');
                    }
                    localStream.stream.getAudioTracks()[0].enabled = true;
                }
            }
        }
        
        var muteCamera = document.getElementById('camera');
        muteCamera.muted = false;
        muteCamera.onclick = function () {
            if (muteCamera.muted === false) {
                muteCamera.muted = true;
                muteCamera.src = "/assets/camera-muted.png";
                muteCamera.title = "Turn camera on";
                if (localStream) {
                    if (localStream.stream.getVideoTracks()[0].onmute === null) {
                        localStream.stream.getVideoTracks()[0].onmute = showMessage('Camera muted');
                    }
                    localStream.stream.getVideoTracks()[0].enabled = false;
                }
            } else {
                muteCamera.muted = false;
                muteCamera.src = "/assets/camera-mute.png";
                muteCamera.title = "Turn camera off";
                if (localStream) {
                    if (localStream.stream.getVideoTracks()[0].onunmute === null) {
                        localStream.stream.getVideoTracks()[0].onunmute = showMessage('Camera unmuted');
                    }
                    localStream.stream.getVideoTracks()[0].enabled = true;
                }
            }
        }
		startButton = document.getElementById('start-button');
        startButton.started = false;
        startButton.onclick = start;
        attachButton = document.getElementById('attach-to-rig');
        attachButton.pressed = false;
        attachButton.onclick = function (event) {
            if (startButton.started) {
                return;
            }
            if (attachToLG){
                return;
            }
            var selectMaster = document.createElement('select');
            selectMaster.id = 'select-master';
            selectMaster.onchange = function() {
                if (startButton.started) {
                    return;
                }
                var masterId = selectMaster.options[selectMaster.selectedIndex].value;
                if (masterId === 'select') {
                    localStream.attributes.role = 'regular';
                    participants[userid].role = 'regular';
                    return;
                } else {
                    localStream.attributes.role = 'slave';
                    localStream.attributes.masterId = masterId;
                    participants[userid].role = 'slave';
                    participants[userid].masterId = masterId;
                }
            }
            var hint = document.createElement('option');
            hint.innerHTML = '-select-';
            hint.id = 'select';
            selectMaster.appendChild(hint);
            for (var i in room.remoteStreams) {
                var remoteUserId = room.remoteStreams[i].getAttributes().userid;
                var option = document.createElement('option');
                option.innerHTML = remoteUserId;
                option.id = 'opt_' + remoteUserId;
                selectMaster.appendChild(option);
            }
            event.srcElement.parentNode.appendChild(selectMaster);
            attachToLG = true;
        };
		
		selectedVideo = document.getElementById('selectedVideo');
		screenShareButton = document.getElementById('share-screen-button');
		screenShareButton.onclick = function() {
			screenStream = Erizo.Stream({screen: true, video: true, data: true, attributes: {userid:userid, type: 'screen', role:'regular'}});
            screenStream.init();
            screenStream.addEventListener('access-accepted', function(event) {
                participants[userid].addStream(screenStream);
                participants[userid].switchVideos();
                screenStream.stream.onended = function() {
                    if (room) {
                        room.unpublish(screenStream);
                    }
                    participants[userid].removeStream(screenStream);
                }
                screenShared = true;
                if (room && room.state == 2) {
                    room.publish(screenStream);
                }
            });
            screenStream.addEventListener('access-denied', function(event) {
                console.log('denied');
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
	function getLocalUserMedia(media) {
        localStream = Erizo.Stream({audio:media.audio, video: media.video, data: media.data, attributes: {userid:userid, type: 'video', role:'regular'}});
        window.stream = localStream;
        localStream.init();
        localStream.addEventListener('access-accepted', function(event) {
            if (!participants[userid]) {
                participants[userid] = new Participant ({userid: userid, role: 'regular'});
                participants[userid].addStream(localStream);
                participants[userid].show({muted: true});
            }
             console.log("Video stream id is " + JSON.stringify(localStream.getAttributes()));
             connectToRoom();
        });
		localStream.addEventListener('access-denied', function(event) {
            getLocalUserMedia({screen: true, audio: false, video: true, data: true});
            console.log('error :' + event.code);
        });
	}
    
    function replaceVideo(stream) {
        var userId = stream.getAttributes().userid;
        var toBeReplaced = document.getElementById(userId);
        toBeReplaced.children[0].children[0].replaceStream(stream.stream);
    }

	function addStreamToVideo(stream) {
        var streamId = stream.getAttributes().userid;
        var container = document.getElementById(streamId);
        var screenIcon = document.createElement('div');
        screenIcon.className = 'screen-icon';
        screenIcon.innerHTML = 'S';
        screenIcon.onclick = function() {
            if (container.participant.streams.length < 2) {
                return;
            }
            container.currStream = 1 - container.currStream;
            var nextStream = container.participant.streams[container.currStream];
            container.children[0].children[0].replaceStream(nextStream.stream);
        }
        container.children[0].children[1].appendChild(screenIcon);
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
    
    
    function getMax(numArray) {
            return Math.max.apply(null, numArray);
    }
    function getMin(numArray) {
            return Math.min.apply(null, numArray);
    }
    
    function getAverageVolume(array) {
        var values = 0;
        var average;
        var length = array.length;
        // get all the frequency amplitudes
        for (var i = 0; i < length; i++) {
            values += array[i];
        }
        average = values / length;
        return average;
    }
    window.showMessage = showMessage;
    window.hide = hideMessage;
    function showMessage(message) {
        hideMessage();
        var notifier = document.querySelector('.message');
        notifier.innerHTML = message;
        document.querySelector('.notification').classList.toggle('pop');
        setTimeout(function() {
            if (notifier.innerHTML == message) {
                hideMessage();
            }
        }, 5000);
    }

    function hideMessage () {
        var node = document.querySelector('.notification');
        if (node.classList.contains('pop')){
            node.classList.toggle('pop');
        }
    }

    function updateAnalysers(param) {
        var freqByteData = new Uint8Array(param.analyzerNode.frequencyBinCount);
        param.analyzerNode.getByteFrequencyData(freqByteData); 
        var percent = getAverageVolume(freqByteData.subarray(0,300));
        var dif = (percent)* (100/256);
        var meter = param.meter.getContext('2d');
        meter.clearRect(0,0,300,100);
        meter.fillStyle = 'green';
        meter.fillRect(0,0, dif,100);
        //console.log(percent);
    }

    function convertToMono( input ) {
        var splitter = audioContext.createChannelSplitter(2);
        var merger = audioContext.createChannelMerger(2);
        input.connect( splitter );
        splitter.connect( merger, 0, 0 );
        splitter.connect( merger, 0, 1 );
        return merger;
    }

    function addVideoTag(configuration) {
        var container = document.createElement('figure');
        container.className = 'video-tile-figure';
        var caption = document.createElement('figcaption');
        caption.className = 'video-tile-caption';
        var muteButton = document.createElement('img');
        muteButton.muted = configuration.muted;

        if (configuration.muted === true) {
            muteButton.src = '/assets/muted.png';
        } else {
            muteButton.src = '/assets/unmuted.png';
        }

        muteButton.className='mute';
        var screenIcon = document.createElement('div');
        screenIcon.className = 'screen-icon';
        screenIcon.innerHTML = 'S';
        screenIcon.currStream = 0;
        screenIcon.onclick = function() {
            if (configuration.participant.streams.length < 2) {
                return;
            }
            this.currStream = 1 - this.currStream;
            var nextStream = configuration.participant.streams[this.currStream];
            configuration.participant.video.replaceStream(nextStream.stream);
        }

        caption.appendChild(muteButton);
        caption.appendChild(screenIcon);
        var stream = configuration.participant.streams[0].stream;
        
		var mediaElement = document.createElement('video');
		mediaElement[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? stream
				: webkitURL.createObjectURL(stream);
		mediaElement.className = "tile-video";
		mediaElement.stream = stream;
		mediaElement.autoplay = true;
		mediaElement.controls = false;
		mediaElement.muted = configuration.muted;
		mediaElement.play();
		mediaElement.onclick = function() {
			selectedVideo[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? mediaElement.stream
					: webkitURL.createObjectURL(mediaElement.stream);
			selectedVideo.videoId = configuration.participant.userid;
			selectedVideo.autoplay = true;
			selectedVideo.muted = configuration.muted;
			selectedVideo.play();
		};
		mediaElement.replaceStream = function(_stream) {
            if (selectedVideo.videoId === configuration.participant.userid) {
                selectedVideo[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? _stream
					: webkitURL.createObjectURL(_stream);
                selectedVideo.muted = true;
            }
            mediaElement[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? _stream
					: webkitURL.createObjectURL(_stream);
            mediaElement.muted = muteButton.muted;
			mediaElement.stream = _stream;

		}
 
        muteButton.onclick = function () {
            if (mediaElement.muted === false) {
                mediaElement.muted = true;
                muteButton.src = '/assets/muted.png';
            } else {
                mediaElement.muted = false;
                muteButton.src = '/assets/unmuted.png';
            } 
            muteButton.muted = mediaElement.muted;
        }
        configuration.participant.video = mediaElement;
        volumeMeter = document.createElement('canvas');
        volumeMeter.className = 'volume-meter';
        volumeMeter.id = 'meter' + configuration.participant.userid;
        container.appendChild(mediaElement);
        container.appendChild(volumeMeter);
        container.appendChild(caption);
		var remoteMediaStreams = document.getElementById('remote-videos');
        var li = document.createElement('li');
        li.id = configuration.participant.userid;
        li.participant = configuration.participant;
        li.appendChild(container);
        li.currStream = 0;
		remoteMediaStreams.appendChild(li);
		mediaElement.onclick();
        if (configuration.participant.userid === userid) {
            //setTimeout(function () {
                var audioInput = audioContext.createMediaStreamSource(stream);
                var analyzerNode = audioContext.createAnalyser();
                convertToMono(audioInput).connect(analyzerNode);
                analyzerNode.fftSize = 2048;
                var zeroGain = audioContext.createGain();
                zeroGain.gain.value = 0.0;
                analyzerNode.connect(zeroGain);
                zeroGain.connect(audioContext.destination);
                var volume = 150;
                meters.push({meter: volumeMeter, volume: volume, analyzerNode: analyzerNode});
            //}, 2000);
        }
	}

    function leaveRoom() {
        room.disconnect();
    }

	window.onload = initialize;
    window.onbeforeload = leaveRoom;
    
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

    function disableAttach() {
        attachButton.style.color = 'rgb(160, 157, 157)';
    }

    function enableStart() {
        ready = true;
        startButton.style.color = 'black';
    }
    function disableStart() {
        ready = false;
        startButton.style.color = 'rgb(160, 157, 157)';
    }

    
    function connectToRoom() {
        createToken(function(token){
            console.log(token);
            room = Erizo.Room({'token': token});
            room.addEventListener('room-connected', function(roomEvent) {
                console.log('room-connected');
                enableStart();
                streams = roomEvent.streams;
                showMessage('Ready to join!');
            });
            
            room.addEventListener('stream-added', function (roomEvent) {
                if (userid === roomEvent.stream.getAttributes().userid) {
                    return;
                } else {
                    var attributes = roomEvent.stream.attributes;
                    if (attributes.role === 'slave' && attributes.masterId !== userid) {
                        return;
                    }
                    if (startButton.started) {
                        if (participants[userid].role === 'regular' || participants[userid].role === 'master') {
                            room.subscribe(roomEvent.stream);
                        }
                    } else {
                        streams.push(roomEvent.stream);
                    }

                    if (attachToLG) {
                        if (attributes.type === 'screen') {
                            return;
                        }
                        var selectMaster = document.getElementById('select-master');
                        var option = document.createElement('option');
                        var remoteUserId =  roomEvent.stream.getAttributes().userid;
                        option.innerHTML = remoteUserId;
                        option.id = 'opt_' + remoteUserId;
                        selectMaster.appendChild(option);
                    }
                }
            });
            
            room.addEventListener('stream-removed', function(roomEvent) {
                if (roomEvent.stream.getAttributes().userid === userid) {
                    return;
                }
                var attributes = roomEvent.stream.getAttributes();
                var remoteUserId = attributes.userid;
                if (attributes.role === 'regular') {
                    if (!participants[remoteUserId]) {
                        return;
                    }
                    if(participants[userid].role === 'slave' && remoteUserId === participants[userid].masterId) {
                        location.reload();
                    }
                    participants[remoteUserId].removeStream(roomEvent.stream);
                    if (!participants[remoteUserId].hasStreams()) {
                        delete participants[remoteUserId];
                        if (attachToLG) {
                            var selectMaster = document.getElementById('select-master');
                            var toBeRemoved = selectMaster.querySelector('#opt_' + remoteUserId);
                            selectMaster.removeChild(selectMaster.querySelector('#opt_' + remoteUserId));
                        }
                    }
                } else {
                    if (attributes.masterId === userid) {
                        participants[userid].removeSlave(remoteUserId);
                    }
                }
            });
            
            room.addEventListener('stream-subscribed', function(roomEvent) {
                var attributes = roomEvent.stream.getAttributes();
                var remoteUserId = attributes.userid;
                if (attributes.role === 'regular') {
                    if (participants[remoteUserId] === undefined) {
                        participants[remoteUserId] = new Participant({
                            userid: remoteUserId,
                            role: 'regular'
                        });
                    }
                    participants[remoteUserId].addStream(roomEvent.stream);
                    if (((participants[userid].role === 'regular' || participants[userid].role === 'master') ||
                        (participants[userid].idToDisplay === remoteUserId)) && !participants[remoteUserId].visible) {
                        participants[remoteUserId].show({muted: false});
                    }
                    roomEvent.stream.addEventListener('stream-data', function(event){
                        participants[remoteUserId].onMessage(event.msg);
                    });
                    if (participants[userid].role === 'master') {
                        participants[userid].handleSlaveVideos();
                    }
                } else if (attributes.masterId === userid){
                    var slave = new Participant({
                        userid: remoteUserId,
                        role: 'slave'
                    });
                    slave.addStream(roomEvent.stream);

                    participants[userid].role = 'master';
                    participants[userid].slaves[remoteUserId] = slave;
                    slave.sendMessage({type: 'request_accepted'});
                    participants[userid].handleSlaveVideos();
                    showMessage('Node ' + remoteUserId + ' joined!');
                }
                console.log('stream subscribed ' + roomEvent.stream.getAttributes().type);
            });
            room.connect();
        });
    };
	
	function start() {
        if (!ready || startButton.started) {
            return;
        }
        startButton.started = true;
        disableStart();
        disableAttach();
        room.publish(localStream);
        setInterval(function() {
            localStream.pc.peerConnection.getStats(function(stats){
                console.log(stats);
                var r = stats.result()[1];
                var names = r.names();
                //for (var i = 0; i < names.length; ++i) {
                    console.log(r.stat('audioOutputLevel'));
                //}
                }, localStream.pc.peerConnection.getLocalStreams()[0].getAudioTracks()[0]
            );
        }, 3000);
        if (screenShared) {
            setTimeout(function(){
                room.publish(screenStream);
                },
                3000
            );
        }
        if (localStream.attributes.role === 'regular') {
            subscribeToStreams(streams);
        } else {
            var master = room.getStreamsByAttribute('userid', localStream.attributes.masterId)[0];
            room.subscribe(master);
        }
    };
    
    function Participant(participantConfig) {
        this.streams = [];
        this.slaves = {};
        this.visible = false;
        this.currentDisplay;
        this.role = participantConfig.role;
    	this.userid = participantConfig.userid;
    };

    Participant.prototype.show = function (conf) {
        addVideoTag({
            'muted' : conf.muted,
            'participant' : this
        });
        this.visible = true;
    };
    
    Participant.prototype.addStream = function(stream) {
        this.streams.push(stream); 
        if (this.visible && this.streams.length > 1) {
            var caption = this.video.parentNode.querySelector('.video-tile-caption');
            caption.style.width = '120%';
            setTimeout(function() {
                caption.style.width = '';
            }, 2000);
            caption.querySelector('.screen-icon').style.color = 'rgb(139, 238, 12)';
        }
    };
    
    Participant.prototype.removeStream = function (toBeRemoved) {
        if (this.streams.length === 1) {
            removeVideoTag(toBeRemoved);
            this.streams = [];
            return;
        }
        for (var i in this.streams) {
            if (toBeRemoved === this.streams[i]) {
                this.streams.splice(i,1);
                this.video.replaceStream(this.streams[0].stream);
                this.video.parentNode.querySelector('.screen-icon').style.color = '';
                break;
            }
        }
    };
    
    Participant.prototype.hasStreams = function() {
        return this.streams.length > 0;
    };
    
    Participant.prototype.switchVideos = function() {
        this.video.onclick();
    };

    Participant.prototype.sendMessage = function(message) {
        localStream.sendData({from: userid, to: this.userid, message: message});
    };

    Participant.prototype.removeSlave = function (slaveId) {
        var id;
        if (id = this.slaves[slaveId].currentDisplay) {
            participants[id].isDisplayedBy = null;
        }
        delete this.slaves[slaveId];
    };
    
    Participant.prototype.onMessage = function(data) {
        if (data.to !== userid) {
            return;
        }
        var message = data.message;
        console.log('message recv from: ' + data.from);
        if (message.type == 'request_accepted') {
            this.galaxyConnectionState = 'connected';
            showMessage('Connected to master ' + data.from);
        } else if (message.type == 'display_request') {
            var toBeDisplayed = room.getStreamsByAttribute('userid', message.idToDisplay)[0];
            participants[userid].idToDisplay = message.idToDisplay;
            room.subscribe(toBeDisplayed);
        }
    };
    Participant.prototype.handleSlaveVideos = function () {
        for (var i in this.slaves) {
            if(!this.slaves[i].currentDisplay) {
                for (var j in participants) {
                    if (j === userid) {
                        continue;
                    }
                    if (!participants[j].isDisplayedBy) {
                        participants[j].idDisplayedBy = i;
                        this.slaves[i].currentDisplay = j;
                        this.slaves[i].sendMessage({type: 'display_request', idToDisplay: j});
                        return;
                    }
                }
            }
        }
    }
}());
