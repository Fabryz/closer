$(document).ready(function() {

	function log(msg) {
		console.log(msg);
	}

	function init() {
		var latlng = new google.maps.LatLng(45.66629, 12.24207);
		var myOptions = {
			zoom: 19,
			center: latlng,
			mapTypeControl: true,
			navigationControlOptions: { style: google.maps.NavigationControlStyle.SMALL },
			mapTypeId: google.maps.MapTypeId.HYBRID
		};
		map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);

		map.setCenter(latlng);
		setMarker(latlng);
	}

	function toggleDebug(spd) {
		var speed = spd || 'fast';
	
		debug.fadeToggle(speed);
		debug.toggleClass("active");
		if (debug.hasClass("active")) {

		} else {

		}
	}

	function setMarker(latlng, id) {
		var marker = new google.maps.Marker({
			position: latlng, 
			map: map, 
			title: "You are here! (at least within a "+ latlng.acc +" meter radius)"
		});

		if (typeof id != undefined) {
			var length = players.length;
			for(var i = 0; i < length; i++) {
				if (players[i].id == id) {
					players[i].marker = marker;
					if (player.id == id) {
						player.marker = marker;
					}
					break;
				}
			}
		}
	}

	function sendCoords(coords) {
		socket.emit("coords", { id: player.id, lat: coords.latitude, lon: coords.longitude, acc: coords.accuracy });

		$("h1").addClass("sent");
		setTimeout(function() {
			$("h1").removeClass("sent");
		}, 300);
	}

	function geolocate() {
		if (navigator.geolocation) {
			watchid = navigator.geolocation.watchPosition(function(position) {   
				player.lat = position.coords.latitude;
				player.lng = position.coords.longitude;
				player.acc = position.coords.accuracy;

				$("#map_status").html(player);

				var latlng = new google.maps.LatLng(player.lat, player.lng);
				console.log(latlng);
				map.setCenter(latlng);
				setMarker(latlng, player.id);

				sendCoords(player);
			}, function(err) {
				$("#map_status").html("Error: see console.");
				console.dir(err);
			}, { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 });
		} else {
			$("#map_status").html("Error: Unable to grab your current position.");
		}
	}

	/*
	* Main
	*/

	var socket = new io.connect(window.location.href);
	
	var status = $("#status"),
		clientId = $("#clientId"),
		online = $("#online"),
		tot = $("#tot"),
		debug = $("#debug"),
		watchid,
		map;

	var player = new Player(),
		players = [];

	$(document).keyup(function(e) {
		if (e.keyCode === 220) { //backslash
			toggleDebug();
		}
	});

	$("#force-send").on("click", function(e) {
		var position = navigator.geolocation.getCurrentPosition(function(position) {   
				player.lat = position.coords.latitude;
				player.lng = position.coords.longitude;
				player.acc = position.coords.accuracy;

				$("#map_status").html(player);

				var latlng = new google.maps.LatLng(player.lat, player.lng);
				console.log(latlng);
				map.setCenter(latlng);
				setMarker(latlng, player.id);

				sendCoords(player);
			}, function(err) {
				$("#map_status").html("Error: see console.");
				console.dir(err);
			}, { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 });
	});

	$("#force-center").on("click", function(e) {
		var latlng = new google.maps.LatLng(player.lat, player.lng);
		map.setCenter(latlng);
	});

	status.html("Connecting...");
	init();

	/* 
	* Socket.io
	*/

    socket.on('connect', function() {
    	status.html("Connected.");
	});
			
	socket.on('disconnect', function() {
		status.html("Disconnected.");
	});
	
	socket.on('clientId', function(data) {
    	clientId.html(data.id);

    	geolocate();
	});
	
	socket.on('tot', function(data) {	
		tot.html(data.tot);
	});

	socket.on('coords', function(data) {
		//TODO: Received coords from XYZ
    	//$("map_status").html(data.lat +" "+ data.lon +" "+ data.acc);
		var latlng = new google.maps.LatLng(data.lat, data.lng);
    	setMarker(latlng, id);

    	$("h1").addClass("received");
    	setTimeout(function() {
    		$("h1").removeClass("received");
    	}, 300);
	});

	socket.on('join', function(data) {
		//var player = jQuery.extend(true, {}, data);
		player.id = data.player.id;
		player.nick = data.player.nick;
		player.lat = data.player.lat;
		player.lng = data.player.lng;
		player.acc = data.player.acc;

		log('Received current player id: '+ player.id);
		log('You have joined the server.');
	});

	socket.on('quit', function(data) {
		var quitter = '';

		var length = players.length;
		for(var i = 0; i < length; i++) {
			if (players[i].id == data.id) {
				players[i].marker.setMap(null);
				quitter = players[i].nick;
				players.splice(i, 1);
				break;
			}
		}

		log('Player quitted: '+ quitter +' (id '+ data.id +')');
	});

	socket.on('newplayer', function(data) {
		var newPlayer = new Player();
		newPlayer.id = data.player.id;
		newPlayer.nick = data.player.nick;
		newPlayer.lat = data.player.lat;
		newplayer.lng = data.player.lng;
		newPlayer.acc = data.player.acc;

		players.push(newPlayer);
		log('New player joined: '+ newPlayer.nick);
		newPlayer = {};
	});

	socket.on('playerlist', function(data) {
		players = []; //prepare for new list

		var length = data.list.length;
		for(var i = 0; i < length; i++) {
			var tmpPlayer = new Player();
			tmpPlayer.id = data.list[i].id;
			tmpPlayer.nick = data.list[i].nick;
			tmpPlayer.lat = data.list[i].lat;
			tmpPlayer.lng = data.list[i].y;
			tmpPlayer.acc = data.list[i].acc;
			tmpPlayer.ping = data.list[i].ping;

			players.push(tmpPlayer);
			tmpPlayer = {};
		}

		log('Initial player list received: '+ length +' players.');
	});

	socket.on('ping', function(data) {
		socket.emit('pong', { time: Date.now() });
		//log('Ping? Pong!');
	});

	socket.on('pingupdate', function(data) {
		var length = players.length;
		for(var i = 0; i < length; i++) {
			if (players[i].id == data.id) {
				players[i].ping = data.ping;
				if (player.id == data.id) {
					player.ping = data.ping;
					//$("#ping").html(player.ping +'ms');
				}
				break;
			}
		}
	});

});