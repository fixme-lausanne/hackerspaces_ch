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
    //markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(0, 0),icon));
        var icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', size, offset);
        var position = value.coordinate;
        console.log(position);
        var LonLat = new OpenLayers.LonLat( position[1],position[0])
       .transform(
           new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
           map.getProjectionObject()); // to Spherical Mercator Projection

        markers.addMarker(new OpenLayers.Marker(LonLat,icon));
        });
    map.zoomToExtent(markers.getDataExtent())
}
