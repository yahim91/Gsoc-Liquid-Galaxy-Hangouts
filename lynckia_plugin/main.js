;
(function() {
	var selectedVideo,
	participants,
	userid,
	screenShareButton,
    startButton,
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
        getLocalUserMedia();
        attachToLG = false;
        /*setInterval(function() {
            for (var i = 0; i < meters.length; i++) {
                var freqByteData = new Uint8Array(meters[i].analyzerNode.frequencyBinCount);
                meters[i].analyzerNode.getByteFrequencyData(freqByteData); 
                var newVol = getAverageVolume(freqByteData.subarray(0,200));
                meters[i].volume = Math.min(newVol, meters[i].volume);
            }
        },
        5000);

        setInterval(function(){
            for (var i = 0; i < meters.length; i++) {
                updateAnalysers({meter: meters[i].meter, analyzerNode: meters[i].analyzerNode, volume: meters[i].volume});
            }
        }, 1000/60);*/

		
		startButton = document.getElementById('start-button');
        startButton.started = false;
        startButton.onclick = start;
        document.getElementById('attach-to-rig').onclick = function (event) {
            if (attachToLG){
                return;
            }
            var selectMaster = document.createElement('select');
            selectMaster.id = 'select-master';
            selectMaster.onchange = function() {
                var masterId = selectMaster.options[selectMaster.selectedIndex].value;
                if (masterId === 'select') {
                    return;
                } else {
                    localStream.attributes.role = 'slave';
                    localStream.attributes.masterId = masterId;
                    participants[masterId].galaxyConnectionState = 'connecting';
                    selectMaster.style.display = 'none';
                    var stateMessage = document.createElement('div');
                    stateMessage.id = 'state-message';
                    stateMessage.innerHTML = 'Connecting ...';
                    event.srcElement.parentNode.appendChild(stateMessage);
                }
            }
            var hint = document.createElement('option');
            hint.innerHTML = '-select-';
            hint.id = 'select';
            selectMaster.appendChild(hint);
            for (var i in participants) {
                if (participants[i].userid === userid) {
                    continue;
                }
                var option = document.createElement('option');
                option.innerHTML = participants[i].userid;
                option.id = 'opt_' + participants[i].userid;
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
	function getLocalUserMedia() {
        localStream = Erizo.Stream({audio:true, video: true, data: true, attributes: {userid:userid, type: 'video', role:'regular'}});
        localStream.init();
        localStream.addEventListener('access-accepted', function(event) {
            if (!participants[userid]) {
                participants[userid] = new Participant ({userid: userid, stream: localStream});
                participants[userid].show({muted: true});
            }
             console.log("Video stream id is " + JSON.stringify(localStream.getAttributes()));
             connectToRoom();
        });
		localStream.addEventListener('access-denied', function(event) {
            
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
    
    function removeStreamFromVideo(stream) {
        var container = document.getElementById(stream.getAttributes().userid);
        var streamLeft = container.participant.streams[0];
        var screen_icon = container.children[0].children[1].getElementsByClassName('screen-icon');
        container.children[0].children[1].removeChild(screen_icon[0]);
        container.children[0].children[0].replaceStream(streamLeft.stream);
        
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

    function updateAnalysers(param) {
        var freqByteData = new Uint8Array(param.analyzerNode.frequencyBinCount);
        param.analyzerNode.getByteFrequencyData(freqByteData); 
        var percent = getAverageVolume(freqByteData.subarray(0,200));
        var dif = (percent - param.volume)*100/30* (113/100);
        var meter = param.meter.getContext('2d');
        meter.clearRect(0,0,300,100);
        meter.fillStyle = 'green';
        meter.fillRect(0,0, dif,100);
        console.log(percent);
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
        if (configuration.muted === true) {
            muteButton.src = '/assets/muted.png';
        } else {
            muteButton.src = '/assets/unmuted.png';
        }

        muteButton.className='mute';
        caption.appendChild(muteButton);
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
			mediaElement[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? _stream
					: webkitURL.createObjectURL(_stream);
			mediaElement.stream = _stream;
            if (selectedVideo.videoId === configuration.participant.userid) {
                selectedVideo[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? _stream
					: webkitURL.createObjectURL(_stream);
            }
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
        /*if (configuration.participant.userid !== userid) {
            setTimeout(function () {
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
            }, 2000);
        };*/

        
	}
	window.onload = initialize;
    
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
                /*if (screenShared) {
                    setTimeout(function(){room.publish(screenStream)}, 3000);
                }
                room.publish(localStream);*/
                streams = roomEvent.streams;
                //subscribeToStreams(roomEvent.streams);
            });
            
            room.addEventListener('stream-added', function (roomEvent) {
                if (userid === roomEvent.stream.getAttributes().userid) {
                    return;
                } else {
                    var attributes = roomEvent.stream.attributes;
                    if (attributes.type === 'video' && attributes.role === 'slave' && attributes.masterId !== userid) {
                        return;
                    }
                    if (startButton.started) {
                        room.subscribe(roomEvent.stream);
                    } else {
                        streams.push(roomEvent.stream);
                    }
                    console.log('subscribe');
                }
            });
            
            room.addEventListener('stream-removed', function(roomEvent){
                if (roomEvent.stream.getAttributes().userid === userid) {
                    return;
                }
                var attributes = roomEvent.stream.getAttributes();
                var remoteUserId = attributes.userid;
                if (attributes.role === 'regular') {
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
                        stream: roomEvent.stream
                    });
                    participants[remoteUserId].show({muted: false});
                    } else {
                        participants[remoteUserId].addStream(roomEvent.stream);
                    } 
                    roomEvent.stream.addEventListener('stream-data', function(event){
                        participants[remoteUserId].onMessage(event.msg);
                    });
                    if (attachToLG) {
                        var selectMaster = document.getElementById('select-master');
                        var option = document.createElement('option');
                        option.innerHTML= remoteUserId;
                        option.id = 'opt_' + remoteUserId;
                        selectMaster.appendChild(option);
                    }

                } else {
                    var slave = new Participant({
                        userid: remoteUserId,
                        stream: roomEvent.stream
                    });
                    participants[userid].slaves[remoteUserId] = slave;
                    slave.sendMessage('request_accepted');
                    var slaveDiv = document.createElement('div');
                    slaveDiv.id = 'slave' + remoteUserId;
                    slaveDiv.innerHTML = 'slave: ' + remoteUserId;
                    document.getElementById('slaves').appendChild(slaveDiv);
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
        room.publish(localStream);
        if (screenShared) {
            setTimeout(function(){
                room.publish(screenStream);
                },
                3000
            );
        }
        subscribeToStreams(streams);
    };
    
    function Participant(participantConfig) {
        this.streams = [];
        this.slaves = {};
        this.visible = false;
        this.role = 'regular';
    	this.userid = participantConfig.userid;
        if (participantConfig.stream) {
            this.streams.push(participantConfig.stream);
        } 
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
        if (this.visible) {
            addStreamToVideo(stream);
        } else {
            this.show();
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
                removeStreamFromVideo(toBeRemoved);
                break;
            }
        }
    };
    
    Participant.prototype.hasStreams = function() {
        return this.streams.length > 0;
    };
    
    Participant.prototype.switchVideos = function() {
        var container = document.getElementById(this.userid);
        container.children[0].children[1].children[1].onclick();
    };

    Participant.prototype.sendMessage = function(message) {
        localStream.sendData({from: userid, to: this.userid, message: message});
    };

    Participant.prototype.removeSlave = function (slaveId) {
        delete this.slaves[slaveId];
        var toBeDeleted = document.getElementById('slave' + slaveId);
        toBeDeleted.parentNode.removeChild(toBeDeleted);

    };
    
    Participant.prototype.onMessage = function(data) {
        if (data.to !== userid) {
            return;
        }
        var message = data.message;
        console.log('message recv from: ' + data.from);
        if (data.message == 'request_accepted') {
            this.galaxyConnectionState = 'connected';
            document.getElementById('state-message').innerHTML = 'Connected';
            document.getElementById('attach-to-rig').style.color = 'rgb(160, 157, 157)'; 
        }
    };
}());
