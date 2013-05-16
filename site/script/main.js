function loadmap(){
    map = new OpenLayers.Map("demoMap")

    map.addLayer(new OpenLayers.Layer.OSM());
    $.getJSON('list', function(data){loadMarker(map, data)})
    map.zoomToMaxExtent();
}

function loadMarker(map, data) {
    var markersLayer = new OpenLayers.Layer.Markers("Markers");
    map.addLayer(markersLayer);
    $.each(data, function(key, value) {
        var size = new OpenLayers.Size(21,25);
        var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
        var icon = new OpenLayers.Icon('images/hs-map.png', size, offset);
        var position = value.coordinate;
        var lonLat = new OpenLayers.LonLat(position[1],position[0])
       .transform(
           new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
           map.getProjectionObject()); // to Spherical Mercator Projection
        var marker = new OpenLayers.Marker(lonLat, icon)
        markersLayer.addMarker(marker);
        var content = createContentFromJson(key, value)
        var popup = new OpenLayers.Popup.AnchoredBubble(key,
                                lonLat,
                                new OpenLayers.Size(200,200),
                                content, 
                                null,
                                true);
        marker.events.register("click", marker, function (e) {
            map.addPopup(popup);
            popup.show();
        });
    });
    map.zoomToExtent(markersLayer.getDataExtent())

}

function createContentFromJson(name, hs_data){
    return name;
}

function getStatus(url, callback){
    $.getJSON(url, callback)
}

