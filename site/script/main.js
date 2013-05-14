function loadmap(){
    map = new OpenLayers.Map("demoMap")

    //var source = Proj4js.Proj('EPSG:4236'); 
    map.addLayer(new OpenLayers.Layer.OSM());
    $.getJSON('list', function(data){loadMarker(map, data)})
    map.zoomToMaxExtent();
}

function loadMarker(map, data) {
    var markers = new OpenLayers.Layer.Markers("Markers");
    map.addLayer(markers);
    $.each(data, function(key, value) {
        var size = new OpenLayers.Size(21,25);
        var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
        var icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', size, offset);
        var position = value.coordinate;
        console.log(position);
        var lonLat = new OpenLayers.LonLat( position[1],position[0])
       .transform(
           new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
           map.getProjectionObject()); // to Spherical Mercator Projection
        marker = new OpenLayers.Marker(lonLat, icon)
        markers.addMarker(marker);
        var popup = new OpenLayers.Popup(key,
                                lonLat,
                                new OpenLayers.Size(200,200),
                                JSON.stringify(value, null, '\t'), 
                                true);
        console.log("added popup");
        marker.events.register("click", marker, function (e) {
            map.addPopup(popup,true);
            popup.show();
        });
    });
    map.zoomToExtent(markers.getDataExtent())

}

function getClosest() {
 }
