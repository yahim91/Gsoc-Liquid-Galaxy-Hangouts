;
(function() {
	var selectedVideo,
	participants,
	userid = 'local',
	screenShareButton,
    /*attachButton,*/
    screenShared,
    screenStream,
    localStream,
    room,
	slaves,
    ready,
    streams,
	slaveNum,
    meters,
    audioContext,
    fullScreenCanvas,
    fullScreenContext,
    orientation,
    pendingSlaves,
    userInfo,
    autoJoin,
    slaveVideoGroup,
    roomNameApproved;

    	

	function initialize() {
        screenShared = false;
        ready = false;
        autoJoin = false;
        slaveVideoGroup = {width: $('#slave-screens').width(), landscapeWidth: 200, portraitWidth: 86};
        participants = {};
        pendingSlaves = {};
        userInfo = {role: 'regular', micState: 'mic_unmuted'};
        meters = [];
        roomNameApproved = false;
        userNameApproved = false;
        audioContext = new AudioContext();
        orientation = document.width > document.height ? 'landscape' : 'portrait';
        document.querySelector('#go-button').onclick = function(){
            gotUserRoomNames();
        }


        document.onwebkitfullscreenchange = function() {
            if (document.height > document.width) {
                if (!document.webkitIsFullScreen) {
                    if (selectedVideo.orientation === 'portrait') { 
                        selectedVideo.style.webkitTransform = selectedVideo.style.webkitTransform.split(' ')[0];
                        selectedVideo.style.top = '';
                        selectedVideo.style.bottom = '';
                        selectedVideo.style.left = '';
                        $('.central-icons').css('left', -250).css('width', $('.selectedVideo').height());
                        $('.central-icons').css('top', $('.selectedVideo').position()['top']);
                        
                    } else {
                        selectedVideo.style.webkitTransform = selectedVideo.style.webkitTransform.split(' ')[0] + 'scale(0.7)';
                        selectedVideo.style.webkitTransformOrigin = 'center';
                        selectedVideo.style.top = '';
                        selectedVideo.style.left = '';
                        selectedVideo.style.width = '';
                        selectedVideo.style.height = '';
                        selectedVideo.style.margin = '';
                        $('.central-icons').css('left', -250).css('width', $('.selectedVideo').width() * 0.7);
                        $('.central-icons').css('top', $('.selectedVideo').position()['top']);
                        for (var i in participants[userid].slaves) {
                            participants[userid].slaves[i].sendMessage({type:'cancel_fullscreen'});
                        }
                    }
                }
            } else {
                if (!document.webkitIsFullScreen) {
                    selectedVideo.style.margin = '';
                    selectedVideo.style.top = '';
                    selectedVideo.style.height = '';
                    selectedVideo.style.width = '';
                    $('.central-icons').css('left', 0).css('top', 25);
                }
            }
        }
        $('#get-user-box').keyup(function (e) {
            if (!/^[a-zA-Z0-9._]*$/.test(e.target.value)) {
                $('#user-error-box div').html("Only alphanumeric, ' _ ' and ' . ' characters are allowed!");
                $('#user-error-box').css('opacity', '1'); 
                $('#user-error-box').css('left', '10');
                userNameApproved = false;
            } else {
                userNameApproved = true;
                $('#user-error-box').css('left', '-10');
                $('#user-error-box').css('opacity', '0');
            }
            console.log(e.target.value);
        });

        $('#get-room-box').keyup(function (e) {
            if (!/^[a-zA-Z0-9._]*$/.test(e.target.value)) {
                $('#room-error-box div').html("Only alphanumeric, ' _ ' and ' . ' characters are allowed!");
                $('#room-error-box').css('opacity', '1'); 
                $('#room-error-box').css('left', '10');
                roomNameApproved = false;
            } else {
                roomNameApproved = true;
                $('#room-error-box').css('left', '-10');
                $('#room-error-box').css('opacity', '0');
            }
        });
        document.querySelector("#get-user-box").onkeydown = getUserName;
        document.querySelector('.text-area').onkeydown = sendChatMessage;
        document.querySelector('.text-area').onkeypress = function (e) {
            if (e.which === 13) {
                return false;
            }
        };
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
        muteMic.onmouseover = function() {
            this.classList.add('media-buttons-hover');
        };
        muteMic.onmouseout = function() {
            this.classList.remove('media-buttons-hover');
        };
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
                    localStream.attributes.muted = true;
                    room.changeAttributesForStream(localStream.getID(), localStream.attributes);
                    participants[userid].showMuteIcon();
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
                    localStream.attributes.muted = false;
                    room.changeAttributesForStream(localStream.getID(), localStream.attributes);
                    participants[userid].hideMuteIcon();
                }
            }
        }
        
        var muteCamera = document.getElementById('camera');
        muteCamera.onmouseover = function() {
            this.classList.add('media-buttons-hover');
        };
        muteCamera.onmouseout = function() {
            this.classList.remove('media-buttons-hover');
        };
        muteCamera.muted = false;
        muteCamera.onclick = function () {
            if (muteCamera.muted === false) {
                muteCamera.muted = true;
                muteCamera.src = "/assets/camera-muted.png";
                muteCamera.title = "Turn camera on";
                if (localStream) {
                    if (localStream.stream.getVideoTracks()[0].onmute === null) {
                        localStream.stream.getVideoTracks()[0].onmute = showMessage('Camera off');
                    }
                    localStream.stream.getVideoTracks()[0].enabled = false;
                }
                if (selectedVideo.videoId === userid) {
                    participants[userid].video.onclick();
                }
            } else {
                muteCamera.muted = false;
                muteCamera.src = "/assets/camera-mute.png";
                muteCamera.title = "Turn camera off";
                if (localStream) {
                    if (localStream.stream.getVideoTracks()[0].onunmute === null) {
                        localStream.stream.getVideoTracks()[0].onunmute = showMessage('Camera on');
                    }
                    localStream.stream.getVideoTracks()[0].enabled = true;
                }
            }
        }
		startButton = document.getElementById('start-button');
        startButton.onmouseover = function () {
            this.classList.add('menu-buttons-hover');
        }

        startButton.onmouseout = function() {
            this.classList.remove('menu-buttons-hover');
        };

        startButton.started = false;
        startButton.onclick = start;
        /*attachButton = document.getElementById('attach-to-rig');
        attachButton.pressed = false;
        attachButton.enabled = false;
        attachButton.onclick = function (event) {
            if (!attachButton.enabled) {
                return;
            }
            disableButton(attachButton, function(){
                attachButton.enabled = false;
                attachButton.pressed = true;
            });
            var selectSide = document.createElement('select');
            selectSide.innerHTML = '<option>-select side-</option><option>right</option><option>left</option>';
            selectSide.onchange = function() {
                localStream.attributes.side = selectSide.options[selectSide.selectedIndex].value;
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
            hint.innerHTML = '-select master id-';
            hint.id = 'select';
            selectMaster.appendChild(hint);
            for (var i in room.remoteStreams) {
                var remoteUserId = room.remoteStreams[i].getID();
                var option = document.createElement('option');
                option.innerHTML = remoteUserId;
                option.id = 'opt_' + remoteUserId;
                selectMaster.appendChild(option);
            }
            event.srcElement.parentNode.appendChild(selectMaster);
            event.srcElement.parentNode.appendChild(selectSide);
        };*/
        if (orientation == 'portrait') {
            $('.chat-group').width(document.width - $('.menu').width() - 2);
        }
		
		selectedVideo = document.querySelector('.selectedVideo');
        selectedVideo.onclick = function () {

            if (screen.width < screen.height) {
                if (selectedVideo.orientation === 'portrait') {
                    selectedVideo.style.webkitTransform = selectedVideo.style.webkitTransform.split(" ")[0] + 'scaleY(' + (screen.width / selectedVideo.clientHeight) + ') ' 
                    + ' scaleX(' + (screen.height / selectedVideo.clientWidth) + ')';
                    selectedVideo.style.webkitTransformOrigin = 'center';
                    selectedVideo.style.top = '0px';
                    selectedVideo.style.bottom = '0px';
                    selectedVideo.style.left='0px';
                } else {
                    selectedVideo.style.width = screen.width;
                    selectedVideo.style.height = screen.height;
                    selectedVideo.style.webkitTransform = selectedVideo.style.webkitTransform.split(' ')[0];
                    selectedVideo.style.top = '0px';
                    selectedVideo.style.left = '0px';
                }
            } else {
                if (selectedVideo.orientation === 'portrait') {
                    selectedVideo.style.width = screen.height;
                    selectedVideo.style.height = screen.width;
                    selectedVideo.style.webkitTransform = selectedVideo.style.webkitTransform.split(' ')[0];
                } else {
                    selectedVideo.style.width = screen.width;
                    selectedVideo.style.height = screen.height;
                    selectedVideo.style.top = '0px';
                }
            }
            $('.central-icons').css('left', 'auto').css('top', 'auto');
            document.body.webkitRequestFullScreen();
        }
		screenShareButton = document.getElementById('share-screen-button');
        screenShareButton.onmouseover = function () {
            this.classList.add('menu-buttons-hover');
        }

        screenShareButton.onmouseout = function() {
            this.classList.remove('menu-buttons-hover');
        };
        screenShareButton.enabled = false;
		screenShareButton.onclick = function() {
            if (!screenShareButton.enabled) {
                return;
            }
			screenStream = Erizo.Stream({screen: {orientation: orientation}, video: true, data: true, attributes: {userid: localStream.getID(), type: 'screen', role:'regular', orientation: orientation}});
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
        handleParameters();
	}

    function handleParameters() {
        if (location.href.indexOf('?') == -1) {
            return;
        }

        var type = getUrlParam('type');
        userInfo.name = getUrlParam('id');
        autoJoin = true;
        
        document.querySelector(".user").hidden = true;
        document.querySelector(".message-video").hidden = false;
        if (type === 'slave') {
            userInfo.role = 'slave';
            userInfo.masterId = getUrlParam('masterId');
            userInfo.side = getUrlParam('side');
            userInfo.position = parseInt(getUrlParam('pos'));
            userInfo.room = getUrlParam('room');
            userInfo.nodeGroupSize = parseInt(getUrlParam('size'));
            userInfo.leftGroupSize = parseInt(getUrlParam('leftsize'));
            getLocalUserMedia({screen:{orientation: orientation}, audio:true, video:true, data:true});
        } else {
            userInfo.role = type;
            userInfo.room = getUrlParam('room');
            getLocalUserMedia({audio:true, video:true, data:true});
        }
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

    function setAutoGrow() {
        $('.text-area').autogrow({
            onIncrease: function(newHeight, oldHeight) {
                $('.conversation').css('height', parseInt($('.conversation').css('height')) - parseInt(Math.abs(newHeight - oldHeight)/10) * 13);
            },
            onDecrease: function(newHeight, oldHeight) {
                $('.conversation').css('height', parseInt($('.conversation').css('height')) + parseInt(Math.abs(newHeight - oldHeight)/10) * 13);
            }
        });
    };

    function getUserName(e) {
        if (e.keyCode === 13) {
           //gotUserRoomNames(); 
        }
    }

    function gotUserRoomNames() {
        userInfo.name = $("#get-user-box").val();
        userInfo.room = $('#get-room-box').val();
        if (userInfo.name === '') {
            $('#user-error-box div').html("The user name must be longer!");
            $('#user-error-box').css('opacity', '1'); 
            $('#user-error-box').css('left', '10');
            return;
        }
        if (userInfo.room === '') {
            $('#room-error-box div').html("The room name must be longer!");
            $('#room-error-box').css('opacity', '1'); 
            $('#room-error-box').css('left', '10');
            return;
        }
        if (!roomNameApproved || !userNameApproved) {
            return;
        }
        $('#user-info-name').html(userInfo.name);
        $('#user-info-room').html(userInfo.room);
        document.querySelector(".user-room-input").hidden = true;
        document.querySelector(".message-video").hidden = false;
        getLocalUserMedia({audio:true, video:true, data:true});
        $('.left-sidebar').css('display', 'block');
        $('.right-sidebar').css('display', 'block');
        setAutoGrow();
    }
    
    function sendChatMessage(e) {
        if (e.keyCode === 13) {
            var message = document.querySelector(".text-area").value;
            document.querySelector(".text-area").value = '';
            document.querySelector('#conversation').style.height = '';
            document.querySelector('.text-area').style.height = '';

            if (message === '' || message === '\n') {
                return;
            }

            localStream.sendData({from: localStream.getID(), message: {type: 'chat' , load: message}});
            addConversationItem(createConversationItem(localStream.getID() || localStream.attributes.userid, message, 'message'));
        }
    }

	// Get user media
	function getLocalUserMedia(media) {
        localStream = Erizo.Stream({screen: media.screen ? {orientation: orientation} : false,
                                   audio:media.audio,
                                   video: media.video,
                                   data: media.data, 
                                   attributes: {
                                       userid: userInfo.name,
                                       type: 'video',
                                       role: userInfo.role,
                                       masterId: userInfo.masterId,
                                       side: userInfo.side,
                                       position: userInfo.position,
                                       orientation: orientation
                                       }
                                    });
        localStream.init();
        localStream.addEventListener('access-accepted', function(event) {
            if (!participants[userid]) {
                participants[userid] = new Participant ({userid: userid, role: userInfo.role});
                participants[userid].addStream(localStream);
                participants[userid].show({muted: true});
            }
            connectToRoom(userInfo.room);
        });
		localStream.addEventListener('access-denied', function(event) {
            getLocalUserMedia({audio: true, video: true, data: true});
            //console.log('error :' + event.code);
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
        screenIcon.className = 'video-icon';
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
        var streamId = stream.getID();
        var toBeRemoved = document.getElementById(streamId);
        if (!toBeRemoved) {
            return;
        }
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
        screenIcon.className = 'video-icon';
        screenIcon.innerHTML = 'S';
        screenIcon.title = 'Switch videos';
        screenIcon.currStream = 0;
        screenIcon.onclick = function() {
            if (configuration.participant.streams.length < 2) {
                return;
            }
            this.currStream = 1 - this.currStream;
            var nextStream = configuration.participant.streams[this.currStream];
            configuration.participant.video.replaceStream(nextStream.stream);
        }

        var rotateButton = document.createElement('div');
        rotateButton.innerHTML = 'R';
        rotateButton.className = 'video-icon';
        rotateButton.title = 'Rotate video';

		var mediaElement = document.createElement('video');

        var displayOnLG = document.createElement('div');
        displayOnLG.innerHTML = 'D';
        displayOnLG.className = 'video-icon';
        displayOnLG.title = 'Display video on Liquid Galaxy';

        displayOnLG.onclick = function() {
            //return;
            if (orientation !== 'portrait' || userInfo.role === 'regular') {
                return;
            }
            mediaElement.onclick();
            if (configuration.participant.userid === 'local') {
                participants[userid].displayOnLG(localStream.getID());
            } else {
                participants[userid].displayOnLG(configuration.participant.userid);
            }
        }

        caption.appendChild(muteButton);
        caption.appendChild(screenIcon);
        caption.appendChild(rotateButton);
        caption.appendChild(displayOnLG);
        var stream = configuration.participant.streams[0].stream;
        
        mediaElement.rotation = 0;
        mediaElement.orientation = 'landscape';//configuration.participant.streams[0].attributes.orientation;
		mediaElement[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? stream
				: webkitURL.createObjectURL(stream);
		mediaElement.className = "tile-video";
        /*if (mediaElement.orientation === 'portrait') {
            mediaElement.classList.add('rotated-tile-video');
            mediaElement.rotation = -90;
        }*/
		mediaElement.stream = stream;
		mediaElement.autoplay = true;
		mediaElement.controls = false;
		mediaElement.muted = configuration.muted;
		mediaElement.play();
		mediaElement.onclick = function() {
            if (selectedVideo.classList.contains('central-video-slave-screen-portrait')) {
                selectedVideo.classList.remove('central-video-slave-screen-portrait');
            }
            if (slaveVideoGroup.selectedId !== undefined) {
                slaveVideoGroup.selectedDiv.classList.toggle('video-selected');
                slaveVideoGroup.selectedId = undefined;
            }
			selectedVideo[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? mediaElement.stream
					: webkitURL.createObjectURL(mediaElement.stream);
			selectedVideo.autoplay = true;
			selectedVideo.muted = true;
			selectedVideo.play();

            mediaElement[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? mediElement.stream
				: webkitURL.createObjectURL(mediaElement.stream);
            mediaElement.muted = muteButton.muted;
			mediaElement.play();

            selectedVideo.orientation = mediaElement.orientation;
            if (orientation === 'landscape') {
                if (mediaElement.orientation == 'portrait' && !selectedVideo.classList.contains('portrait-central-video')) {
                    selectedVideo.classList.add('portrait-central-video');
                    selectedVideo.style.webkitTransform = 'rotate(' + mediaElement.rotation + 'deg) scale(0.8)';
                    $('.selectedVideo').css('top', -$('.selectedVideo').position()['top'] + 25);
                } else if (mediaElement.orientation == 'landscape' && selectedVideo.classList.contains('portrait-central-video')) {
                    selectedVideo.classList.toggle('portrait-central-video');
                    selectedVideo.style.webkitTransform = 'rotate(' + mediaElement.rotation + 'deg)';
                    $('.selectedVideo').css('top', '');
                }
            } else {
                if (mediaElement.orientation == 'landscape') {
                    selectedVideo.style.webkitTransform = 'rotate(' + mediaElement.rotation + 'deg) scale(0.7)';
                    $('.central-icons').css('width', $('.selectedVideo').width() * 0.7);
                    $('.central-icons').css('top', $('.selectedVideo').position()['top']);
                } else {
                    selectedVideo.style.webkitTransform = 'rotate(' + mediaElement.rotation + 'deg)';
                }
            }

            if (selectedVideo.videoId !== configuration.participant.userid) {
                if (selectedVideo.videoId) {
                    participants[selectedVideo.videoId].hideSlaves();
                }
                if (configuration.participant.slaveSize > 0) {
                        configuration.participant.showSlaves();
                }
            }
			selectedVideo.videoId = configuration.participant.userid;
            if (!configuration.participant.streams[0].attributes.muted) {
                $('#mute-icon-central').css('display', 'none');
            } else {
                $('#mute-icon-central').css('display', 'block');
            }
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
        rotateButton.onclick = function () {
            mediaElement.rotation += 90;
            if (mediaElement.rotation === 360) {
                mediaElement.rotation = 0;
            }
            if (mediaElement.rotation == 0 || mediaElement.rotation == 180) {
                mediaElement.orientation = 'landscape';
            } else {
                mediaElement.orientation = 'portrait';
            }
            if ((mediaElement.rotation === 90 || mediaElement.rotation === 270) && !mediaElement.classList.contains('rotated-tile-video')) {
                mediaElement.classList.add('rotated-tile-video');
            } else if ((mediaElement.rotation === 0 || mediaElement.rotation === 180) && mediaElement.classList.contains('rotated-tile-video')) {
                mediaElement.classList.remove('rotated-tile-video');
            }
            mediaElement.style.webkitTransform = 'rotate(' + mediaElement.rotation + 'deg)';
           
			if(selectedVideo.videoId === configuration.participant.userid) {
                mediaElement.onclick();
                if (orientation == 'landscape') {
                    if (mediaElement.orientation == 'portrait') {
                        $('.central-icons').css('width', $('.selectedVideo').height() * 0.8);
                    } else {
                        $('.central-icons').css('width', $('.selectedVideo').width() + 2);
                    }
                } else {
                    if (mediaElement.orientation == 'portrait') {
                        $('.central-icons').css('width', $('.selectedVideo').height());
                        $('.central-icons').css('top', $('.selectedVideo').position()['top']);
                    } else {
                        $('.central-icons').css('width', $('.selectedVideo').width() * 0.7);
                        $('.central-icons').css('top', $('.selectedVideo').position()['top']);
                    }
                }

            }
        }

        var volumeMutedIcon = document.createElement('div');
 
        muteButton.onclick = function () {
            if (mediaElement.muted === false) {
                mediaElement.muted = true;
                muteButton.src = '/assets/muted.png';
                volumeMutedIcon.style.display = 'block';
            } else {
                mediaElement.muted = false;
                muteButton.src = '/assets/unmuted.png';
                volumeMutedIcon.style.display = 'none';
            } 
            muteButton.muted = mediaElement.muted;
        }
        configuration.participant.video = mediaElement;
        /*volumeMeter = document.createElement('canvas');
        volumeMeter.className = 'volume-meter';
        volumeMeter.id = 'meter' + configuration.participant.userid;*/
        var muteIcon = document.createElement('div');
        if (configuration.participant.userid !== 'local') {
            muteIcon.id = 'mute-icon-' + configuration.participant.streams[0].getID();
        } else {
            muteIcon.id = 'mute-icon-local';
        }
        muteIcon.className = 'tile-video-mute-icon';
        if (!configuration.participant.streams[0].attributes.muted) {
            muteIcon.style.display = 'none';
        }

        var volumeMutedIcon = document.createElement('div');
        if (configuration.participant.userid !== 'local') {
            volumeMutedIcon.id = 'volume-icon-' + configuration.participant.streams[0].getID();
        } else {
            volumeMutedIcon.id = 'volume-icon-local';
        }
        
        volumeMutedIcon.className = 'tile-video-volume-muted-icon';
        if (!muteButton.muted) {
            volumeMutedIcon.style.display = 'none';
        }
        var iconContainer = document.createElement('div');
        iconContainer.className = 'tile-video-icon-container';
        iconContainer.appendChild(volumeMutedIcon);
        iconContainer.appendChild(muteIcon);
        container.appendChild(iconContainer);
        container.appendChild(mediaElement);
        var user_name = document.createElement('div');
        user_name.className = 'video-user-name';
        if (configuration.participant.userid === 'local') {
            user_name.innerHTML = localStream.attributes.userid;
        } else {
            user_name.innerHTML = configuration.participant.streams[0].getID();
        }
        configuration.participant.changeName = function(name) {
            user_name.innerHTML = name;
        }
        //container.appendChild(volumeMeter);
        container.appendChild(user_name);
        container.appendChild(caption);
		var remoteMediaStreams = document.getElementById('remote-videos');
        var li = document.createElement('li');
        li.id = configuration.participant.userid;
        li.participant = configuration.participant;
        li.appendChild(container);
        li.currStream = 0;
		remoteMediaStreams.appendChild(li);
		mediaElement.onclick();
        /*if (configuration.participant.userid === userid) {
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
        }*/
	}

    function leaveRoom() {
        room.disconnect();
        deleteRoom();
    }

	window.onload = initialize;
    window.onbeforeunload = leaveRoom;

    function getRooms(callback) {
        var xhr = new XMLHttpRequest();
        var url = '/getRooms/';
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                callback(JSON.parse(xhr.responseText));
            }
        }
        
        xhr.open('GET', url, true);
        xhr.send();
    };

    function deleteRoom() {
        var xhr = new XMLHttpRequest();
        var url = '/rooms/';
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                callback(xhr.responseText);
            }
        }
        xhr.open('DELETE', url + userInfo.roomID, true);
        xhr.send();
    };

    function createRoom(roomName, callback) {
        var xhr = new XMLHttpRequest();
        var url = '/createRoom/';
        var body = {'roomname': roomName};
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                callback(xhr.responseText);
            }
        }
        
        xhr.open('POST', url, true);

        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(body));
    }
    
    var createToken = function(roomID, callback) {
        var xhr = new XMLHttpRequest();
        var url = '/createToken/';
        var body = {role: 'user', 'roomID': roomID};
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                callback(xhr.responseText);
            }
        }
        
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
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


    function enableButton(button, callback) {
        if (button.classList.contains('button-disabled')) {
            button.classList.toggle('button-disabled');
        }
        callback();
    }

    function disableButton(button, callback) {
        if (!button.classList.contains('button-disabled')) {
            button.classList.toggle('button-disabled');
        }
        callback();
    }

    function gotToken(token) {
        console.log(token);
        room = Erizo.Room({'token': token});
        room.addEventListener('room-connected', function(roomEvent) {
            console.log('room-connected');
            enableButton(startButton, function(){
                ready = true;});
            /*enableButton(attachButton, function() {
                attachButton.enabled = true;
            });*/
            streams = roomEvent.streams;
            showMessage('Ready to join!');
            if (autoJoin) {
                start();
            }
        });
        
        room.addEventListener('stream-added', function (roomEvent) {
            if (localStream.getID() === roomEvent.stream.getID()) {
                console.log('added '+ localStream.getID());
                if (userInfo.role !== 'slave') {
                    enableButton(screenShareButton, function(){
                        screenShareButton.enabled = true;
                    });
                }
                participants[userid].changeName(localStream.getID());
                return;
            } else {
                var attributes = roomEvent.stream.attributes;
                /*if (attributes.role === 'slave' && attributes.masterId !== localStream.getID()) {
                    return;
                }*/
                if (startButton.started) {
                    if ((participants[userid].role === 'regular' || participants[userid].role === 'master') || attributes.userid === 
                            userInfo.masterId) {
                        room.subscribe(roomEvent.stream);
                    }
                } else {
                    streams.push(roomEvent.stream);
                }
            }
        });

        room.addEventListener('stream-removed', function(roomEvent) {
            if (roomEvent.stream.getID() === localStream.getID()) {
                return;
            }

            var attributes = roomEvent.stream.getAttributes();
            var remoteUserId = roomEvent.stream.getID();
            if (attributes.role === 'regular' || attributes.role === 'master') {
                if (attributes.type === 'video') {
                    if (!participants[remoteUserId]) {
                        return;
                    }
                    if(userInfo.role === 'slave' && remoteUserId === userInfo.masterId) {
                        location.replace('https://webrtc.liquidgalaxy.org:3004');
                    }
                    participants[remoteUserId].removeStream(roomEvent.stream);
                    if (!participants[remoteUserId].hasStreams()) {
                        addConversationItem(createConversationItem(remoteUserId, 'left the room', 'notification'));
                        var slave = participants[remoteUserId].isDisplayedBy;
                        delete participants[remoteUserId];
                        if (slave && userInfo.role === 'regular' || userInfo.role === 'master') {
                            if (slave === 'local') {
                                participants[userid].currentDisplay = null;
                            } else {
                                participants[userid].slaves[slave].currentDisplay = null;
                            }
                        }
                    }
                } else {
                    participants[attributes.userid].removeStream(roomEvent.stream);
                }
            } else {
                if (attributes.masterId === localStream.getID()) {
                    participants[userid].removeSlave(remoteUserId);
                } else {
                    participants[attributes.masterId].removeSlave(remoteUserId);
                }
            }
        });
        
        room.addEventListener('stream-subscribed', function(roomEvent) {
            var attributes = roomEvent.stream.getAttributes();
            var remoteUserId = roomEvent.stream.getID();
            if (attributes.role === 'regular' || attributes.role === 'master') {
                if (attributes.type === 'video') {
                    if (participants[remoteUserId] === undefined) {
                        participants[remoteUserId] = new Participant({
                            userid: remoteUserId,
                            role: 'regular'
                        });
                        addConversationItem(createConversationItem(remoteUserId, 'joined the room', 'notification'));
                    }
                    roomEvent.stream.addEventListener('attributes-changed', function(event) {
                        if (event.msg.muted) {
                            participants[remoteUserId].showMuteIcon();
                        } else {
                            participants[remoteUserId].hideMuteIcon();
                        }
                        roomEvent.stream.attributes = event.msg;
                    });
                    participants[remoteUserId].addStream(roomEvent.stream);
                    if (((participants[userid].role === 'regular' /*|| participants[userid].role === 'master'*/) ||
                    (userInfo.masterId && userInfo.masterId !== remoteUserId)) && !participants[remoteUserId].visible ) {
                        if (userInfo.displayFullScreenId === remoteUserId) {
                            participants[remoteUserId].show({muted: true});
                            if (userInfo.position === 'left') {
                                displayVideoFragment(-userInfo.position + userInfo.leftGroupSize, userInfo.nodeGroupSize);
                            } else {
                                displayVideoFragment(userInfo.position + userInfo.leftGroupSize, userInfo.nodeGroupSize);
                            }
                        } else {
                            participants[remoteUserId].show({muted: false});
                        }
                    }
                    roomEvent.stream.addEventListener('stream-data', function(event){
                        participants[remoteUserId].onMessage(event.msg);
                    });
                    if (participants[userid].role === 'master') {
                        participants[userid].handleSlaveVideos();
                    }
                } else {
                    participants[roomEvent.stream.getAttributes().userid].addStream(roomEvent.stream);
                }
                if (pendingSlaves[remoteUserId]) {
                    for (var i = 0; i < pendingSlaves[remoteUserId].length; i++) {
                        var id = pendingSlaves[remoteUserId][i].userid;
                        participants[remoteUserId].slaves[id] = pendingSlaves[remoteUserId][i];
                    }
                    participants[remoteUserId].role = 'master';
                    participants[remoteUserId].slaveSize = pendingSlaves[remoteUserId].length;
                    participants[remoteUserId].showSlaves();
                    delete pendingSlaves[remoteUserId];
                }
            } else if (attributes.masterId === localStream.getID()){
                var slave = new Participant({
                    userid: remoteUserId,
                    role: 'slave'
                });
                roomEvent.stream.addEventListener('stream-data', function(event){
                        slave.onMessage(event.msg);
                });
                slave.addStream(roomEvent.stream);
                participants[userid].role = 'master';
                if (roomEvent.stream.getAttributes().side === 'left') {
                    slave.index = -roomEvent.stream.getAttributes().position;
                    participants[userid].leftSlaveNumber--;
                } else {
                    slave.index = roomEvent.stream.getAttributes().position;
                    participants[userid].rightSlaveNumber++;
                }
                participants[userid].slaves[remoteUserId] = slave;
                participants[userid].slaveSize++;
                slave.sendMessage({type: 'request_accepted'});
                userInfo.role = 'master';
                participants[userid].handleSlaveVideos();
                
                addConversationItem(createConversationItem(remoteUserId, 'node joined', 'notification'));
                slave.show({'muted': true});
            } else if (attributes.masterId !== localStream.getID()) {
                var slave = new Participant({
                    userid: remoteUserId,
                    role: 'slave'
                });
                slave.addStream(roomEvent.stream);
                if (!participants[attributes.masterId]) {
                    if (pendingSlaves[attributes.masterId]) {
                        pendingSlaves[attributes.masterId].slaves.push(slave);
                    } else {
                        pendingSlaves[attributes.masterId] = [slave];
                    }
                } else {
                    participants[attributes.masterId].role = 'master';
                    participants[attributes.masterId].slaves[remoteUserId] = slave;
                    participants[attributes.masterId].slaveSize++;
                    participants[attributes.masterId].showSlaves();
                }
            }
            console.log('stream subscribed ' + roomEvent.stream.getAttributes().type);
        });
        room.connect();
    }
    function connectToRoom(room) {
        getRooms(function(rooms) {
            var roomExists = false;
            for (var i in rooms) {
                if (rooms[i].name === userInfo.room) {
                    roomExists = true;
                    userInfo.roomID = rooms[i]._id;
                    break;
                }
            }

            if (!roomExists) {
                createRoom(room, function(room) {
                    room = JSON.parse(room);
                    userInfo.roomID = room._id;
                    createToken(room._id, gotToken);
                });
            } else {
                createToken(userInfo.roomID, gotToken);
            }
        });
    };
    
	function start() {
        if (!ready || startButton.started) {
            return;
        }
        disableButton(startButton, function(){
            startButton.started = true;
        });
        /*disableButton(attachButton, function() {
            attachButton.enabled = false;
        });*/
        room.publish(localStream);
        
        if (localStream.attributes.role === 'regular' || localStream.attributes.role === 'master') {
            subscribeToStreams(streams);
        } else {
            var master = room.getStreamsByAttribute('userid', localStream.attributes.masterId)[0];
            if (master) {
                room.subscribe(master);
            }
        }
    };

    function createConversationItem(from, message, type) {
        if (message[0] === '\n') {
            message = message.substring(1, message.length);
        }
        var conv_item = document.createElement('div');
        var conv_item_user = document.createElement('div');
        var conv_item_message = document.createElement('div');
        var span_message = document.createElement('span');
        var span_user = document.createElement('span');
        if (type == 'notification') {
            span_message.style.color = 'rgb(156, 156, 156)';
            span_user.style.color = 'rgb(156, 156, 156)';
        }
        span_user.style.marginLeft = '4px';
        span_message.style.marginLeft = '4px';
        span_message.innerHTML = message;
        span_user.innerHTML = from + ':';
        conv_item_message.className = 'conv-item-message';
        conv_item_user.className = 'conv-item-user';
        conv_item.className = 'conv-item';
        conv_item_message.appendChild(span_message);
        conv_item_user.appendChild(span_user);
        conv_item.appendChild(conv_item_user);
        conv_item.appendChild(conv_item_message);
        return conv_item;
    }

    function addConversationItem(item) {
        var conv = document.querySelector('.conversation');
        conv.appendChild(item);
        conv.scrollTop = conv.scrollHeight;
    };

    function displayVideoFragment(fragmentIndex, nrOfFragments) {
        var offset = screen.width * fragmentIndex;
        selectedVideo.style.width = screen.width;
        selectedVideo.style.height = screen.height;
        selectedVideo.style.webkitTransform = selectedVideo.style.webkitTransform.split(' ')[0] + 'scale(' + nrOfFragments + ')';
        selectedVideo.style.webkitTransformOrigin = '0%';
        selectedVideo.style.top = '0px';
        selectedVideo.style.left = - offset;
        selectedVideo.style.margin = '0';
        document.body.webkitRequestFullScreen();
    };

    function addSlaveScreen(stream, name, orientation) {
        var newWidth = slaveVideoGroup.width / ($('#slave-screens').children().length + 1);
        var div = document.createElement('div');
        var standardWidth = orientation == 'landscape' ? slaveVideoGroup.landscapeWidth : slaveVideoGroup.portraitWidth;
        
        if (newWidth < standardWidth) {
            $('#slave-screens').children('div').each(function() {
                this.style.width = newWidth;
            });
            div.style.width = newWidth;
        }
        if (orientation === 'landscape') {
            var currentScreenWidth = Math.min(slaveVideoGroup.landscapeWidth, newWidth);
        } else {
            var currentScreenWidth = Math.min(slaveVideoGroup.portraitWidth, newWidth);
        }
        var offset = (slaveVideoGroup.width - currentScreenWidth * ($('#slave-screens').children('div').length + 1))/2;
        offset += ($('#slave-screens').children('div').length) * currentScreenWidth;
        $('#slave-screens').children('div').each(function() {
            this.style.right = offset;
            offset-= currentScreenWidth;
        });
        div.style.left = 'auto';
        div.style.right = offset;
        if (orientation === 'landscape') {
            div.className = 'slave-screen-landscape';
        } else {
            div.className = 'slave-screen-portrait';
        }
        div.id = 'slave-screen-' + name;
        var slaveScreen = document.createElement('video');
        slaveScreen.onclick = function() {
            if (slaveVideoGroup.selectedId !== undefined) {
                slaveVideoGroup.selectedDiv.classList.toggle('video-selected');
            }
            this.classList.add('video-selected');
            slaveVideoGroup.selectedId = name;
            slaveVideoGroup.selectedDiv = this;
            selectedVideo[browser === 'firefox' ? 'mozSrcObject' : 'src'] = browser === 'firefox' ? stream.stream
                            : webkitURL.createObjectURL(stream.stream);
            if (orientation === 'portrait') {
                selectedVideo.classList.add('central-video-slave-screen-portrait');
            }
        }
        slaveScreen.className = 'tile-video';
        slaveScreen.src = webkitURL.createObjectURL(stream.stream);
        slaveScreen.play();
        //slaveScreen.muted = true;
        div.appendChild(slaveScreen);
        if (name) {
            var nameDiv = document.createElement('div');
            nameDiv.innerHTML = name;
            nameDiv.className = 'video-user-name';
            div.appendChild(nameDiv);
        }
        $('#slave-screens').append(div);
    };

    function removeSlaveScreen(id) {
        var newWidth = slaveVideoGroup.width / ($('#slave-screens').children().length - 1);
        var currentScreenWidth = Math.min(slaveVideoGroup.landscapeWidth, newWidth);
        var offset = (slaveVideoGroup.width - currentScreenWidth * ($('#slave-screens').children('div').length - 1))/2;
        offset += ($('#slave-screens').children('div').length - 2) * currentScreenWidth;
        $('#slave-screen-' + id).remove();
        $('#slave-screens').children('div').each(function() {
            this.style.right = offset;
            this.style.width = currentScreenWidth;
            offset-= currentScreenWidth;
        });
    }

    function Participant(participantConfig) {
        this.streams = [];
        this.slaves = {};
        this.slaveSize = 0;
        this.leftSlaveNumber = -1;
        this.rightSlaveNumber = 1;
        this.visible = false;
        this.currentDisplay;
        this.role = participantConfig.role;
    	this.userid = participantConfig.userid;
    };

    Participant.prototype.show = function (conf) {
        if (this.role === 'slave' && this.userid != 'local') {
           //addSlaveScreen(this.streams[0]);
        } else {
            addVideoTag({
                'muted' : conf.muted,
                'participant' : this
            });
        }
        this.visible = true;
    };

    Participant.prototype.hide = function () {
        removeVideoTag(this.streams[0]);
        this.visible = false;
    };

    Participant.prototype.showMuteIcon = function() {
        if (!this.visible) {
            return;
        }
        $('#mute-icon-' + this.userid).css('display', 'block');
        if (selectedVideo.videoId == this.userid) {    
            $('#mute-icon-central').css('display', 'block');
        }
    };

    Participant.prototype.hideMuteIcon = function() {
        if (!this.visible) {
            return;
        }
        $('#mute-icon-' + this.userid).css('display', 'none'); 
        if (selectedVideo.videoId == this.userid) {    
            $('#mute-icon-central').css('display', 'none');
        }
    };
    
    Participant.prototype.addStream = function(stream) {
        this.streams.push(stream); 
        if (this.visible && this.streams.length > 1) {
            var caption = this.video.parentNode.querySelector('.video-tile-caption');
            caption.style.width = '113%';
            setTimeout(function() {
                caption.style.width = '';
            }, 2000);
            caption.querySelector('.video-icon').style.color = 'rgb(139, 238, 12)';
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
                this.video.parentNode.querySelector('.video-icon').style.color = '';
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
        localStream.sendData({from: localStream.getID(), to: this.userid, message: message});
    };

    Participant.prototype.removeSlave = function (slaveId) {
        var id;
        if (id = this.slaves[slaveId].currentDisplay) {
            participants[id].isDisplayedBy = null;
        }
        delete this.slaves[slaveId];
        this.slaveSize--;
        removeSlaveScreen(slaveId);
        if (slaveVideoGroup.selectedId === slaveId) {
            this.video.onclick();
            slaveVideoGroup.selectedId = undefined;
        }
    };

    Participant.prototype.showSlaves = function () {
        if (orientation === 'portrait') {
            return;
        }
        for (var i in this.slaves) {
            if (this.slaves[i].visible === false) {
                addSlaveScreen(this.slaves[i].streams[0], i, this.streams[0].attributes.orientation);
                this.slaves[i].visible = true;
            }
        }
    };

    Participant.prototype.hideSlaves = function () {
        if (orientation === 'portrait') {
            return;
        }
        for (var i in this.slaves) {
            this.slaves[i].visible = false;
        }
        document.querySelector('#slave-screens').innerHTML = '';
    };
    
    Participant.prototype.onMessage = function(data) {
        if (data.to && data.to !== localStream.getID()) {
            return;
        }
        var message = data.message;
        console.log('message recv from: ' + data.from + ' ' + JSON.stringify(message));
        if (message.type == 'request_accepted') {
            this.galaxyConnectionState = 'connected';
            showMessage('Connected to master ' + data.from);
        } else if (message.type == 'display_request') {
            participants[userid].idToDisplay = message.idToDisplay;
            room.subscribe(room.remoteStreams[message.idToDisplay]);
        } else if (message.type == 'chat') {
            var item = createConversationItem(data.from, message.load, 'message');
            addConversationItem(item);
        } else if (message.type == 'slave_display_lg') {
            for (var i in participants[userid].slaves) {
                if (i === data.from) {
                    continue;
                }
                participants[userid].slaves[i].sendMessage({
                    type: 'display_lg',
                    streamId: message.streamId
                });
            }
            
            userInfo.displayFullScreenId = message.streamId;
            if (!participants[message.streamId]) {
                room.subscribe(room.getStreamsByAttribute('userid', message.streamId)[0]);
            } else if (!participants[message.streamId].visible) {
                if (userInfo.position === 'left') {
                    displayVideoFragment(-userInfo.position + userInfo.leftGroupSize, userInfo.nodeGroupSize);
                } else {
                    displayVideoFragment(userInfo.position + userInfo.leftGroupSize, userInfo.nodeGroupSize);
                }
            }
            displayVideoFragment(0 + toAdd, this.slaveSize + 1);
        } else if (message.type == 'display_lg'){
            userInfo.displayFullScreenId = message.streamId;
            if (!participants[message.streamId]) {
                room.subscribe(room.getStreamsByAttribute('userid', message.streamId)[0]);
            } else if (!participants[message.streamId].visible) {
                // usually for the master stream that already exists
                participants[message.streamId].show({'muted': true, 'participant': participants[message.streamId]});
                if (userInfo.position === 'left') {
                    displayVideoFragment(-userInfo.position + userInfo.leftGroupSize, userInfo.nodeGroupSize);
                } else {
                    displayVideoFragment(userInfo.position + userInfo.leftGroupSize, userInfo.nodeGroupSize);
                }
            }
        } else if (message.type == 'cancel_fullscreen') {
            document.onwebkitfullscreenchange();
            if (userInfo.displayFullScreenId && userInfo.displayFullScreenId !== userInfo.masterId && 
                participants[userid].idToDisplay !== userInfo.displayFullScreenId) {
                var toBeDeleted = participants[userInfo.displayFullScreenId].streams[0];
                room.unsubscribe(toBeDeleted);
                participants[userInfo.displayFullScreenId].removeStream(toBeDeleted);
                delete participants[userInfo.displayFullScreenId];
            } else if (userInfo.displayFullScreenId === userInfo.masterId) {
                participants[userInfo.masterId].hide();
            }
            userInfo.displayFullScreenId = null;
        } 
    };

    Participant.prototype.handleSlaveVideos = function () {
        if (!this.currentDisplay) {
            for (var j in participants) {
                if (j == userid) {
                    continue;
                }
                if (!participants[j].isDisplayedBy) {
                    this.currentDisplay = j;
                    participants[j].isDisplayedBy = userid;
                    if (!participants[j].isVisible) {
                        participants[j].show({'muted': false, 'participant': participants[j]});
                    }
                }
            }
        }

        for (var i in this.slaves) {
            if(!this.slaves[i].currentDisplay) {
                for (var j in participants) {
                    if (j === userid) {
                        continue;
                    }
                    if (!participants[j].isDisplayedBy) {
                        participants[j].isDisplayedBy = i;
                        this.slaves[i].currentDisplay = j;
                        this.slaves[i].sendMessage({type: 'display_request', idToDisplay: j});
                        return;
                    }
                }
            }
        }
    }

    Participant.prototype.displayOnLG = function(id) {
        if (userInfo.role === 'master') {
            var toAdd = -(this.leftSlaveNumber + 1);
            for (var i in this.slaves) {
                this.slaves[i].sendMessage({
                    type: 'display_lg',
                    streamId: id
                });
            }
            displayVideoFragment(toAdd, this.slaveSize + 1);
        } else {
            if (userInfo.side === 'left') {
                displayVideoFragment(-userInfo.position + userInfo.leftGroupSize, userInfo.nodeGroupSize);
            } else {
                displayVideoFragment(userInfo.position + userInfo.leftGroupSize, userInfo.nodeGroupSize);
            }
            participants[userInfo.masterId].sendMessage({
                type: 'slave_display_lg',
                streamId: id
            });
        }
    };
}());
