var map;
var markers = [];
var infowindow;
var bounds;
var locations = [
  {title: 'Park Ave Penthouse', location: {lat: 40.7713024, lng: -73.9632393}},
  {title: 'Times Square', location: {lat:40.758960, lng:-73.985195 }},
  {title: 'Empire State Building', location: {lat:40.748427, lng:-73.985710}},
  {title: 'Central Park Zoo', location: {lat:40.767801, lng:-73.971977}},
  {title: 'Whitney Museum of American Art', location: {lat:40.739583, lng:-74.008884}}
  
];

var styles = [
  {
    featureType: 'water',
    stylers: [
      { color: '#19a0d8' }
    ]
  },{
    featureType: 'administrative',
    elementType: 'labels.text.stroke',
    stylers: [
      { color: '#ffffff' },
      { weight: 6 }
    ]
  },{
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [
      { color: '#e85113' }
    ]
  },{
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [
      { color: '#efe9e4' },
      { lightness: -40 }
    ]
  },{
    featureType: 'transit.station',
    stylers: [
      { weight: 9 },
      { hue: '#e85113' }
    ]
  },{
    featureType: 'road.highway',
    elementType: 'labels.icon',
    stylers: [
      { visibility: 'off' }
    ]
  },{
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [
      { lightness: 100 }
    ]
  },{
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [
      { lightness: -100 }
    ]
  },{
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [
      { visibility: 'on' },
      { color: '#f0e4d3' }
    ]
  },{
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [
      { color: '#efe9e4' },
      { lightness: -25 }
    ]
  }
];


var Item = function(data){
  this.title = ko.observable(data.title);
  this.location = ko.observable(data.location);
  this.marker = ko.observable(data.marker);
};
var viewModel = function(){
  var self = this;
  this.items = ko.observableArray();
  self.itemClick = function(item) {
    google.maps.event.trigger(item.marker, 'click');
  };
  locations.forEach(function(item){
    self.items.push(new Item(item));
  });
  map = new google.maps.Map(document.getElementById('map'),{
		center: {lat: 40.7413549, lng: -73.9980244},
    zoom: 13,
    mapTypeControl: false
  });
  bounds = new google.maps.LatLngBounds();
  infowindow = new google.maps.InfoWindow();
  //var self = this;
  // Style the markers a bit. This will be our listing marker icon.
  var defaultIcon = makeMarkerIcon('0091ff');
  // Create a "highlighted location" marker color for when the user
  // mouses over the marker.
  var highlightedIcon = makeMarkerIcon('FFFF24');
  
  // The following group uses the location array to create an array of markers on initialize.
  for (var i = 0; i < locations.length; i++) {
    // Get the position from the location array.
    var position = locations[i].location;
    //console.log(position);
    var title = locations[i].title;
    
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      map: map,
      position : position,
      title: title,
      animation: google.maps.Animation.DROP,
      icon: defaultIcon,
      id: i
    });
    
    bounds.extend(position);
    //console.log(marker);
    //viewModel.items.valueHasMutated();
    self.items()[i].marker = marker;
    //console.log(self.items()[i].marker);
    markers.push(marker);
    marker.addListener('click', function() {
      populateInfoWindow(this, infowindow);
      $('.navbar-collapse').collapse('hide');
    });
    marker.addListener('mouseover', function() {
      this.setIcon(highlightedIcon);
    });
    marker.addListener('mouseout', function() {
      this.setIcon(defaultIcon);
    });
    
  }
  window.onresize = function () {
    map.fitBounds(bounds);
  };
  // Extend the boundaries of the map for each marker
  map.fitBounds(bounds);
  // Push the marker to our array of markers.
  markers.push(this.marker);
  //console.log(markers());
  /*for(var i = 0; i<locations.length;i++){
    items.push(new Item(locations[i]));
    
    console.log(items()[i].marker);
    
  }*/
  
  this.search = ko.observable("");
  
  self.filteredItems = ko.computed(function(){
    var filter = self.search().toLowerCase();
    console.log(filter);
    if(!filter){
      self.items().forEach(function(item) {
        if(item.marker){
          //console.log(item.marker);
          item.marker.setVisible(true);
        }
      });
      return self.items();
    }
    else {
			return ko.utils.arrayFilter(self.items(), function(item) {
        //console.log(item.title().toLowerCase());
        if(item.title().toLowerCase().indexOf(filter) != -1){
          //item.marker.setVisible(true);
          //console.log(item.title());
          return true;
        }
				else{
          //console.log(item.marker);
          item.marker.setVisible(false);
          infowindow.close();
          return false;
        }
      });
      
    }
    
  },self.animateMarker = function(item){
    google.maps.event.trigger(item.marker, 'click');
  });
  ko.applyBindings(this);
  
};
// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    // Clear the infowindow content to give the streetview time to load.
    infowindow.setContent('');
    infowindow.marker = marker;
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
      map.fitBounds(bounds);
    });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    // In case the status is OK, which means the pano was found, compute the
    // position of the streetview image, then calculate the heading, then get a
    // panorama from that and set the options
    function getStreetView(data, status) {
      if (status == google.maps.StreetViewStatus.OK) {
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(
          nearStreetViewLocation, marker.position);
          //infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
          var panoramaOptions = {
            position: nearStreetViewLocation,
            pov: {
              heading: heading,
              pitch: 30
            }
          };
          var panorama = new google.maps.StreetViewPanorama(
            document.getElementById('pano'), panoramaOptions);
          } else {
            infowindow.setContent('<div>' + marker.title + '</div>' +
            '<div>No Street View Found</div>');
          }
        }
        //create a wikipedia URL to search for the title on wikipedia
        var wikiURL = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.title + '&format=json&callback=wikiCallback';
        $.ajax({
          url: wikiURL,
          dataType: "jsonp"
        }).done(function(data) {
          var article = data[0];
          if (!article) {
            alert("The wikipedia data you have requested is not available.");
          }
          var URL = 'http://en.wikipedia.org/wiki/' + article;
          // Use streetview service to get the closest streetview image within
          // 50 meters of the markers position
          streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
          infowindow.setContent('<div class="card"> <div class="card-body"><div class="card-title">' + marker.title + '</div><br><a href ="' + URL + '" target="_blank">' + URL + '</a><hr><div class="card-img-bottom" id="pano"></div></div></div>');
          // Open the infowindow on the correct marker
          infowindow.open(map, marker);
          map.fitBounds(bounds);
          // error handling
        }).fail(function(jqXHR, textStatus) {
          alert("The wikipedia data you have requested is not available");
        });
        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position
        //streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the correct marker.
        //infowindow.open(map, marker);
      }
    }
    //error handaling for google map
    window.mapError = function() {
      alert( 'Google Maps Failed To Load' );
    };
    //A function to change marker Icon
    function makeMarkerIcon(markerColor) {
      var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21,34));
        return markerImage;
      }
