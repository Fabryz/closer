(function(exports) {

	var Player = function(id, lat, lng, acc) {
		this.id = id || -1;
		this.nick = 'Guest'+ this.id;
		this.lat = lat || 0;
		this.lng = lng || 0;
		this.acc = acc || 0;

		this.lastMoveTime = Date.now();
		this.ping = 0;
		
		this.marker = null;
		this.color = "#FF0000";
	};

	Player.prototype.toString = function() { 
		return this.lat +' '+ this.lng +' '+ this.acc +'m';
	};

	exports.Player = Player;
})(typeof global === "undefined" ? window : exports);