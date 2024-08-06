'use strict';

const path = require('path')
const ol = require('openlayers')
const semver = require('semver');

const MSPChainerClass = require('./../js/msp/MSPchainer');
const mspHelper = require('./../js/msp/MSPHelper');
const MSPCodes = require('./../js/msp/MSPCodes');
const MSP = require('./../js/msp');
const interval = require('./../js/intervals');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const i18n = require('./../js/localization');
const Settings = require('./../js/settings');
const serialPortHelper = require('./../js/serialPortHelper');
const features = require('./../js/feature_framework');
const { globalSettings } = require('./../js/globalSettings');
const jBox = require('./../js/libraries/jBox/jBox.min');
const SerialBackend = require('../js/serial_backend');
const ublox = require('../js/ublox/UBLOX');


TABS.gps = {};
TABS.gps.initialize = function (callback) {

    if (GUI.active_tab != 'gps') {
        GUI.active_tab = 'gps';
    }

    // mavlink ADSB_EMITTER_TYPE
    const ADSB_VEHICLE_TYPE = {
        0: {icon: 'adsb_14.png', name: 'No info'}, // ADSB_EMITTER_TYPE_NO_INFO
        1: {icon: 'adsb_1.png', name: 'Light'}, // ADSB_EMITTER_TYPE_LIGHT
        2: {icon: 'adsb_1.png', name: 'Small'}, // ADSB_EMITTER_TYPE_SMALL
        3: {icon: 'adsb_2.png', name: 'Large'}, // ADSB_EMITTER_TYPE_LARGE
        4: {icon: 'adsb_14.png', name: 'High vortex large'}, // ADSB_EMITTER_TYPE_HIGH_VORTEX_LARGE
        5: {icon: 'adsb_5.png', name: 'Heavy'}, // ADSB_EMITTER_TYPE_HEAVY
        6: {icon: 'adsb_14.png', name: 'Manuv'}, // ADSB_EMITTER_TYPE_HIGHLY_MANUV
        7: {icon: 'adsb_13.png', name: 'Rotorcraft'}, // ADSB_EMITTER_TYPE_ROTOCRAFT
        8: {icon: 'adsb_14.png', name: 'Unassigned'}, // ADSB_EMITTER_TYPE_UNASSIGNED
        9: {icon: 'adsb_6.png', name: 'Glider'}, // ADSB_EMITTER_TYPE_GLIDER
        10:{icon:  'adsb_7.png', name: 'Lighter air'}, // ADSB_EMITTER_TYPE_LIGHTER_AIR
        11:{icon:  'adsb_15.png', name: 'Parachute'}, // ADSB_EMITTER_TYPE_PARACHUTE
        12:{icon:  'adsb_1.png', name: 'Ultra light'}, // ADSB_EMITTER_TYPE_ULTRA_LIGHT
        13:{icon:  'adsb_14.png', name: 'Unassigned 2'}, // ADSB_EMITTER_TYPE_UNASSIGNED2
        14:{icon:  'adsb_8.png', name: 'UAV'}, // ADSB_EMITTER_TYPE_UAV
        15:{icon:  'adsb_14.png', name: 'Space'}, // ADSB_EMITTER_TYPE_SPACE
        16:{icon:  'adsb_14.png', name: 'Unassigned 3'}, // ADSB_EMITTER_TYPE_UNASSGINED3
        17:{icon:  'adsb_9.png', name: 'Surface'}, // ADSB_EMITTER_TYPE_EMERGENCY_SURFACE
        18:{icon:  'adsb_10.png', name: 'Service surface'}, // ADSB_EMITTER_TYPE_SERVICE_SURFACE
        19:{icon:  'adsb_12.png', name: 'Pint obstacle'}, // ADSB_EMITTER_TYPE_POINT_OBSTACLE
    };

    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadFeatures,
        mspHelper.loadSerialPorts,
        mspHelper.loadMiscV2
    ];

    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    var saveChainer = new MSPChainerClass();

    var saveChain = [
        mspHelper.saveMiscV2,
        mspHelper.saveSerialPorts,
        saveSettings,
        mspHelper.saveToEeprom
    ];

    function saveSettings(onComplete) {
        Settings.saveInputs(onComplete);
    }

    saveChainer.setChain(saveChain);
    saveChainer.setExitPoint(reboot);

    function reboot() {
        //noinspection JSUnresolvedVariable
        GUI.log(i18n.getMessage('configurationEepromSaved'));

        GUI.tab_switch_cleanup(function () {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                //noinspection JSUnresolvedVariable
                GUI.log(i18n.getMessage('deviceRebooting'));
                GUI.handleReconnect($('.tab_gps a'));
            });
        });
    }

    function load_html() {
        GUI.load(path.join(__dirname, "gps.html"), Settings.processHtml(process_html));
    }

    let cursorInitialized = false;
    let iconStyle;
    let mapHandler;
    let iconGeometry;
    let iconFeature;

    let vehicleVectorSource;
    let vehiclesCursorInitialized = false;

    function process_html() {
       i18n.localize();;

        var fcFeatures = FC.getFeatures();

        features.updateUI($('.tab-gps'), FC.FEATURES);

        //Generate serial port options
        let $port = $('#gps_port');
        let $baud = $('#gps_baud');

        let ports = serialPortHelper.getPortIdentifiersForFunction('GPS');

        let currentPort = null;

        if (ports.length == 1) {
            currentPort = ports[0];
        }

        let availablePorts = serialPortHelper.getPortList();

        //Generate port select
        $port.append('<option value="-1">NONE</option>');
        for (let i = 0; i < availablePorts.length; i++) {
            let port = availablePorts[i];
            $port.append('<option value="' + port.identifier + '">' + port.displayName + '</option>');
        }

        //Generate baud select
        serialPortHelper.getBauds('SENSOR').forEach(function (baud) {
            $baud.append('<option value="' + baud + '">' + baud + '</option>');
        });

        //Select defaults
        if (currentPort !== null) {
            $port.val(currentPort);
            let portConfig = serialPortHelper.getPortByIdentifier(currentPort);
            $baud.val(portConfig.sensors_baudrate);
        } else {
            $port.val(-1);
            $baud.val(serialPortHelper.getRuleByName('GPS').defaultBaud);
        }

        // generate GPS
        var gpsProtocols = FC.getGpsProtocols();
        var gpsSbas = FC.getGpsSbasProviders();

        var gps_protocol_e = $('#gps_protocol');
        for (let i = 0; i < gpsProtocols.length; i++) {
            gps_protocol_e.append('<option value="' + i + '">' + gpsProtocols[i] + '</option>');
        }

        gps_protocol_e.on('change', function () {
            FC.MISC.gps_type = parseInt($(this).val());
        });

        gps_protocol_e.val(FC.MISC.gps_type);
        gps_protocol_e.trigger('change');

        var gps_ubx_sbas_e = $('#gps_ubx_sbas');
        for (let i = 0; i < gpsSbas.length; i++) {
            gps_ubx_sbas_e.append('<option value="' + i + '">' + gpsSbas[i] + '</option>');
        }

        gps_ubx_sbas_e.on('change', function () {
            FC.MISC.gps_ubx_sbas = parseInt($(this).val());
        });

        gps_ubx_sbas_e.val(FC.MISC.gps_ubx_sbas);

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

        $("#center_button").on('click', function () {
            let lat = FC.GPS_DATA.lat / 10000000;
            let lon = FC.GPS_DATA.lon / 10000000;
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

            if (feature && feature.get('data') && feature.get('name')) {
                TABS.gps.toolboxAdsbVehicle.setContent(
                    `callsign: <strong>` + feature.get('name') + `</strong><br />`
                    + `lat: <strong>`+ (feature.get('data').lat / 10000000) + `</strong><br />`
                    + `lon: <strong>`+ (feature.get('data').lon / 10000000) + `</strong><br />`
                    + `ASL: <strong>`+ (feature.get('data').altCM ) / 100 + `m</strong><br />`
                    + `heading: <strong>`+ feature.get('data').headingDegrees + `°</strong><br />`
                    + `type: <strong>`+ ADSB_VEHICLE_TYPE[feature.get('data').emitterType].name + `</strong>`
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
            MSP.send_message(MSPCodes.MSP_GPSSTATISTICS, false, false, update_gps_ui);
        }

        function get_raw_adsb_data() {
            MSP.send_message(MSPCodes.MSP2_ADSB_VEHICLE_LIST, false, false, update_adsb_ui);
        }

        function update_gps_ui() {
            let lat = FC.GPS_DATA.lat / 10000000;
            let lon = FC.GPS_DATA.lon / 10000000;

            let gpsFixType = i18n.getMessage('gpsFixNone');
            if (FC.GPS_DATA.fix >= 2) {
                gpsFixType = i18n.getMessage('gpsFix3D');
            } else if (FC.GPS_DATA.fix >= 1) {
                gpsFixType = i18n.getMessage('gpsFix2D');
            }

            $('.GPS_info td.fix').html(gpsFixType);
            $('.GPS_info td.alt').text(FC.GPS_DATA.alt + ' m');
            $('.GPS_info td.lat').text(lat.toFixed(4) + ' deg');
            $('.GPS_info td.lon').text(lon.toFixed(4) + ' deg');
            $('.GPS_info td.speed').text(FC.GPS_DATA.speed + ' cm/s');
            $('.GPS_info td.sats').text(FC.GPS_DATA.numSat);
            $('.GPS_info td.distToHome').text(FC.GPS_DATA.distanceToHome + ' m');

            let gpsRate = 0;
            if (FC.GPS_DATA.messageDt > 0) {
                gpsRate = 1000 / FC.GPS_DATA.messageDt;
            }

            $('.GPS_stat td.messages').text(FC.GPS_DATA.packetCount);
            $('.GPS_stat td.rate').text(gpsRate.toFixed(1) + ' Hz');
            $('.GPS_stat td.errors').text(FC.GPS_DATA.errors);
            $('.GPS_stat td.timeouts').text(FC.GPS_DATA.timeouts);
            $('.GPS_stat td.eph').text((FC.GPS_DATA.eph / 100).toFixed(2) + ' m');
            $('.GPS_stat td.epv').text((FC.GPS_DATA.epv / 100).toFixed(2) + ' m');
            $('.GPS_stat td.hdop').text((FC.GPS_DATA.hdop / 100).toFixed(2));

            //Update map
            if (FC.GPS_DATA.fix >= 2) {

                let center = ol.proj.fromLonLat([lon, lat]);

                if (!cursorInitialized) {
                    cursorInitialized = true;

                    iconStyle = new ol.style.Style({
                        image: new ol.style.Icon(({
                            anchor: [0.5, 1],
                            opacity: 1,
                            scale: 0.5,
                            src: path.join(__dirname, './../images/icons/cf_icon_position.png')
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
        }

        function update_adsb_ui() {

            if (vehiclesCursorInitialized) {
                vehicleVectorSource.clear();
            }

            $('.adsbVehicleTotalMessages').html(FC.ADSB_VEHICLES.vehiclePacketCount);
            $('.adsbHeartbeatTotalMessages').html(FC.ADSB_VEHICLES.heartbeatPacketCount);

            for (let key in FC.ADSB_VEHICLES.vehicles) {
                let vehicle = FC.ADSB_VEHICLES.vehicles[key];

                if (!vehiclesCursorInitialized) {
                    vehiclesCursorInitialized = true;

                    vehicleVectorSource = new ol.source.Vector({});

                    let vehicleLayer = new ol.layer.Vector({
                        source: vehicleVectorSource
                    });

                    mapHandler.addLayer(vehicleLayer);
                }

                if (vehicle.lat != 0 && vehicle.lon != 0 && vehicle.ttl > 0) {
                    let vehicleIconStyle = new ol.style.Style({
                        image: new ol.style.Icon(({
                            opacity: 1,
                            rotation: vehicle.headingDegrees * (Math.PI / 180),
                            scale: 0.8,
                            anchor: [0.5, 0.5],
                            src: path.join(__dirname, './../resources/adsb/' + ADSB_VEHICLE_TYPE[vehicle.emitterType].icon),
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
        }

        /*
         * enable data pulling
         * GPS is usually refreshed at 5Hz, there is no reason to pull it much more often, really...
         */
        interval.add('gps_pull', function gps_update() {
            // avoid usage of the GPS commands until a GPS sensor is detected for targets that are compiled without GPS support.
            if (!SerialBackend.have_sensor(FC.CONFIG.activeSensors, 'gps')) {
                update_gps_ui();
                return;
            }

            get_raw_gps_data();

        }, 200);


        if (semver.gte(FC.CONFIG.flightControllerVersion, "8.0.0")) {
            $('.adsb_info_block').hide();
            mspHelper.loadSerialPorts(function () {
                for(var i  in FC.SERIAL_CONFIG.ports){
                   if(FC.SERIAL_CONFIG.ports[i].functions && FC.SERIAL_CONFIG.ports[i].functions.includes("TELEMETRY_MAVLINK")){
                       $('.adsb_info_block').show();
                       interval.add('adsb_pull', get_raw_adsb_data, 200);
                       break;
                   }
                }
            });
        }

        $('a.save').on('click', function () {
            serialPortHelper.set($port.val(), 'GPS', $baud.val());
            features.reset();
            features.fromUI($('.tab-gps'));
            features.execute(function () {
                saveChainer.execute();
            });
        });

        function processUbloxData(data) {
            if(data != null) {
                //console.log("processing data type: " + typeof(data));
                let totalSent = 0;
                let total = data.length;

                var ubloxChainer = MSPChainerClass();
                var chain = [];
                let d = new Date();

                GUI.log(i18n.getMessage('gpsAssistnowStart'));
                data.forEach((item) => {
                    chain.push(function (callback) {
                        //console.log("UBX command: " + item.length);
                        let callCallback = false;
                        if (ublox.isAssistnowDataRelevant(item, d.getUTCFullYear(), d.getUTCMonth()+1, d.getUTCDate()+1)) {
                            mspHelper.sendUbloxCommand(item, callback);
                        } else {
                            // Ignore msp command, but keep counter going.
                            callCallback = true;
                        }
                        totalSent++;
                        if((totalSent % 100) == 0) {
                            GUI.log(totalSent + '/' + total + ' ' + i18n.getMessage('gpsAssistnowUpdate'));
                        }
                        if(callCallback) {
                            callback();
                        }
                    });
                });
                ubloxChainer.setChain(chain);
                ubloxChainer.setExitPoint(function () {
                    if ((totalSent % 100) != 0) {
                        GUI.log(totalSent + '/' + total + ' ' + i18n.getMessage('gpsAssistnowUpdate'));
                    }
                    GUI.log(i18n.getMessage('gpsAssistnowDone'));
                });

                ubloxChainer.execute();
            }
        }

        $('a.loadAssistnowOnline').on('click', function () {
            if(globalSettings.assistnowApiKey != null && globalSettings.assistnowApiKey != '') {
                ublox.loadAssistnowOnline(processUbloxData);
           } else {
                GUI.alert("Assistnow Token not set!");
            }
        });

        $('a.loadAssistnowOffline').on('click', function () {
            if(globalSettings.assistnowApiKey != null && globalSettings.assistnowApiKey != '') {
                ublox.loadAssistnowOffline(processUbloxData);
            } else {
                GUI.alert("Assistnow Token not set!");
            }
        });

        GUI.content_ready(callback);
    }

};

TABS.gps.cleanup = function (callback) {
    if (callback) callback();
    if (TABS.gps.toolboxAdsbVehicle){
        TABS.gps.toolboxAdsbVehicle.close();
    }
};
