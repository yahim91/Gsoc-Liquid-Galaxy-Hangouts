function Channel(channelConfig) {
	this.channel = new Firebase(channelConfig.url);
	if (channelConfig.onopen) {
		channelConfig.onopen(this);
	}
	this.channel.on("child_added", function(event) {
		channelConfig.onmessage(event.val());
	});
	this.channel.on("child_removed",
			function(event) {
				if (event.val().type
						&& (event.val().type == 'new_participant' || event
								.val().type === 'new_galaxy_rig')) {
					if (channelConfig.onmessageremoved) {
						channelConfig.onmessageremoved(event.val());
					}
				}
			});
	console.log('Channel opened: ' + channelConfig.url);
}

Channel.prototype.send = function(message) {
	return this.channel.push(message);
};