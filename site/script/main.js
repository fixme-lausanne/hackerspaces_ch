hackerspaces = {};

$(document).ready(loadmap)

function loadmap(){
    map = new OpenLayers.Map("map");
    map.addLayer(new OpenLayers.Layer.OSM());
    $.getJSON('list', function(data){
        hackerspaces = data;
        loadMarker(map);
        createMenu();
        loadByHash();
    });
    if (typeof String.prototype.startsWith != 'function') {
       //see below for better implementation!
        String.prototype.startsWith = function (str){
            return this.indexOf(str) == 0;
        };
    }
}

function createIcon(image_path) {
        var size = new OpenLayers.Size(21,25);
        var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
        var icon = new OpenLayers.Icon(image_path, size, offset);
        return icon;
}

function getPosition(data){
    var position = data.coordinate;
    var lonLat = new OpenLayers.LonLat(position[1],position[0])
        .transform(
           new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
           map.getProjectionObject()); // to Spherical Mercator Projection
    return lonLat;
}

function loadMarker(map, data) {
    var markersLayer = new OpenLayers.Layer.Markers("Markers");
    map.addLayer(markersLayer);
    $.each(hackerspaces, function(key, value) {
        var size = new OpenLayers.Size(25,25);
        var offset = new OpenLayers.Pixel(-(size.w/2), -(size.h/2));
        var icon = new OpenLayers.Icon('images/hs-noinfo-marker.png', size, offset);
        var lonLat = getPosition(value)
        var marker = new OpenLayers.Marker(lonLat, icon);
        markersLayer.addMarker(marker);
        marker.events.register("click", marker, function (e) {
            populateData(key, value);
            });
        //fetch the status of the hackerspace and change the icon
        //accordingly
        var status_url = value.space_url;
        if (status_url) {
            getSpaceApiData(status_url, marker);
        }
    });
    map.zoomToExtent(markersLayer.getDataExtent());

    var center = map.getCenter();
    var distance = OpenLayers.Util.distVincenty;
    var min_value = null;
    var min_key = null;
    var min_dist = 100000000;

    //display the nearest hackerspace
    $.each(hackerspaces, function(key, value){
        var lonLat = getPosition(value);
        var d = distance(lonLat, center);
        if (d < min_dist) {
            min_dist = d;
            min_value = value;
            min_key = key;
        }
        });
    populateData(min_key, min_value);
}

function populateData(key){
    var hsdata = $('#hsdata');
    $("#hsname").text(key);

    var logo = hackerspaces[key].logo
    var logo_img = hsdata.find('#hslogo')
    if (logo) {
        logo_img.attr('src', logo);
        logo_img.show()
    } else {
        logo_img.attr('src', null)
        logo_img.hide()
    }
    var dl = hsdata.children('dl');
    dl.empty()
    $.each(hackerspaces[key], function(key, value){
        var dt = $('<dt>');
        dt.text(key)
        dl.append(dt);

        var dd = $('<dd>');
        if (typeof value == "string" && value.startsWith("http")) {
            var a = $('<a>')
            a.attr({'href': value})
            a.text(value)
            dd.append(a);
        } else {

            dd.text(value);
        }
        dl.append(dd)
    });
}

function getSpaceApiData(url, marker) {
    $.getJSON(url, function(space_api) {
        //set the status icon
        var open = space_api.open;
        if (open === true) {
            marker.setUrl('images/hs-open-marker.png');
        } else if (open === false) {
            marker.setUrl('images/hs-closed-marker.png');
        }
        // Merge SpaceApi data
        console.log(marker);
    });
}

function createMenu(){
    var menu = $('#hslist');
    var ul = $('<ul>');
    menu.children().replaceWith(ul);
    $.each(hackerspaces, function(k, v){
        var a = $('<a>');
        a.attr({'href': '#'+k})
        a.click(function(){
            populateData(k, v);
            map.setCenter(getPosition(v), 13);
        });
        a.text(k);
        var li = $('<li>');
        li.append(a);
        ul.append(li);
    });
}

function loadByHash(){
    var hash = window.location.hash;
    if(hash){
        var key = hash.split('#')[1];
        populateData(key, hackerspaces[key]);
        map.setCenter(getPosition(hackerspaces[key]), 13);
    }
}
