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
    if (typeof String.prototype.startsWith != 'function') {
        //see below for better implementation!
        String.prototype.startsWith = function (str){
            return this.indexOf(str) == 0;
        };
    }
	if (typeof String.prototype.capitalize != 'function') {
        String.prototype.capitalize = function(str) {
            return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
        };
    }
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
        var icon = new OpenLayers.Icon('img/hs-noinfo-marker.png', size, offset);
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

function createDataBlock(title, data){
    block = $('<div>');
    block.addClass('one-third');
    titleh = $('<h4>');
    titleh.addClass('heading');
    titleh.text(title);
    block.append(titleh);
    var dl = $('<dl>');
    $.each(data, function(key, value){
        if(key==undefined || value==undefined){
            //return 1;
        }
        var dt = $('<dt>');
        dt.text(key);
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
        dl.append(dd);
    });
    block.append(dl);
    return block;
}

function populateData(key){
    var hs = hackerspaces[key];
    $("#hsname").text(key);
    var hsdata = $('#page-content');
    hsdata.empty();

    // Important data
    var block, title, data;
    if(hs['status'] && hs['lastchange']){
        hsdata.append(createDataBlock('Status', {
            'Status': hs['status'],
            'Last change': hs['lastchange'],
        }));
    }
    if(hs['address']){
        data = {
            'Address': hs['address'],
            'GPS': hs['lon'] + ',' + hs['lat'],
        };
    } else {
        data = {
            'Address': hs['street-address'] + ', ' + hs['postalcode'] + ', ' + hs['city'],
            'GPS': hs['coordinate'][1] + ',' + hs['coordinate'][0],
        };
    }
    hsdata.append(createDataBlock('Localisation', data));

    if(hs.logo){
        var block_img = $('<div>');
        block_img.addClass('thumb one-third last');
        hsdata.append(block_img);
        var logo_img = $('<img>');
        //logo_img.height('150px');
        block_img.append(logo_img);
        logo_img.attr('src', hs.logo);
        logo_img.show();
    }

    hsdata.append($('<div>').addClass('clearfix'));
    if (hs['contact']) {
        hsdata.append(createDataBlock('Contact', {
            'Phone': hs['contact']['phone'],
            'Twiter': hs['contact']['twitter'],
            'IRC': hs['contact']['irc'],
            'Email': hs['contact']['email'],
            'Mailing-List': hs['contact']['ml'],
        }));
        hsdata.append($('<div>').addClass('clearfix'));
    }
    //hsdata.append(createDataBlock('Flux', {
    //}));
    //hsdata.append($('<div>').addClass('clearfix'));

    // All other data

    /*
    var dl = hsdata.children('dl');
    dl.empty()
    $.each(hackerspaces[key], function(key, value){
        var dt = $('<dt>');
        dt.text(key.capitalize())
        dl.append(dt);
        var dd = $('<dd>');
        if (typeof value == "string" && value.startsWith("http")) {
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
    */


    // Update Nav
    $('#nav a').removeClass('active');
    $('#nav a[href="#'+ key +'"]').addClass('active');
    $('#comboNav').val('#' + key);
}

function getObject(obj) {
    var dl = $('<dl>');
    $.each(obj, function(key, value){
        var dt = $('<dt>');
        if (typeof key == "string"){
            dt.text(key.capitalize());
        } else if(typeof key == "number") {
            dt.text(key);
        }
        dl.append(dt);
        var dd = $('<dd>');
        if (typeof value == "string" ) {
            if (value.startsWith("http")) {
                var a = $('<a>')
                a.attr({'href': value})
                a.text(value)
                dd.append(a)
            } else {
                dd.text(value.capitalize());
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
            marker.setUrl('img/hs-open-marker.png');
        } else if (open === false) {
            marker.setUrl('img/hs-closed-marker.png');
        }
        // Merge SpaceApi data
        $.each(space_api, function(k, v){
            hackerspaces[key][k] = v;
        });

        loadByHash();
    });
}

function createMenu(){
    var menu = $('#nav');
    var select = $('#comboNav');
    var ul = $('<ul>');
    menu.children().replaceWith(ul);
    $.each(hackerspaces, function(k, v){
        // Link menu
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

        // Option combo nav
        var o = $('<option>');
        o.attr({'value': '#'+k}).text(k);
        o.click(function(){
            populateData(k, v);
            map.setCenter(getPosition(v), 13);
        });
        select.append(o);
    });
    select.change(function() {
        var key = this.options[this.selectedIndex].value.split('#')[1];
        populateData(key, hackerspaces[key]);
        map.setCenter(getPosition(hackerspaces[key].coordinate), 13);
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
