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

	/* 
	* Socket.io
	*/
	    
    socket.on('connect', function() {
    	status.html("Connected.");

    	if (navigator.geolocation) {
			watchid = navigator.geolocation.watchPosition(function(position) {   
				last_coords.lat = position.coords.latitude;
				last_coords.lon = position.coords.longitude;
			
				var latlng = new google.maps.LatLng(last_coords.lat, last_coords.lon);

				$("#map_status").html(last_coords.lat +' '+ last_coords.lon +' '+ last_coords.acc);
				map.setCenter(latlng);
				setMarker(latlng);

				socket.emit("coords", { lat: last_coords.lat, lon: last_coords.lon, acc: last_coords.acc});
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
    	$("map_status").html(data.lat +" "+ data.lon +" "+ data.acc);
	});
});