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
            // TODO: Trim spaces
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

function createDataBlock(title, data, cls){
    block = $('<div>');
    block.addClass('one-third');
    block.addClass(cls);
    titleh = $('<h4>');
    titleh.addClass('heading');
    titleh.text(title);
    block.append(titleh);
    block.append(getObject(data));
    return block;
}

function populateData(key){
    var hs = hackerspaces[key];
    $("#hsname").text(key);
    var hsdata = $('#page-content');
    hsdata.empty();

    // Logo
    var block_img = $('<div>');
    block_img.addClass('one-third last img-logo-container');
    hsdata.append(block_img);
    var logo_img = $('<img>');
    logo_img.addClass('img-logo');
    block_img.append(logo_img);
    if(hs.logo){
        logo_img.attr('src', hs.logo);
    } else {
        logo_img.attr('src', '/img/nologo.png');
    }

    // Contact
    data = {
        'Phone': hs['phone'],
        'Email': hs['email'],
        'Mailing-List': hs['maillist'],
        'Jabber': hs['jabber'],
    };
    if (hs['contact']) {
        data['Phone'] = hs['contact']['phone'];
        data['IRC'] = hs['contact']['irc'];
        data['Email'] = hs['contact']['email'];
        data['Mailing-List'] = hs['contact']['ml'];
        data['Twiter'] = hs['contact']['twitter'];
        data['Facebook'] = hs['contact']['facebook'];
        data['Google+'] = hs['contact']['googleplus'];
    }
    hsdata.append(createDataBlock('Contact',data,'last'));

    // Information
    var block, title, data;
    hsdata.append(createDataBlock('Information', {
            'Website': hs['site'],
            'Wiki': hs['wiki'],
            'Size': hs['size'],
            'Membercount': hs['membercount'],
            'Fee': hs['fee'],
            'Founded': hs['founding'],
    }));

    hsdata.append($('<div>').addClass('clearfix')); // CLEAR

    // Localisation
    data = {};
    if(hs['address']){
        data['Address'] = hs['address'];
    } else if (hs['street-address'] && hs['postalcode'] && hs['city']){
        data['Address'] = hs['street-address'].capitalize() + ', ' +
            hs['postalcode'] + ' ' + hs['city'].capitalize();
    } else if(hs['city']) {
        data['Address'] = hs['city'].capitalize();
    }
    if (hs['coordinate']){
        data['GPS'] = hs['coordinate'][1] + ',' + hs['coordinate'][0];
    } else if(hs['lon'] && hs['lat']) {
        data['GPS'] = hs['lon'] + ',' + hs['lat'];
    }
    hsdata.append(createDataBlock('Localisation', data));

    // Status
    if(hs['status'] && hs['lastchange']){
        hsdata.append(createDataBlock('Status', {
            'Status': hs['status'],
            'Last change': hs['lastchange'],
        }));
    }

    hsdata.append($('<div>').addClass('clearfix')); // CLEAR

    // Update Nav
    $('#nav a').removeClass('active');
    $('#nav a[href="#'+ key +'"]').addClass('active');
    $('#comboNav').val('#' + key);
}

function getObject(obj) {
    var ul = $('<ul>');
    $.each(obj, function(key, value){
        if (!key || !value){
            return 1;
        }
        var li = $('<li>');
        var label = $('<label>');
        if (typeof key == "string"){
            label.text(key.capitalize());
        } else if(typeof key == "number") {
            label.text(key);
        }
        li.append(label);
        var span = $('<span>');
        if (typeof value == "string" ) {
            if (value.startsWith("http")) {
                var a = $('<a>')
                a.attr({'href': value})
                value = value.replace('http://www.', '');
                value = value.replace('https://www.', '');
                value = value.replace('http://', '');
                value = value.replace('https://', '');
                if(value.length > 28){
                    a.text(value.substring(0, 18) + '..' + value.substr(-8, 8));
                } else {
                    a.text(value)
                }
                span.append(a)
            } else {
                span.text(value.capitalize());
            }
        } else if (typeof value == "number" ) {
            span.text(value);
        } else if(typeof value == "object") {
            span.append(getObject(value));
        }
        li.append(span);
        ul.append(li);
    });
    return ul;
}

function getSpaceApiData(key, url, marker) {
    if (!url) {
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
