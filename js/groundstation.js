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
        console.log('updateGui');
    };

    return publicScope;
})();