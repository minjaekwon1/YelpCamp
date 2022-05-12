mapboxgl.accessToken = mapToken;
// Creates a map w/ the coordinates in the 'geometry' prop
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: campground.geometry.coordinates, // starting position [lng, lat]
    zoom: 9 // starting zoom
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

// Makes a marker centered on the above coordinates
new mapboxgl.Marker()
    // Tells marker where it should go
    .setLngLat(campground.geometry.coordinates)
    // Sets what should pop up when marker is clicked
    .setPopup(
        new mapboxgl.Popup({ offset: 25 })
            .setHTML(
                `<h3>${campground.title}</h3><p>${campground.location}</p>`
            )
    )
    .addTo(map)