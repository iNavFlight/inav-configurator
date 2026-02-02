'use strict';

import xml2js from 'xml2js';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

// Make Chart available globally for plotElevation function
window.Chart = Chart;

import Map from 'ol/Map.js';
import XYZ from 'ol/source/XYZ.js';
import OSM from 'ol/source/OSM.js';
import TileWMS from 'ol/source/TileWMS'
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js'
import { fromLonLat, toLonLat, getPointResolution, METERS_PER_UNIT } from 'ol/proj';
import Style from 'ol/style/Style'
import Icon from 'ol/style/Icon';
import Text from 'ol/style/Text';
import Fill from 'ol/style/Fill';
import Point from 'ol/geom/Point.js';
import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector.js';
import VectorLayer from 'ol/layer/Vector.js';
import { LineString } from 'ol/geom';
import Stroke from 'ol/style/Stroke';
import RegularShape from 'ol/style/RegularShape';
import Circle from 'ol/geom/Circle';
import PointerInteraction from 'ol/interaction/Pointer.js';
import {defaults as defaultInteractions} from 'ol/interaction/defaults';
import {Control, defaults as defaultControls} from 'ol/control.js';

import MSPChainerClass from './../js/msp/MSPchainer';
import mspHelper from './../js/msp/MSPHelper';
import MSPCodes from './../js/msp/MSPCodes';
import MSP from './../js/msp';
import mspQueue from './../js/serial_queue';
import { GUI, TABS } from './../js/gui';
import FC from './../js/fc';
import CONFIGURATOR from './../js/data_storage';
import i18n from './../js/localization';
import { globalSettings } from './../js/globalSettings';
import MWNP from './../js/mwnp';
import Waypoint from './../js/waypoint';
import WaypointCollection from './../js/waypointCollection';
import Safehome from './../js/safehome';
import SafehomeCollection from './../js/safehomeCollection';
import { ApproachDirection, FwApproach } from './../js/fwApproach';
import FwApproachCollection from './../js/fwApproachCollection';
import SerialBackend from './../js/serial_backend';
import { distanceOnLine, wrap_360, calculate_new_cooridatnes } from './../js/helpers';
import interval from './../js/intervals';
import { Geozone, GeozoneVertex, GeozoneType, GeozoneShapes, GeozoneFenceAction }  from './../js/geozone';
import store from './../js/store';
import dialog from '../js/dialog';

import html from'./mission_control.html?raw';

var MAX_NEG_FW_LAND_ALT = -2000; // cm

// Dictionary of Parameter 1,2,3 definition depending on type of action selected (refer to MWNP.WPTYPE)
var dictOfLabelParameterPoint = {
    1:  {parameter1: 'Speed (cm/s)', parameter2: '', parameter3: 'Sea level Ref'},
    2:  {parameter1: '', parameter2: '', parameter3: ''},
    3:  {parameter1: 'Wait time (s)', parameter2: 'Speed (cm/s)', parameter3: 'Sea level Ref'},
    4:  {parameter1: 'Force land (non zero)', parameter2: '', parameter3: ''},
    5:  {parameter1: '', parameter2: '', parameter3: ''},
    6:  {parameter1: 'Target WP number', parameter2: 'Number of repeat (-1: infinite)', parameter3: ''},
    7:  {parameter1: 'Heading (deg)', parameter2: '', parameter3: ''},
    8:  {parameter1: '', parameter2: '', parameter3: 'Sea level Ref'}
};

var waypointOptions = ['JUMP','SET_HEAD','RTH'];

const iconNames = [
    'icon_mission_airplane.png',
    'icon_RTH.png',
    'icon_safehome.png',
    'icon_safehome_used.png',
    'icon_geozone_excl.png',
    'icon_geozone_incl.png',
    'icon_home.png',
    'icon_position_edit.png',
    'icon_position_head.png',
    'icon_position_LDG_edit.png',
    'icon_position_LDG.png',
    'icon_position_PH_edit.png',
    'icon_position_PH.png',
    'icon_position_POI.png',
    'icon_position_POI_edit.png',
    'icon_position_WP_edit.png',
    'icon_position_WP.png',
    'icon_position_edit.png',
    'icon_arrow.png',
    'settings_white.svg',
    'icon_safehome_white.svg',
    'icon_geozone_white.svg',
    'icon_elevation_white.svg',
    'icon_multimission_white.svg'    
];

const icons = Object.create(null)

////////////////////////////////////
//
// Tab mission control block
//
////////////////////////////////////

