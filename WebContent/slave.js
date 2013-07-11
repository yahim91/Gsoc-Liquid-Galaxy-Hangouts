;
(function() {
 	var userInfo,
	remoteParticipant,
	ownChannel;
	function initialize() {
		getUserInfo();
		ownChannel = new Channel({
			url: 'https://liquid-galaxy.firebaseio.com/' + userInfo.id,
			onmessage: function (data) {
				if (data.userid === userInfo.id) {
					return;
				}
				if (data.type === 'new_participant') {
					handleRemoteParticipant(data.userid);
				}
			}
		});
		//handleRemoteParticipant(userInfo.galaxyRemoteId);
	}
	
	function getUserInfo() {
		if (location.href.split('?').length > 1) {
			userInfo = {
				id: getUrlParam('slaveId'),
				type : 'galaxy-rig',
				galaxyId : getUrlParam('galaxyId'),
				galaxyRole : getUrlParam('galaxyRole'),
				galaxyRemoteId : getUrlParam('remoteId'),
				masterId: getUrlParam('masterId')
			};
		} else {
			userInfo = {
				type : 'regular'
			};
		}
		console.log(JSON.stringify(userInfo));
	}
	
	function merge(s1, s2) {
		return s1 < s2 ? s1 + '+' + s2 : s2 + '+' + s1;
	}
	
	function getUrlParam(key) {
		var param_string = location.href.split('?')[1];
		var parameters = param_string.split('&');
		for (var i in parameters) {
			res = parameters[i].split('=');
			console.log(res[0] + ' = ' + key);
			if (res[0] === key) {
				return res[1];
			}
		}
	}

	function handleRemoteParticipant(userid) {
		remoteParticipant = new Participant(
				{
					localUserId: userInfo.id,
					userid: merge(userid, userInfo.id),
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
						var mediaElement = document
								.getElementById('remoteSlaveVideo');
						mediaElement[browser === 'firefox' ? 'mozSrcObject'
									: 'src'] = browser === 'firefox' ? event.stream
									: webkitURL.createObjectURL(event.stream);
						mediaElement.autoplay = true;
						mediaElement.stream = event.stream;
						mediaElement.play();
						console.log('remote stream added');
					},
					mediaConfiguration : {
						'mandatory' : {
							'OfferToReceiveAudio' : false,
							'OfferToReceiveVideo' : false
						}
					}
				});
	}
	window.onload = initialize;
	
}());