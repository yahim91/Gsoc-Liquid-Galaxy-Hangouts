;
(function() {
 	userInfo,
	remoteParticipant;
	function initialize() {
		getUserInfo();
		handleRemoteParticipant(userInfo.galaxyRemoteId);
	}
	
	function getUserInfo() {
		if (location.href.split('?').length > 1) {
			userInfo = {
				id: getUrlParam('slaveId'),
				type : 'galaxy-rig',
				galaxyId : getUrlParam('galaxyId'),
				galaxyRole : getUrlParam('galaxyRole'),
				galaxyRemoteId : getUrlParam('remoteId'),
			};
		} else {
			userInfo = {
				type : 'regular'
			};
		}
	}
	
	function merge(s1, s2) {
		return remoteUserid < userid ? remoteUserid + '+' + userid : userid
				+ '+' + remoteUserid;
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

	function handleRemoteParticipant(userid) {
		remoteParticipant = new Participant(
				{
					userid : merge(userid, userInfo.id),
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
								.getElementById(remoteuserid);
						if (mediaElement) {
							mediaElement[browser === 'firefox' ? 'mozSrcObject'
									: 'src'] = browser === 'firefox' ? event.stream
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
				});
	}
	
}());