TABS.mission_control = {};
TABS.mission_control.isYmapLoad = false;
TABS.mission_control.initialize = function (callback) {

    let cursorInitialized = false;
    let curPosStyle;
    let curPosGeo;
    let rthGeo;
    let breadCrumbLS;
    let breadCrumbFeature;
    let breadCrumbStyle;
    let breadCrumbSource;
    let breadCrumbVector;
    let textStyle;
    let textFeature;
    var textGeom;
    let isOffline = false;
    let selectedSafehome;
    let $safehomeContentBox;
    let $waypointOptionsTableBody;
    let selectedGeozone;
    let $geozoneContent;
    let invalidGeoZones = false;
    let isGeozoneEnabeld = false;
    let settings = {speed: 0, alt: 5000, safeRadiusSH: 50, fwApproachAlt: 60, fwLandAlt: 5, maxDistSH: 0, fwApproachLength: 0, fwLoiterRadius: 0};

    if (GUI.active_tab != 'mission_control') {
        GUI.active_tab = 'mission_control';
    }

    if (FC.isFeatureEnabled('GEOZONE')) {
        isGeozoneEnabeld = true;
    }

    if (CONFIGURATOR.connectionValid) {
        var loadChainer = new MSPChainerClass();
        loadChainer.setChain([
            mspHelper.getMissionInfo,
            //mspHelper.loadWaypoints,
            mspHelper.loadSafehomes,
            mspHelper.loadFwApproach,
            function (callback) {
                if (isGeozoneEnabeld) {
                    mspHelper.loadGeozones(callback);
                } else {
                    callback();
                }
            },
            function (callback) {
                mspHelper.getSetting("nav_fw_land_approach_length").then((data) =>  {
                    settings.fwApproachLength = parseInt(data.value);
                }).then(callback);
            },
            function (callback) {
                mspHelper.getSetting("safehome_max_distance").then((data) => {
                    settings.maxDistSH = parseInt(data.value) / 100;
                }).then(callback);
            },
            function (callback) {
                mspHelper.getSetting(("nav_fw_loiter_radius")).then((data) => {
                    settings.fwLoiterRadius = parseInt(data.value);
                }).then(callback);
            }
        ]);
        loadChainer.setExitPoint(loadHtml);
        loadChainer.execute();
    } else {

        // FC not connected, load page anyway
        loadHtml();
        if (!FC.FW_APPROACH) {
            FC.FW_APPROACH = new FwApproachCollection();
        }
        if (!FC.SAFEHOMES) {
            FC.SAFEHOMES = new SafehomeCollection();
        }
        for (let i = 0; i < FC.FW_APPROACH.getMaxFwApproachCount(); i++){
            FC.FW_APPROACH.put(new FwApproach(i));
        }
    }
    
function iconKey(filename) {
    // drop extension, keep base name (e.g., "icon_RTH")
    return filename.replace(/\.(png|svg)$/i, '');
}

    async function loadIcons() {
        for (const fname of iconNames) {
            // Vites packager needs a bit help
            const base = iconKey(fname);
            const ext = fname.split('.').pop();
            let iconUrl;
            if (ext === 'png') {
                iconUrl = (await import(`./../images/icons/map/cf_${base}.png?inline`)).default;
            } else if (ext === 'svg') {
                iconUrl = (await import(`./../images/icons/map/cf_${base}.svg?inline`)).default;
            }
            if (!iconUrl) {
               throw new Error(`Missing icon URL for ${fname}`);
            }
            icons[base] = iconUrl;
        }
    }

    function loadHtml() {
        GUI.load(html, () => loadIcons().then(process_html));
    }

    function process_html() {

        // set GUI for offline operations
        if (!CONFIGURATOR.connectionValid) {
            $('#infoAvailablePoints').hide();
            $('#infoMissionValid').hide();
            $('#loadMissionButton').hide();
            $('#saveMissionButton').hide();
            $('#loadEepromMissionButton').hide();
            $('#saveEepromMissionButton').hide();
            isOffline = true;
        }

        $('#infoGeozoneMissionWarning').hide();
        $('#infoGeozoneInvalid').hide();
        $safehomeContentBox = $('#SafehomeContentBox');
        $waypointOptionsTableBody = $('#waypointOptionsTableBody');
        $geozoneContent = $('#geozoneContent');

       
            loadSettings();
            // let the dom load finish, avoiding the resizing of the map
            setTimeout(initMap, 200);
            if (!isOffline) {
                setTimeout(() => {
                    if (FC.SAFEHOMES.safehomeCount() >= 1) {
                        updateSelectedShAndFwAp(0);
                    } else {
                        selectedSafehome = null;
                        selectedFwApproachSh = null;
                    }
                    renderSafehomesOnMap();
                    updateSafehomeInfo();
                }, 500);
                if (isGeozoneEnabeld) {
                    setTimeout(() => {
                        selectedGeozone = FC.GEOZONES.last();
                        renderGeozonesOnMap();
                        updateGeozoneInfo();
                    }, 500);
                }
            }
    
        i18n.localize();

        function get_raw_gps_data() {
            MSP.send_message(MSPCodes.MSP_RAW_GPS, false, false, get_comp_gps_data);
        }

        function get_comp_gps_data() {
            MSP.send_message(MSPCodes.MSP_COMP_GPS, false, false, get_altitude_data);
        }

        function get_altitude_data() {
            MSP.send_message(MSPCodes.MSP_ALTITUDE, false, false, get_attitude_data);

        }

        function get_attitude_data() {
            MSP.send_message(MSPCodes.MSP_ATTITUDE, false, false, update_gpsTrack);
        }

        function update_gpsTrack() {

          let lat = FC.GPS_DATA.lat / 10000000;
          let lon = FC.GPS_DATA.lon / 10000000;

          //Update map
          if (FC.GPS_DATA.fix >= 2) {

              if (!cursorInitialized) {
                  cursorInitialized = true;

                  /////////////////////////////////////
                  //create layer for current position
                  curPosStyle = new Style({
                      image: new Icon(({
                          anchor: [0.5, 0.5],
                          opacity: 1,
                          scale: 0.6,
                          src: icons['icon_mission_airplane']
                      }))
                  });

                  let currentPositionLayer;
                  curPosGeo = new Point(fromLonLat([lon, lat]));

                  let curPosFeature = new Feature({
                      geometry: curPosGeo
                  });

                  curPosFeature.setStyle(curPosStyle);

                  let vectorSource = new VectorSource({
                      features: [curPosFeature]
                  });
                  currentPositionLayer = new VectorLayer({
                      source: vectorSource
                  });

                  ///////////////////////////
                  //create layer for RTH Marker
                  let rthStyle = new Style({
                      image: new Icon(({
                          anchor: [0.5, 1.0],
                          opacity: 1,
                          scale: 0.5,
                          src: icons['icon_RTH']
                      }))
                  });

                  rthGeo = new Point(fromLonLat([90, 0]));

                  let rthFeature = new Feature({
                      geometry: rthGeo
                  });

                  rthFeature.setStyle(rthStyle);

                  let rthVector = new VectorSource({
                      features: [rthFeature]
                  });
                  let rthLayer = new VectorLayer({
                      source: rthVector
                  });

                  //////////////////////////////
                  //create layer for bread crumbs
                  breadCrumbLS = new LineString([fromLonLat([lon, lat]), fromLonLat([lon, lat])]);

                  breadCrumbStyle = new Style({
                    stroke: new Stroke({
                      color: '#ffcc33',
                      width: 6
                    })
                  });

                  breadCrumbFeature = new Feature({
                    geometry: breadCrumbLS
                  });

                  breadCrumbFeature.setStyle(breadCrumbStyle);

                  breadCrumbSource = new VectorSource({
                    features: [breadCrumbFeature]
                  });

                  breadCrumbVector = new VectorLayer({
                    source: breadCrumbSource
                  });

                  /////////////////////////////
                  //create layer for heading, alt, groundspeed
                  textGeom = new Point([0,0]);

                  textStyle = new Style({
                    text: new Text({
                      font: 'bold 35px Calibri,sans-serif',
                      fill: new Fill({ color: '#fff' }),
                      offsetX: map.getSize()[0]-260,
                      offsetY: 80,
                      textAlign: 'left',
                      backgroundFill: new Fill({ color: '#000' }),
                      stroke: new Stroke({
                        color: '#fff', width: 2
                      }),
                      text: 'H: XXX\nAlt: XXXm\nSpeed: XXXcm/s'
                    })
                  });

                  textFeature = new Feature({
                    geometry: textGeom
                  });

                  textFeature.setStyle(textStyle);

                  var textSource = new VectorSource({
                    features: [textFeature]
                  });

                  var textVector = new VectorLayer({
                    source: textSource
                  });

                  map.addLayer(rthLayer);
                  map.addLayer(breadCrumbVector);
                  map.addLayer(currentPositionLayer);
                  map.addControl(textVector);
              }

              let gpsPos = fromLonLat([lon, lat]);
              curPosGeo.setCoordinates(gpsPos);

              breadCrumbLS.appendCoordinate(gpsPos);

              var coords = breadCrumbLS.getCoordinates();
              if(coords.length > 100)
              {
                coords.shift();
                breadCrumbLS.setCoordinates(coords);
              }

              curPosStyle.getImage().setRotation((FC.SENSOR_DATA.kinematics[2]/360.0) * 6.28318);

              //update data text
              textGeom.setCoordinates(map.getCoordinateFromPixel([0,0]));
              let tmpText = textStyle.getText();
              tmpText.setText('                                \n' +
                              'H: ' + FC.SENSOR_DATA.kinematics[2] +
                              '\nAlt: ' + FC.SENSOR_DATA.altitude +
                              'm\nSpeed: ' + FC.GPS_DATA.speed + 'cm/s\n' +
                              'Dist: ' + FC.GPS_DATA.distanceToHome + 'm');
          }
        }

        /*
         * enable data pulling if not offline
         * Refreshing data at 5Hz...  Could slow this down if we have performance issues
         */
        if(!isOffline)
        {
            interval.add('gps_pull', function gps_update() {
              // avoid usage of the GPS commands until a GPS sensor is detected for targets that are compiled without GPS support.
              if (!SerialBackend.have_sensor(FC.CONFIG.activeSensors, 'gps')) {
                  update_gpsTrack();
                  return;
              }

              get_raw_gps_data();
          }, 200);
        }

        GUI.content_ready(callback);
    }

    ///////////////////////////////////////////////
    //
    // define & init parameters
    //
    ///////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////////////////////////////////
    //      define & init parameters for Map Layer
    //////////////////////////////////////////////////////////////////////////////////////////////
    var markers = [];           // Layer for Waypoints
    var lines = [];             // Layer for lines between waypoints
    var safehomeMarkers = [];   // layer for Safehome points
    var safehomeMarkers = [];   // layer for Safehome points
    var approachLayers = []     // Layers for FW approach
    var safehomeMarkers = [];   // layer for Safehome points
    var approachLayers = []     // Layers for FW approach
    var geozoneMarkers = [];    // Layer for Geozonemarkers
    var geozoneLines = [];      // Layer for Lines between geozone vertices

    var map;

    //////////////////////////////////////////////////////////////////////////////////////////////
    //      define & init parameters for Selected Marker
    //////////////////////////////////////////////////////////////////////////////////////////////
    var selectedMarker = null;
    var selectedFeature = null;
    var tempMarker = null;
    var disableMarkerEdit = false;
    var selectedFwApproachWp = null;
    var selectedFwApproachSh = null;
    var lockShExclHeading = false;


    //////////////////////////////////////////////////////////////////////////////////////////////
    //      define & init parameters for default Settings
    //////////////////////////////////////////////////////////////////////////////////////////////



    //////////////////////////////////////////////////////////////////////////////////////////////
    //      define & init Waypoints parameters
    //////////////////////////////////////////////////////////////////////////////////////////////
    var mission = new WaypointCollection();

    //////////////////////////////////////////////////////////////////////////////////////////////
    //      define & init Multi Mission parameters
    //////////////////////////////////////////////////////////////////////////////////////////////
    var multimission = new WaypointCollection();
    var multimissionCount = 0;
    var maxMultimissionCount = 9;

    //////////////////////////////////////////////////////////////////////////////////////////////
    //      define & init home parameters
    //////////////////////////////////////////////////////////////////////////////////////////////
    var HOME = new Waypoint(0,0,0,0);
    var homeMarkers =[];    // layer for home point

    //////////////////////////////////////////////////////////////////////////////////////////////
    //      define & init Safehome parameters
    //////////////////////////////////////////////////////////////////////////////////////////////
    //var FC.SAFEHOMES = new SafehomeCollection(); // TO COMMENT FOR RELEASE : DECOMMENT FOR DEBUG
    //FC.SAFEHOMES.inflate(); // TO COMMENT FOR RELEASE : DECOMMENT FOR DEBUG
    //var safehomeRangeRadius = 200; //meters
    //var safehomeSafeRadius = 50; //meters

    /////////////////////////////////////////////
    //
    // Reinit Jquery Form
    //
    /////////////////////////////////////////////
    function clearEditForm() {
        $('#pointLat').val('');
        $('#pointLon').val('');
        $('#pointAlt').val('');
        $('#pointP1').val('');
        $('#pointP2').val('');
        $('#pointP3Alt').val('');
        $('#missionDistance').text(0);
        $('#MPeditPoint').fadeOut(300);
    }

    function clearFilename() {
        $('#missionFilename').text('');
    }

    /////////////////////////////////////////////
    //
    // Manage Settings
    //
    /////////////////////////////////////////////
    function loadSettings() {
        const missionPlannerSettings = store.get('missionPlannerSettings', false);
        if (missionPlannerSettings) {
            if (!missionPlannerSettings.fwApproachLength && settings.fwApproachLength) {
                missionPlannerSettings.fwApproachLength = settings.fwApproachLength;
                missionPlannerSettings.maxDistSH = settings.maxDistSH;
                missionPlannerSettings.fwLoiterRadius = settings.fwLoiterRadius;
            }
            saveSettings();
            settings = missionPlannerSettings;
        }
        refreshSettings();
    }

    function saveSettings() {
        store.set('missionPlannerSettings', settings);
    }

    function refreshSettings() {
        $('#MPdefaultPointAlt').val(String(settings.alt));
        $('#MPdefaultPointSpeed').val(String(settings.speed));
        $('#MPdefaultSafeRangeSH').val(String(settings.safeRadiusSH));
        $('#MPdefaultFwApproachAlt').val(String(settings.fwApproachAlt));
        $('#MPdefaultLandAlt').val(String(settings.fwLandAlt));
    }

    function closeSettingsPanel() {
        $('#missionPlannerSettings').hide();
    }

    /////////////////////////////////////////////
    //
    // Manage Safehome
    //
    /////////////////////////////////////////////
    function closeSafehomePanel() {
        $('#missionPlannerSafehome').hide();
        cleanSafehomeLayers();
    }

    async function checkApproachAltitude(altitude, isSeaLevelRef, sealevel) {

        if (altitude - (isSeaLevelRef ? sealevel * 100 : 0 ) < 0) {
            dialog.alert(i18n.getMessage('MissionPlannerAltitudeChangeReset'));
            return false;
        }

        return true;
    }

    function checkLandingAltitude(altitude, isSeaLevelRef, sealevel) {

        if (altitude - (isSeaLevelRef ? sealevel * 100 : 0 ) < MAX_NEG_FW_LAND_ALT) {
            dialog.alert(i18n.getMessage('MissionPlannerFwLAndingAltitudeChangeReset'));
            return false;
        }

        return true;
    }

    function updateSafehomeInfo(){
        let freeSamehomes = FC.SAFEHOMES.getMaxSafehomeCount() - FC.SAFEHOMES.safehomeCount()
        $('#availableSafehomes').text(freeSamehomes + '/' + FC.SAFEHOMES.getMaxSafehomeCount());
    }


    function renderSafehomesOnMap() {
        /*
         * Process safehome on Map
         */
        FC.SAFEHOMES.get().forEach(safehome => {
            addFwApproach(safehome.getLonMap(), safehome.getLatMap(), FC.FW_APPROACH.get()[safehome.getNumber()], safehomeMarkers);
        });
        FC.SAFEHOMES.get().forEach(safehome => {
            addSafehomeCircles(safehome);
            addSafeHomeMarker(safehome);
        });
    }

    function cleanSafehomeLayers() {
        for (var i in safehomeMarkers) {
            map.removeLayer(safehomeMarkers[i]);
        }
        safehomeMarkers = [];
    }

    function getSafehomeIcon(safehome) {
        /*
         * Process Safehome Icon
         */
        return new Style({
            image: new Icon(({
                anchor: [0.5, 1],
                opacity: 1,
                scale: 0.5,
                src: safehome.isUsed() ? icons['icon_safehome_used'] : icons['icon_safehome']
            })),
            text: new Text(({
                text: String(Number(safehome.getNumber())+1),
                font: '12px sans-serif',
                offsetY: -15,
                offsetX: -2,
                fill: new Fill({
                    color: '#FFFFFF'
                }),
                stroke: new Stroke({
                    color: '#FFFFFF'
                }),
            }))
        });
    }

    function paintApproachLine(pos1, pos2, color, layers)
    {
        var line = new LineString([fromLonLat([pos1.lon, pos1.lat]), fromLonLat([pos2.lon, pos2.lat])]);

        var feature = new Feature({
            geometry: line
        });

        var styles = [  new Style({
                stroke: new Stroke({
                    color: color,
                    width: 3,
                }),
            })
        ];

        var geometry = feature.getGeometry();
        geometry.forEachSegment(function (start, end) {
            var dx = end[0] - start[0];
            var dy = end[1] - start[1];
            var rotation = Math.atan2(dy, dx);

            styles.push(new Style({
              geometry: new Point(distanceOnLine(start, end, -8)),
              image: new RegularShape({
                fill: new Fill({color}),
                points: 3,
                radius: 8,
                rotation: -rotation,
                angle: Math.PI / 2 // rotate -90°
              })
            }));
        });

        feature.setStyle(styles);

        var vectorSource = new VectorSource({
                features: [feature]
        });


        var vectorLayer = new VectorLayer({
            source: vectorSource
        });



        vectorLayer.kind = "approachline";
        vectorLayer.selection = false;


        approachLayers.push(vectorLayer);

        approachLayers.push(vectorLayer);
        map.addLayer(vectorLayer);
        layers.push(vectorLayer);

        return vectorLayer;
    }

    function paintApproach(landCoord, approachLength, bearing, approachDirection, layers) {

        var pos1 = calculate_new_cooridatnes(landCoord, bearing, approachLength);
        let direction;
        if (approachDirection == ApproachDirection.LEFT) {
            direction = wrap_360(bearing + 90);
        } else {
            direction = wrap_360(bearing - 90);
        }

        var pos2 = calculate_new_cooridatnes(pos1, direction, Math.max(settings.fwLoiterRadius * 4, settings.fwApproachLength / 2));

        paintApproachLine(landCoord, pos2, '#0025a1', layers);
        paintApproachLine(pos2, pos1, '#0025a1', layers);
        paintApproachLine(pos1, landCoord, '#f78a05', layers);
    }

    function addFwApproach(lon, lat, fwApproach, layers)
    {
        if (fwApproach.getLandHeading1() != 0) {
            let bearing = wrap_360(Math.abs(fwApproach.getLandHeading1()) + 180);
            paintApproach({lat: lat, lon: lon}, settings.fwApproachLength, bearing, fwApproach.getApproachDirection(), layers);
        }

        if (fwApproach.getLandHeading1() > 0) {
            let direction = fwApproach.getApproachDirection() == ApproachDirection.LEFT ? ApproachDirection.RIGHT : ApproachDirection.LEFT;
            paintApproach({lat: lat, lon: lon}, settings.fwApproachLength, fwApproach.getLandHeading1(), direction, layers);
        }

        if (fwApproach.getLandHeading2() != 0) {
            let bearing = wrap_360(Math.abs(fwApproach.getLandHeading2()) + 180);
            paintApproach({lat: lat, lon: lon}, settings.fwApproachLength, bearing, fwApproach.getApproachDirection(), layers);
        }

        if (fwApproach.getLandHeading2() > 0) {
            let direction = fwApproach.getApproachDirection() == ApproachDirection.LEFT ? ApproachDirection.RIGHT : ApproachDirection.LEFT;
            paintApproach({lat: lat, lon: lon}, settings.fwApproachLength, fwApproach.getLandHeading2(), direction, layers);
        }
    }

    function addSafehomeCircles(safehome) {
        /*
         * add safehome on Map
         */
        let coord = fromLonLat([safehome.getLonMap(), safehome.getLatMap()]);
        var iconFeature = new Feature({
            geometry: new Point(coord),
            name: 'safehome'
        });

        //iconFeature.setStyle(getSafehomeIcon(safehome, safehome.isUsed()));

        let circleStyle = new Style({
            stroke: new Stroke({
                color: 'rgba(144, 12, 63, 0.5)',
                width: 3,
                lineDash : [10]
            }),
            // fill: new Fill({
                // color: 'rgba(251, 225, 155, 0.1)'
            // })
        });

        let circleSafeStyle = new Style({
            stroke: new Stroke({
                color: 'rgba(136, 204, 62, 1)',
                width: 3,
                lineDash : [10]
            }),
            /* fill: new Fill({
                color: 'rgba(136, 204, 62, 0.1)'
            }) */
        });

        var vectorLayer = new VectorLayer({
            source: new VectorSource({
                        features: [iconFeature]
                    }),
            style : function(iconFeature) {
                let styles = [getSafehomeIcon(safehome)];
                if (safehome.isUsed()) {
                    circleStyle.setGeometry(new Circle(iconFeature.getGeometry().getCoordinates(), getProjectedRadius(settings.maxDistSH)));
                    circleSafeStyle.setGeometry(new Circle(iconFeature.getGeometry().getCoordinates(), getProjectedRadius(Number(settings.safeRadiusSH))));
                    styles.push(circleSafeStyle);
                    styles.push(circleStyle);
                }
                return styles;
            }
        });

        vectorLayer.kind = "safehome";
        vectorLayer.number = safehome.getNumber();
        vectorLayer.selection = false;

        safehomeMarkers.push(vectorLayer);
        map.addLayer(vectorLayer);
    }

    function addSafeHomeMarker(safehome) {

        let coord = fromLonLat([safehome.getLonMap(), safehome.getLatMap()]);
        var iconFeature = new Feature({
            geometry: new Point(coord),
            name: 'safehome'
        });

        var vectorLayer = new VectorLayer({
            source: new VectorSource({
                        features: [iconFeature]
                    }),
            style : function(iconFeature) {
                return [getSafehomeIcon(safehome)];
            }
        });

        vectorLayer.kind = "safehome";
        vectorLayer.number = safehome.getNumber();
        vectorLayer.selection = true;

        safehomeMarkers.push(vectorLayer);
        map.addLayer(vectorLayer);
    }

    function getProjectedRadius(radius) {
        let projection = map.getView().getProjection();
        let resolutionAtEquator = map.getView().getResolution();
        let resolutionRate = resolutionAtEquator / getPointResolution(projection, resolutionAtEquator, map.getView().getCenter());
        let radiusProjected = (radius / METERS_PER_UNIT.m) * resolutionRate;
        return radiusProjected;
    }

    /////////////////////////////////////////////
    //
    // Manage Geozones
    //
    /////////////////////////////////////////////
    function getGeozoneIcon(geozone, number) {
    
        return new Style({
            image: new Icon(({
                anchor: [0.5, 1],
                opacity: 1,
                scale: 0.5,
                src: geozone.getType() == GeozoneType.EXCULSIVE ? icons['icon_geozone_excl'] : icons['icon_geozone_incl']
            })),
            text: new Text(({
                text: String(number + 1),
                font: '12px sans-serif',
                offsetY: -15,
                offsetX: -2,
                fill: new Fill({
                    color: '#FFFFFF'
                }),
                stroke: new Stroke({
                    color: '#FFFFFF'
                }),
            }))
        });
    }

    function addZoneVertex(zone, vertex) {
        
        let coord = fromLonLat([vertex.getLonMap(), vertex.getLatMap()]);
        var iconFeature = new Feature({
            geometry: new Point(coord),
            name: 'geozone'
        });
        
        var vectorLayer = new VectorLayer({
            source: new VectorSource({
                        features: [iconFeature]
                    }),
            style : function(iconFeature) {
                return [getGeozoneIcon(zone, zone.getShape() == GeozoneShapes.POLYGON ? vertex.getNumber() : zone.getNumber())];

            }
        });

        vectorLayer.kind = "geozone";
        vectorLayer.number = vertex.getNumber();
        vectorLayer.layerNumber = zone.getNumber();
        vectorLayer.selection = true;

        geozoneMarkers.push(vectorLayer);

        return vectorLayer;
    }

    function paintGeozoneLine(pos1, pos2, color, number, zoneNum)
    {
        var line = new LineString([pos1, pos2]);

        var feature = new Feature({
            geometry: line
        });

        feature.setStyle(
            new Style({
                stroke: new Stroke({
                    color: color,
                    width: 3,
                }),
                text: new Text({
                    text: String(zoneNum + 1),
                    font: '14px sans-serif',
                    placement : 'line',
                    textBaseline: 'ideographic',
                    stroke: new Stroke({
                        color: color
                    }),
                }),
            }),
        );

        
         var vectorSource = new VectorSource({
            features: [feature]
        });


        var vectorLayer = new VectorLayer({
            source: vectorSource
        });

        vectorLayer.kind = "geozoneline";
        vectorLayer.selection = true;
        vectorLayer.number = number;
        vectorLayer.layerNumber = zoneNum;

        geozoneLines.push(vectorLayer);
        map.addLayer(vectorLayer);
    }

    function repaintGeozoneLines() {
        cleanGeozoneLines();

        FC.GEOZONES.get().forEach(zone => {
            if (zone.getVerticesCount() != 0) {
                if (zone.getShape() == GeozoneShapes.CIRCULAR) {
                    var circleFeature = new Feature({
                        geometry: new Circle(fromLonLat([zone.getFirstVertex().getLonMap(), zone.getFirstVertex().getLatMap()]), getProjectedRadius(zone.getRadius() / 100)), 
                        name: "geozoneCircle",
                    });
                    
                    var vectorSource = new VectorSource();
                    vectorSource.addFeatures([circleFeature]);

                    var vectorLayer = new VectorLayer({
                        source: vectorSource,
                        style : [
                            new Style({
                                stroke: new Stroke({
                                    color: zone.getType() == GeozoneType.EXCULSIVE ? '#E62121' : '#1DBE0A',
                                    width: 3,
                                })
                            })
                        ],
                    });

                    vectorLayer.kind = "geozonecircle";
                    vectorLayer.selection = true;

                    geozoneLines.push(vectorLayer);
                    map.addLayer(vectorLayer);
                } else if (zone.getShape() == GeozoneShapes.POLYGON) {
                    var verticesCount = zone.getVerticesCount();
                    var prev = zone.getLastVertex();
                    var current;
                    for (let i = 0; i < verticesCount; i++) {
                        current = zone.getVertex(i);
                        let pos1 = fromLonLat([prev.getLonMap(), prev.getLatMap()]);
                        let pos2 = fromLonLat([current.getLonMap(), current.getLatMap()]);
                        paintGeozoneLine(pos1, pos2, zone.getType() == GeozoneType.EXCULSIVE ? '#E62121' : '#1DBE0A', prev.getNumber(), zone.getNumber());
                        prev = current;
                    }
                }
            }
        });
    }

    function renderGeozonesOnMap()
    {
        cleanGeozoneLayers();
        if (!selectedGeozone) {
            cleanGeozoneLines();
            geozoneWarning();
            return;
        }

        repaintGeozoneLines();
        FC.GEOZONES.get().forEach(zone => {
            if (zone.getVerticesCount() > 0) {
                zone.getVertices().forEach(vertex => {
                    map.addLayer(addZoneVertex(zone, vertex));
                });
            }
        });
        geozoneWarning();
    }

    function cleanGeozoneLines() {
        geozoneLines.forEach(line => {
            map.removeLayer(line);
        });
        geozoneLines = [];
    }

    function cleanGeozoneLayers() {
        geozoneMarkers.forEach(marker => {
            map.removeLayer(marker);
        });

        geozoneMarkers = [];
    }

    function geozoneWarning() {

        if (!isGeozoneEnabeld) {
            return;
        }

        if (markers.length >= 1 && geozoneMarkers.length >= 1) {
            $('#infoGeozoneMissionWarning').show();
        } else {
            $('#infoGeozoneMissionWarning').hide();
        }

        $('#geozoneInvalidContent').empty();
        invalidGeoZones = false;
        for (var i = 0; i < FC.GEOZONES.geozoneCount(); i++) {
            const zone = FC.GEOZONES.at(i);

            var reasons = []
            if (!zone.isCounterClockwise()) {
                reasons.push(i18n.getMessage("gezoneInvalidReasonNotCC"));
            }

            if (zone.isComplex()) {
                reasons.push(i18n.getMessage("gezoneInvalidReasonComplex"));
            }

            if (zone.getMaxAltitude() <= zone.getMinAltitude()) {
                reasons.push(i18n.getMessage("gezoneInvalidReasonMinMaxAlt"));
            }

            if (reasons.length > 0) {
                $('#geozoneInvalidContent').append(`<div style="display: inline-block">${i18n.getMessage("geozone")} ${zone.getNumber() + 1}: ${reasons.join(", ")}</div><br/>`);
                invalidGeoZones = true;
            }
        }

        if (invalidGeoZones) {
            $('#infoGeozoneInvalid').show();
        } else {
            $('#infoGeozoneInvalid').hide();
        }
    }

    function updateGeozoneInfo() {
        $('#availableGeozones').text((FC.GEOZONES.getMaxZones() - FC.GEOZONES.geozoneCount()) + '/' + FC.GEOZONES.getMaxZones());
        $('#availableVertices').text((FC.GEOZONES.getMaxVertices() - FC.GEOZONES.getUsedVerticesCount()) + '/' + FC.GEOZONES.getMaxVertices());
    }

    function addGeozone() {

        if (FC.GEOZONES.geozoneCount() + 1 > FC.GEOZONES.getMaxZones()) {
            dialog.alert(i18n.getMessage('missionGeozoneMaxZonesReached'));
            return;
        }

        if (FC.GEOZONES.getUsedVerticesCount() + 2 > FC.GEOZONES.getMaxVertices()) {
            dialog.alert(i18n.getMessage('missionGeozoneMaxVerticesReached'));
            return;
        }

        let mapCenter = map.getView().getCenter();
        let midLon = Math.round(toLonLat(mapCenter)[0] * 1e7);
        let midLat = Math.round(toLonLat(mapCenter)[1] * 1e7);        
        FC.GEOZONES.put(new Geozone(GeozoneType.INCLUSIVE, GeozoneShapes.CIRCULAR, 0, 10000, false, 20000, GeozoneFenceAction.NONE, [ new GeozoneVertex(0, midLat, midLon) ]));

        selectedGeozone = FC.GEOZONES.last();
        renderGeozoneOptions();
        renderGeozonesOnMap();
        updateGeozoneInfo();
    }

    /////////////////////////////////////////////
    //
    // Manage Take Off Home
    //
    /////////////////////////////////////////////
    function closeHomePanel() {
        $('#missionPlannerHome').hide();
        $('#missionPlannerElevation').hide();
        cleanHomeLayers();
    }

    function cleanHomeLayers() {
        for (var i in homeMarkers) {
            map.removeLayer(homeMarkers[i]);
        }
        homeMarkers = [];
    }

    function renderHomeTable() {
        /*
         * Process home table UI
         */

        $(".home-lat").val(HOME.getLatMap()).on('change', function () {
            HOME.setLat(Math.round(Number($(this).val()) * 10000000));
            cleanHomeLayers();
            renderHomeOnMap();
        });

        $(".home-lon").val(HOME.getLonMap()).on('change', function () {
            HOME.setLon(Math.round(Number($(this).val()) * 10000000));
            cleanHomeLayers();
            renderHomeOnMap();
        });

        if (HOME.getLatMap() == 0 && HOME.getLonMap() == 0) {
            HOME.setAlt("N/A");
        } else {
            (async () => {
                const elevationAtHome = await HOME.getElevation(globalSettings);
                $('#elevationValueAtHome').text(elevationAtHome+' m');
                HOME.setAlt(elevationAtHome);
            })()
        }
    }


    function renderHomeOnMap() {
        /*
         * Process home on Map
         */
        map.addLayer(addHomeMarker(HOME));
    }

    function addHomeMarker(home) {
        /*
         * add safehome on Map
         */
        let coord = fromLonLat([home.getLonMap(), home.getLatMap()]);
        var iconFeature = new Feature({
            geometry: new Point(coord),
            name: 'home'
        });

        //iconFeature.setStyle(getSafehomeIcon(safehome, safehome.isUsed()));

        var vectorLayer = new VectorLayer({
            source: new VectorSource({
                        features: [iconFeature]
                    }),
            style : function(iconFeature) {
                let styles = [getHomeIcon(home)];
                return styles;
            }
        });

        vectorLayer.kind = "home";
        vectorLayer.number = home.getNumber();
        vectorLayer.selection = false;

        homeMarkers.push(vectorLayer);

        return vectorLayer;
    }

    function getHomeIcon(home) {
        /*
         * Process Safehome Icon
         */
        return new Style({
            image: new Icon(({
                anchor: [0.5, 1],
                opacity: 1,
                scale: 0.5,
                src: icons['icon_home']
            })),
        });
    }

    function updateHome() {
        renderHomeTable();
        cleanHomeLayers();
        renderHomeOnMap();
        plotElevation();
    }

    /////////////////////////////////////////////
    //
    // Manage Multi Mission
    //
    /////////////////////////////////////////////
    /* Multi Mission working method:
     * 'multimission' waypoint collection is a repository for all multi missions.
     * 'mission' WP collection remains as the WP source for the map display.
     * All missions can be displayed on the map or only a single mission. With all missions displayed 'mission' and
     * 'multimission' are copies containing all missions. When a single mission is displayed 'multimission' contains all
     * missions except the currently displayed mission.
     * On update to display all missions the current dislayed mission is merged back into 'multimission' and 'mission'
     * updated as a copy of 'multimission'.
     * When all missions are displayed WP data can be viewed but mission edit is disabled.
     * Mission WPs can be edited only when a single mission is loaded on the map. */

    var startWPCount = 0;

    function renderMultimissionTable() {
        $('#multimissionOptionList').prop('options').length = 1;
        for (var i = 1; i <= multimissionCount; i++) {
            $('#multimissionOptionList').append($('<option>', {value: i, text: i}));
        }
        updateMultimissionState();
        $('#activeNissionIndex').text(1);
    }

    function updateMultimissionState() {
        setMultimissionEditControl(false);
        if (!mission.isEmpty() || multimissionCount) {
            if ((!multimissionCount || (multimissionCount && !mission.isEmpty())) && multimissionCount < maxMultimissionCount) {
                $("#addMultimissionButton").removeClass('disabled');
            } else {
                $("#addMultimissionButton").addClass('disabled');
            }
            if (multimissionCount) {
                let totalmultimissionWPs;
                if (singleMissionActive()) {
                    totalmultimissionWPs = multimission.get().length + mission.get().length;
                    $("#updateMultimissionButton").removeClass('disabled');
                    $("#setActiveMissionButton").removeClass('disabled');
                    $('#missionPlannerElevation').show();
                } else {
                    $('#missionDistance').text('N/A');
                    totalmultimissionWPs = mission.get().length;
                    $("#editMission").show();
                    $("#updateMultimissionButton").addClass('disabled');
                    $("#setActiveMissionButton").addClass('disabled');
                    $('#missionPlannerElevation').hide();
                    setMultimissionEditControl(true);
                }
                $('#multimissionInfo').text(multimissionCount + ' missions (' + totalmultimissionWPs + '/' + mission.getMaxWaypoints() + ' WPs)');
                document.getElementById('multimissionInfo').style.color = totalmultimissionWPs > mission.getMaxWaypoints() ? "#FF0000" : "#303030";
            } else {
                $('#cancelMultimission').trigger('click');
                $('#multimissionInfo').text('No multi missions loaded');
                $("#updateMultimissionButton").addClass('disabled');
                $("#setActiveMissionButton").addClass('disabled');
            }
        } else {
            $("#addMultimissionButton").addClass('disabled');
            $("#setActiveMissionButton").addClass('disabled');
        }
        updateTotalInfo();
    }

    // /* checks if single mission loaded on map */
    function singleMissionActive() {
        return !multimissionCount || Number($('#multimissionOptionList').val());
    }

    function updateAllMultimission(missionDelete = false, newMission = false) {
        // flag if new MM mission empty on update
        let missionIsEmptyOnUpdate = mission.isEmpty() ? true : false;

        /* copy active single mission into MM on update so MM contains all missions.
         * active mission may be deleted by not copying back into MM on update */
        var i = startWPCount;
        if (!missionDelete) {
            mission.get().forEach(function (element) {
                multimission.get().splice(i, 0, element);
                i++;
            });
        }

        i = 0;
        multimission.get().forEach(function (element) {     // renumber MM WPs
            element.setNumber(i);
            i++;
        });
        multimission.update(false);
        // multimission.missionDisplayDebug();

        // if new mission added no need to redraw so return
        if (newMission) return;

        mission.reinit();
        mission.copy(multimission);
        mission.update(false);
        // mission.missionDisplayDebug();

        /* Remove empty missions on update.
         * Cancel MM if only 2 MM missions loaded and one mission is empty */
        if (missionIsEmptyOnUpdate) {
            multimissionCount -= multimissionCount == 2 ? 2 : 1;
            if (!multimissionCount) {
                multimissionCount = 0;
                multimission.flush();
            }
            renderMultimissionTable();
        }

        selectedMarker = null;
        clearEditForm();
        setView(14);
        refreshLayers();
        updateTotalInfo();
    }

    /* selects single mission from MM repository */
    function editMultimission() {
        var MMCount = 0;
        var endWPCount = 0;
        var found = false;
        startWPCount = 0;

        mission.get().forEach(function (element) {
            if (element.getEndMission() == 0xA5 && !found) {
                MMCount ++;
                endWPCount = element.getNumber();
                if (MMCount == Number($('#multimissionOptionList').val())) {
                    found = true;
                } else {
                    startWPCount = endWPCount + 1;
                }
            }
        });

        mission.reinit();
        var tempMissionData = multimission.get().slice(startWPCount, endWPCount + 1);   // copy selected single mission from MM
        let i = 0;
        tempMissionData.forEach(function (element) {    // write mission copy to active map mission
            mission.put(element);
            mission.get()[i].setNumber(i);
            i++;
        });
        mission.setMaxWaypoints(multimission.getMaxWaypoints());
        multimission.get().splice(startWPCount, (endWPCount - startWPCount + 1))    // cut current active map mission from MM

        mission.update();
        updateMultimissionState();

        selectedMarker = null;
        clearEditForm();
        setView(14);
        refreshLayers();
        updateTotalInfo();
        plotElevation();
    }

    /* single mission selection using WP Edit panel button */
    function mapSelectEditMultimission(WPNumber) {
        let MMCount = 1;

        mission.get().forEach(function (element) {
            if (element.getEndMission() == 0xA5 && element.getNumber() < WPNumber) {
                MMCount ++;
            }
        });
        $('#multimissionOptionList').val(MMCount).trigger('change');
    }

    function deleteMultimission() {
        updateAllMultimission(true);
        multimissionCount -= multimissionCount == 2 ? 2 : 1;
        if (!multimissionCount) {
            multimission.flush();
        }
        renderMultimissionTable();
    }

    function addMultimission() {
        if (singleMissionActive() || !multimissionCount) {
            updateAllMultimission(false, true);
        }
        multimissionCount += !multimissionCount ? 2 : 1;
        renderMultimissionTable();
        $('#multimissionOptionList').val(multimissionCount);

        removeAllWaypoints();
        startWPCount = multimission.get().length;

        updateMultimissionState();
    }

    function removeAllMultiMissionCheck() {
        if (!multimissionCount) {
            return true;
        } else if (singleMissionActive()) {
            deleteMultimission();
            return false;
        }

        multimissionCount = 0;
        multimission.flush();
        renderMultimissionTable();
        return true;
    }

    function fileLoadMultiMissionCheck() {
        if (singleMissionActive()) {
            return true;
        } else if (dialog.confirm(i18n.getMessage('confirm_overwrite_multimission_file_load_option'))) {
            var options = {
                filters: [ { name: "Mission file", extensions: ['mission'] } ]
            };
            dialog.showOpenDialog(options).then(result => {
                if (result.canceled) {
                    console.log('No file selected');
                    return;
                }

                if (result.filePaths.length == 1) {
                    loadMissionFile(result.filePaths[0]);
                    multimissionCount = 0;
                    multimission.flush();
                    renderMultimissionTable();
                }
            });
        }
        return false;
    }

    /* disable mission/WP edit when all missions displayed on map, true = edit disabled */
    function setMultimissionEditControl(enabled = true) {
        disableMarkerEdit = enabled;
        $("*", "#MPeditPoint").prop('disabled',enabled);
        if (enabled) {
            $("#addOptionsPointButton").addClass('disabled');
            $("#removePointButton").addClass('disabled');
            $("#waypointOptionsTableBody").fadeOut();
        } else {
            $("#addOptionsPointButton").removeClass('disabled');
            $("#removePointButton").removeClass('disabled');
            $("#waypointOptionsTableBody").fadeIn();
        }
    }

    /////////////////////////////////////////////
    //
    // Manage Waypoint
    //
    /////////////////////////////////////////////

    function removeAllWaypoints() {
        mission.reinit();
        refreshLayers();
        clearEditForm();
        updateTotalInfo();
        clearFilename();
    }

    function addWaypointMarker(waypoint, isEdit=false) {
        let coord = fromLonLat([waypoint.getLonMap(), waypoint.getLatMap()]);
        var iconFeature = new Feature({
            geometry: new Point(coord),
            name: 'Null Island',
            population: 4000,
            rainfall: 500
        });
        iconFeature.setStyle(getWaypointIcon(waypoint, isEdit));
        var vectorSource = new VectorSource({
            features: [iconFeature]
        });

        var vectorLayer = new VectorLayer({
            source: vectorSource
        });

        vectorLayer.kind = "waypoint";
        vectorLayer.number = waypoint.getNumber();
        vectorLayer.layerNumber = waypoint.getLayerNumber();

        markers.push(vectorLayer);

        return vectorLayer;
    }

    function getWaypointIcon(waypoint, isEdit) {
        var dictofPointIcon = {
            1:    'WP',
            2:    'PH',
            3:    'PH',
            5:    'POI',
            8:    'LDG'
        };

        return new Style({
            image: new Icon(({
                anchor: [0.5, 1],
                opacity: 1,
                scale: 0.5,
                src: icons['icon_position' + (dictofPointIcon[waypoint.getAction()] != '' ? '_' + dictofPointIcon[waypoint.getAction()] : '') + (isEdit ? '_edit' : '')]
            })),
            text: new Text(({
                text: String(Number(waypoint.getLayerNumber()+1)),
                font: '12px sans-serif',
                offsetY: -15,
                offsetX: -2,
                fill: new Fill({
                    color: '#FFFFFF'
                }),
                stroke: new Stroke({
                    color: '#FFFFFF'
                }),
            }))
        });
    }

    function repaintLine4Waypoints(mission) {
        let oldPos,
            oldAction,
            poiList = [],
            oldHeading,
            multiMissionWPNum = 0;
        let activatePoi = false;
        let activateHead = false;
        $('#missionDistance').text(0);
        cleanLines();
        mission.get().forEach(function (element) {
            if (!element.isAttached()) {
                let coord = fromLonLat([element.getLonMap(), element.getLatMap()]);
                if (element.getAction() == 5) {
                    // If action is Set_POI, increment counter of POI
                    poiList.push(element.getNumber());
                    activatePoi = true;
                    activateHead = false;
                }
                else {
                    // If classic WPs, draw standard line in-between
                    if (typeof oldPos !== 'undefined' && activatePoi != true && activateHead != true){
                        paintLine(oldPos, coord, element.getNumber());
                    }
                    // If one is POI, draw orange line in-between and modulate dashline each time a new POI is defined
                    else if (typeof oldPos !== 'undefined' && activatePoi == true && activateHead != true) {
                        if ((poiList.length % 2) == 0) {
                            paintLine(oldPos, coord, element.getNumber(), '#ffb725', 5);
                        }
                        else {
                            paintLine(oldPos, coord, element.getNumber(), '#ffb725');
                        }
                    }
                    // If one is SET_HEAD, draw labelled line in-between with heading value
                    else if (typeof oldPos !== 'undefined' && activatePoi != true && activateHead == true) {
                        paintLine(oldPos, coord, element.getNumber(), '#1497f1', 0, String(oldHeading)+"°");
                    }

                    if (element.getEndMission() == 0xA5) {
                        oldPos = 'undefined';
                        activatePoi = false;
                        activateHead = false;
                        multiMissionWPNum = element.getNumber() + 1;
                    } else {
                        oldPos = coord;
                    }
                }
            }
            else if (element.isAttached()) {
                if (element.getAction() == MWNP.WPTYPE.JUMP) {
                    let jumpWPIndex = multiMissionWPNum + element.getP1();
                    let coord = fromLonLat([mission.getWaypoint(jumpWPIndex).getLonMap(), mission.getWaypoint(jumpWPIndex).getLatMap()]);
                    paintLine(oldPos, coord, element.getNumber(), '#e935d6', 5, "Repeat x"+(element.getP2() == -1 ? " infinite" : String(element.getP2())), false, true);
                }
                // If classic WPs is defined with a heading = -1, change Boolean for POI to false. If it is defined with a value different from -1, activate Heading boolean
                else if (element.getAction() == MWNP.WPTYPE.SET_HEAD) {
                    if (element.getP1() == -1) {
                        activatePoi = false;
                        activateHead = false;
                        oldHeading = 'undefined'
                    }
                    else if (typeof element.getP1() != 'undefined' && element.getP1() != -1) {
                        activatePoi = false;
                        activateHead = true;
                        oldHeading = String(element.getP1());
                    }
                }

                if (element.getEndMission() == 0xA5) {
                    oldPos = 'undefined';
                    activatePoi = false;
                    activateHead = false;
                    multiMissionWPNum = element.getNumber() + 1;
                }
            }
            if (element.getAction() == MWNP.WPTYPE.LAND) {
                addFwApproach(element.getLonMap(), element.getLatMap(), FC.FW_APPROACH.get()[FC.SAFEHOMES.getMaxSafehomeCount() + element.getMultiMissionIdx()], lines);
            }
        });
        //reset text position
        if (textGeom) {
            textGeom.setCoordinates(map.getCoordinateFromPixel([0,0]));
        }
        let lengthMission = mission.getDistance(true);

        if (disableMarkerEdit) {
            $('#missionDistance').text('N/A');
        } else {
            if (lengthMission.length >= 1) {
                $('#missionDistance').text(lengthMission[lengthMission.length -1].toFixed(1));
            } else {
                $('#missionDistance').text('infinite');
            }
        }
    }

    function paintLine(pos1, pos2, pos2ID, color='#1497f1', lineDash=0, lineText="", selection=true, arrow=false) {
        var line = new LineString([pos1, pos2]);

        var feature = new Feature({
            geometry: line
        });

        feature.setStyle(
            new Style({
                stroke: new Stroke({
                    color: color,
                    width: 3,
                    lineDash: [lineDash]
                }),
                text: new Text({
                    text: lineText,
                    font: '14px sans-serif',
                    placement : 'line',
                    textBaseline: 'ideographic',
                    stroke: new Stroke({
                        color: color
                    }),
                }),
            }),
        );

        if (arrow) {
            let dx = pos2[0] - pos1[0];
            let dy = pos2[1] - pos1[1];
            let rotation = Math.atan2(dx, dy);
            var featureArrow = new Feature({
                geometry: new Point([pos1[0]+dx/2, pos1[1]+dy/2])
            });
            featureArrow.setStyle(
                new Style({
                    image: new Icon({
                        src: icons['icon_arrow'],
                        scale: 0.3,
                        anchor: [0.5, 0.5],
                        rotateWithView: true,
                        rotation: rotation,
                    }),
                })
            );
        }

        if (arrow) {
            var vectorSource = new VectorSource({
                features: [feature, featureArrow]
            });
        }
        else {
            var vectorSource = new VectorSource({
                features: [feature]
            });
        }

        var vectorLayer = new VectorLayer({
            source: vectorSource
        });

        vectorLayer.kind = "line";
        vectorLayer.selection = selection;
        vectorLayer.number = pos2ID;

        lines.push(vectorLayer);

        map.addLayer(vectorLayer);
    }

    function refreshLayers() {
        cleanLayers();
        redrawLayers();
    }

    function cleanLayers() {
        for (var i in lines) {
            map.removeLayer(lines[i]);
        }
        lines = [];

        for (var i in markers) {
            map.removeLayer(markers[i]);
        }
        markers = [];
    }

    function cleanLines() {
        for (var i in lines) {
            map.removeLayer(lines[i]);
        }
        lines = [];
    }

    function redrawLayers() {
        if (!mission.isEmpty()) {
            repaintLine4Waypoints(mission);
            mission.get().forEach(function (element) {
                if (!element.isAttached()) {
                    map.addLayer(addWaypointMarker(element));
                }
            });

        }

        if (!isOffline) geozoneWarning();
    }

    function redrawLayer() {
        repaintLine4Waypoints(mission);
        if (selectedFeature && selectedMarker) {
            selectedFeature.setStyle(getWaypointIcon(selectedMarker, true));
        }
    }

    function renderSafeHomeOptions()  {
        if (selectedSafehome && selectedFwApproachSh) {

            lockShExclHeading = true;
            if (!$('#missionPlannerSafehome').is(':visible')) {
                $('#missionPlannerSafehome').fadeIn(300);
            }

            $('#SafehomeContentBox').show();

            if (selectedFwApproachSh.getLandHeading1() == 0 && selectedFwApproachSh.getLandHeading1() == 0 && selectedFwApproachSh.getApproachAltAsl() == 0 && selectedFwApproachSh.getLandAltAsl() == 0) {
                selectedFwApproachSh.setApproachAltAsl(settings.fwApproachAlt * 100);
                selectedFwApproachSh.setLandAltAsl(settings.fwLandAlt * 100);
            }

            if (selectedFwApproachSh.getElevation() == 0) {
                (async () => {
                    const elevation = await selectedFwApproachSh.getElevationFromServer(selectedSafehome.getLonMap(), selectedSafehome.getLatMap(), globalSettings) * 100;
                    selectedFwApproachSh.setElevation(elevation);
                    $('#safehomeElevation').text(selectedFwApproachSh.getElevation() / 100 + " m");
                })();
            }

            const $safehomeBox = $safehomeContentBox.find('.missionPlannerSafehomeBox:last-child');
            $safehomeBox.find('.spacer_box_title').text(i18n.getMessage('safehomeEdit') + ' '  + (selectedSafehome.getNumber() + 1));

            $('#safehomeLatitude').val(selectedSafehome.getLatMap());
            $('#safehomeLongitude').val(selectedSafehome.getLonMap());
            changeSwitch($('#safehomeSeaLevelRef'), selectedFwApproachSh.getIsSeaLevelRef());
            $('#safehomeApproachAlt').val(selectedFwApproachSh.getApproachAltAsl());
            $('#safehomeLandAlt').val(selectedFwApproachSh.getLandAltAsl());
            $('#geozoneApproachDirection').val(selectedFwApproachSh.getApproachDirection());
            $('#safehomeLandHeading1').val(Math.abs(selectedFwApproachSh.getLandHeading1()));
            changeSwitch($('#safehomeLandHeading1Excl'), selectedFwApproachSh.getLandHeading1() < 0);
            $('#safehomeLandHeading2').val(Math.abs(selectedFwApproachSh.getLandHeading2()));
            changeSwitch($('#safehomeLandHeading2Excl'), selectedFwApproachSh.getLandHeading2() < 0);
            $('#safehomeLandAltM').text(selectedFwApproachSh.getLandAltAsl() / 100 + " m");
            $('#safehomeApproachAltM').text(selectedFwApproachSh.getApproachAltAsl() / 100 + " m");
            lockShExclHeading = false;
        } else {
            $('#SafehomeContentBox').hide();
        }
    }

    function renderGeozoneOptions() {
        if (selectedGeozone) {
            if (!$('#missionPlannerGeozones').is(':visible')) {
                $('#missionPlannerGeozones').fadeIn(300);
            }

            $('#geozoneContentBox').show();
            const $geozonContent = $geozoneContent.find('.missionPlannerGeozone:last-child');
            $geozonContent.find('.spacer_box_title').text(i18n.getMessage('missionGeozoneEdit', selectedGeozone.getNumber() + 1));

            $('#geozoneShape').val(selectedGeozone.getShape());
            $('#geozoneType').val(selectedGeozone.getType());
            $('#geozoneMinAlt').val(selectedGeozone.getMinAltitude());
            $('#geozoneMaxAlt').val(selectedGeozone.getMaxAltitude());
            $('#geozoneMinAltM').text(selectedGeozone.getMinAltitude() / 100 + " m");
            $('#geozoneMaxAltM').text(selectedGeozone.getMaxAltitude()  / 100 + " m");
            changeSwitch($('#geozoneSeaLevelRef'), selectedGeozone.getSealevelRef());
            $('#geozoneAction').val(selectedGeozone.getFenceAction());
            $('#geozoneRadius').val(selectedGeozone.getRadius);
            if (selectedGeozone.getShape() == GeozoneShapes.CIRCULAR) {
                $('#geozoneRadius').prop('disabled', false);
            } else {
                $('#geozoneRadius').prop('disabled', true);
            }

            let $verticesTable = $('#geozoneVerticesTableBody');
            $verticesTable.empty();
            selectedGeozone.getVertices().forEach(vertex => {
                $verticesTable.append('\
                    <tr> \
                        <td> \
                            <div class="btnTable btnTableIcon"> \
                                <a class="ic_removeAll" id="removeVertex" href="#"  title="Remove"></a> \
                            </div>\
                        </td> \
                        <td> \
                            <span class="vertexNumber"></span> \
                        </td> \
                        <td> \
                            <input type="number" step="0.0000001" class="vertexLat"/> \
                        </td> \
                        <td> \
                            <input type="number" step="0.0000001" class="vertexLon"/> \
                        </td> \
                    </tr> \
                ');
                const $row = $verticesTable.find('tr:last');
                $row.find('.vertexNumber').text(vertex.getNumber() + 1);

                $row.find('.vertexLat')
                    .val((vertex.getLatMap())
                    .toLocaleString(['en-US'], {minimumFractionDigits: 7}))
                    .on('change', event => {
                        const lat = $(event.currentTarget).val();
                        if (isNaN(lat) || lat < -90 || lat > 90) {
                            dialog.alert(i18n.getMessage("geozoneInvalidLat"));
                            $(event.currentTarget).val(vertex.getLatMap());
                            return;
                        }
                        vertex.setLat(lat * 1e7);
                        renderGeozoneOptions();
                        renderGeozonesOnMap();
                        updateGeozoneInfo();

                });

                $row.find('.vertexLon')
                    .val((vertex.getLonMap())
                    .toLocaleString(['en-US'], {minimumFractionDigits: 7}))
                    .on('change', event => {
                        const lat = $(event.currentTarget).val();
                        if (isNaN(lat) || lat < -180 || lat > 180) {
                            dialog.alert(i18n.getMessage("geozoneInvalidLon"));
                            $(event.currentTarget).val(vertex.getLonMap());
                            return;
                        }
                        vertex.setLon(lat * 1e7);
                        renderGeozoneOptions();
                        renderGeozonesOnMap();
                        updateGeozoneInfo();
                });

                $row.find('#removeVertex').on('click', event => {
                    if (selectedGeozone.getVerticesCount() > 3) {
                        selectedGeozone.dropVertex(vertex.getNumber());
                        renderGeozoneOptions();
                        renderGeozonesOnMap();
                        updateGeozoneInfo();
                    }
                });
            });
            geozoneWarning();
        } else  {
            $('#geozoneContentBox').hide();
        }
    }

    function renderWaypointOptionsTable(waypoint) {
        /*
         * Process Waypoint Options table UI
         */
        $waypointOptionsTableBody.empty();
        mission.getAttachedFromWaypoint(waypoint).forEach(function (element) {
            $waypointOptionsTableBody.append('\
                <tr>\
                <td><div id="deleteOptionsPoint" class="btnTable btnTableIcon btnTable-danger"> \
                        <a class="ic_cancel" data-role="waypointOptions-delete" href="#" style="float: center" title="Delete"></a> \
                    </div>\
                </td> \
                <td><span class="waypointOptions-number"/></td>\
                <td><select class="waypointOptions-action"></select></td>\
                <td><input type="number" class="waypointOptions-p1" /></td>\
                <td><input type="number" class="waypointOptions-p2" /></td>\
                </tr>\
            ');

            const $row = $waypointOptionsTableBody.find('tr:last');

            for (var i = 1; i <= 3; i++) {
                if (dictOfLabelParameterPoint[element.getAction()]['parameter'+String(i)] != '') {
                    $row.find(".waypointOptions-p"+String(i)).prop("disabled", false);
                    $row.find(".waypointOptions-p"+String(i)).prop("title", dictOfLabelParameterPoint[element.getAction()]['parameter'+String(i)]);
                }
                else {
                    $row.find(".waypointOptions-p"+String(i)).prop("disabled", true);
                    $row.find(".waypointOptions-p"+String(i)).prop("title", "");
                }
            }

            GUI.fillSelect($row.find(".waypointOptions-action"), waypointOptions, waypointOptions.indexOf(MWNP.WPTYPE.REV[element.getAction()]));

            $row.find(".waypointOptions-action").val(waypointOptions.indexOf(MWNP.WPTYPE.REV[element.getAction()])).on('change', function () {
                element.setAction(MWNP.WPTYPE[waypointOptions[$(this).val()]]);
                let P1Value = 0;
                if (waypointOptions[$(this).val()] == "JUMP") {
                    P1Value = 1;
                } else if (waypointOptions[$(this).val()] == "RTH" && !isOffline) {
                    if (FC.isMultirotor()) P1Value = 1;
                }
                $row.find(".waypointOptions-p1").val(P1Value);
                element.setP1(P1Value);

                for (var i = 1; i <= 3; i++) {
                    if (dictOfLabelParameterPoint[element.getAction()]['parameter'+String(i)] != '') {
                        $row.find(".waypointOptions-p"+String(i)).prop("disabled", false);
                        $row.find(".waypointOptions-p"+String(i)).prop("title", dictOfLabelParameterPoint[element.getAction()]['parameter'+String(i)]);
                    }
                    else {
                        $row.find(".waypointOptions-p"+String(i)).prop("disabled", true);
                        $row.find(".waypointOptions-p"+String(i)).prop("title", "");
                    }
                }
                mission.updateWaypoint(element);
                cleanLines();
                redrawLayer();
            });

            $row.find(".waypointOptions-number").text(element.getAttachedNumber()+1);

            $row.find(".waypointOptions-p1").val((MWNP.WPTYPE.REV[element.getAction()] == "JUMP" ? mission.convertWaypointToJumpNumber(element.getP1()) + 1 : element.getP1())).on('change', function () {
                if (MWNP.WPTYPE.REV[element.getAction()] == "SET_HEAD") {
                    if ($(this).val() >= 360 || ($(this).val() < 0 && $(this).val() != -1))
                    {
                      $(this).val(-1);
                      dialog.alert(i18n.getMessage('MissionPlannerHeadSettingsCheck'));
                    }
                }
                else if (MWNP.WPTYPE.REV[element.getAction()] == "RTH") {
                    if ($(this).val() != 0 && $(this).val() != 1)
                    {
                      $(this).val(0);
                      dialog.alert(i18n.getMessage('MissionPlannerRTHSettingsCheck'));
                    }
                }
                else if (MWNP.WPTYPE.REV[element.getAction()] == "JUMP") {
                    if ($(this).val() > mission.getNonAttachedList().length || $(this).val() < 1)
                    {
                      $(this).val(1);
                      GUI.alert(i18n.getMessage('MissionPlannerJumpSettingsCheck'));
                    }
                    else if (mission.getPoiList().length != 0 && mission.getPoiList()) {
                        if (mission.getPoiList().includes(mission.convertJumpNumberToWaypoint(Number($(this).val())-1))) {
                            $(this).val(1);
                            dialog.alert(i18n.getMessage('MissionPlannerJump3SettingsCheck'));
                        }
                    }
                }
                element.setP1((MWNP.WPTYPE.REV[element.getAction()] == "JUMP" ? mission.convertJumpNumberToWaypoint(Number($(this).val())-1) : Number($(this).val())));
                mission.updateWaypoint(element);
                cleanLines();
                redrawLayer();
            });

            $row.find(".waypointOptions-p2").val(element.getP2()).on('change', function () {
                if (MWNP.WPTYPE.REV[element.getAction()] == "JUMP") {
                    if ($(this).val() > 10 || ($(this).val() < 0 && $(this).val() != -1))
                    {
                      $(this).val(0);
                      dialog.alert(i18n.getMessage('MissionPlannerJump2SettingsCheck'));
                    }
                }
                element.setP2(Number($(this).val()));
                mission.updateWaypoint(element);
                cleanLines();
                redrawLayer();
            });

            $row.find("[data-role='waypointOptions-delete']").attr("data-index", element.getAttachedNumber()+1);

        });
        GUI.switchery();
        i18n.localize();;
        return waypoint;
    }

    function setView(zoom) {
        var coord = fromLonLat([mission.getWaypoint(0).getLonMap(), mission.getWaypoint(0).getLatMap()]);
        map.getView().setCenter(coord);
        map.getView().setZoom(zoom);
    }

    /////////////////////////////////////////////
    //
    // Manage Map construction
    //
    /////////////////////////////////////////////
    function initMap() {
        var app = {};

        //////////////////////////////////////////////////////////////////////////////////////////////
        //      Drag behavior definition
        //////////////////////////////////////////////////////////////////////////////////////////////

        class Drag extends PointerInteraction {
            constructor() {
                super ({
                    handleDownEvent: (evt) => app.handleDownEvent(evt),
                    handleDragEvent: (evt) => app.handleDragEvent(evt),
                    handleMoveEvent: (evt) => app.handleMoveEvent(evt),
                    handleUpEvent: (evt) => app.handleUpEvent(evt)
                });

                this.coordinate_ = null;
                this.cursor_ = 'pointer';
                this.feature_ = null;
                this.previousCursor_ = undefined;
            }
        }

        app.ConvertCentimetersToMeters = function (val) {
            return parseInt(val) / 100;
        };

        class PlannerSettingsControl extends Control {
            
            constructor(opt_options) {
                var options = opt_options || {};
                var button = document.createElement('button');

                button.innerHTML = ' ';
                button.style = `background: url("${icons['settings_white']}") no-repeat 1px -1px;background-color: rgba(0,60,136,.5);`;
                

                var handleShowSettings = function () {
                    $('#missionPlannerSettings').fadeIn(300);
                };

                button.addEventListener('click', handleShowSettings, false);
                button.addEventListener('touchstart', handleShowSettings, false);

                var element = document.createElement('div');
                element.className = 'mission-control-settings ol-unselectable ol-control';
                element.appendChild(button);
                element.title = 'MP Settings';

                super({
                    element: element,
                    target: options.target
                })
            }
        };

        class PlannerSafehomeControl extends Control {
            
            constructor(opt_options) {
                var options = opt_options || {};
                var button = document.createElement('button');

                button.innerHTML = ' ';
                button.style = `background: url("${icons['icon_safehome_white']}") no-repeat 1px -1px;background-color: rgba(0,60,136,.5);`;
                
                var handleShowSafehome = function () {
                    $('#missionPlannerSafehome').fadeIn(300);
                    cleanSafehomeLayers();
                    renderSafehomesOnMap();
                    $('#safeHomeMaxDistance').text(settings.maxDistSH);
                    $('#SafeHomeSafeDistance').text(settings.safeRadiusSH);
                };

                button.addEventListener('click', handleShowSafehome, false);
                button.addEventListener('touchstart', handleShowSafehome, false);

                var element = document.createElement('div');
                element.className = 'mission-control-safehome ol-unselectable ol-control';
                element.appendChild(button);
                element.title = 'MP Safehome';

                super({
                    element: element,
                    target: options.target
                });
            }
        };

        class GeozonesControl extends Control {
            
            constructor(opt_options) {
                var options = opt_options || {};
                var button = document.createElement('button');

                button.innerHTML = ' ';
                button.style = `background: url("${icons['icon_geozone_white']}") no-repeat 1px -1px;background-color: rgba(0,60,136,.5);`;
                
                var handleShowGeozoneSettings = function () {
                    $('#missionPlannerGeozones').fadeIn(300);
                    if (!selectedGeozone) {
                        selectedGeozone = FC.GEOZONES.first();
                    } 
                    renderGeozoneOptions();
                    renderGeozonesOnMap();
                };

                button.addEventListener('click', handleShowGeozoneSettings, false);
                button.addEventListener('touchstart', handleShowGeozoneSettings, false);

                var element = document.createElement('div');
                element.className = 'geozone-settings ol-unselectable ol-control';
                element.appendChild(button);
                element.title = 'Geozone';

                super({
                    element: element,
                    target: options.target
                });
            }
        };

        class PlannerElevationControl extends Control {
            
            constructor(opt_options) {
                var options = opt_options || {};
                var button = document.createElement('button');

                button.innerHTML = ' ';
                button.style = `background: url("${icons['icon_elevation_white']}") no-repeat 1px -1px;background-color: rgba(0,60,136,.5);`;

                var handleShowSettings = function () {
                    $('#missionPlannerHome').fadeIn(300);
                    cleanHomeLayers();
                    renderHomeTable();
                    renderHomeOnMap();
                    $('#missionPlannerElevation').fadeIn(300);
                    plotElevation();
                };

                button.addEventListener('click', handleShowSettings, false);
                button.addEventListener('touchstart', handleShowSettings, false);

                var element = document.createElement('div');
                element.className = 'mission-control-elevation ol-unselectable ol-control';
                element.appendChild(button);
                element.title = 'MP Elevation';

                super({
                    element: element,
                    target: options.target
                });
            }
        };

        class PlannerMultiMissionControl extends Control {

            constructor(opt_options) {
                var options = opt_options || {};
                var button = document.createElement('button');

                button.innerHTML = ' ';
                button.style = `background: url("${icons['icon_multimission_white']}") no-repeat 1px -1px;background-color: rgba(0,60,136,.5);`;

                var handleShowSettings = function () {
                    $('#missionPlannerMultiMission').fadeIn(300);
                };

                button.addEventListener('click', handleShowSettings, false);
                button.addEventListener('touchstart', handleShowSettings, false);

                var element = document.createElement('div');
                element.className = 'mission-control-multimission ol-unselectable ol-control';
                element.appendChild(button);
                element.title = 'MP MultiMission';

                super({
                    element: element,
                    target: options.target
                });
            }
        };

        /**
         * @param {ol.MapBrowserEvent} evt Map browser event.
         * @return {boolean} `true` to start the drag sequence.
         */
        app.handleDownEvent = function (evt) {
            if (disableMarkerEdit) return false;

            var map = evt.map;

            var feature = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return feature;
                });

            tempMarker = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return layer;
                });

            if (feature) {
                this.coordinate_ = evt.coordinate;
                this.feature_ = feature;
                this.layer_ = tempMarker;
            }

            return !!feature;
        };

        /**
         * @param {ol.MapBrowserEvent} evt Map browser event.
         */
        app.handleDragEvent = function (evt) {
            
            if (tempMarker.kind == "safehomecircle" || tempMarker.kind == "geozonecircle") {
                return;
            }

            var map = evt.map;

            var feature = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return feature;
                });

            var deltaX = evt.coordinate[0] - this.coordinate_[0];
            var deltaY = evt.coordinate[1] - this.coordinate_[1];

            var geometry = /** @type {ol.geom.SimpleGeometry} */
                (this.feature_.getGeometry());
            if (tempMarker.kind == "waypoint" || tempMarker.kind == "safehome" || tempMarker.kind == "home" || tempMarker.kind == "geozone") {
                geometry.translate(deltaX, deltaY);
                this.coordinate_[0] = evt.coordinate[0];
                this.coordinate_[1] = evt.coordinate[1];
            }

            let coord = toLonLat(geometry.getCoordinates());
            if (tempMarker.kind == "waypoint") {
                let tempWp = mission.getWaypoint(tempMarker.number);
                tempWp.setLon(Math.round(coord[0] * 10000000));
                tempWp.setLat(Math.round(coord[1] * 10000000));
                if (selectedMarker != null && tempMarker.number == selectedMarker.getLayerNumber()) {
                    $('#pointLon').val(Math.round(coord[0] * 10000000) / 10000000);
                    $('#pointLat').val(Math.round(coord[1] * 10000000) / 10000000);
                }
                mission.updateWaypoint(tempWp);
                repaintLine4Waypoints(mission);
            }
            else if (tempMarker.kind == "safehome") {
                let tmpSafehome = FC.SAFEHOMES.get()[tempMarker.number];
                tmpSafehome.setLon(Math.round(coord[0] * 1e7));
                tmpSafehome.setLat(Math.round(coord[1] * 1e7));

                $('#safeHomeLongitude').val(Math.round(coord[0] * 1e7));
                $('#safeHomeLatitude').val(Math.round(coord[1] * 1e7));
                updateSelectedShAndFwAp(tempMarker.number);
                renderSafeHomeOptions();
                cleanSafehomeLayers();
                renderSafehomesOnMap();
            }
            else if (tempMarker.kind == "home") {
                HOME.setLon(Math.round(coord[0] * 10000000));
                HOME.setLat(Math.round(coord[1] * 10000000));
                $('.home-lon').val(Math.round(coord[0] * 10000000) / 10000000);
                $('.home-lat').val(Math.round(coord[1] * 10000000) / 10000000);
            } else if (tempMarker.kind == "geozone") {
                let tmpVertex = FC.GEOZONES.at(tempMarker.layerNumber).getVertex(tempMarker.number);
                tmpVertex.setLon(Math.round(coord[0] * 1e7));
                tmpVertex.setLat(Math.round(coord[1] * 1e7));
                //GEOZONES.updateGeozone(tmpVertex);
                let tableBody = $($geozoneContent.find('.missionPlannerGeozone').get(tempMarker.layerNumber)).find('#geozoneVerticesTableBody');
                tableBody.find('tr:nth-child(' + String(tempMarker.number + 1) + ') > td > .vertexLon').val(Math.round(coord[0] * 1e7) / 1e7);
                tableBody.find('tr:nth-child(' + String(tempMarker.number + 1) + ') > td > .vertexLat').val(Math.round(coord[1] * 1e7) / 1e7);
                selectedGeozone = FC.GEOZONES.at(tempMarker.layerNumber);
                renderGeozoneOptions();
                renderGeozonesOnMap();
                updateGeozoneInfo();
            }
        };

        /**
         * @param {ol.MapBrowserEvent} evt Event.
         */
        app.handleMoveEvent = function (evt) {
            if (this.cursor_) {
                var map = evt.map;
                var feature = map.forEachFeatureAtPixel(evt.pixel,
                    function (feature, layer) {
                        return feature;
                    });
                var element = evt.map.getTargetElement();
                if (feature && feature.name != "circleFeature" && feature.name != "circleSafeFeature") {
                    if (element.style.cursor != this.cursor_) {
                        this.previousCursor_ = element.style.cursor;
                        element.style.cursor = this.cursor_;
                    }
                } else if (this.previousCursor_ !== undefined) {
                    element.style.cursor = this.previousCursor_;
                    this.previousCursor_ = undefined;
                }
            }
        };

        /**
         * @param {ol.MapBrowserEvent} evt Map browser event.
         * @return {boolean} `false` to stop the drag sequence.
         */
        app.handleUpEvent = function (evt) {
            if (tempMarker.kind == "waypoint") {
                if (selectedMarker != null && tempMarker.number == selectedMarker.getLayerNumber()) {
                    (async () => {
                        const elevationAtWP = await mission.getWaypoint(tempMarker.number).getElevation(globalSettings);
                        $('#elevationValueAtWP').text(elevationAtWP);
                        const returnAltitude = checkAltElevSanity(false, mission.getWaypoint(tempMarker.number).getAlt(), elevationAtWP, mission.getWaypoint(tempMarker.number).getP3());
                        mission.getWaypoint(tempMarker.number).setAlt(returnAltitude);

                        if (mission.getWaypoint(tempMarker.number).getAction() == MWNP.WPTYPE.LAND) {
                            let approach = FC.FW_APPROACH.get()[FC.SAFEHOMES.getMaxSafehomeCount() + mission.getWaypoint(tempMarker.number).getMultiMissionIdx()];
                            if (approach.getIsSeaLevelRef()) {
                                if (approach.getElevation() != 0) {
                                    approach.setApproachAltAsl(approach.getApproachAltAsl() - approach.getElevation() + elevationAtWP * 100);
                                    approach.setLandAltAsl(approach.getLandAltAsl() - approach.getElevation() + elevationAtWP * 100);
                                }
                                approach.setElevation(elevationAtWP * 100);
                                $('#wpApproachAlt').val(approach.getApproachAltAsl());
                                $('#wpLandAlt').val(approach.getLandAltAsl);
                                $('#wpLandAltM').text(approach.getLandAltAsl() / 100 + " m");
                                $('#wpApproachAltM').text(approach.getApproachAltAsl() / 100 + " m");
                            }
                        }

                        plotElevation();
                    })()
                } else {
                    // Update elevation chart even for non-selected waypoints
                    plotElevation();
                }
            }
            else if (tempMarker.kind == "home" ) {
                (async () => {
                    const elevationAtHome = await HOME.getElevation(globalSettings);
                    $('#elevationValueAtHome').text(elevationAtHome+' m');
                    HOME.setAlt(elevationAtHome);
                    plotElevation();
                })()
            }
            else if (tempMarker.kind == "safehome") {
                (async () => {
                    let approach = FC.FW_APPROACH.get()[tempMarker.number];
                    let safehome = FC.SAFEHOMES.get()[tempMarker.number];
                    const elevation = await approach.getElevationFromServer(safehome.getLonMap(), safehome.getLatMap(), globalSettings) * 100;
                    $('#safehomeElevation').text(elevation / 100 + " m");
                    if (approach.getIsSeaLevelRef()) {
                        if (approach.getElevation() != 0) {
                            approach.setApproachAltAsl(approach.getApproachAltAsl() - approach.getElevation() + elevation);
                            approach.setLandAltAsl(approach.getLandAltAsl() - approach.getElevation() + elevation);
                        }
                        approach.setElevation(elevation);
                    }
                    renderSafeHomeOptions();
                })()
            }
            this.coordinate_ = null;
            this.feature_ = null;
            return false;
        };

        var lat = (FC.GPS_DATA ? (FC.GPS_DATA.lat / 10000000) : 0);
        var lon = (FC.GPS_DATA ? (FC.GPS_DATA.lon / 10000000) : 0);

        let mapLayers = [];
        let control_list;

        if (globalSettings.mapProviderType == 'esri') {
            mapLayers.push(new TileLayer({
                source: new XYZ({
                            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                            attributions: 'Source: <a href="https://www.esri.com/" target="_blank">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community',
                            maxZoom: 19
                        })
            }));
            mapLayers.push(new TileLayer({
                    source: new XYZ({
                                url: 'https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
                                maxZoom: 19
                            })
            }));
            mapLayers.push(new TileLayer({
                source: new XYZ({
                            url: 'https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                            maxZoom: 19
                        })
            }));
        } else if ( globalSettings.mapProviderType == 'mapproxy' ) {
            mapLayers.push(new TileLayer({
                source: new TileWMS({
                            url: globalSettings.proxyURL,
                            params: {'LAYERS':globalSettings.proxyLayer}
                        })
            }));
        } else {
            mapLayers.push(new TileLayer({
                source: new OSM()
            }));
        }

        if (CONFIGURATOR.connectionValid) {
            control_list = [
                new PlannerSettingsControl(),
                new PlannerMultiMissionControl(),
                new PlannerSafehomeControl(),
                new PlannerElevationControl(),
            ]

            if (isGeozoneEnabeld) {
                control_list.push(new GeozonesControl());
            }
        }
        else {
            control_list = [
                new PlannerSettingsControl(),
                new PlannerMultiMissionControl(),
                new PlannerElevationControl(),
                //new app.PlannerSafehomeControl() // TO COMMENT FOR RELEASE : DECOMMENT FOR DEBUG
            ]
        }

        //////////////////////////////////////////////////////////////////////////////////////////////
        // Map object definition
        //////////////////////////////////////////////////////////////////////////////////////////////
        map = new Map({
            controls: defaultControls({
                attributionOptions: {
                    collapsible: false
                }
            }).extend(control_list),
            interactions: defaultInteractions().extend([new Drag()]),
            layers: mapLayers,
            target: 'missionMap',
            view: new View({
                center: fromLonLat([lon, lat]),
                zoom: 2
            })
        });

        //////////////////////////////////////////////////////////////////////////
        // Set the attribute link to open on an external browser window, so
        // it doesn't interfere with the configurator.
        //////////////////////////////////////////////////////////////////////////
        setTimeout(function() {
            $('.ol-attribution a').attr('target', '_blank');
        }, 100);
        //////////////////////////////////////////////////////////////////////////
        // save map view settings when user moves it
        //////////////////////////////////////////////////////////////////////////
        map.on('moveend', function (evt) {
            store.set('missionPlannerLastValues', {
                center: toLonLat(map.getView().getCenter()),
                zoom: map.getView().getZoom()
            });
        });
        //////////////////////////////////////////////////////////////////////////
        // load map view settings on startup
        //////////////////////////////////////////////////////////////////////////
        const missionPlannerLastValues = store.get('missionPlannerLastValues', false);
        if (missionPlannerLastValues && missionPlannerLastValues.zoom && missionPlannerLastValues.center) {
            map.getView().setCenter(fromLonLat(missionPlannerLastValues.center));
            map.getView().setZoom(missionPlannerLastValues.zoom);
        }         

        //////////////////////////////////////////////////////////////////////////
        // Map on-click behavior definition
        //////////////////////////////////////////////////////////////////////////
        map.on('click', function (evt) {
            var tempSelectedMarkerIndex = null;
            if (selectedMarker != null && selectedFeature != null) {
                tempSelectedMarkerIndex = selectedMarker.getLayerNumber();
                try {
                    selectedFeature.setStyle(getWaypointIcon(selectedMarker, false));
                    selectedMarker = null;
                    selectedFeature = null;
                    tempMarker = null;
                    clearEditForm();
                } catch (e) {
                    console.log(e);
                    GUI.log(i18n.getMessage('notAWAYPOINT'));
                }
            }
            selectedFeature = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return feature;
                });
            tempMarker = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return layer;
                });
            if (selectedFeature && tempMarker.kind == "waypoint") {
                $("#editMission").hide();
                selectedMarker = mission.getWaypoint(tempMarker.number);

                selectedFwApproachWp = FC.FW_APPROACH.get()[FC.SAFEHOMES.getMaxSafehomeCount() + selectedMarker.getMultiMissionIdx()];

                if (selectedFwApproachWp.getLandHeading1() == 0 && selectedFwApproachWp.getLandHeading1() == 0 && selectedFwApproachWp.getApproachAltAsl() == 0 && selectedFwApproachWp.getLandAltAsl() == 0) {
                    selectedFwApproachWp.setApproachAltAsl(settings.fwApproachAlt * 100);
                    selectedFwApproachWp.setLandAltAsl(settings.fwLandAlt * 100);
                }

                var geometry = selectedFeature.getGeometry();
                var coord = toLonLat(geometry.getCoordinates());

                selectedFeature.setStyle(getWaypointIcon(selectedMarker, true));

                let P3Value = selectedMarker.getP3();

                changeSwitch($('#pointP3Alt'), TABS.mission_control.isBitSet(P3Value, MWNP.P3.ALT_TYPE));
                changeSwitch($('#pointP3UserAction1'), TABS.mission_control.isBitSet(P3Value, MWNP.P3.USER_ACTION_1));
                changeSwitch($('#pointP3UserAction2'), TABS.mission_control.isBitSet(P3Value, MWNP.P3.USER_ACTION_2));
                changeSwitch($('#pointP3UserAction3'), TABS.mission_control.isBitSet(P3Value, MWNP.P3.USER_ACTION_3));
                changeSwitch($('#pointP3UserAction4'), TABS.mission_control.isBitSet(P3Value, MWNP.P3.USER_ACTION_4));

                var altitudeMeters = app.ConvertCentimetersToMeters(selectedMarker.getAlt());

                if (selectedMarker.getAction() == MWNP.WPTYPE.LAND) {
                    $('#wpFwLanding').fadeIn(300);
                } else  {
                    $('#wpFwLanding').fadeOut(300);
                }

                if (tempSelectedMarkerIndex == null || tempSelectedMarkerIndex != selectedMarker.getLayerNumber()) {
                    (async () => {
                        const elevationAtWP = await selectedMarker.getElevation(globalSettings);
                        $('#elevationValueAtWP').text(elevationAtWP);
                        const returnAltitude = checkAltElevSanity(false, selectedMarker.getAlt(), elevationAtWP, P3Value);
                        selectedMarker.setAlt(returnAltitude);

                        /*
                        if (TABS.mission_control.isBitSet(P3Value, MWNP.P3.ALT_TYPE)) {
                            if (!selectedFwApproachWp.getIsSeaLevelRef()) {
                                selectedFwApproachWp.setApproachDirection(selectedFwApproachWp.getApproachDirection() + elevationAtWP * 100);
                                selectedFwApproachWp.setLandAltAsl(selectedFwApproachWp.getLandAltAsl() + elevationAtWP * 100);
                            }

                        }
                        */
                        selectedFwApproachWp.setIsSeaLevelRef(TABS.mission_control.isBitSet(P3Value, MWNP.P3.ALT_TYPE) ? 1 : 0);
                        $('#wpApproachAlt').val(selectedFwApproachWp.getApproachAltAsl());
                        $('#wpLandAlt').val(selectedFwApproachWp.getLandAltAsl);
                        $('#wpLandAltM').text(selectedFwApproachWp.getLandAltAsl() / 100 + " m");
                        $('#wpApproachAltM').text(selectedFwApproachWp.getApproachAltAsl() / 100 + " m");

                        plotElevation();
                    })()
                }
                $('#elevationAtWP').fadeIn();
                $('#groundClearanceAtWP').fadeIn();

                $('#altitudeInMeters').text(` ${altitudeMeters}m`);
                $('#pointLon').val(Math.round(coord[0] * 10000000) / 10000000);
                $('#pointLat').val(Math.round(coord[1] * 10000000) / 10000000);
                $('#pointAlt').val(selectedMarker.getAlt());
                $('#pointType').val(selectedMarker.getAction());
                // Change SpeedValue to Parameter1, 2, 3
                $('#pointP1').val(selectedMarker.getP1());
                $('#pointP2').val(selectedMarker.getP2());




                $('#wpApproachDirection').val(selectedFwApproachWp.getApproachDirection());
                $('#wpLandHeading1').val(Math.abs(selectedFwApproachWp.getLandHeading1()));
                changeSwitch($('#wpLandHeading1Excl'), selectedFwApproachWp.getLandHeading1() < 0);
                $('#wpLandHeading2').val(Math.abs(selectedFwApproachWp.getLandHeading2()));
                changeSwitch($('#wpLandHeading2Excl'), selectedFwApproachWp.getLandHeading2() < 0);



                $('#wpApproachDirection').val(selectedFwApproachWp.getApproachDirection());
                $('#wpLandHeading1').val(Math.abs(selectedFwApproachWp.getLandHeading1()));
                changeSwitch($('#wpLandHeading1Excl'), selectedFwApproachWp.getLandHeading1() < 0);
                $('#wpLandHeading2').val(Math.abs(selectedFwApproachWp.getLandHeading2()));
                changeSwitch($('#wpLandHeading2Excl'), selectedFwApproachWp.getLandHeading2() < 0);

                // Selection box update depending on choice of type of waypoint
                for (var j in dictOfLabelParameterPoint[selectedMarker.getAction()]) {
                    if (dictOfLabelParameterPoint[selectedMarker.getAction()][j] != '') {
                        $('#pointP'+String(j).slice(-1)+'class').fadeIn(300);
                        $('label[for=pointP'+String(j).slice(-1)+']').html(dictOfLabelParameterPoint[selectedMarker.getAction()][j]);
                    }
                    else {$('#pointP'+String(j).slice(-1)+'class').fadeOut(300);}
                }
                selectedMarker = renderWaypointOptionsTable(selectedMarker);
                $('#EditPointNumber').text("Edit point "+String(selectedMarker.getLayerNumber()+1));
                $('#MPeditPoint').fadeIn(300);
                $('#pointP3UserActionClass').fadeIn();
                redrawLayer();
            }
            else if (selectedFeature && tempMarker.kind == "line" && tempMarker.selection && !disableMarkerEdit) {
                let tempWpCoord = toLonLat(evt.coordinate);
                let tempWp = new Waypoint(tempMarker.number, MWNP.WPTYPE.WAYPOINT, Math.round(tempWpCoord[1] * 10000000), Math.round(tempWpCoord[0] * 10000000), Number(settings.alt), Number(settings.speed));
                tempWp.setMultiMissionIdx(mission.getWaypoint(0).getMultiMissionIdx());

                if (homeMarkers.length && HOME.getAlt() != "N/A") {
                    (async () => {
                        const elevationAtWP = await tempWp.getElevation(globalSettings);
                        tempWp.setAlt(checkAltElevSanity(false, settings.alt, elevationAtWP, false));

                        mission.insertWaypoint(tempWp, tempMarker.number);
                        mission.update(singleMissionActive());
                        refreshLayers();
                        plotElevation();
                    })()
                } else {
                    mission.insertWaypoint(tempWp, tempMarker.number);
                    mission.update(singleMissionActive());
                    refreshLayers();
                    plotElevation();
                }
            }
            else if (selectedFeature && tempMarker.kind == "safehome" && tempMarker.selection) {
                updateSelectedShAndFwAp(tempMarker.number);
                //renderSafeHomeOptions();
            }
            else if (selectedFeature && tempMarker.kind == "home" && tempMarker.selection) {
                selectedMarker = HOME;
                var geometry = selectedFeature.getGeometry();
                var coord = toLonLat(geometry.getCoordinates());
                $('.home-lon').val(Math.round(coord[0] * 10000000) / 10000000);
                $('.home-lat').val(Math.round(coord[1] * 10000000) / 10000000);
            }
            else if (selectedFeature && tempMarker.kind == "geozone" && tempMarker.selection) {
                selectedGeozone = FC.GEOZONES.at(tempMarker.layerNumber);
                renderGeozoneOptions();
            }
            else if (selectedFeature && tempMarker.kind == "geozoneline" && tempMarker.selection) {

                if (FC.GEOZONES.getUsedVerticesCount() + 1 > FC.GEOZONES.getMaxVertices()) {
                    dialog.alert(i18n.getMessage('missionGeozoneMaxVerticesReached'));
                    return;
                }
                
                let tempCoord = toLonLat(evt.coordinate);
                let tmpVertex = new GeozoneVertex(tempMarker.number + 1, Math.round(tempCoord[1] * 1e7), Math.round(tempCoord[0] * 1e7));
                FC.GEOZONES.at(tempMarker.layerNumber).insertVertex(tempMarker.number + 1, tmpVertex);
                selectedGeozone = FC.GEOZONES.at(tempMarker.layerNumber);
                renderGeozoneOptions();
                renderGeozonesOnMap();
                updateGeozoneInfo();
            }
            else if (!disableMarkerEdit) {
                let tempWpCoord = toLonLat(evt.coordinate);
                let tempWp = new Waypoint(mission.get().length, MWNP.WPTYPE.WAYPOINT, Math.round(tempWpCoord[1] * 10000000), Math.round(tempWpCoord[0] * 10000000), Number(settings.alt), Number(settings.speed));

                if (mission.get().length == 0) {
                    tempWp.setMultiMissionIdx(multimissionCount == 0 ? 0 : multimissionCount - 1);
                    FC.FW_APPROACH.clean(FC.SAFEHOMES.getMaxSafehomeCount() + tempWp.getMultiMissionIdx());
                } else {
                    tempWp.setMultiMissionIdx(mission.getWaypoint(mission.get().length - 1).getMultiMissionIdx());
                }

                if (homeMarkers.length && HOME.getAlt() != "N/A") {
                    (async () => {
                        const elevationAtWP = await tempWp.getElevation(globalSettings);
                        tempWp.setAlt(checkAltElevSanity(false, settings.alt, elevationAtWP, false));

                        mission.put(tempWp);
                        mission.update(singleMissionActive());
                        refreshLayers();
                        plotElevation();
                    })()
                } else {
                    mission.put(tempWp);
                    mission.update(singleMissionActive());
                    refreshLayers();
                    plotElevation();
                }
            }
            //mission.missionDisplayDebug();
            updateMultimissionState();
        });

        //////////////////////////////////////////////////////////////////////////
        // change mouse cursor when over marker
        //////////////////////////////////////////////////////////////////////////
        $(map.getViewport()).on('mousemove', function (e) {
            var pixel = map.getEventPixel(e.originalEvent);
            var name = "";
            var hit = map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                if (feature) {
                    name = feature.getProperties().name;
                }
                return true;
            });
            if (hit && name != "safehomeDist" && name != "safehomeSafe" && name != "geozoneCircle") {
                map.getTargetElement().style.cursor = 'pointer';
            } else {
                map.getTargetElement().style.cursor = '';
            }
        });

        //////////////////////////////////////////////////////////////////////////
        // handle map size on container resize
        //////////////////////////////////////////////////////////////////////////
        setInterval(function () {
            let width = $("#missionMap canvas").width(), height = $("#missionMap canvas").height();
            if ((map.width_ != width) || (map.height_ != height)) map.updateSize();
            map.width_ = width; map.height_ = height;
        }, 200);

        //////////////////////////////////////////////////////////////////////////
        // Update Alt display in meters on ALT field keypress up
        //////////////////////////////////////////////////////////////////////////
        $('#pointAlt').on('keyup', () => {
            let altitudeMeters = app.ConvertCentimetersToMeters($('#pointAlt').val());
            $('#altitudeInMeters').text(` ${altitudeMeters}m`);
        });

        /////////////////////////////////////////////
        // Callback to show/hide menu boxes
        /////////////////////////////////////////////
        $('#showHideActionButton').on('click', function () {
            var src = ($(this).children().attr('class') === 'ic_hide')
                ? 'ic_show'
                : 'ic_hide';
            $(this).children().attr('class', src);
            if ($(this).children().attr('class') === 'ic_hide') {
                $('#ActionContent').fadeIn(300);
            }
            else {
                $('#ActionContent').fadeOut(300);
            }
        });

        $('#showHideInfoButton').on('click', function () {
            var src = ($(this).children().attr('class') === 'ic_hide')
                ? 'ic_show'
                : 'ic_hide';
            $(this).children().attr('class', src);
            if ($(this).children().attr('class') === 'ic_hide') {
                $('#InfoContent').fadeIn(300);
            }
            else {
                $('#InfoContent').fadeOut(300);
            }
        });

        $('#showHideSafehomeButton').on('click', function () {
            var src = ($(this).children().attr('class') === 'ic_hide')
                ? 'ic_show'
                : 'ic_hide';
            $(this).children().attr('class', src);
            if ($(this).children().attr('class') === 'ic_hide') {
                $('#SafehomeContent').fadeIn(300);
            }
            else {
                $('#SafehomeContent').fadeOut(300);
            }
        });

        $('#showHideHomeButton').on('click', function () {
            var src = ($(this).children().attr('class') === 'ic_hide')
                ? 'ic_show'
                : 'ic_hide';
            $(this).children().attr('class', src);
            if ($(this).children().attr('class') === 'ic_hide') {
                $('#HomeContent').fadeIn(300);
            }
            else {
                $('#HomeContent').fadeOut(300);
            }
        });

        $('#showHideWPeditButton').on('click', function () {
            var src = ($(this).children().attr('class') === 'ic_hide')
                ? 'ic_show'
                : 'ic_hide';
            $(this).children().attr('class', src);
            if ($(this).children().attr('class') === 'ic_hide') {
                $('#WPeditContent').fadeIn(300);
            }
            else {
                $('#WPeditContent').fadeOut(300);
            }
        });

        $('#showHideMultimissionButton').on('click', function () {
            var src = ($(this).children().attr('class') === 'ic_hide')
                ? 'ic_show'
                : 'ic_hide';
            $(this).children().attr('class', src);
            if ($(this).children().attr('class') === 'ic_hide') {
                $('#multimissionContent').fadeIn(300);
            }
            else {
                $('#multimissionContent').fadeOut(300);
            }
        });

        $('#showHideGeozonesButton').on('click', function () {
            var src = ($(this).children().attr('class') === 'ic_hide')
                ? 'ic_show'
                : 'ic_hide';
            $(this).children().attr('class', src);
            if ($(this).children().attr('class') === 'ic_hide') {
                $('#geozoneContent').fadeIn(300);
            }
            else {
                $('#geozoneContent').fadeOut(300);
            }
        });

        /////////////////////////////////////////////
        // Callback for Waypoint edition
        /////////////////////////////////////////////
        $('#pointType').on('change', async (event) => {
            if (selectedMarker) {
                if (Number($('#pointType').val()) == MWNP.WPTYPE.LAND) {
                    let found = false;
                    mission.get().forEach(wp => {
                        if (wp.getAction() == MWNP.WPTYPE.LAND) {
                            dialog.alert(i18n.getMessage('MissionPlannerOnlyOneLandWp'));
                            found = true;
                            $(event.currentTarget).val(selectedMarker.getAction());
                        }
                    });

                    if (!found) {
                        $('#wpFwLanding').fadeIn(300);
                    }

                } else  {
                    $('#wpFwLanding').fadeOut(300);
                }

                selectedMarker.setAction(Number($('#pointType').val()));
                if ([MWNP.WPTYPE.SET_POI,MWNP.WPTYPE.POSHOLD_TIME,MWNP.WPTYPE.LAND].includes(selectedMarker.getAction())) {
                    selectedMarker.setP1(0.0);
                    selectedMarker.setP2(0.0);
                }
                for (var j in dictOfLabelParameterPoint[selectedMarker.getAction()]) {
                    if (dictOfLabelParameterPoint[selectedMarker.getAction()][j] != '') {
                        $('#pointP'+String(j).slice(-1)+'class').fadeIn(300);
                        $('label[for=pointP'+String(j).slice(-1)+']').html(dictOfLabelParameterPoint[selectedMarker.getAction()][j]);
                    }
                    else {$('#pointP'+String(j).slice(-1)+'class').fadeOut(300);}
                }
                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        $('#pointLat').on('change', function (event) {
            if (selectedMarker) {
                selectedMarker.setLat(Math.round(Number($('#pointLat').val()) * 10000000));
                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                refreshLayers();
                selectedFeature = markers[selectedMarker.getLayerNumber()].getSource().getFeatures()[0];
                selectedFeature.setStyle(getWaypointIcon(selectedMarker, true));
                plotElevation();
            }
        });

        $('#pointLon').on('change', function (event) {
            if (selectedMarker) {
                selectedMarker.setLon(Math.round(Number($('#pointLon').val()) * 10000000));
                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                refreshLayers();
                selectedFeature = markers[selectedMarker.getLayerNumber()].getSource().getFeatures()[0];
                selectedFeature.setStyle(getWaypointIcon(selectedMarker, true));
                plotElevation();
            }
        });

        $('#pointAlt').on('change', function (event) {
            if (selectedMarker) {
                const elevationAtWP = Number($('#elevationValueAtWP').text());
                const returnAltitude = checkAltElevSanity(true, Number($('#pointAlt').val()), elevationAtWP, selectedMarker.getP3());
                selectedMarker.setAlt(returnAltitude);
                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
                plotElevation();
            }
        });

        $('#pointP1').on('change', function (event) {
            if (selectedMarker) {
                selectedMarker.setP1(Number($('#pointP1').val()));
                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        $('#pointP2').on('change', function (event) {
            if (selectedMarker) {
                selectedMarker.setP2(Number($('#pointP2').val()));
                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        $('#pointP3Alt').on('change', function (event) {
            if (selectedMarker) {
                var P3Value = selectedMarker.getP3();

                if (disableMarkerEdit) {
                    changeSwitch($('#pointP3Alt'), TABS.mission_control.isBitSet(P3Value, MWNP.P3.ALT_TYPE));
                }

                P3Value = TABS.mission_control.setBit(P3Value, MWNP.P3.ALT_TYPE, $('#pointP3Alt').prop("checked"));
                (async () => {
                    const elevationAtWP = await selectedMarker.getElevation(globalSettings);
                    $('#elevationValueAtWP').text(elevationAtWP);
                    var altitude = Number($('#pointAlt').val());

                    if (P3Value != selectedMarker.getP3()) {
                        selectedMarker.setP3(P3Value);

                        let groundClearance = 100 * Number($('#groundClearanceValueAtWP').text());
                        if (isNaN(groundClearance)) {
                            groundClearance = settings.alt; // use default altitude if no current ground clearance
                        }

                        if ($('#pointP3Alt').prop("checked")) {
                            selectedMarker.setAlt(groundClearance + elevationAtWP * 100);
                        } else {
                            let elevationAtHome = HOME.getAlt();
                            if (isNaN(elevationAtHome)) {
                                elevationAtHome = elevationAtWP;
                            }
                            selectedMarker.setAlt(groundClearance + 100 * (elevationAtWP - elevationAtHome));
                        }

                        if (selectedMarker.getAction() == MWNP.WPTYPE.LAND && selectedFwApproachWp && selectedFwApproachWp.getIsSeaLevelRef() != $('#pointP3Alt').prop("checked")) {

                            let oldElevation = 0;
                            if (selectedFwApproachWp.getIsSeaLevelRef()) {
                                oldElevation = selectedFwApproachWp.getElevation();
                            }

                            if ($('#pointP3Alt').prop("checked")) {
                                selectedFwApproachWp.setApproachAltAsl(selectedFwApproachWp.getApproachAltAsl() - oldElevation + elevationAtWP * 100);
                                selectedFwApproachWp.setLandAltAsl(selectedFwApproachWp.getLandAltAsl() - oldElevation + elevationAtWP * 100);
                            } else {
                                selectedFwApproachWp.setApproachAltAsl(selectedFwApproachWp.getApproachAltAsl() - elevationAtWP * 100);
                                selectedFwApproachWp.setLandAltAsl(selectedFwApproachWp.getLandAltAsl() - elevationAtWP * 100);
                            }
                            selectedFwApproachWp.setElevation(elevationAtWP * 100);
                            selectedFwApproachWp.setIsSeaLevelRef($('#pointP3Alt').prop("checked") ? 1 : 0);
                            $('#wpApproachAlt').val(selectedFwApproachWp.getApproachAltAsl());
                            $('#wpLandAlt').val(selectedFwApproachWp.getLandAltAsl());
                        }

                    }

                    const returnAltitude = checkAltElevSanity(false, selectedMarker.getAlt(), elevationAtWP, selectedMarker.getP3());
                    selectedMarker.setAlt(returnAltitude);
                    $('#pointAlt').val(selectedMarker.getAlt());
                    let altitudeMeters = app.ConvertCentimetersToMeters(selectedMarker.getAlt());
                    $('#altitudeInMeters').text(` ${altitudeMeters}m`);

                    $('#wpLandAltM').text(selectedFwApproachWp.getLandAltAsl() / 100 + " m");
                    $('#wpApproachAltM').text(selectedFwApproachWp.getApproachAltAsl() / 100 + " m");

                    if (selectedFwApproachWp && selectedFwApproachWp.getIsSeaLevelRef() != $('#pointP3Alt').prop("checked")) {
                        selectedFwApproachWp.setIsSeaLevelRef($('#pointP3Alt').prop("checked"));
                        selectedFwApproachWp.setElevation(elevationAtWP * 100);
                        if ($('#pointP3Alt').prop("checked")) {
                            selectedFwApproachWp.setApproachAltAsl(selectedFwApproachWp.getApproachAltAsl() + elevationAtWP * 100);
                            selectedFwApproachWp.setLandAltAsl(selectedFwApproachWp.getLandAltAsl() + elevationAtWP * 100);
                        } else {
                            selectedFwApproachWp.setApproachAltAsl(selectedFwApproachWp.getApproachAltAsl() - elevationAtWP * 100);
                            selectedFwApproachWp.setLandAltAsl(selectedFwApproachWp.getLandAltAsl() - elevationAtWP * 100);
                        }

                        $('#wpApproachAlt').val(selectedFwApproachWp.getApproachAltAsl());
                        $('#wpLandAlt').val(selectedFwApproachWp.getLandAltAsl());
                    }

                    $('#wpLandAltM').text(selectedFwApproachWp.getLandAltAsl() / 100 + " m");
                    $('#wpApproachAltM').text(selectedFwApproachWp.getApproachAltAsl() / 100 + " m");

                    mission.updateWaypoint(selectedMarker);
                    mission.update(singleMissionActive());
                    redrawLayer();
                    plotElevation();
                })();
            }
        });

        $('#pointP3UserAction1').on('change', function(event){
            if (selectedMarker) {
                if (disableMarkerEdit) {
                    changeSwitch($('#pointP3UserAction1'), TABS.mission_control.isBitSet(selectedMarker.getP3(), MWNP.P3.USER_ACTION_1));
                }

                var P3Value = TABS.mission_control.setBit(selectedMarker.getP3(), MWNP.P3.USER_ACTION_1, $('#pointP3UserAction1').prop("checked"));
                selectedMarker.setP3(P3Value);

                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        $('#pointP3UserAction2').on('change', function(event){
            if (selectedMarker) {
                if (disableMarkerEdit) {
                    changeSwitch($('#pointP3UserAction2'), TABS.mission_control.isBitSet(selectedMarker.getP3(), MWNP.P3.USER_ACTION_2));
                }

                var P3Value = TABS.mission_control.setBit(selectedMarker.getP3(), MWNP.P3.USER_ACTION_2, $('#pointP3UserAction2').prop("checked"));
                selectedMarker.setP3(P3Value);

                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        $('#pointP3UserAction3').on('change', function(event){
            if (selectedMarker) {
                if (disableMarkerEdit) {
                    changeSwitch($('#pointP3UserAction3'), TABS.mission_control.isBitSet(selectedMarker.getP3(), MWNP.P3.USER_ACTION_3));
                }

                var P3Value = TABS.mission_control.setBit(selectedMarker.getP3(), MWNP.P3.USER_ACTION_3, $('#pointP3UserAction3').prop("checked"));
                selectedMarker.setP3(P3Value);

                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        $('#pointP3UserAction4').on('change', function(event){
            if (selectedMarker) {
                if (disableMarkerEdit) {
                    changeSwitch($('#pointP3UserAction4'), TABS.mission_control.isBitSet(selectedMarker.getP3(), MWNP.P3.USER_ACTION_4));
                }

                var P3Value = TABS.mission_control.setBit(selectedMarker.getP3(), MWNP.P3.USER_ACTION_4, $('#pointP3UserAction4').prop("checked"));
                selectedMarker.setP3(P3Value);

                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        $('#wpApproachAlt').on('change', (event) => {
            if (selectedMarker && selectedFwApproachWp) {
                let altitude = Number($(event.currentTarget).val());
                if (checkApproachAltitude(altitude, $('#pointP3Alt').prop('checked'), Number($('#elevationValueAtWP').text()))) {
                    selectedFwApproachWp.setApproachAltAsl(Number($(event.currentTarget).val()));
                    $('#wpApproachAltM').text(selectedFwApproachWp.getApproachAltAsl() / 100 + " m");
                }
            }
        });

        $('#wpLandAlt').on('change', (event) => {
            if (selectedMarker && selectedFwApproachWp) {
                let altitude = Number($(event.currentTarget).val());
                if (checkLandingAltitude(altitude, $('#pointP3Alt').prop('checked'), Number($('#elevationValueAtWP').text()))) {
                    selectedFwApproachWp.setLandAltAsl(Number($(event.currentTarget).val()));
                    $('#wpLandAltM').text(selectedFwApproachWp.getLandAltAsl() / 100 + " m");
                }
            }
        });

        $('#wpApproachDirection').on('change', (event) => {
            if (selectedMarker && selectedFwApproachWp) {
                selectedFwApproachWp.setApproachDirection($(event.currentTarget).val());
                refreshLayers();
                }
        });

        $('#wpLandHeading1').on('change', (event) => {
            if (selectedMarker && selectedFwApproachWp) {
                let val = Number($(event.currentTarget).val());
                if (val < 0) {
                    val = 360;
                    $('#wpLandHeading1').val(360);
                }
                if (val > 360) {
                    val = 0;
                    $('#wpLandHeading1').val(0);
                }

                if ($('#wpLandHeading1Excl').prop('checked')) {
                    val *= -1;
                }

                selectedFwApproachWp.setLandHeading1(val);
                refreshLayers();
            }
        });

        $('#wpLandHeading1Excl').on('change', (event) => {

            if (selectedMarker && selectedFwApproachWp) {
                if (disableMarkerEdit) {
                    changeSwitch($('#wpLandHeading1Excl'), selectedFwApproachWp.getLandHeading1() < 0);
                    return;
                }

                if ($('#wpLandHeading1Excl').prop('checked')) {
                    selectedFwApproachWp.setLandHeading1(-Math.abs(selectedFwApproachWp.getLandHeading1()));
                } else {
                    selectedFwApproachWp.setLandHeading1(Math.abs(selectedFwApproachWp.getLandHeading1()));
                }

                refreshLayers();
            }
        });

        $('#wpLandHeading2').on('change', (event) => {
            if (selectedMarker && selectedFwApproachWp) {
                let val = Number($(event.currentTarget).val());
                if (val < 0) {
                    val = 360;
                    $('#wpLandHeading2').val(360);
                }
                if (val > 360) {
                    val = 0;
                    $('#wpLandHeading2').val(0);
                }

                if ($('#wpLandHeading2Excl').prop('checked')) {
                    val *= -1;
                }

                selectedFwApproachWp.setLandHeading2(val);
                refreshLayers();
            }
        });

        $('#wpLandHeading2Excl').on('change', (event) => {
            if (selectedMarker && selectedFwApproachWp) {
                if (disableMarkerEdit) {
                    changeSwitch($('#wpLandHeading2Excl'), selectedFwApproachWp.getLandHeading2() < 0);
                    return;
                }
                if ($('#wpLandHeading2Excl').prop('checked')) {
                    selectedFwApproachWp.setLandHeading2(-Math.abs(selectedFwApproachWp.getLandHeading2()));
                } else {
                    selectedFwApproachWp.setLandHeading2(Math.abs(selectedFwApproachWp.getLandHeading2()));
                }
                refreshLayers();
            }
        });


        /////////////////////////////////////////////
        // Callback for Waypoint Options Table
        /////////////////////////////////////////////
        $waypointOptionsTableBody.on('click', "[data-role='waypointOptions-delete']", function (event) {
            if (selectedMarker) {
                mission.dropAttachedFromWaypoint(selectedMarker, $(event.currentTarget).attr("data-index")-1);
                renderWaypointOptionsTable(selectedMarker);
                //cleanLines();
                refreshLayers();
                selectedFeature = markers[selectedMarker.getLayerNumber()].getSource().getFeatures()[0];
                selectedFeature.setStyle(getWaypointIcon(selectedMarker, true));
            }
        });

        $("[data-role='waypointOptions-add']").on('click', function () {
            if (selectedMarker) {
                mission.addAttachedFromWaypoint(selectedMarker);
                renderWaypointOptionsTable(selectedMarker);
                //cleanLines();
                refreshLayers();
                selectedFeature = markers[selectedMarker.getLayerNumber()].getSource().getFeatures()[0];
                selectedFeature.setStyle(getWaypointIcon(selectedMarker, true));
            }
        });

        $('#editMission').on('click', function () {
            mapSelectEditMultimission(selectedMarker.getNumber());
        });

        /////////////////////////////////////////////
        // Callback for SAFEHOMES
        /////////////////////////////////////////////


        $('#addSafehome').on('click', () => {
            if (FC.SAFEHOMES.safehomeCount() + 1 > FC.SAFEHOMES.getMaxSafehomeCount()){
                dialog.alert(i18n.getMessage('missionSafehomeMaxSafehomesReached'));
                return;
            }

            let mapCenter = map.getView().getCenter();
            let midLon = Math.round(toLonLat(mapCenter)[0] * 1e7);
            let midLat = Math.round(toLonLat(mapCenter)[1] * 1e7);
            FC.SAFEHOMES.put(new Safehome(FC.SAFEHOMES.safehomeCount(), 1, midLat, midLon));
            updateSelectedShAndFwAp(FC.SAFEHOMES.safehomeCount() - 1);
            renderSafeHomeOptions();
            cleanSafehomeLayers();
            renderSafehomesOnMap();
            updateSafehomeInfo();
        });

        $('#cancelSafehome').on('click', function () {
            closeSafehomePanel();
        });

        $('#loadEepromSafehomeButton').on('click', function () {
            $(this).addClass('disabled');
            GUI.log('Start of getting Safehome points');
            var loadChainer = new MSPChainerClass();
            loadChainer.setChain([
                mspHelper.loadSafehomes,
                mspHelper.loadFwApproach,
                function() {
                    if (FC.SAFEHOMES.safehomeCount() >= 1) {
                        updateSelectedShAndFwAp(0);
                    } else {
                        selectedSafehome = null;
                        selectedFwApproachSh = null;
                    }
                    renderSafeHomeOptions();
                    cleanSafehomeLayers();
                    renderSafehomesOnMap();
                    updateSafehomeInfo();
                    GUI.log(i18n.getMessage('endGettingSafehomePoints'));
                    $('#loadEepromSafehomeButton').removeClass('disabled');
                }
            ]);
            loadChainer.execute();
        });

        $('#saveEepromSafehomeButton').on('click', function() {
            $(this).addClass('disabled');
            GUI.log(i18n.getMessage('startSendingSafehomePoints'));

            var saveChainer = new MSPChainerClass();
            saveChainer.setChain([
                mspHelper.saveSafehomes,
                mspHelper.saveFwApproach,
                function() {
                    mspHelper.saveToEeprom();
                    GUI.log(i18n.getMessage('endSendingSafehomePoints'));
                    $('#saveEepromSafehomeButton').removeClass('disabled');
                }
            ]);
            saveChainer.execute();
        });

        $('#deleteSafehome').on('click', () => {
            if (selectedSafehome && selectedFwApproachSh) {
                var shNum = selectedSafehome.getNumber();
                FC.SAFEHOMES.drop(shNum);
                FC.FW_APPROACH.clean(shNum);

                if (FC.SAFEHOMES.safehomeCount() > 0) {
                    updateSelectedShAndFwAp(FC.SAFEHOMES.safehomeCount() - 1);
                } else {
                    selectedSafehome = null;
                    selectedFwApproachSh = null;
                }
                renderSafeHomeOptions();
                cleanSafehomeLayers();
                renderSafehomesOnMap();
                updateSafehomeInfo();
            }
        });

        $('#safehomeLatitude').on('change', event => {
            if (selectedSafehome && selectedFwApproachSh) {
                selectedSafehome.setLat(Math.round(Number($(event.currentTarget).val()) * 1e7));
                renderSafeHomeOptions();
                cleanSafehomeLayers();
                renderSafehomesOnMap();
            }
        });


        $('#safehomeLongitude').on('change', event => {
            if (selectedSafehome && selectedFwApproachSh) {
                selectedSafehome.setLon(Math.round(Number($(event.currentTarget).val()) * 1e7));
                renderSafeHomeOptions();
                cleanSafehomeLayers();
                renderSafehomesOnMap();
            }
        });

        $('#safehomeSeaLevelRef').on('change', event => {

            let isChecked = $(event.currentTarget).prop('checked') ? 1 : 0;
            if (selectedSafehome && selectedFwApproachSh && isChecked != selectedFwApproachSh.getIsSeaLevelRef()) {
                selectedFwApproachSh.setIsSeaLevelRef(isChecked);

                (async () => {
                    const elevation = await selectedFwApproachSh.getElevationFromServer(selectedSafehome.getLonMap(), selectedSafehome.getLatMap(), globalSettings) * 100;
                    selectedFwApproachSh.setElevation(elevation);

                    if (isChecked) {
                        selectedFwApproachSh.setApproachAltAsl(selectedFwApproachSh.getApproachAltAsl() + elevation);
                        selectedFwApproachSh.setLandAltAsl(selectedFwApproachSh.getLandAltAsl() + elevation);
                    } else {
                        selectedFwApproachSh.setApproachAltAsl(selectedFwApproachSh.getApproachAltAsl() - elevation);
                        selectedFwApproachSh.setLandAltAsl(selectedFwApproachSh.getLandAltAsl() - elevation);

                    }

                    $('#safehomeElevation').text(elevation / 100);
                    $('#safehomeApproachAlt').val(selectedFwApproachSh.getApproachAltAsl());
                    $('#safehomeLandAlt').val(selectedFwApproachSh.getLandAltAsl());
                    $('#safehomeLandAltM').text(selectedFwApproachSh.getLandAltAsl() / 100 + " m");
                    $('#safehomeApproachAltM').text(selectedFwApproachSh.getApproachAltAsl() / 100 + " m");

                    renderSafeHomeOptions();
                })();
            }
        });

        $('#safehomeApproachAlt').on('change', event => {

            if (selectedFwApproachSh) {
                let altitude = Number($(event.currentTarget).val());
                if (checkApproachAltitude(altitude, $('#safehomeSeaLevelRef').prop('checked'), Number($('#safehomeElevation').text()))) {
                    selectedFwApproachSh.setApproachAltAsl(Number($(event.currentTarget).val()));
                    $('#safehomeApproachAltM').text(selectedFwApproachSh.getApproachAltAsl() / 100 + " m");
                    cleanSafehomeLayers();
                    renderSafehomesOnMap();
                    renderHomeTable();
                }
                $('#safehomeApproachAlt').val(selectedFwApproachSh.getApproachAltAsl());
            }

        });

        $('#safehomeLandAlt').on('change', event => {

            if (selectedFwApproachSh) {
                let altitude = Number($(event.currentTarget).val());
                if (checkLandingAltitude(altitude, $('#safehomeSeaLevelRef').prop('checked'), Number($('#safehomeElevation').text()))) {
                    selectedFwApproachSh.setLandAltAsl(altitude);
                    $('#safehomeLandAltM').text(selectedFwApproachSh.getLandAltAsl() / 100 + " m");
                    cleanSafehomeLayers();
                    renderSafehomesOnMap();
                    renderHomeTable();
                } else {
                    $('#safehomeLandAlt').val(selectedFwApproachSh.getLandAltAsl());
                }
            }
        });

        $('#geozoneApproachDirection').on('change', event => {
            if (selectedFwApproachSh) {
                selectedFwApproachSh.setApproachDirection($(event.currentTarget).val());
                cleanSafehomeLayers();
                renderSafehomesOnMap();
            }
        });

        $('#safehomeLandHeading1Excl').on('change', event => {
            if (selectedFwApproachSh && !lockShExclHeading) {
                selectedFwApproachSh.setLandHeading1(selectedFwApproachSh.getLandHeading1() * -1);
                cleanSafehomeLayers();
                renderSafehomesOnMap();
            }
        });

        $('#safehomeLandHeading1').on('change', event => {
            if (selectedFwApproachSh) {
                let val = Number($(event.currentTarget).val());
                if (val < 0) {
                    val = 360;
                    $('#safehomeLandHeading1').val(360);
                }
                if (val > 360) {
                    val = 0;
                    $('#safehomeLandHeading1').val(0);
                }

                if ($('#safehomeLandHeading1Excl').prop('checked')) {
                    val *= -1;
                }

                selectedFwApproachSh.setLandHeading1(val);
                cleanSafehomeLayers();
                renderSafehomesOnMap();
            }
        });


        $('#safehomeLandHeading2Excl').on('change', event => {
            if (selectedFwApproachSh && !lockShExclHeading) {
                selectedFwApproachSh.setLandHeading2(selectedFwApproachSh.getLandHeading2() * -1);
                cleanSafehomeLayers();
                renderSafehomesOnMap();
            }
        });


        $('#safehomeLandHeading2').on('change', event => {
            if (selectedFwApproachSh) {
                let val = Number($(event.currentTarget).val());
                if (val < 0) {
                    val = 360;
                    $('#safehomeLandHeading2').val(360);
                }
                if (val > 360) {
                    val = 0;
                    $('#safehomeLandHeading2').val(0);
                }

                if ($('#safehomeLandHeading2Excl').prop('checked')) {
                    val *= -1;
                }

                selectedFwApproachSh.setLandHeading2(val);
                cleanSafehomeLayers();
                renderSafehomesOnMap();
            }
        });

        /////////////////////////////////////////////
        // Callback for Geozones
        /////////////////////////////////////////////

        function reboot() {
            //noinspection JSUnresolvedVariable
            GUI.log(i18n.getMessage('configurationEepromSaved'));
            GUI.tab_switch_cleanup(function () {
                MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
            });
        }

        function reinitialize() {
            //noinspection JSUnresolvedVariable
            GUI.log(i18n.getMessage('deviceRebooting'));
            GUI.handleReconnect($('.tab_mission_control a'));
        }

        $('#cancelGeozone').on('click', function() {
            $('#missionPlannerGeozones').hide();
            cleanGeozoneLayers();
            cleanGeozoneLines();
            selectedGeozone = null;
        });

        $('#addGeozone').on('click', function() {
            addGeozone();
        });

        $('#deleteGeozone').on('click', event => {
            FC.GEOZONES.drop(selectedGeozone.getNumber());
            selectedGeozone = FC.GEOZONES.last();
            renderGeozoneOptions();
            renderGeozonesOnMap();
            updateGeozoneInfo();
        });

        $('#loadEepromGeozoneButton').on('click', event => {
            $(event.currentTarget).addClass('disabled');
            GUI.log('Start of getting Geozones');
            mspHelper.loadGeozones(() => {
                 if (FC.GEOZONES.geozoneCount() >= 1) {
                    selectedGeozone = FC.GEOZONES.first();
                } else {
                    selectedGeozone = null;
                }
                renderGeozoneOptions();
                renderGeozonesOnMap();
                updateGeozoneInfo();
                GUI.log('End of getting Geozones');
                $(event.currentTarget).removeClass('disabled');
            }, 1000);
        });

        $('#saveEepromGeozoneButton').on('click', event => {

            if (invalidGeoZones) {
                dialog.alert(i18n.getMessage("geozoneUnableToSave"));
                return;
            }
            
            if (dialog.confirm(i18n.getMessage("missionGeozoneReboot"))) {            
                $(event.currentTarget).addClass('disabled');
                GUI.log('Start of sending Geozones');
                mspHelper.saveGeozones(() => {
                    mspHelper.saveToEeprom();
                    GUI.log('End of sending Geozones');
                    reboot();
                });
            }
        });

        $('#geozoneShape').on('change', event => {
            if (selectedGeozone) {
                if ($(event.currentTarget).val() == GeozoneShapes.CIRCULAR) {
                    $('#geozoneRadius').prop('disabled', false);
                    let tmpVertex = selectedGeozone.getFirstVertex();
                    selectedGeozone.resetVertices();
                    selectedGeozone.setVertices([tmpVertex]);
                } else {
                    if (FC.GEOZONES.getUsedVerticesCount() + 2 > FC.GEOZONES.getMaxVertices()) {
                        dialog.alert(i18n.getMessage('missionGeozoneMaxVerticesReached'));
                        renderGeozoneOptions();
                        return;
                    }
                    $('#geozoneRadius').prop('disabled', true);
                    if (selectedGeozone.getVerticesCount() < 3) {
                        let lat = selectedGeozone.getFirstVertex().getLat();
                        let lon = selectedGeozone.getFirstVertex().getLon();
                        let vertices = [
                            new GeozoneVertex(0, lat - 25000, lon - 25000),
                            new GeozoneVertex(1, lat - 25000, lon + 25000),
                            new GeozoneVertex(2, lat + 25000, lon + 25000),
                            new GeozoneVertex(3, lat + 25000, lon - 25000)
                        ];
                        selectedGeozone.setVertices(vertices);
                    };
                }
                selectedGeozone.setShape($(event.currentTarget).val());
                renderGeozonesOnMap();
                updateGeozoneInfo();
            }
        });


        $('#geozoneType').on('change', event => {
            if (selectedGeozone) {
                selectedGeozone.setType($(event.currentTarget).val());
                renderGeozonesOnMap();
            }
        });

        $('#geozoneMinAlt').on('change', event => {
            if (selectedGeozone) {
                selectedGeozone.setMinAltitude($(event.currentTarget).val());
                renderGeozoneOptions();
            }
        });
        $('#geozoneMaxAlt').on('change', event => {
            if (selectedGeozone) {
                selectedGeozone.setMaxAltitude($(event.currentTarget).val());
                renderGeozoneOptions();
            }
        });

        $('#geozoneSeaLevelRef').on('change', event => {
            const isChecked = $(event.currentTarget).prop('checked') ? 1 : 0;
            if (selectedGeozone && isChecked != selectedGeozone.getSealevelRef()) {
                selectedGeozone.setSealevelRef(isChecked);
                (async () => {
                    const vertex = selectedGeozone.getVertex(0);
                    const elevation = await selectedGeozone.getElevationFromServer(vertex.getLonMap(), vertex.getLatMap(), globalSettings);

                    if (isChecked) {
                        selectedGeozone.setMinAltitude(Number(selectedGeozone.getMinAltitude()) + elevation * 100);
                        selectedGeozone.setMaxAltitude(Number(selectedGeozone.getMaxAltitude()) + elevation * 100);
                    } else {
                        selectedGeozone.setMinAltitude(Number(selectedGeozone.getMinAltitude()) - elevation * 100);
                        selectedGeozone.setMaxAltitude(Number(selectedGeozone.getMaxAltitude()) - elevation * 100);
                    }
                    renderGeozoneOptions();
                })();
            }
        });

        $('#geozoneAction').on('change', event => {
            if (selectedGeozone) {
                selectedGeozone.setFenceAction($(event.currentTarget).val());
            }
        });

        $('#geozoneRadius').on('change', event => {
            if (selectedGeozone) {
                selectedGeozone.setRadius($(event.currentTarget).val());
                renderGeozonesOnMap();
            }
        });


        /////////////////////////////////////////////
        // Callback for HOME Table
        /////////////////////////////////////////////
        $('#homeTableBody').on('click', "[data-role='home-center']", function (event) {
            let mapCenter = map.getView().getCenter();
            HOME.setLon(Math.round(toLonLat(mapCenter)[0] * 1e7));
            HOME.setLat(Math.round(toLonLat(mapCenter)[1] * 1e7));
            updateHome();
        });

        $('#cancelHome').on('click', function () {
            closeHomePanel();
        });

        $('#cancelPlot').on('click', function () {
            closeHomePanel();
        });

        /////////////////////////////////////////////
        // Callback for MULTIMISSION Table
        /////////////////////////////////////////////
        $('#multimissionOptionList').on('change', function () {
            if (singleMissionActive()) {
                // updateAllMultimission only when a single mission is loaded on map
                // or new mission is empty.
                if (mission.isEmpty()) {
                    updateAllMultimission();
                    return;
                }
                let missions = 0;
                mission.get().forEach(function (element) {
                    missions += element.getEndMission() == 0xA5 ? 1 : 0;
                });
                if (missions == 1) updateAllMultimission();

                editMultimission();
            } else {
                updateAllMultimission();
                updateMultimissionState();
            }
        });

        $('#addMultimissionButton').on('click', function () {
            addMultimission();
        });

        $('#updateMultimissionButton').on('click', function () {
            $('#multimissionOptionList').val('0').trigger('change');
        });

        $('#cancelMultimission').on('click', function () {
            $('#missionPlannerMultiMission').fadeOut(300);
        });

        $('#setActiveMissionButton').on('click', function () {
            $('#activeNissionIndex').text(Number($('#multimissionOptionList').val()));
        });

        /////////////////////////////////////////////
        // Callback for Remove buttons
        /////////////////////////////////////////////
        $('#removeAllPoints').on('click', function () {
            if (markers.length && dialog.confirm(i18n.getMessage('confirm_delete_all_points'))) {
                if (removeAllMultiMissionCheck()) {
                    removeAllWaypoints();
                    updateMultimissionState();
                }
                for (let i = FC.SAFEHOMES.getMaxSafehomeCount(); i < FC.FW_APPROACH.getMaxFwApproachCount(); i++) {
                    FC.FW_APPROACH.clean(i);
                }
                plotElevation();
            }
        });

        $('#removePoint').on('click', function () {
            if (selectedMarker) {
                if (mission.isJumpTargetAttached(selectedMarker)) {
                    dialog.alert(i18n.getMessage('MissionPlannerJumpTargetRemoval'));
                }
                else if (mission.getAttachedFromWaypoint(selectedMarker) && mission.getAttachedFromWaypoint(selectedMarker).length != 0) {
                    if (dialog.confirm(i18n.getMessage('confirm_delete_point_with_options'))) {
                        mission.getAttachedFromWaypoint(selectedMarker).forEach(function (element) {

                            if (element.getAction() == MWNP.WPTYPE.LAND) {
                                FC.FW_APPROACH.clean(element.getNumber());
                            }

                            mission.dropWaypoint(element);
                            mission.update(singleMissionActive());
                        });
                        mission.dropWaypoint(selectedMarker);
                        selectedMarker = null;
                        mission.update(singleMissionActive());
                        clearEditForm();
                        refreshLayers();
                        plotElevation();
                    }
                }
                else {
                    mission.dropWaypoint(selectedMarker);
                    if (selectedMarker.getAction() == MWNP.WPTYPE.LAND) {
                        FC.FW_APPROACH.clean(selectedFwApproachWp.getNumber());
                    }
                    selectedMarker = null;
                    mission.update(singleMissionActive());
                    clearEditForm();
                    refreshLayers();
                    plotElevation();
                }
                updateMultimissionState();
            }
        });

        /////////////////////////////////////////////
        // Callback for Save/load buttons
        /////////////////////////////////////////////
        $('#loadFileMissionButton').on('click', function () {
            if (!fileLoadMultiMissionCheck()) return;

            if (markers.length && !dialog.confirm(i18n.getMessage('confirm_delete_all_points'))) return;
            var options = {
                filters: [ { name: "Mission file", extensions: ['mission'] } ]
            };
            dialog.showOpenDialog(options).then(result => {
                if (result.canceled) {
                    console.log('No file selected');
                    return;
                }
                if (result.filePaths.length == 1) {
                    loadMissionFile(result.filePaths[0]);
                }
            })
        });

        $('#saveFileMissionButton').on('click', function () {
            var options = {
                filters: [ { name: "Mission file", extensions: ['mission'] } ]
            };
            dialog.showSaveDialog(options).then(result =>  {
                if (result.canceled) {
                    return;
                }
                saveMissionFile(result.filePath);
            });
        });

        $('#loadMissionButton').on('click', function () {
            let message = multimissionCount ? 'confirm_overwrite_multimission_file_load_option' : 'confirm_delete_all_points';
            if ((markers.length || multimissionCount) && !dialog.confirm(i18n.getMessage(message))) return;
            removeAllWaypoints();
            $(this).addClass('disabled');
            GUI.log(i18n.getMessage('startGetPoint'));
            getWaypointsFromFC(false);
        });

        $('#saveMissionButton').on('click', function () {
            if (mission.isEmpty()) {
                dialog.alert(i18n.getMessage('no_waypoints_to_save'));
                return;
            }
            $(this).addClass('disabled');
            GUI.log(i18n.getMessage('startSendPoint'));
            sendWaypointsToFC(false);
        });

        $('#loadEepromMissionButton').on('click', function () {
            let message = multimissionCount ? 'confirm_overwrite_multimission_file_load_option' : 'confirm_delete_all_points';
            if ((markers.length || multimissionCount) && !dialog.confirm(i18n.getMessage(message))) return;
            removeAllWaypoints();
            $(this).addClass('disabled');
            GUI.log(i18n.getMessage('startGetPoint'));
            getWaypointsFromFC(true);
        });

        $('#saveEepromMissionButton').on('click', function () {
            if (mission.isEmpty()) {
                dialog.alert(i18n.getMessage('no_waypoints_to_save'));
                return;
            }
            $(this).addClass('disabled');
            GUI.log(i18n.getMessage('startSendPoint'));
            sendWaypointsToFC(true);
        });

        /////////////////////////////////////////////
        // Callback for settings
        /////////////////////////////////////////////
        $('#saveSettings').on('click', function () {
            let oldSafeRadiusSH = settings.safeRadiusSH;

            // update only default settings
            settings.alt = Number($('#MPdefaultPointAlt').val());
            settings.speed = Number($('#MPdefaultPointSpeed').val());
            settings.safeRadiusSH = Number($('#MPdefaultSafeRangeSH').val());
            settings.fwApproachAlt = Number($('#MPdefaultFwApproachAlt').val());
            settings.fwLandAlt = Number($('#MPdefaultLandAlt').val());

            saveSettings();

            if (settings.safeRadiusSH != oldSafeRadiusSH  && $('#showHideSafehomeButton').is(":visible")) {
                cleanSafehomeLayers();
                renderSafehomesOnMap();
                $('#SafeHomeSafeDistance').text(settings.safeRadiusSH);
            }

            closeSettingsPanel();
        });

        $('#cancelSettings').on('click', function () {
            loadSettings();
            closeSettingsPanel();
        });

        updateTotalInfo();
    }

    /////////////////////////////////////////////
    //
    // Load/Save MWP File Toolbox
    //
    /////////////////////////////////////////////
    function loadMissionFile(filename) {
        for (let i = FC.SAFEHOMES.getMaxSafehomeCount(); i < FC.FW_APPROACH.getMaxFwApproachCount(); i++) {
            FC.FW_APPROACH.clean(i);
        }

        window.electronAPI.readFile(filename).then(response => {
            if (response.error) {
                GUI.log(i18n.getMessage('errorReadingFile'));
                console.error(response.error);
                return;
            }

            xml2js.Parser({ 'explicitChildren': true, 'preserveChildrenOrder': true }).parseString(response.data, (err, result) => {
                if (err) {
                    GUI.log(i18n.getMessage('errorParsingFile'));
                    return console.error(err);
                }

                // parse mission file
                removeAllWaypoints();
                let missionEndFlagCount = 0;
                var node = null;
                var nodemission = null;
                for (var noderoot in result) {
                    if (!nodemission && noderoot.match(/mission/i)) {
                        nodemission = result[noderoot];
                        var missionIdx = -1;
                        if (nodemission.$$ && nodemission.$$.length) {
                            for (var i = 0; i < nodemission.$$.length; i++) {
                                node = nodemission.$$[i];
                                if (node['#name'].match(/version/i) && node.$) {
                                    for (var attr in node.$) {
                                        if (attr.match(/value/i)) {
                                            mission.setVersion(node.$[attr]);
                                        }
                                    }
                                } else if (node['#name'].match(/meta/i) || node['#name'].match(/mwp/i) && node.$) {
                                    for (var attr in node.$) {
                                        if (attr.match(/mission/i)) {
                                            missionIdx = parseInt(node.$[attr]) -1;
                                        } else if (attr.match(/zoom/i)) {
                                            mission.setCenterZoom(parseInt(node.$[attr]));
                                        } else if (attr.match(/cx/i)) {
                                            mission.setCenterLon(parseFloat(node.$[attr]) * 10000000);
                                        } else if (attr.match(/cy/i)) {
                                            mission.setCenterLat(parseFloat(node.$[attr]) * 10000000);
                                        } else if (attr.match(/home\-x/i)) {
                                            HOME.setLon(Math.round(parseFloat(node.$[attr]) * 10000000));
                                        } else if (attr.match(/home\-y/i)) {
                                            HOME.setLat(Math.round(parseFloat(node.$[attr]) * 10000000));
                                        }
                                    }
                                } else if (node['#name'].match(/missionitem/i) && node.$) {
                                    //var point = {};
                                    var point = new Waypoint(0,0,0,0);
                                    for (var attr in node.$) {
                                        if (attr.match(/no/i)) {
                                            point.setNumber(parseInt(node.$[attr]));
                                        } else if (attr.match(/action/i)) {
                                            if (node.$[attr].match(/WAYPOINT/i)) {
                                                point.setAction(MWNP.WPTYPE.WAYPOINT);
                                            } else if (node.$[attr].match(/PH_UNLIM/i) || node.$[attr].match(/POSHOLD_UNLIM/i)) {
                                                point.setAction(MWNP.WPTYPE.POSHOLD_UNLIM);
                                            } else if (node.$[attr].match(/PH_TIME/i) || node.$[attr].match(/POSHOLD_TIME/i)) {
                                                point.setAction(MWNP.WPTYPE.POSHOLD_TIME);
                                            } else if (node.$[attr].match(/RTH/i)) {
                                                point.setAction(MWNP.WPTYPE.RTH);
                                            } else if (node.$[attr].match(/SET_POI/i)) {
                                                point.setAction(MWNP.WPTYPE.SET_POI);
                                            } else if (node.$[attr].match(/JUMP/i)) {
                                                point.setAction(MWNP.WPTYPE.JUMP);
                                            } else if (node.$[attr].match(/SET_HEAD/i)) {
                                                point.setAction(MWNP.WPTYPE.SET_HEAD);
                                            } else if (node.$[attr].match(/LAND/i)) {
                                                point.setAction(MWNP.WPTYPE.LAND);
                                            } else {
                                                point.setAction(0);
                                            }
                                        } else if (attr.match(/lat/i)) {
                                            point.setLat(Math.round(parseFloat(node.$[attr]) * 10000000));
                                        } else if (attr.match(/lon/i)) {
                                            point.setLon(Math.round(parseFloat(node.$[attr]) * 10000000));
                                        } else if (attr.match(/alt/i)) {
                                            point.setAlt((parseInt(node.$[attr]) * 100));
                                        } else if (attr.match(/parameter1/i)) {
                                            point.setP1(parseInt(node.$[attr]));
                                        } else if (attr.match(/parameter2/i)) {
                                            point.setP2(parseInt(node.$[attr]));
                                        } else if (attr.match(/parameter3/i)) {
                                            point.setP3(parseInt(node.$[attr]));
                                        } else if (attr.match(/flag/i)) {
                                            point.setEndMission(parseInt(node.$[attr]));
                                            if (parseInt(node.$[attr]) == 0xA5) {
                                                missionEndFlagCount ++;
                                            }
                                        }
                                    }
                                    if (missionIdx >= 0) {
                                        point.setMultiMissionIdx(missionIdx);
                                    }
                                    mission.put(point);
                                } else if (node['#name'].match(/fwapproach/i) && node.$) {
                                    var fwApproach = new FwApproach(0);
                                    var idx = -1;
                                    for (var attr in node.$) {
                                        if (attr.match(/index/i)) {
                                            idx = parseInt(node.$[attr]);
                                        } else if (attr.match(/no/i)) {
                                            fwApproach.setNumber(parseInt(node.$[attr]));
                                        } else if (attr.match(/approach-alt/i)) {
                                            fwApproach.setApproachAltAsl(parseInt(node.$[attr]));
                                        } else if (attr.match(/land-alt/i)) {
                                            fwApproach.setLandAltAsl(parseInt(node.$[attr]));
                                        } else if (attr.match(/approach-direction/i)) {
                                            fwApproach.setApproachDirection(node.$[attr] == 'left' ? 0 : 1);
                                        } else if (attr.match(/landheading1/i)) {
                                            fwApproach.setLandHeading1(parseInt(node.$[attr]));
                                        } else if (attr.match(/landheading2/i)) {
                                            fwApproach.setLandHeading2(parseInt(node.$[attr]));
                                        } else if (attr.match(/sealevel-ref/i)) {
                                            fwApproach.setIsSeaLevelRef(parseBooleans(node.$[attr]) ? 1 : 0);
                                        }
                                    }
                                    FC.FW_APPROACH.insert(fwApproach, FC.SAFEHOMES.getMaxSafehomeCount() + idx);
                                }
                            }
                        }
                    }
                }

                if (missionEndFlagCount > 1) {
                    if (multimissionCount && ! dialog.confirm(i18n.getMessage('confirm_multimission_file_load'))) {
                        mission.flush();
                        return;
                    } else {
                        /* update Attached Waypoints (i.e non Map Markers)
                         * Ensure WPs numbered sequentially across all missions */
                        i = 1;
                        mission.get().forEach(function (element) {
                            element.setNumber(i);
                            i++;
                        });
                        mission.update(false, true);
                        multimissionCount = missionEndFlagCount;
                        multimission.reinit();
                        multimission.copy(mission);
                        renderMultimissionTable();
                        $('#missionPlannerMultiMission').fadeIn(300);
                    }
                } else {
                    // update Attached Waypoints (i.e non Map Markers)
                    mission.update(true, true);
                }
                updateMultimissionState();

                if (Object.keys(mission.getCenter()).length !== 0) {
                    var coord = fromLonLat([mission.getCenter().lon / 10000000 , mission.getCenter().lat / 10000000]);
                    map.getView().setCenter(coord);
                    if (mission.getCenter().zoom) {
                        map.getView().setZoom(mission.getCenter().zoom);
                    }
                    else {
                        map.getView().setZoom(16);
                    }
                }
                else {
                    setView(16);
                }

                redrawLayers();
                if (!(HOME.getLatMap() == 0 && HOME.getLonMap() == 0)) {
                    updateHome();
                }
                updateTotalInfo();
                let sFilename = String(filename.split('\\').pop().split('/').pop());
                GUI.log(sFilename + i18n.getMessage('loadedSuccessfully'));
                updateFilename(sFilename);
            });
        });
    }

    function saveMissionFile(filename) {
        var center = toLonLat(map.getView().getCenter());
        var zoom = map.getView().getZoom();
        let multimission = multimissionCount && !singleMissionActive();
        let version = multimission ? '4.0.0' : '2.3-pre8';
        var data = {
            'version': { $: { 'value': version } },
            'mwp': { $: { 'cx': (Math.round(center[0] * 10000000) / 10000000),
                          'cy': (Math.round(center[1] * 10000000) / 10000000),
                          'home-x' : HOME.getLonMap(),
                          'home-y' : HOME.getLatMap(),
                          'zoom': zoom } },
            'missionitem': [],
            'fwapproach': []
        };

        let missionStartWPNumber = 0;
        let missionNumber = 1;
        mission.get().forEach(function (waypoint) {
            if (waypoint.getNumber() - missionStartWPNumber == 0 && multimission) {
                let meta = {$:{
                        'mission': missionNumber
                    }};
                data.missionitem.push(meta);
            }
            var point = { $: {
                        'no': waypoint.getNumber() - missionStartWPNumber + 1,
                        'action': MWNP.WPTYPE.REV[waypoint.getAction()],
                        'lat': waypoint.getLatMap(),
                        'lon': waypoint.getLonMap(),
                        'alt': (waypoint.getAlt() / 100),
                        'parameter1': (MWNP.WPTYPE.REV[waypoint.getAction()] == "JUMP" ? waypoint.getP1()+1 : waypoint.getP1()),
                        'parameter2': waypoint.getP2(),
                        'parameter3': waypoint.getP3(),
                        'flag': waypoint.getEndMission(),
                    } };
            data.missionitem.push(point);

            if (waypoint.getEndMission() == 0xA5) {
                missionStartWPNumber = waypoint.getNumber() + 1;
                missionNumber ++;
            }
        });
        let approachIdx = 0;
        for (let i = FC.SAFEHOMES.getMaxSafehomeCount(); i < FC.FW_APPROACH.getMaxFwApproachCount(); i++){
            let approach = FC.FW_APPROACH.get()[i];
            if (approach.getLandHeading1() != 0 || approach.getLandHeading2() != 0) {
                var item = { $: {
                    'index': approachIdx,
                    'no': approach.getNumber(),
                    'approach-alt': approach.getApproachAltAsl(),
                    'land-alt': approach.getLandAltAsl(),
                    'approach-direction': approach.getApproachDirection() == 0 ? 'left' : 'right',
                    'landheading1': approach.getLandHeading1(),
                    'landheading2': approach.getLandHeading2(),
                    'sealevel-ref': approach.getIsSeaLevelRef() ? 'true' : 'false'
                }};
                data.fwapproach.push(item);
            }
            approachIdx++;
        }

        var builder = new xml2js.Builder({ 'rootName': 'mission', 'renderOpts': { 'pretty': true, 'indent': '\t', 'newline': '\n' } });
        var xml = builder.buildObject(data);
        xml = xml.replace(/missionitem mission/g, 'meta mission');
        window.electronAPI.writeFile(filename, xml).then(err => {
            if (err) {
                GUI.log(i18n.getMessage('ErrorWritingFile'));
                return console.error(err);
            }
            let sFilename = String(filename.split('\\').pop().split('/').pop());
            GUI.log(sFilename + i18n.getMessage('savedSuccessfully'));
            updateFilename(sFilename);
        });
    }

    /////////////////////////////////////////////
    // Load/Save FC mission Toolbox
    // mission = configurator store, WP number indexed from 0, FC.MISSION_PLANNER = FC NVM store, WP number indexed from 1
    /////////////////////////////////////////////
    function getWaypointsFromFC(loadEeprom) {

        var loadChainer = new MSPChainerClass();
        var chain = [mspHelper.loadFwApproach];
        if (loadEeprom) {
            chain.push(function(callback) {
                MSP.send_message(MSPCodes.MSP_WP_MISSION_LOAD, [0], callback);
            });
        }
        chain.push(mspHelper.loadWaypoints);
        chain.push(function() {
            GUI.log(i18n.getMessage('endGetPoint'));
            if (loadEeprom) {
                GUI.log(i18n.getMessage('eeprom_load_ok'));
                $('#loadEepromMissionButton').removeClass('disabled');
            } else {
                $('#loadMissionButton').removeClass('disabled');
            }
            if (!FC.MISSION_PLANNER.getCountBusyPoints()) {
                dialog.alert(i18n.getMessage('no_waypoints_to_load'));
                return;
            }
            mission.reinit();
            mission.copy(FC.MISSION_PLANNER);
            mission.update(false, true);

            /* check multimissions */
            multimissionCount = 0;
            mission.get().forEach(function (element) {
                if (element.getEndMission() == 0xA5) {
                    element.setMultiMissionIdx(multimissionCount);
                    multimissionCount++;
                }
            });
            multimissionCount = multimissionCount > 1 ? multimissionCount : 0;
            multimission.reinit();
            if (multimissionCount > 1) {
                multimission.copy(mission);
                $('#missionPlannerMultiMission').fadeIn(300);
            }
            renderMultimissionTable();
            setView(16);
            redrawLayers();
            updateTotalInfo();
        });

        loadChainer.setChain(chain);
        loadChainer.execute();
    }

    function sendWaypointsToFC(saveEeprom) {
        FC.MISSION_PLANNER.reinit();
        FC.MISSION_PLANNER.copy(mission);
        FC.MISSION_PLANNER.update(false, true, true);
        let saveChainer = new MSPChainerClass();
        saveChainer.setChain([
            mspHelper.saveWaypoints,
            mspHelper.saveFwApproach,
            function () {
                GUI.log(i18n.getMessage('endSendPoint'));
                if (saveEeprom) {
                    $('#saveEepromMissionButton').removeClass('disabled');
                    GUI.log(i18n.getMessage('eeprom_saved_ok'));
                    MSP.send_message(MSPCodes.MSP_WP_MISSION_SAVE, [0], false, setMissionIndex);
                } else {
                    $('#saveMissionButton').removeClass('disabled');
                }
                mission.setMaxWaypoints(FC.MISSION_PLANNER.getMaxWaypoints());
                mission.setValidMission(FC.MISSION_PLANNER.getValidMission());
                mission.setCountBusyPoints(FC.MISSION_PLANNER.getCountBusyPoints());
                multimission.setMaxWaypoints(mission.getMaxWaypoints());
                updateTotalInfo();
                mission.reinit();
                mission.copy(FC.MISSION_PLANNER);
                mission.update(false, true);
                refreshLayers();
                $('#MPeditPoint').fadeOut(300);
            }
        ]);
        saveChainer.execute();

        function setMissionIndex() {
            let activeIndex = singleMissionActive() ? 1 : $('#activeNissionIndex').text();
            mspHelper.setSetting("nav_wp_multi_mission_index", activeIndex, function () {
                MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, function () {
                    GUI.log(i18n.getMessage('multimission_active_index_saved_eeprom'));
                });
            });
        }
    }

    function updateTotalInfo() {
        if (CONFIGURATOR.connectionValid) {
            let availableWPs = mission.getMaxWaypoints() - mission.get().length;
            if (multimissionCount && singleMissionActive()) {
                availableWPs = availableWPs - multimission.get().length;
            }
            $('#availablePoints').text(availableWPs + '/' + mission.getMaxWaypoints());
            $('#missionValid').html(mission.getValidMission() ? i18n.getMessage('armingCheckPass') : i18n.getMessage('armingCheckFail'));
        }
    }

    function updateFilename(filename) {
        $('#missionFilename').text(filename);
        $('#infoMissionFilename').show();
    }

    function changeSwitch(element, checked) {
        element.prop('checked', checked);
    }

    function updateSelectedShAndFwAp(index) {
        selectedSafehome = FC.SAFEHOMES.get()[index];
        selectedFwApproachSh = FC.FW_APPROACH.get()[index];
    }

    /* resetAltitude = true : For selected WPs only. Changes WP Altitude value back to previous value if setting below ground level.
     ^ resetAltitude = false : changes WP Altitude to value required to give ground clearance = default Altitude setting
     ^ AbsAltCheck : check value for whether or not to use absolute altitude. This can be the P3 bitset or excplicitly set to true or false */
    function checkAltElevSanity(resetAltitude, checkAltitude, elevation, AbsAltCheck) {
        let groundClearance = "NO HOME";
        let altitude = checkAltitude;
        AbsAltCheck = (typeof AbsAltCheck == "boolean") ? AbsAltCheck : TABS.mission_control.isBitSet(AbsAltCheck, MWNP.P3.ALT_TYPE);

        if (AbsAltCheck) {
            if (checkAltitude < 100 * elevation) {
                if (resetAltitude) {
                    dialog.alert(i18n.getMessage('MissionPlannerAltitudeChangeReset'));
                    altitude = selectedMarker.getAlt();
                } else {
                    altitude = settings.alt + 100 * elevation;
                }
            }
            groundClearance = altitude / 100 - elevation;
        } else if (homeMarkers.length && HOME.getAlt() != "N/A") {
            let elevationAtHome = HOME.getAlt();
            if ((checkAltitude / 100 + elevationAtHome) < elevation) {
                if (resetAltitude) {
                    dialog.alert(i18n.getMessage('MissionPlannerAltitudeChangeReset'));
                    altitude = selectedMarker.getAlt();
                } else {
                    let currentGroundClearance = 100 * Number($('#groundClearanceValueAtWP').text());
                    if (isNaN(currentGroundClearance) || selectedMarker == null) {
                        currentGroundClearance = settings.alt;  // use default altitude if no current ground clearance
                    }
                    altitude = currentGroundClearance + 100 * (elevation - elevationAtHome);
                }
            }
            groundClearance = altitude / 100 + (elevationAtHome - elevation);
        }
        $('#pointAlt').val(altitude);
        let altitudeMeters = parseInt(altitude) / 100;
        $('#altitudeInMeters').text(` ${altitudeMeters}m`);
        document.getElementById('groundClearanceAtWP').style.color = groundClearance < (settings.alt / 100) ? "#FF0000" : "#303030";
        $('#groundClearanceValueAtWP').text(` ${groundClearance}`);

        return altitude;
    }

    // Track elevation chart update sequence to prevent race conditions
    let elevationUpdateSequence = 0;

    function plotElevation() {
        if ($('#missionPlannerElevation').is(":visible") && !disableMarkerEdit) {
            if (mission.isEmpty()) {
                const ctx = $("#elevationChart").get(0);

                if (!ctx || ctx.tagName !== 'CANVAS') {
                    console.error('elevationChart canvas element not found');
                    return;
                }

                // Destroy existing chart if it exists
                if (window.elevationChartInstance) {
                    window.elevationChartInstance.destroy();
                    window.elevationChartInstance = null;
                }

                // Create empty chart with message
                window.elevationChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: [0],
                        datasets: [
                            {
                                label: 'WGS84 elevation',
                                data: [{x: 0, y: 0}],
                                borderColor: '#ff7f0e',
                                backgroundColor: 'rgba(255, 127, 14, 0.2)',
                                borderWidth: 2,
                                fill: true,
                                pointRadius: 0,
                            },
                            {
                                label: 'Mission altitude',
                                data: [{x: 0, y: 0}],
                                borderColor: '#1497f1',
                                backgroundColor: 'rgba(20, 151, 241, 0)',
                                borderWidth: 2,
                                pointRadius: 5,
                                pointBackgroundColor: '#1f77b4',
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Mission Elevation Profile'
                            },
                            legend: {
                                display: true,
                                position: 'top',
                            }
                        },
                        scales: {
                            x: {
                                type: 'linear',
                                title: {
                                    display: true,
                                    text: 'Distance (m)'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Elevation (m)'
                                },
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
            else {
                (async () => {
                    // Capture current sequence number to detect stale updates
                    const currentSequence = ++elevationUpdateSequence;

                    try {
                        const [lengthMission, totalMissionDistance, samples, elevation, altPoint2measure, namePoint2measure, refPoint2measure] = await mission.getElevation(globalSettings);

                        // Check if a newer update has been triggered while we were fetching data
                        if (currentSequence !== elevationUpdateSequence) {
                            console.log('Ignoring stale elevation data');
                            return;
                        }
                        const x_elevation = Array.from(Array(samples+1), (_,i)=> i*totalMissionDistance/samples);
                        const y_missionElevation = altPoint2measure.map((x,i) => x / 100 + HOME.getAlt()*(1-refPoint2measure[i]));

                        /* Show multi mission number in plot title when single mission displayed
                         * Not updated when ALL multi missions displayed since plot disabled
                         */
                        let missionNumber = '';
                        if (multimissionCount) {
                            missionNumber = ' ' + ($('#multimissionOptionList').val());
                        }
                        const chartTitle = 'Mission' + missionNumber + ' Elevation Profile';

                        // Calculate Y-axis range safely
                        const minElevation = elevation.length > 0 ? Math.min(...elevation) : 0;
                        const minMission = y_missionElevation.length > 0 ? Math.min(...y_missionElevation) : 0;
                        const maxElevation = elevation.length > 0 ? Math.max(...elevation) : 100;
                        const maxMission = y_missionElevation.length > 0 ? Math.max(...y_missionElevation) : 100;

                        const ctx = $("#elevationChart").get(0);
                        if (!ctx || ctx.tagName !== 'CANVAS') {
                            console.error('elevationChart canvas element not found');
                            return;
                        }

                        const newData = {
                            labels: x_elevation,
                            datasets: [
                                {
                                    label: 'WGS84 elevation',
                                    data: elevation.map((y, i) => ({x: x_elevation[i], y: y})),
                                    borderColor: '#ff7f0e',
                                    backgroundColor: 'rgba(255, 127, 14, 0.2)',
                                    borderWidth: 2,
                                    fill: true,
                                    pointRadius: 0,
                                },
                                {
                                    label: 'Mission altitude',
                                    data: lengthMission.map((x, i) => ({x: x, y: y_missionElevation[i]})),
                                    borderColor: '#1497f1',
                                    backgroundColor: 'rgba(20, 151, 241, 0)',
                                    borderWidth: 2,
                                    pointRadius: 5,
                                    pointBackgroundColor: '#1f77b4',
                                }
                            ]
                        };

                        // Update existing chart if it exists, otherwise create new one
                        if (window.elevationChartInstance) {
                            // Update data
                            window.elevationChartInstance.data = newData;
                            window.elevationChartInstance.options.plugins.title.text = chartTitle;
                            window.elevationChartInstance.options.scales.y.min = Math.floor(-10 + Math.min(minMission, minElevation));
                            window.elevationChartInstance.options.scales.y.max = Math.ceil(10 + Math.max(maxMission, maxElevation));
                            // Trigger re-render without animation for better performance during drag operations
                            window.elevationChartInstance.update('none');
                        } else {
                            // Create new chart
                            window.elevationChartInstance = new Chart(ctx, {
                                type: 'line',
                                data: newData,
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: chartTitle
                                        },
                                        legend: {
                                            display: true,
                                            position: 'top',
                                        }
                                    },
                                    scales: {
                                        x: {
                                            type: 'linear',
                                            title: {
                                                display: true,
                                                text: 'Distance (m)'
                                            }
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Elevation (m)'
                                            },
                                            min: Math.floor(-10 + Math.min(minMission, minElevation)),
                                            max: Math.ceil(10 + Math.max(maxMission, maxElevation))
                                        }
                                    }
                                }
                            });
                        }
                    } catch (error) {
                        console.error('Failed to plot elevation:', error);
                    }
                })()
            }
        }
    }

    function parseBooleans (str) {
        if (/^(?:true|false)$/i.test(str)) {
          str = str.toLowerCase() === 'true';
        }
        return str;
      };
};

TABS.mission_control.isBitSet = function(bits, testBit) {
    let isTrue = ((bits & (1 << testBit)) != 0);

    return isTrue;
}

TABS.mission_control.setBit = function(bits, bit, value) {
    return value ? bits |= (1 << bit) : bits &= ~(1 << bit);
}

// window.addEventListener("error", handleError, true);

// function handleError(evt) {
    // if (evt.message) { // Chrome sometimes provides this
      // GUI.alert("error: "+evt.message +" at linenumber: "+evt.lineno+" of file: "+evt.filename);
    // } else {
      // GUI.alert("error: "+evt.type+" from element: "+(evt.srcElement || evt.target));
    // }
// }

TABS.mission_control.cleanup = function (callback) {
    if (callback) callback();
};
