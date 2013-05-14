function loadmap(){
     map = new OpenLayers.Map("demoMap");
     map.addLayer(new OpenLayers.Layer.OSM());
     map.zoomToMaxExtent();
}
