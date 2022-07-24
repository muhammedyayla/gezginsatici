let markers = [];
let places = [];

let map;
let placesService;
let autocomplete;
let infoWindow;
let place;
let directionsService;
let directionsRenderer;

const konum = {
    lat: 41.0437815,
    lng: 29.0066407
};

function initMap() {

    const mapDiv = document.getElementById("map");
    map = new google.maps.Map(mapDiv, {
        center: konum,
        zoom: 17,
    });

    placesService = new google.maps.places.PlacesService(map);
    infoWindow = new google.maps.InfoWindow();
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();

    const options = {
        fields: ['name', 'geometry', 'business_status', 'formatted_address', 'icon', 'photos', 'place_id', 'plus_code', 'types'],
        strictBounds: false,
        country: ["tr"]
    };

    const input = document.getElementById("search-places-input");
    autocomplete = new google.maps.places.Autocomplete(input, options);
    autocomplete.bindTo("bounds", map);

    autocomplete.addListener("place_changed", setPlace);
}

function setPlace() {
    place = autocomplete.getPlace();
    console.log(place);

    if (!place.geometry || !place.geometry.location) {
        alert("No details available for input: '" + place.name + "'");
        return;
    }

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
    } else {
        map.setCenter(place.geometry.location);
        map.setZoom(20);
    }

    const marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map
    });

    marker.addListener("click", () => {
        infowindow = new google.maps.InfoWindow({
            content: `<strong>${place.name}</strong><br>${place.formatted_address}<br>${getPhotosHtml(place.photos)}`
        });
        infowindow.open({
            anchor: marker,
            map,
            shouldFocus: true,
        });
    });
}

function getPhotosHtml(photos) {
    let str = "";
    for (let i = 0; i < photos.length; i++) {
        const element = photos[i];
        str += `<a href='${element.getUrl()}' target='_blank'> <img src='${element.getUrl()}' width='150px' height='150px'/></a>`
    }
    return str;
}

function addToList() {
    places.filter(p => p.place_id == place.place_id).length == 0 ? places.push(place) : alert("Bu yer zaten listeye eklenmiş");
    renderList();
    saveLocalStorage();
}

function renderList() {
    const list = document.getElementById("place-list");
    list.innerHTML = "<ul>";
    for (let i = 0; i < places.length; i++) {
        const element = places[i];
        list.innerHTML += `<li>${element.name} ${element.formatted_address}</li>`;
    }
    list.innerHTML += "</ul>";
}

function loadFromLocalStorage() {
    const str = localStorage.getItem("places");
    if (str == null || str == "") {
        return;
    }
    places = JSON.parse(str);
}

function saveLocalStorage() {
    localStorage.setItem("places", JSON.stringify(places));
}

function callRoute() {
    if (places.length == 0) {
        alert("Rota çizmek için gerekli yerleri eklemediniz");
        return;
    }

    wayPoints = [];
    for (let i = 0; i < places.length; i++) {
        wayPoints.push({
            stopover: true,
            location: { placeId: places[i].place_id }
        });
    }

    directionsService.route({
        origin: konum,
        //destination: wayPoints[wayPoints.length - 1].location,
        destination: konum,
        travelMode: "DRIVING",
        waypoints: wayPoints,
        optimizeWaypoints: true,
        drivingOptions: {
            departureTime: new Date(Date.now()),
            trafficModel: "bestguess"
        }
    }, (response, status) => {
        if (status === "OK") {
            //console.log(response);
            directionsRenderer.setDirections(response);
            directionsRenderer.setMap(map);
            directionsRenderer.setPanel(document.getElementById("panel"));
        } else {
            window.alert("Directions request failed due to " + status);
        }
    });
}

loadFromLocalStorage();
renderList();