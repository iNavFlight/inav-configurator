'use strict';

var helper = helper || {};

helper.groundstation = (function () {

    let publicScope = {},
        privateScope = {};

    privateScope.activated = false;
    privateScope.$viewport = null;
    privateScope.$gsViewport = null;
    privateScope.mapHandler = null;
    privateScope.mapLayer = null;
    privateScope.mapView = null;
    
    privateScope.cursorStyle = null;
    privateScope.cursorPosition = null;
    privateScope.cursorFeature = null;
    privateScope.cursorVector = null;
    privateScope.cursorLayer = null;

    privateScope.mapInitiated = false;

    publicScope.isActivated = function () {
        return privateScope.activated;
    };

    publicScope.activate = function ($viewport) {

        if (privateScope.activated) {
            return;
        }

        helper.interval.add('gsUpdateGui', privateScope.updateGui, 200);

        privateScope.$viewport = $viewport;

        privateScope.$viewport.find(".tab_container").hide();
        privateScope.$viewport.find('#content').hide();
        privateScope.$viewport.find('#status-bar').hide();
        privateScope.$viewport.find('#connectbutton a.connect_state').text(chrome.i18n.getMessage('disconnect')).addClass('active');

        privateScope.$gsViewport = $viewport.find('#view-groundstation');
        privateScope.$gsViewport.show();
        privateScope.mapInitiated = false;

        setTimeout(privateScope.initMap, 200);

        privateScope.activated = true;
        GUI.log(chrome.i18n.getMessage('gsActivated'));
    }

    privateScope.initMap = function () {

        //initialte layers
        if (globalSettings.mapProviderType == 'bing') {
            privateScope.mapLayer = new ol.source.BingMaps({
                key: globalSettings.mapApiKey,
                imagerySet: 'AerialWithLabels',
                maxZoom: 19
            });
        } else if (globalSettings.mapProviderType == 'mapproxy') {
            privateScope.mapLayer = new ol.source.TileWMS({
                url: globalSettings.proxyURL,
                params: { 'LAYERS': globalSettings.proxyLayer }
            })
        } else {
            privateScope.mapLayer = new ol.source.OSM();
        }
        
        //initiate view
        privateScope.mapView = new ol.View({
            center: ol.proj.fromLonLat([0, 0]),
            zoom: 3
        });

        //initiate map handler
        privateScope.mapHandler = new ol.Map({
            target: document.getElementById('groundstation-map'),
            layers: [
                new ol.layer.Tile({
                    source: privateScope.mapLayer
                })
            ],
            view: privateScope.mapView
        });
    };

    publicScope.deactivate = function () {

        if (!privateScope.activated) {
            return;
        }

        helper.interval.remove('gsUpdateGui');

        if (privateScope.$viewport !== null) {
            privateScope.$viewport.find(".tab_container").show();
            privateScope.$viewport.find('#content').show();
            privateScope.$viewport.find('#status-bar').show();
        }

        if (privateScope.$gsViewport !== null) {
            privateScope.$gsViewport.hide();
        }

        privateScope.activated = false;
        GUI.log(chrome.i18n.getMessage('gsDeactivated'));
    }

    privateScope.updateGui = function () {

        let telemetry = helper.ltmDecoder.get();

        if (telemetry.gpsFix) {

            let lat = telemetry.latitude / 10000000;
            let lon = telemetry.longitude / 10000000;

            //On first initiation, set zoom to 15
            if (!privateScope.mapInitiated) {

                //Place UAV on the map
                privateScope.cursorStyle = new ol.style.Style({
                    image: new ol.style.Icon(({
                        anchor: [0.5, 0.5],
                        opacity: 1,
                        scale: 0.6,
                        src: '../images/icons/icon_mission_airplane.png'
                    }))
                });
                privateScope.cursorPosition = new ol.geom.Point(ol.proj.fromLonLat([lon, lat]));

                privateScope.cursorFeature = new ol.Feature({
                    geometry: privateScope.cursorPosition
                });

                privateScope.cursorFeature.setStyle(privateScope.cursorStyle);

                privateScope.cursorVector = new ol.source.Vector({
                    features: [privateScope.cursorFeature]
                });
                privateScope.cursorLayer = new ol.layer.Vector({
                    source: privateScope.cursorVector
                });

                privateScope.mapHandler.addLayer(privateScope.cursorLayer);

                privateScope.mapView.setZoom(17);
                privateScope.mapInitiated = true;
            }

            //Update map center
            let position = ol.proj.fromLonLat([lon, lat]);
            privateScope.mapView.setCenter(position);

            //Update position of cursor
            privateScope.cursorPosition.setCoordinates(position);
            //Update orientation of cursor
            privateScope.cursorStyle.getImage().setRotation((telemetry.heading / 360.0) * 6.28318);

        }

    };

    return publicScope;
})();