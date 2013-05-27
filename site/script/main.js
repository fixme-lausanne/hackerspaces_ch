function loadmap(){
    map = new OpenLayers.Map("demoMap");

    map.addLayer(new OpenLayers.Layer.OSM());
    $.getJSON('list', function(data){loadMarker(map, data);});
    map.zoomToMaxExtent();
}

function createIcon(image_path) {
        var size = new OpenLayers.Size(21,25);
        var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
        var icon = new OpenLayers.Icon(image_path, size, offset);
        return icon;
}

function loadMarker(map, data) {
    var markersLayer = new OpenLayers.Layer.Markers("Markers");
    map.addLayer(markersLayer);
    $.each(data, function(key, value) {
    var size = new OpenLayers.Size(25,25);
    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
    var icon = new OpenLayers.Icon('images/hs-noinfo-marker.png', size, offset);
        var position = value.coordinate;
        var icon = createIcon('images/hs-map.png');
        var lonLat = new OpenLayers.LonLat(position[1],position[0])
        .transform(
           new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
           map.getProjectionObject()); // to Spherical Mercator Projection
        var marker = new OpenLayers.Marker(lonLat, icon);
        markersLayer.addMarker(marker);
        var content = createContentFromJson(key, value);
        var popup = new OpenLayers.Popup.AnchoredBubble(key,
                                lonLat,
                                new OpenLayers.Size(200,200),
                                content,
                                null,
                                true);
        marker.events.register("click", marker, function (e) {
            map.addPopup(popup);
            popup.show();
            populateData(value);
        });
        //fetch the status of the hackerspace and change the icon
        //accordingly
        var status_url = value.space_url;
        if (status_url) {
            getStatus(status_url, marker);
        }
    });
    map.zoomToExtent(markersLayer.getDataExtent());

}

function populateData(data){
    var div = $('#data');
    $.each(data, function(key, value){
        var label = $('<label>');
        label.attr({'for': 'data_'+key});
        label.text(key);
        div.append(label);

        var span = $('<span>');
        span.attr({id: 'data_'+key});
        span.text(value);
        div.append(span);

        div.append('<br>'); //lame
    });
}

function createContentFromJson(name, hs_data){
}

function getStatus(url, marker){
    $.getJSON(url, function(space_api) {
        //set the icon according to the cursor
        var open = space_api.open;
        if (open === true) {
            marker.icon = createIcon('images/hs-open-marker.png');
        } else if (open === false) {
            marker.icon = createIcon('images/hs-closed-marker.png');
        }
    });
}

