hackerspaces = {};

$(document).ready(loadmap)

function loadmap(){
    map = new OpenLayers.Map("map");
    map.addLayer(new OpenLayers.Layer.OSM());
    $.getJSON('list', function(data){
        hackerspaces = data;
        loadMarker(map);
        createMenu();
    });
}

function startsWith(str, match) {
    return str.slice(0, match.length) == match;
}

function capitalize(str){
    return str.charAt(0).toUpperCase() + str.slice(1)
}
function createIcon(image_path) {
        var size = new OpenLayers.Size(21,25);
        var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
        var icon = new OpenLayers.Icon(image_path, size, offset);
        return icon;
}

function getPosition(position){
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
        if (!value.coordinate) {
            return true;
        }
        var size = new OpenLayers.Size(25,25);
        var offset = new OpenLayers.Pixel(-(size.w/2), -(size.h/2));
        var icon = new OpenLayers.Icon('images/hs-noinfo-marker.png', size, offset);
        var lonLat = getPosition(value.coordinate)
        var marker = new OpenLayers.Marker(lonLat, icon);
        markersLayer.addMarker(marker);
        marker.events.register("click", marker, function (e) {
            populateData(key, value);
            });
        getSpaceApiData(key, value.space_url, marker);
    });
    map.zoomToExtent(markersLayer.getDataExtent());

    var center = map.getCenter();
    var distance = OpenLayers.Util.distVincenty;
    var min_value = null;
    var min_key = null;
    var min_dist = 100000000;

    //display the nearest hackerspace
    $.each(hackerspaces, function(key, value){
        if(!value.coordinate){
            return true;
        }
        var lonLat = getPosition(value.coordinate);
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
        dt.text(capitalize(key))
        dl.append(dt);
        var dd = $('<dd>');
        if (typeof value == "string" && startsWith(value, "http")) {
            var a = $('<a>')
            a.attr({'href': value})
            a.text(value)
            dd.append(a);
        } else if(typeof value == "object") {
            dd.append(getObject(value));
        } else {
            dd.text(value);
        }
        dl.append(dd)
    });
}

function getObject(obj) {
    var dl = $('<dl>');
    $.each(obj, function(key, value){
        var dt = $('<dt>');
        if (typeof key == "string"){
            dt.text(capitalize(key));
        } else if(typeof key == "number") {
            dt.text(key);
        }
        dl.append(dt);
        var dd = $('<dd>');
        if (typeof value == "string" ) {
            if (startsWith(value, "http")) {
                var a = $('<a>')
                a.attr({'href': value})
                a.text(value)
                dd.append(a)
            } else {
                dd.text(capitalize(value));
            }
        } else if (typeof value == "number" ) {
            dd.text(value);
        } else if(typeof value == "object") {
            dd.append(getObject(value));
        }
        dl.append(dd);
    });
    return dl;
}

function getSpaceApiData(key, url, marker) {
    if (!url) {
        console.log(key + ' has no spaceapi');
        return;
    }
    $.getJSON(url, function(space_api) {
        //set the status icon
        var open = space_api.open;
        if (open === true) {
            marker.setUrl('images/hs-open-marker.png');
        } else if (open === false) {
            marker.setUrl('images/hs-closed-marker.png');
        }
        // Merge SpaceApi data
        $.each(space_api, function(k, v){
            hackerspaces[key][k] = v;
        });

        loadByHash();
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
            map.setCenter(getPosition(v.coordinate), 13);
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
        if (hackerspaces[key].coordinate) {
            populateData(key, hackerspaces[key]);
            map.setCenter(getPosition(hackerspaces[key].coordinate), 13);
        }
    }
}
