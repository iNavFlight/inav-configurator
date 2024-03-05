/*global $,MSPChainerClass,googleAnalytics,mspHelper,MSPCodes,GUI,chrome,MSP,TABS,Settings,helper,ol*/
'use strict';

TABS.gps = {};
TABS.gps.initialize = function (callback) {

    if (GUI.active_tab != 'gps') {
        GUI.active_tab = 'gps';
        googleAnalytics.sendAppView('GPS');
    }

    // mavlink ADSB_EMITTER_TYPE
    const ADSB_VEHICLE_TYPE = {
        0: 'adsb_14.png', // ADSB_EMITTER_TYPE_NO_INFO
        1: 'adsb_1.png', // ADSB_EMITTER_TYPE_LIGHT
        2: 'adsb_1.png', // ADSB_EMITTER_TYPE_SMALL
        3: 'adsb_2.png', // ADSB_EMITTER_TYPE_LARGE
        4: 'adsb_14.png', // ADSB_EMITTER_TYPE_HIGH_VORTEX_LARGE
        5: 'adsb_5.png', // ADSB_EMITTER_TYPE_HEAVY
        6: 'adsb_14.png', // ADSB_EMITTER_TYPE_HIGHLY_MANUV
        7: 'adsb_13.png', // ADSB_EMITTER_TYPE_ROTOCRAFT
        8: 'adsb_14.png', // ADSB_EMITTER_TYPE_UNASSIGNED
        9: 'adsb_6.png', // ADSB_EMITTER_TYPE_GLIDER
        10: 'adsb_7.png', // ADSB_EMITTER_TYPE_LIGHTER_AIR
        11: 'adsb_15.png', // ADSB_EMITTER_TYPE_PARACHUTE
        12: 'adsb_1.png', // ADSB_EMITTER_TYPE_ULTRA_LIGHT
        13: 'adsb_14.png', // ADSB_EMITTER_TYPE_UNASSIGNED2
        14: 'adsb_8.png', // ADSB_EMITTER_TYPE_UAV
        15: 'adsb_14.png', // ADSB_EMITTER_TYPE_SPACE
        16: 'adsb_14.png', // ADSB_EMITTER_TYPE_UNASSGINED3
        17: 'adsb_9.png', // ADSB_EMITTER_TYPE_EMERGENCY_SURFACE
        18: 'adsb_10.png', // ADSB_EMITTER_TYPE_SERVICE_SURFACE
        19: 'adsb_12.png', // ADSB_EMITTER_TYPE_POINT_OBSTACLE
    };



    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadFeatures,
        mspHelper.loadMiscV2
    ];

    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    var saveChainer = new MSPChainerClass();

    var saveChain = [
        mspHelper.saveMiscV2,
        saveSettings,
        mspHelper.saveToEeprom
    ];

    function saveSettings(onComplete) {
        Settings.saveInputs().then(onComplete);
    }

    saveChainer.setChain(saveChain);
    saveChainer.setExitPoint(reboot);

    function reboot() {
        //noinspection JSUnresolvedVariable
        GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));

        GUI.tab_switch_cleanup(function () {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                //noinspection JSUnresolvedVariable
                GUI.log(chrome.i18n.getMessage('deviceRebooting'));
                GUI.handleReconnect($('.tab_gps a'));
            });
        });
    }

    function load_html() {
        GUI.load("./tabs/gps.html", Settings.processHtml(process_html));
    }

    let cursorInitialized = false;
    let iconStyle;
    let mapHandler;
    let iconGeometry;
    let iconFeature;

    let vehicleVectorSource;
    let vehiclesCursorInitialized = false;


    function process_html() {
        localize();

        var features = FC.getFeatures();

        helper.features.updateUI($('.tab-gps'), FEATURES);

        // generate GPS
        var gpsProtocols = FC.getGpsProtocols();
        var gpsSbas = FC.getGpsSbasProviders();

        var gps_protocol_e = $('#gps_protocol');
        for (i = 0; i < gpsProtocols.length; i++) {
            gps_protocol_e.append('<option value="' + i + '">' + gpsProtocols[i] + '</option>');
        }

        gps_protocol_e.change(function () {
            MISC.gps_type = parseInt($(this).val());
        });

        gps_protocol_e.val(MISC.gps_type);
        gps_protocol_e.change();

        var gps_ubx_sbas_e = $('#gps_ubx_sbas');
        for (i = 0; i < gpsSbas.length; i++) {
            gps_ubx_sbas_e.append('<option value="' + i + '">' + gpsSbas[i] + '</option>');
        }

        gps_ubx_sbas_e.change(function () {
            MISC.gps_ubx_sbas = parseInt($(this).val());
        });

        gps_ubx_sbas_e.val(MISC.gps_ubx_sbas);

        let mapView = new ol.View({
            center: ol.proj.fromLonLat([0, 0]),
            zoom: 15
        });

        let mapLayer;

        if (globalSettings.mapProviderType == 'bing') {
            mapLayer = new ol.source.BingMaps({
                key: globalSettings.mapApiKey,
                imagerySet: 'AerialWithLabels',
                maxZoom: 19
            });
        } else if (globalSettings.mapProviderType == 'mapproxy') {
            mapLayer = new ol.source.TileWMS({
                url: globalSettings.proxyURL,
                params: { 'LAYERS': globalSettings.proxyLayer }
            })
        } else {
            mapLayer = new ol.source.OSM();
        }

        $("#center_button").click(function () {
            let lat = GPS_DATA.lat / 10000000;
            let lon = GPS_DATA.lon / 10000000;
            let center = ol.proj.fromLonLat([lon, lat]);
            mapView.setCenter(center);
        });

        mapHandler = new ol.Map({
            target: document.getElementById('gps-map'),
            layers: [
                new ol.layer.Tile({
                    source: mapLayer
                })
            ],
            view: mapView
        });

        TABS.gps.toolboxAdsbVehicle = new jBox('Mouse', {
            position: {
                x: "right",
                y: "bottom"
            },
            offset: {
                x: -5,
                y: 20,
            },
        });

        mapHandler.on('pointermove', function(evt) {
            var feature = mapHandler.forEachFeatureAtPixel(mapHandler.getEventPixel(evt.originalEvent), function(feature, layer) {
                return feature;
            });

            if (feature) {
                TABS.gps.toolboxAdsbVehicle.setContent(
                    `icao: <strong>` + feature.get('name') + `</strong><br />`
                    + `lat: <strong>`+ (feature.get('data').lat / 10000000) + `</strong><br />`
                    + `lon: <strong>`+ (feature.get('data').lon / 10000000) + `</strong><br />`
                    + `ASL: <strong>`+ (feature.get('data').altCM ) / 100 + `m</strong><br />`
                    + `heading: <strong>`+ feature.get('data').headingDegrees + `°</strong><br />`
                    + `type: <strong>`+ feature.get('data').emitterType + `</strong>`
                ).open();
            }else{
                TABS.gps.toolboxAdsbVehicle.close();
            }
        });

        let center = ol.proj.fromLonLat([0, 0]);
        mapView.setCenter(center);
        mapView.setZoom(2);

        function get_raw_gps_data() {
            MSP.send_message(MSPCodes.MSP_RAW_GPS, false, false, get_comp_gps_data);
        }

        function get_comp_gps_data() {
            MSP.send_message(MSPCodes.MSP_COMP_GPS, false, false, get_gpsstatistics_data);
        }

        function get_gpsstatistics_data() {
            MSP.send_message(MSPCodes.MSP_GPSSTATISTICS, false, false, update_ui);
        }

        function update_ui() {

            let lat = GPS_DATA.lat / 10000000;
            let lon = GPS_DATA.lon / 10000000;

            let gpsFixType = chrome.i18n.getMessage('gpsFixNone');
            if (GPS_DATA.fix >= 2) {
                gpsFixType = chrome.i18n.getMessage('gpsFix3D');
            } else if (GPS_DATA.fix >= 1) {
                gpsFixType = chrome.i18n.getMessage('gpsFix2D');
            }

            $('.GPS_info td.fix').html(gpsFixType);
            $('.GPS_info td.alt').text(GPS_DATA.alt + ' m');
            $('.GPS_info td.lat').text(lat.toFixed(4) + ' deg');
            $('.GPS_info td.lon').text(lon.toFixed(4) + ' deg');
            $('.GPS_info td.speed').text(GPS_DATA.speed + ' cm/s');
            $('.GPS_info td.sats').text(GPS_DATA.numSat);
            $('.GPS_info td.distToHome').text(GPS_DATA.distanceToHome + ' m');

            let gpsRate = 0;
            if (GPS_DATA.messageDt > 0) {
                gpsRate = 1000 / GPS_DATA.messageDt;
            }

            $('.GPS_stat td.messages').text(GPS_DATA.packetCount);
            $('.GPS_stat td.rate').text(gpsRate.toFixed(1) + ' Hz');
            $('.GPS_stat td.errors').text(GPS_DATA.errors);
            $('.GPS_stat td.timeouts').text(GPS_DATA.timeouts);
            $('.GPS_stat td.eph').text((GPS_DATA.eph / 100).toFixed(2) + ' m');
            $('.GPS_stat td.epv').text((GPS_DATA.epv / 100).toFixed(2) + ' m');
            $('.GPS_stat td.hdop').text((GPS_DATA.hdop / 100).toFixed(2));

            //Update map
            if (GPS_DATA.fix >= 2) {

                let center = ol.proj.fromLonLat([lon, lat]);

                if (!cursorInitialized) {
                    cursorInitialized = true;

                    iconStyle = new ol.style.Style({
                        image: new ol.style.Icon(({
                            anchor: [0.5, 1],
                            opacity: 1,
                            scale: 0.5,
                            src: '../images/icons/cf_icon_position.png'
                        }))
                    });

                    let currentPositionLayer;
                    iconGeometry = new ol.geom.Point(ol.proj.fromLonLat([0, 0]));
                    iconFeature = new ol.Feature({
                        geometry: iconGeometry
                    });

                    iconFeature.setStyle(iconStyle);

                    let vectorSource = new ol.source.Vector({
                        features: [iconFeature]
                    });
                    currentPositionLayer = new ol.layer.Vector({
                        source: vectorSource
                    });

                    mapHandler.addLayer(currentPositionLayer);

                    mapView.setCenter(center);
                    mapView.setZoom(14);
                }

                iconGeometry.setCoordinates(center);

            }

            if (semver.gte(CONFIG.flightControllerVersion, "7.1.0")) {
                MSP.send_message(MSPCodes.MSP2_ADSB_VEHICLE_LIST, false, false, function () {
                    //ADSB vehicles

                    if (vehiclesCursorInitialized) {
                        vehicleVectorSource.clear();
                    }

                    for (let key in ADSB_VEHICLES.vehicles) {
                        let vehicle = ADSB_VEHICLES.vehicles[key];

                        if (!vehiclesCursorInitialized) {
                            vehiclesCursorInitialized = true;

                            vehicleVectorSource = new ol.source.Vector({});

                            let vehicleLayer = new ol.layer.Vector({
                                source: vehicleVectorSource
                            });

                            mapHandler.addLayer(vehicleLayer);
                        }

                        if (vehicle.lat > 0 && vehicle.lon > 0 && vehicle.ttl > 0) {
                            let vehicleIconStyle = new ol.style.Style({
                                image: new ol.style.Icon(({
                                    opacity: 1,
                                    rotation: vehicle.headingDegrees * (Math.PI / 180),
                                    scale: 0.8,
                                    anchor: [0.5, 0.5],
                                    src: '../resources/adsb/' + ADSB_VEHICLE_TYPE[vehicle.emitterType],
                                })),
                                text: new ol.style.Text(({
                                    text: vehicle.callsign,
                                    textAlign: 'center',
                                    textBaseline: "bottom",
                                    offsetY: +40,
                                    padding: [2, 2, 2, 2],
                                    backgroundFill: '#444444',
                                    fill: new ol.style.Fill({color: '#ffffff'}),
                                })),
                            });


                            let iconGeometry = new ol.geom.Point(ol.proj.fromLonLat([vehicle.lon / 10000000, vehicle.lat / 10000000]));
                            let iconFeature = new ol.Feature({
                                geometry: iconGeometry,
                                name: vehicle.callsign,
                                type: 'adsb',
                                data: vehicle,
                            });

                            iconFeature.setStyle(vehicleIconStyle);
                            vehicleVectorSource.addFeature(iconFeature);
                        }
                    }
                });
            }

        }

        /*
         * enable data pulling
         * GPS is usually refreshed at 5Hz, there is no reason to pull it much more often, really...
         */
        helper.mspBalancedInterval.add('gps_pull', 200, 3, function gps_update() {
            // avoid usage of the GPS commands until a GPS sensor is detected for targets that are compiled without GPS support.
            if (!have_sensor(CONFIG.activeSensors, 'gps')) {
                update_ui();
                return;
            }

            if (helper.mspQueue.shouldDrop()) {
                return;
            }

            get_raw_gps_data();
        });


        $('a.save').on('click', function () {
            if (FC.isFeatureEnabled('GPS', features)) {
                googleAnalytics.sendEvent('Setting', 'GpsProtocol', gpsProtocols[MISC.gps_type]);
                googleAnalytics.sendEvent('Setting', 'GpsSbas', gpsSbas[MISC.gps_ubx_sbas]);
            }

            googleAnalytics.sendEvent('Setting', 'GPSEnabled', FC.isFeatureEnabled('GPS', features) ? "true" : "false");

            for (var i = 0; i < features.length; i++) {
                var featureName = features[i].name;
                if (FC.isFeatureEnabled(featureName, features)) {
                    googleAnalytics.sendEvent('Setting', 'Feature', featureName);
                }
            }

            helper.features.reset();
            helper.features.fromUI($('.tab-gps'));
            helper.features.execute(function () {
                saveChainer.execute();
            });
        });

        GUI.content_ready(callback);
    }

};

TABS.gps.cleanup = function (callback) {
    if (callback) callback();
    if(TABS.gps.toolboxAdsbVehicle){
        TABS.gps.toolboxAdsbVehicle.close();
    }
};
