$(document).ready(function() {
	var socket = new io.connect(window.location.href);
	
	var status = $("#status"),
		clientId = $("#clientId"),
		online = $("#online"),
		tot = $("#tot"),
		debug = $("#debug"),
		last_coords = { lat: 0, lon: 0 , acc: 0},
		watchid,
		map;
		
	status.html("Connecting...");
	initialize();

	function initialize() {
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

	$(document).keyup(function(e) {
		if (e.keyCode === 220) { //backslash
			toggleDebug();
		}
	});

	function setMarker(latlng) {
		var marker = new google.maps.Marker({
			position: latlng, 
			map: map, 
			title: "You are here! (at least within a "+ latlng.acc +" meter radius)"
		});
	}

	$("#force-send").on("click", function(e) {
		console.log("click");
		var gigi = navigator.geolocation.getCurrentPosition();

		console.log(gigi);

		sendcoords(gigi);
	});

	/* 
	* Socket.io
	*/

	function sendCoords(coords) {
		socket.emit("coords", { lat: coords.latitude, lon: coords.longitude, acc: coords.accuracy });
	}
	    
    socket.on('connect', function() {
    	status.html("Connected.");

    	if (navigator.geolocation) {
			watchid = navigator.geolocation.watchPosition(function(position) {   
				last_coords.latitude = position.coords.latitude;
				last_coords.longitude = position.coords.longitude;
				last_coords.accuracy = position.coords.accuracy;

				$("h1").addClass("sent");
				setTimeout(function() {
		    		$("h1").removeClass("sent");
		    	}, 300);
			
				var latlng = new google.maps.LatLng(last_coords.latitude, last_coords.longitude);

				console.log(latlng);

				$("#map_status").html(last_coords.latitude +' '+ last_coords.longitude +' '+ last_coords.accuracy);
				map.setCenter(latlng);
				setMarker(latlng);

				sendCoords(last_coords);
			}, function(err) {
				$("#map_status").html("Error: see console.");
				console.dir(err);
			}, { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 });
		} else {
			$("#map_status").html("Error: Unable to grab your current position.");
		}
	});
			
	socket.on('disconnect', function() {
		status.html("Disconnected.");
	});
	
	socket.on('clientId', function(data) {
    	clientId.html(data.id);
	});
	
	socket.on('tot', function(data) {	
		tot.html(data.tot);
	});

	socket.on('coords', function(data) {
		//TODO: Received coords from XYZ
    	//$("map_status").html(data.lat +" "+ data.lon +" "+ data.acc);
		var latlng = new google.maps.LatLng(data.latitude, data.longitude);
    	setMarker(latlng);

    	$("h1").addClass("received");
    	setTimeout(function() {
    		$("h1").removeClass("received");
    	}, 300);
	});
});