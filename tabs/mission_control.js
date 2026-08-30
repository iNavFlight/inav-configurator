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
import DragAndDrop from 'ol/interaction/DragAndDrop.js';
import {GPX, GeoJSON, IGC, KML, TopoJSON} from 'ol/format.js';
import { unzipSync } from 'fflate';

import MSPChainerClass from './../js/msp/MSPchainer';
import mspHelper from './../js/msp/MSPHelper';
import MSPCodes from './../js/msp/MSPCodes';
import MSP from './../js/msp';
import mspQueue from './../js/serial_queue';
import GUI from './../js/gui';
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
import elevationFetch from './../js/elevationFetch';

import html from'./mission_control.html?raw';

function extractKmlFromKmz(source) {
    const data = source instanceof Uint8Array ? source : new Uint8Array(source);
    const unzipped = unzipSync(data);
    const kmlEntry = Object.keys(unzipped).find(name => name === 'doc.kml')
                  || Object.keys(unzipped).find(name => name.endsWith('.kml'));
    if (!kmlEntry) throw new Error('No KML file found in KMZ archive');
    return new TextDecoder().decode(unzipped[kmlEntry]);
}

class KMZ extends KML {
    getType() { return 'arraybuffer'; }
    readFeature(source, options) { return super.readFeature(extractKmlFromKmz(source), options); }
    readFeatures(source, options) { return super.readFeatures(extractKmlFromKmz(source), options); }
}

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
    8:  {parameter1: 'Speed (cm/s)', parameter2: '', parameter3: 'Sea level Ref'}
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

const missionControlTab = {};
missionControlTab.isYmapLoad = false;

// Shared between plotElevation() (inside initialize) and cleanup()
let elevationChartInstance = null;
function convertCentimetersToMeters(val) {
    return Number.parseInt(val) / 100;
}

/* How a waypoint reads in the selector: its number, what it does, how high it flies. */
function wpListLabel(wp) {
    const typeNames = {1: 'Waypoint', 2: 'PH_UNLIM', 3: 'PH_TIME', 4: 'RTH', 5: 'POI', 6: 'JUMP', 7: 'HEAD', 8: 'Land'};
    const type = typeNames[wp.getAction()] || ('Type ' + wp.getAction());
    return (wp.getLayerNumber() + 1) + ' \u00b7 ' + type + ' \u00b7 ' + convertCentimetersToMeters(wp.getAlt()) + ' m';
}

/* Below the ground it flies over means straight into the terrain. The terrain is the
   true ground; the conversion datum stands in when only the reference moved on a known
   home, and without either there is nothing to judge against. */
function endsBelowGround(wp, index, plan) {
    // A point of interest marks a place on the ground for the camera to look at; the
    // aircraft never flies to it, and the save leaves its altitude alone.
    if (wp.getAction() == MWNP.WPTYPE.SET_POI) return false;

    let groundCm = null;
    if (plan.terrainCm) {
        groundCm = plan.terrainCm[index];
    } else if (plan.homeCm !== null) {
        groundCm = plan.homeCm;
    }
    if (groundCm === null) return false;

    const wpAbsolute = missionControlTab.isBitSet(wp.getP3(), MWNP.P3.ALT_TYPE);
    return (wpAbsolute ? wp.getAlt() - groundCm : wp.getAlt()) < 0;
}

/* The default fields hold centimetres and centimetres per second, which nobody flies
   in, so each carries its value in metres and km/h alongside. */
function updateDefaultUnitHints() {
    const altCm = Number($('#MPdefaultPointAlt').val());
    const speedCms = Number($('#MPdefaultPointSpeed').val());
    $('#MPdefaultPointAltM').text(Number.isNaN(altCm) ? '' : ' ' + (altCm / 100) + 'm');
    $('#MPdefaultPointSpeedKmh').text(Number.isNaN(speedCms) ? '' : ' ' + (Math.round(speedCms * 0.36) / 10) + 'km/h');
}

/* The default fields are plain text boxes and hold whatever was typed. A value that is
   not a number differs from the stored one, so it would count as a change and be written
   into every waypoint the save touches. Refuse it and put the stored value back. */
function readNumericSetting(selector, stored) {
    const typed = String($(selector).val()).trim();
    const value = Number(typed);
    if (typed !== '' && Number.isFinite(value)) return value;

    $(selector).val(String(stored));
    return stored;
}

/* One request for the whole mission instead of one per waypoint; opentopodata takes
   locations separated by a pipe and answers in the same order. */
async function fetchWaypointElevations(waypoints) {
    const elevations = [];
    try {
        for (let start = 0; start < waypoints.length; start += 100) {
            const chunk = waypoints.slice(start, start + 100);
            const locations = chunk.map(wp => wp.getLatMap() + ',' + wp.getLonMap()).join('|');
            const response = await elevationFetch('https://api.opentopodata.org/v1/aster30m?locations=' + locations);
            if (!response.ok) return null;
            const answer = await response.json();
            if (answer.status != 'OK' || !answer.results || answer.results.length != chunk.length) return null;
            answer.results.forEach(result => elevations.push(result.elevation == null ? null : result.elevation));
        }
    } catch (error) {
        // offline or the service unreachable - same handled failure as a bad answer
        console.warn('elevation lookup failed:', error.message);
        return null;
    }
    return elevations.includes(null) ? null : elevations;
}
missionControlTab.initialize = function (callback) {

    let cursorInitialized = false;
    let curPosStyle;
    let curPosGeo;
    let rthGeo;
    let breadCrumbLS;
    let breadCrumbFeature;
    let breadCrumbStyle;
    let breadCrumbSource;
    let breadCrumbVector;
    let autoCenteredOnFix = false;
    let lastGpsPos = null;
    let infoOverlayEl;
    let infoOverlaySpans;
    let isOffline = false;
    let selectedSafehome;
    let $safehomeContentBox;
    let $waypointOptionsTableBody;
    let selectedGeozone;
    let $geozoneContent;
    let invalidGeoZones = false;
    let isGeozoneEnabeld = false;
    let settings = {speed: 0, alt: 5000, safeRadiusSH: 50, fwApproachAlt: 60, fwLandAlt: 5, maxDistSH: 0, fwApproachLength: 0, fwLoiterRadius: 0};

    if (GUI.active_tab !== this) {
        GUI.active_tab = this;
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
            $('#centerOnDrone').hide();
            isOffline = true;
        } else {
            $('#centerOnDrone').show();
        }

        $('#infoGeozoneMissionWarning').hide();
        $('#infoGeozoneInvalid').hide();
        $safehomeContentBox = $('#SafehomeContentBox');
        $waypointOptionsTableBody = $('#waypointOptionsTableBody');
        $geozoneContent = $('#geozoneContent');
        $('#centerOnDrone').css({ opacity: 0.45, pointerEvents: 'none' });

       
            loadSettings();
            // let the dom load finish, avoiding the resizing of the map
            setTimeout(initMap, 200);
            // Set initial button visibility based on mission state
            setTimeout(updateLocationButtonsVisibility, 300);
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

        // Append shortcut hints after i18n sets titles (Ctrl-based)
        const addShortcutHint = (selector, suffix) => {
            const el = $(selector);
            if (!el.length) return;
            const current = el.attr('title') || '';
            if (current.includes(suffix)) return;
            el.attr('title', `${current}${current ? ' ' : ''}${suffix}`.trim());
        };
        addShortcutHint('#centerOnDroneButton', '(Ctrl+C)');
        addShortcutHint('#loadFileMissionButton', '(Ctrl+L)');
        addShortcutHint('#saveFileMissionButton', '(Ctrl+S)');
        addShortcutHint('#removeAllPoints a', '(Ctrl+D)');
        addShortcutHint('#searchAddressButton', '(Ctrl+A)');

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
                    const latLonPrecision = 5; // Raise this to 6 if you want more precise lat/lon readout later.

          const hasGpsLock = FC.GPS_DATA.fix >= 2;

          //Update map
          if (hasGpsLock) {

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

                  map.addLayer(rthLayer);
                  map.addLayer(breadCrumbVector);
                  map.addLayer(currentPositionLayer);

                                    // Create a simple top bar overlay for telemetry text
                                    const targetEl = map.getTargetElement();
                                    if (targetEl) {
                                        if (!targetEl.style.position) {
                                            targetEl.style.position = 'relative';
                                        }
                                        infoOverlayEl = document.createElement('div');
                                        infoOverlayEl.className = 'mc-gps-inline';
                                        Object.assign(infoOverlayEl.style, {
                                            position: 'absolute',
                                            bottom: '1.125rem',
                                            left: '0',
                                            right: '0',
                                            padding: '0.375rem 0.625rem',
                                            background: 'rgba(0, 0, 0, 0.45)',
                                            color: '#fff',
                                            font: '600 1rem "Segoe UI", Calibri, sans-serif',
                                            textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
                                            textAlign: 'center',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: '1.125rem',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            fontVariantNumeric: 'tabular-nums',
                                            pointerEvents: 'none',
                                            zIndex: 5,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            visibility: 'hidden'
                                        });

                                        infoOverlaySpans = {};
                                        const telemetryFields = ['H', 'Alt', 'Spd', 'Dist', 'Sats', 'Lat', 'Lon'];
                                        telemetryFields.forEach((field) => {
                                            const span = document.createElement('span');
                                            span.style.minWidth = '4.875rem';
                                            span.style.textAlign = 'center';
                                            infoOverlaySpans[field] = span;
                                            infoOverlayEl.appendChild(span);
                                        });

                                        targetEl.appendChild(infoOverlayEl);
                                    }
              }

              let gpsPos = fromLonLat([lon, lat]);
              curPosGeo.setCoordinates(gpsPos);
              lastGpsPos = gpsPos;
              $('#centerOnDrone').css({ opacity: 1, pointerEvents: 'auto' });

                            // Uncomment to auto-center/zoom once when GPS lock is first acquired
                            // if (!autoCenteredOnFix && map && map.getView()) {
                            //     autoCenteredOnFix = true;
                            //     map.getView().setCenter(gpsPos);
                            //     if (map.getView().getZoom() < 14) {
                            //         map.getView().setZoom(14);
                            //     }
                            // }

              breadCrumbLS.appendCoordinate(gpsPos);

              var coords = breadCrumbLS.getCoordinates();
              if(coords.length > 100)
              {
                coords.shift();
                breadCrumbLS.setCoordinates(coords);
              }

              curPosStyle.getImage().setRotation((FC.SENSOR_DATA.kinematics[2]/360.0) * 6.28318);

                            if (infoOverlayEl) {
                                const latStr = lat.toFixed(latLonPrecision);
                                const lonStr = lon.toFixed(latLonPrecision);
                                infoOverlayEl.style.visibility = 'visible';
                                if (infoOverlaySpans) {
                                    infoOverlaySpans.H.textContent = `H: ${FC.SENSOR_DATA.kinematics[2]}`;
                                    infoOverlaySpans.Alt.textContent = `Alt: ${FC.SENSOR_DATA.altitude} m`;
                                    infoOverlaySpans.Spd.textContent = `Spd: ${FC.GPS_DATA.speed} cm/s`;
                                    infoOverlaySpans.Dist.textContent = `Dist: ${FC.GPS_DATA.distanceToHome} m`;
                                    infoOverlaySpans.Sats.textContent = `Sats: ${FC.GPS_DATA.numSat}`;
                                    infoOverlaySpans.Lat.textContent = `Lat: ${latStr}`;
                                    infoOverlaySpans.Lon.textContent = `Lon: ${lonStr}`;
                                } else {
                                    infoOverlayEl.textContent =
                                        `H: ${FC.SENSOR_DATA.kinematics[2]}  ` +
                                        `Alt: ${FC.SENSOR_DATA.altitude} m  ` +
                                        `Spd: ${FC.GPS_DATA.speed} cm/s  ` +
                                        `Dist: ${FC.GPS_DATA.distanceToHome} m  ` +
                                        `Sats: ${FC.GPS_DATA.numSat}  ` +
                                        `Lat: ${latStr}  Lon: ${lonStr}`;
                                }
                            }
          }
                    else if (infoOverlayEl) {
                        $('#centerOnDrone').css({ opacity: 0.45, pointerEvents: 'none' });
                        infoOverlayEl.style.visibility = 'hidden';
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
        $('#pointSavedTick').hide();
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
        updateDefaultUnitHints();
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
        updateLocationButtonsVisibility();
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
        updateLocationButtonsVisibility();
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

    async function fileLoadMultiMissionCheck() {
        if (singleMissionActive()) {
            return true;
        } else if (await dialog.confirm(i18n.getMessage('confirm_overwrite_multimission_file_load_option'))) {
            var options = {
                filters: [ { name: "Mission file", extensions: ['mission'] } ]
            };
            const result = await dialog.showOpenDialog(options);
            if (!result.canceled && result.filePaths.length == 1) {
                loadMissionFile(result.filePaths[0]);
                multimissionCount = 0;
                multimission.flush();
                renderMultimissionTable();
            }
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
    // Layer Management Functions
    //
    /////////////////////////////////////////////

    function updateLayerListUI() {
        $('#layerListContainer').empty();
        const customLayers = [];
        map.getLayers().forEach(layer => {
            if (layer.get('is_custom_overlay') === true) {
                customLayers.push(layer);
            }
        });
        if (customLayers.length === 0) {
            $('#layerListContainer').html('<div style="color: #888; font-style: italic;">No layers loaded</div>');
            return;
        }
        customLayers.forEach((layer, i) => {
            const layerName = layer.get('name');
            const isVisible = layer.getVisible();
            const layerId = 'layer_' + layerName.replaceAll(/[^a-zA-Z0-9]/g, '_' + i);
            const layerHtml = `
                <div class="layer-item" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 5px; border-bottom: 1px solid #444;">
                    <div style="flex: 1; display: flex; align-items: center; min-width: 0;">
                        <input id="${layerId}" type="checkbox" class="togglemedium layer-toggle" data-layer-name="${layerName}" ${isVisible ? 'checked' : ''} style="flex-shrink: 0;">
                        <label for="${layerId}" style="margin-left: 8px; cursor: pointer; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${layerName}</label>
                    </div>
                    <div class="btnTable btnTableIcon btnTable-danger" style="margin-left: 10px; flex-shrink: 0;">
                        <a class="ic_removeAll layer-delete" data-layer-name="${layerName}" href="#" title="Delete layer"></a>
                    </div>
                </div>
            `;
            $('#layerListContainer').append(layerHtml);
        });
        GUI.switchery();
        $('.layer-toggle').on('change', function() {
            const layerName = $(this).attr('data-layer-name');
            const isChecked = $(this).is(':checked');
            map.getLayers().forEach(layer => {
                if (layer.get('name') === layerName && layer.get('is_custom_overlay')) {
                    layer.setVisible(isChecked);
                }
            });
        });
        $('.layer-delete').on('click', async function(event) {
            event.preventDefault();
            const layerName = $(this).attr('data-layer-name');
            if (await dialog.confirm(i18n.getMessage('layerConfirmDelete'))) {
                removeLayerFromDisk(layerName);
            }
        });
    }

    function saveLayerToDisk(layer) {
        let customOverlayList = store.get('custom_overlay_list');
        if (customOverlayList === undefined) {
            customOverlayList = [];
        }
        const writer = new GeoJSON();
        const geojsonStr = writer.writeFeatures(layer.getSource().getFeatures());
        const layerName = layer.get('name');
        customOverlayList = customOverlayList.filter(l => l.name !== layerName);
        const savedLayer = {
            name: layerName,
            layer_data: geojsonStr,
            visible: layer.getVisible()
        };
        customOverlayList.push(savedLayer);
        store.set('custom_overlay_list', customOverlayList);
        GUI.log(`Saved layer: ${layerName}`);
    }

    function removeLayerFromDisk(layerName) {
        let customOverlayList = store.get('custom_overlay_list');
        if (!customOverlayList) return;
        customOverlayList = customOverlayList.filter(l => l.name !== layerName);
        store.set('custom_overlay_list', customOverlayList);
        const layersToRemove = [];
        map.getLayers().forEach(layer => {
            if (layer.get('name') === layerName && layer.get('is_custom_overlay')) {
                layersToRemove.push(layer);
            }
        });
        layersToRemove.forEach(layer => map.removeLayer(layer));
        updateLayerListUI();
        GUI.log(`Removed layer: ${layerName}`);
    }

    function createGeoLayer(features, fileName, visible) {
        const vectorSource = new VectorSource({ features: features });
        vectorSource.forEachFeature(function(feature) {
            if (!feature.get('name')) feature.set('name', fileName);
            feature.set('show_info_on_hover', true);
        });
        const vectorLayer = new VectorLayer({ source: vectorSource, visible: visible });
        vectorLayer.set('name', fileName);
        vectorLayer.set('is_custom_overlay', true);
        vectorLayer.set('no_interaction', true);
        map.addLayer(vectorLayer);
        return vectorLayer;
    }

    function addGeoLayerToMap(features, fileName, visible = true) {
        const vectorLayer = createGeoLayer(features, fileName, visible);
        saveLayerToDisk(vectorLayer);
        updateLayerListUI();
        GUI.log(`Added layer: ${fileName}`);
    }

    async function loadGeoFile(filePath) {
        const fileName = filePath.split('/').pop().split('\\').pop();
        const ext = fileName.split('.').pop().toLowerCase();

        const response = await globalThis.electronAPI.readFile(filePath, ext === 'kmz' ? null : undefined);
        if (response.error) {
            GUI.log(`Error reading file: ${response.error}`);
            dialog.alert(i18n.getMessage('layerLoadError'));
            return;
        }

        let format;
        let fileData = response.data;

        switch (ext) {
            case 'kmz': fileData = extractKmlFromKmz(response.data); format = new KML(); break;
            case 'kml': format = new KML(); break;
            case 'json':
            case 'geojson': format = new GeoJSON(); break;
            case 'gpx': format = new GPX(); break;
            case 'igc': format = new IGC(); break;
            case 'topojson': format = new TopoJSON(); break;
            default: throw new Error('Unsupported file format');
        }

        const features = format.readFeatures(fileData, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });

        if (features.length === 0) throw new Error('No features found in file');

        addGeoLayerToMap(features, fileName);
        GUI.log(`Loaded ${features.length} features from ${fileName}`);
    }

    /////////////////////////////////////////////
    //
    // Manage Waypoint
    //
    /////////////////////////////////////////////

    // Show/hide location buttons based on waypoint presence
    function updateLocationButtonsVisibility() {
        if (mission.isEmpty() && !multimissionCount) {
            $('#centerOnCurrentLocation').fadeIn(300);
        } else {
            $('#centerOnCurrentLocation').fadeOut(300);
        }
    }

    function removeAllWaypoints() {
        mission.reinit();
        refreshLayers();
        clearEditForm();
        updateTotalInfo();
        clearFilename();
        updateLocationButtonsVisibility();
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

        renderWaypointSelect();

        if (!isOffline) geozoneWarning();
    }

    function redrawLayer() {
        repaintLine4Waypoints(mission);
        if (selectedFeature && selectedMarker) {
            selectedFeature.setStyle(getWaypointIcon(selectedMarker, true));
        }
        renderWaypointSelect();
    }

    /////////////////////////////////////////////
    //
    // Waypoint selector panel
    //
    /////////////////////////////////////////////

    function selectWaypointMarkerByNumber(wpNumber, previousLayerIndex) {
        $("#editMission").hide();
        selectedMarker = mission.getWaypoint(wpNumber);
        selectedFeature = markers[selectedMarker.getLayerNumber()].getSource().getFeatures()[0];

        selectedFwApproachWp = FC.FW_APPROACH.get()[FC.SAFEHOMES.getMaxSafehomeCount() + selectedMarker.getMultiMissionIdx()];

        if (selectedFwApproachWp.getLandHeading1() == 0 && selectedFwApproachWp.getLandHeading1() == 0 && selectedFwApproachWp.getApproachAltAsl() == 0 && selectedFwApproachWp.getLandAltAsl() == 0) {
            selectedFwApproachWp.setApproachAltAsl(settings.fwApproachAlt * 100);
            selectedFwApproachWp.setLandAltAsl(settings.fwLandAlt * 100);
        }

        var geometry = selectedFeature.getGeometry();
        var coord = toLonLat(geometry.getCoordinates());

        selectedFeature.setStyle(getWaypointIcon(selectedMarker, true));

        let P3Value = selectedMarker.getP3();

        changeSwitch($('#pointP3Alt'), missionControlTab.isBitSet(P3Value, MWNP.P3.ALT_TYPE));
        changeSwitch($('#pointP3UserAction1'), missionControlTab.isBitSet(P3Value, MWNP.P3.USER_ACTION_1));
        changeSwitch($('#pointP3UserAction2'), missionControlTab.isBitSet(P3Value, MWNP.P3.USER_ACTION_2));
        changeSwitch($('#pointP3UserAction3'), missionControlTab.isBitSet(P3Value, MWNP.P3.USER_ACTION_3));
        changeSwitch($('#pointP3UserAction4'), missionControlTab.isBitSet(P3Value, MWNP.P3.USER_ACTION_4));

        const altitudeMeters = convertCentimetersToMeters(selectedMarker.getAlt());

        if (selectedMarker.getAction() == MWNP.WPTYPE.LAND) {
            $('#wpFwLanding').fadeIn(300);
        } else  {
            $('#wpFwLanding').fadeOut(300);
        }

        if (previousLayerIndex == null || previousLayerIndex != selectedMarker.getLayerNumber()) {
            const wp = selectedMarker;
            const approachWp = selectedFwApproachWp;
            (async () => {
                const elevationAtWP = await wp.getElevation(globalSettings);
                // the waypoint may have been deleted or deselected while the elevation was fetched
                if (selectedMarker !== wp) return;

                $('#elevationValueAtWP').text(elevationAtWP);
                rememberTerrain(wp, elevationAtWP);
                const returnAltitude = checkAltElevSanity(false, wp.getAlt(), elevationAtWP, P3Value);
                wp.setAlt(returnAltitude);

                approachWp.setIsSeaLevelRef(missionControlTab.isBitSet(P3Value, MWNP.P3.ALT_TYPE) ? 1 : 0);
                $('#wpApproachAlt').val(approachWp.getApproachAltAsl());
                $('#wpLandAlt').val(approachWp.getLandAltAsl);
                $('#wpLandAltM').text(approachWp.getLandAltAsl() / 100 + " m");
                $('#wpApproachAltM').text(approachWp.getApproachAltAsl() / 100 + " m");

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
        // the tick belongs to edits of the previously shown waypoint
        $('#pointSavedTick').hide();
        $('#MPeditPoint').fadeIn(300);
        $('#pointP3UserActionClass').fadeIn();
        redrawLayer();
    }

    function selectWaypointFromList(wpNumber) {
        let previousLayerIndex = null;
        if (selectedMarker != null && selectedFeature != null) {
            previousLayerIndex = selectedMarker.getLayerNumber();
            selectedFeature.setStyle(getWaypointIcon(selectedMarker, false));
            selectedMarker = null;
            selectedFeature = null;
        }
        selectWaypointMarkerByNumber(wpNumber, previousLayerIndex);
        map.getView().animate({center: fromLonLat([selectedMarker.getLonMap(), selectedMarker.getLatMap()]), duration: 200});
    }

    function wpListSelectableWaypoints() {
        return mission.get().filter(wp => !wp.isAttached());
    }

    function renderWaypointSelect() {
        const $select = $('#wpListSelect');
        if (!$select.length) return;

        const waypoints = wpListSelectableWaypoints();
        const previous = selectedMarker ? String(selectedMarker.getNumber()) : String($select.val());

        $select.empty();
        waypoints.forEach(function (wp) {
            $select.append($('<option>').val(String(wp.getNumber())).text(wpListLabel(wp)));
        });
        if (waypoints.some(wp => String(wp.getNumber()) === previous)) {
            $select.val(previous);
        }

        $('#wpListCount').text(i18n.getMessage('missionWpListCount', [String(waypoints.length)]));
        $select.prop('disabled', waypoints.length === 0);
        $('#wpListPrev, #wpListNext').toggleClass('disabled', waypoints.length === 0);
        syncSeaLevelSwitch();
    }

    /* Terrain height and ground clearance are otherwise only recomputed by
       checkAltElevSanity, which also corrects the altitude. This one only reports, using
       the same two formulas, so the panel can be refreshed without moving a waypoint. */
    async function refreshGroundClearanceDisplay(knownElevation) {
        const wp = selectedMarker;
        if (!wp) return;

        // The terrain height is already on screen for the selected waypoint, so a caller
        // that only needs the reading recomputed can hand it over and skip the lookup.
        let elevation = Number(knownElevation);
        if (Number.isNaN(elevation)) {
            try {
                elevation = Number(await wp.getElevation(globalSettings));
            } catch (error) {
                console.warn('elevation lookup failed:', error.message);
                return;
            }
            if (selectedMarker !== wp || Number.isNaN(elevation)) return;
        }

        $('#elevationValueAtWP').text(elevation);
        rememberTerrain(wp, elevation);

        let clearance = 'NO HOME';
        if (missionControlTab.isBitSet(wp.getP3(), MWNP.P3.ALT_TYPE)) {
            clearance = wp.getAlt() / 100 - elevation;
        } else if (homeMarkers.length && HOME.getAlt() != "N/A") {
            clearance = wp.getAlt() / 100 + (Number(HOME.getAlt()) - elevation);
        }
        document.getElementById('groundClearanceAtWP').style.color =
            (typeof clearance === 'number' && clearance < settings.alt / 100) ? "#FF0000" : "#303030";
        $('#groundClearanceValueAtWP').val(clearance);
    }

    /* Push values a save may have altered back into the single point panel directly:
       re-selecting the waypoint would start another elevation lookup. */
    function syncEditPanelWithSelection() {
        if (!selectedMarker) return;
        $('#pointAlt').val(selectedMarker.getAlt());
        $('#altitudeInMeters').text(' ' + convertCentimetersToMeters(selectedMarker.getAlt()) + 'm');
        $('#pointP1').val(selectedMarker.getP1());
        $('#pointP2').val(selectedMarker.getP2());
        changeSwitch($('#pointP3Alt'), missionControlTab.isBitSet(selectedMarker.getP3(), MWNP.P3.ALT_TYPE));
        // A landing's approach fields share the waypoint's datum; after a conversion
        // they would otherwise keep showing - and write back - the old numbers.
        if (selectedMarker.getAction() == MWNP.WPTYPE.LAND && selectedFwApproachWp) {
            $('#wpApproachAlt').val(selectedFwApproachWp.getApproachAltAsl());
            $('#wpLandAlt').val(selectedFwApproachWp.getLandAltAsl());
            $('#wpLandAltM').text(selectedFwApproachWp.getLandAltAsl() / 100 + " m");
            $('#wpApproachAltM').text(selectedFwApproachWp.getApproachAltAsl() / 100 + " m");
        }
        refreshGroundClearanceDisplay();
    }

    function stepWaypointSelection(offset) {
        const waypoints = wpListSelectableWaypoints();
        if (!waypoints.length) return;
        const current = waypoints.findIndex(wp => selectedMarker && wp.getNumber() == selectedMarker.getNumber());
        const next = current < 0 ? 0 : (current + offset + waypoints.length) % waypoints.length;
        selectWaypointFromList(waypoints[next].getNumber());
    }

    /* The switch mirrors the mission, so saving only converts when the pilot actually
       moved it away from what the mission already says. */
    let seaLevelSwitchOnOpen = false;

    /* An empty mission has no waypoint to read the reference from. It keeps the choice
       that was last saved instead, so the switch survives until there is a waypoint and
       the first one placed adopts it. */
    function missionUsesSeaLevel() {
        const waypoints = wpListSelectableWaypoints();
        if (!waypoints.length) return seaLevelSwitchOnOpen;

        return missionControlTab.isBitSet(waypoints[0].getP3(), MWNP.P3.ALT_TYPE);
    }

    function refreshSeaLevelSwitch() {
        seaLevelSwitchOnOpen = missionUsesSeaLevel();
        changeSwitch($('#MPapplySlrValue'), seaLevelSwitchOnOpen);
        $('.mpApplySaved').hide();
    }

    /* A new waypoint is built from the default altitude, which is a height above the
       ground. Dropped into a mission that reads its altitudes from sea level it would
       keep that number and sit hundreds of metres below the rest of the route, so it
       joins on the mission's own reference instead. */
    async function adoptMissionAltitudeReference(waypoint, knownElevation) {
        if (!missionUsesSeaLevel()) return;

        // Adding the waypoint must never hinge on the elevation service: with no answer
        // it joins on the relative reference, which the log says out loud.
        let elevation = knownElevation === undefined ? Number.NaN : Number(knownElevation);
        if (Number.isNaN(elevation)) {
            // The caller may already have looked this terrain up, and every lookup waits
            // its turn at the elevation service's one-per-second gate.
            try {
                elevation = Number(await waypoint.getElevation(globalSettings));
            } catch (error) {
                console.warn('elevation lookup failed:', error.message);
            }
        }
        if (Number.isNaN(elevation)) {
            GUI.log(i18n.getMessage('missionApplyNoElevation'));
            return;
        }

        rememberTerrain(waypoint, elevation);
        waypoint.setP3(missionControlTab.setBit(waypoint.getP3(), MWNP.P3.ALT_TYPE, true));
        waypoint.setAlt(Math.round(Number(settings.alt) + elevation * 100));
    }

    /* Dragging a waypoint, adding one or loading a mission can change what the mission
       says, so the switch follows along - unless the pilot has already moved it and is
       waiting to save, which must not be overwritten. */
    function syncSeaLevelSwitch() {
        if (!$('#MPapplySlrValue').length) return;
        if ($('#MPapplySlrValue').prop('checked') !== seaLevelSwitchOnOpen) return;
        const inMission = missionUsesSeaLevel();
        if (inMission === seaLevelSwitchOnOpen) return;
        seaLevelSwitchOnOpen = inMission;
        changeSwitch($('#MPapplySlrValue'), inMission);
        $('#MPapplySlrSaved').hide();
    }

    /* The firmware measures a relative waypoint altitude from home and from nothing
       else, so converting between the two references needs the home elevation. The
       terrain under a waypoint is a different quantity: substituting it would store
       numbers that fly at a different height than the ones on screen. Without a home
       position there is no conversion to make, and the save says so. */
    async function resolveHomeElevationCm() {
        if (!homeMarkers.length) return null;

        let elevation = Number(HOME.getAlt());
        if (Number.isNaN(elevation)) {
            try {
                elevation = Number(await HOME.getElevation(globalSettings));
                if (!Number.isNaN(elevation)) {
                    HOME.setAlt(elevation);
                    // the home row still says N/A until something looks the height up
                    $('#elevationValueAtHome').text(elevation + ' m');
                }
            } catch (error) {
                console.warn('home elevation lookup failed:', error.message);
                return null;
            }
        }
        return Number.isNaN(elevation) ? null : elevation * 100;
    }

    let applyingMissionDefaults = false;

    function applySpeedToWaypoints(waypoints) {
        waypoints.forEach(function (wp) {
            if (wp.getAction() == MWNP.WPTYPE.WAYPOINT) {
                wp.setP1(settings.speed);
            } else if (wp.getAction() == MWNP.WPTYPE.POSHOLD_TIME) {
                wp.setP2(settings.speed);
            }
            mission.updateWaypoint(wp);
        });
    }

    /* The defaults describe the whole mission, so saving them applies what actually
       changed to every waypoint: a moved reference switch converts, a changed default
       altitude or speed is written out. Nothing is touched while the fields are edited,
       and an unchanged value never rewrites the mission. */
    async function applyMissionDefaults(oldAlt, oldSpeed) {
        if (disableMarkerEdit || applyingMissionDefaults) return;
        applyingMissionDefaults = true;
        try {
            await applyMissionDefaultsLocked(oldAlt, oldSpeed);
        } finally {
            applyingMissionDefaults = false;
        }
    }

    /* A landing keeps its approach and land altitudes on the waypoint's datum, so they
       move with it or the approach is flown against the wrong zero. */
    function convertLandingApproach(wp, toAbsolute, groundCm) {
        if (wp.getAction() != MWNP.WPTYPE.LAND) return;
        const approach = FC.FW_APPROACH.get()[FC.SAFEHOMES.getMaxSafehomeCount() + wp.getMultiMissionIdx()];
        if (!approach || approach.getIsSeaLevelRef() == toAbsolute) return;

        const oldGroundCm = approach.getIsSeaLevelRef() ? approach.getElevation() : 0;
        const shift = toAbsolute ? groundCm - oldGroundCm : -groundCm;
        approach.setApproachAltAsl(Math.round(approach.getApproachAltAsl() + shift));
        approach.setLandAltAsl(Math.round(approach.getLandAltAsl() + shift));
        approach.setElevation(groundCm);
        approach.setIsSeaLevelRef(toAbsolute ? 1 : 0);
    }

    /* Writes one waypoint and reports whether it ended up under the ground. Altitudes
       are read on the waypoint's own datum, since a mission can carry mixed references
       set per waypoint in the point editor. */
    function writeSpeedToWaypoint(wp) {
        if (wp.getAction() == MWNP.WPTYPE.WAYPOINT) {
            wp.setP1(settings.speed);
        } else if (wp.getAction() == MWNP.WPTYPE.POSHOLD_TIME) {
            wp.setP2(settings.speed);
        }
    }

    function writeDefaultsToWaypoint(wp, index, plan) {
        if (plan.switchMoved && missionControlTab.isBitSet(wp.getP3(), MWNP.P3.ALT_TYPE) != plan.toAbsolute) {
            // Home is the exact datum and keeps the flown path identical. Without it the
            // terrain under the waypoint stands in, which is the ground the point
            // editor's own switch measures from, and keeps the height above it.
            const conversionCm = plan.homeCm ?? plan.terrainCm[index];
            wp.setP3(missionControlTab.setBit(wp.getP3(), MWNP.P3.ALT_TYPE, plan.toAbsolute));
            wp.setAlt(Math.round(wp.getAlt() + (plan.toAbsolute ? conversionCm : -conversionCm)));
            convertLandingApproach(wp, plan.toAbsolute, conversionCm);
        }

        // A POI's altitude is not flown, so the default is not forced onto it. On sea
        // level the default measures from the terrain under this waypoint.
        if (plan.applyAlt && wp.getAction() != MWNP.WPTYPE.SET_POI) {
            const wpAbsolute = missionControlTab.isBitSet(wp.getP3(), MWNP.P3.ALT_TYPE);
            wp.setAlt(wpAbsolute ? Math.round(plan.terrainCm[index] + settings.alt) : settings.alt);
        }
        if (plan.speedChanged) writeSpeedToWaypoint(wp);
        mission.updateWaypoint(wp);

        return endsBelowGround(wp, index, plan);
    }

    /* Fetches the ground levels the requested changes need. Two different grounds serve
       two different jobs: converting the reference shifts every altitude by the datum
       offset, and home is that offset when known, which keeps the flown path identical;
       the default altitude is a height above the ground each waypoint flies over, so it
       always measures from the terrain under that waypoint. */
    async function resolveGroundsForDefaults(waypoints, plan, onAltitudeUnavailable) {
        if (plan.switchMoved) {
            plan.homeCm = await resolveHomeElevationCm();
        }

        const altitudeNeedsTerrain = plan.applyAlt && (plan.switchMoved
            ? plan.toAbsolute
            : waypoints.some(wp => missionControlTab.isBitSet(wp.getP3(), MWNP.P3.ALT_TYPE)));

        // The below-ground warning is judged against the ground each waypoint flies over,
        // so the terrain is worth having whenever altitudes move at all: a save that only
        // switches the reference would otherwise be judged against home and stay quiet
        // about a waypoint sitting inside its own hill.
        if (plan.switchMoved || plan.applyAlt) {
            const terrain = await fetchWaypointElevations(waypoints);
            if (terrain) {
                plan.terrainCm = terrain.map(e => e * 100);
                waypoints.forEach((wp, i) => rememberTerrain(wp, terrain[i]));
            } else if (altitudeNeedsTerrain) {
                // without terrain the altitude cannot be placed above it; the switch and
                // the speed still go ahead
                plan.applyAlt = false;
                onAltitudeUnavailable();
            }
        }

        // The conversion needs one datum or the other. With neither there is nothing to
        // measure from, so nothing is written.
        return !plan.switchMoved || plan.homeCm !== null || plan.terrainCm !== null;
    }

    function reportDefaultsApplied(plan, count, belowGround) {
        if (plan.switchMoved) $('#MPapplySlrSaved').show();
        if (plan.applyAlt) $('#MPapplyAltSaved').show();
        if (plan.speedChanged) $('#MPapplySpeedSaved').show();

        if (plan.switchMoved) {
            GUI.log(i18n.getMessage(plan.homeCm !== null ? 'missionApplyViaHome' : 'missionApplyViaTerrain',
                                    [String(count)]));
        }
        if (plan.applyAlt) GUI.log(i18n.getMessage('missionApplyAltApplied', [String(count)]));
        if (plan.speedChanged) GUI.log(i18n.getMessage('missionApplySpeedApplied', [String(count)]));
        if (belowGround) GUI.log(i18n.getMessage('missionApplyBelowGround', [String(belowGround)]));
    }

    async function applyMissionDefaultsLocked(oldAlt, oldSpeed) {
        /* Saving writes the defaults into the mission whether or not the fields were
           touched. After a waypoint has been dragged or edited by hand, pressing save is
           how the pilot puts the whole mission back onto the defaults - a button that
           quietly does nothing because the field still reads the same is no help. */
        const plan = {
            toAbsolute: $('#MPapplySlrValue').prop('checked'),
            speedChanged: true,
            applyAlt: true,
            homeCm: null,
            terrainCm: null,
        };
        plan.switchMoved = plan.toAbsolute !== seaLevelSwitchOnOpen;

        const waypoints = wpListSelectableWaypoints();
        if (!waypoints.length) {
            seaLevelSwitchOnOpen = plan.toAbsolute;
            return;
        }

        // A failed apply is rolled back into the settings so the next save can retry it -
        // otherwise nothing would count as changed any more.
        const revertAltitude = function () {
            settings.alt = oldAlt;
            $('#MPdefaultPointAlt').val(String(oldAlt));
            saveSettings();
        };

        const gotGrounds = await resolveGroundsForDefaults(waypoints, plan, function () {
            revertAltitude();
            GUI.log(i18n.getMessage('missionApplyNoElevation'));
        });

        if (!gotGrounds) {
            // The speed needs no ground levels, so it is still written
            if (plan.speedChanged) {
                applySpeedToWaypoints(waypoints);
                mission.update(singleMissionActive());
                syncEditPanelWithSelection();
                redrawLayer();
                $('#MPapplySpeedSaved').show();
                GUI.log(i18n.getMessage('missionApplySpeedApplied', [String(waypoints.length)]));
            }
            if (plan.applyAlt) revertAltitude();
            changeSwitch($('#MPapplySlrValue'), seaLevelSwitchOnOpen);
            GUI.log(i18n.getMessage('missionApplyNoElevation'));
            return;
        }

        // The fetches took real time; deleting waypoints, switching the multi mission or
        // loading a file meanwhile replaced the mission, and writing the captured
        // waypoints back would resurrect it. Start over instead.
        if ((plan.homeCm !== null || plan.terrainCm) && missionWasReplaced(waypoints)) {
            if (settings.alt !== oldAlt) revertAltitude();
            if (plan.speedChanged) {
                settings.speed = oldSpeed;
                $('#MPdefaultPointSpeed').val(String(oldSpeed));
                saveSettings();
            }
            refreshSeaLevelSwitch();
            GUI.log(i18n.getMessage('missionApplyMissionChanged'));
            return;
        }

        let belowGround = 0;
        waypoints.forEach(function (wp, index) {
            if (writeDefaultsToWaypoint(wp, index, plan)) belowGround++;
        });

        seaLevelSwitchOnOpen = plan.toAbsolute;
        mission.update(singleMissionActive());
        syncEditPanelWithSelection();
        redrawLayer();
        plotElevation();
        reportDefaultsApplied(plan, waypoints.length, belowGround);
    }

    function missionWasReplaced(waypoints) {
        const current = wpListSelectableWaypoints();
        return current.length !== waypoints.length || current.some((wp, i) => wp !== waypoints[i]);
    }

    /* Placing a waypoint waits on the elevation service while the map keeps taking
       clicks. Run the additions one after another, so each one reads the mission length
       it is actually appending to instead of the one two clicks ago. A failed addition
       must not stall the ones behind it. */
    let waypointAdditions = Promise.resolve();
    function queueWaypointAddition(task) {
        // The catch settles the chain either way, so one addition that fails neither
        // stalls the clicks behind it nor escapes as an unhandled rejection.
        waypointAdditions = waypointAdditions.then(task).catch(function (error) {
            console.warn('adding a waypoint failed:', error.message);
        });
    }

    /* A file load or a switch of multi mission replaces the whole waypoint collection.
       An addition that started before that belongs to a mission which is gone, and
       putting it in would graft it onto the new one. */
    function collectionChangedSince(snapshot) {
        const current = mission.get();
        return current.length !== snapshot.length || current.some((wp, i) => wp !== snapshot[i]);
    }

    /* The ground a waypoint was last measured against. Dragged somewhere else it should
       keep its height above the ground it flies over, not its height above the sea, and
       that needs the ground it had before the move. Keyed by the waypoint itself, so a
       deleted one takes its entry with it. */
    const terrainUnderWaypoint = new WeakMap();
    function rememberTerrain(wp, elevationMeters) {
        const value = Number(elevationMeters);
        if (!Number.isNaN(value)) terrainUnderWaypoint.set(wp, value * 100);
    }

    /* A waypoint that was never looked at has no remembered ground, and once the drag has
       moved it its old coordinates are gone for good. So the question is asked the moment
       it is picked up, while it still stands where it stood. */
    let groundBeforeDragCm = Promise.resolve(undefined);
    function captureGroundBeforeDrag(wp) {
        const known = wp ? terrainUnderWaypoint.get(wp) : undefined;
        if (!wp || known !== undefined) {
            groundBeforeDragCm = Promise.resolve(known);
            return;
        }
        groundBeforeDragCm = wp.getElevation(globalSettings)
            .then(elevation => (Number.isNaN(Number(elevation)) ? undefined : Number(elevation) * 100))
            .catch(error => {
                console.warn('elevation lookup failed:', error.message);
                return undefined;
            });
    }

    /* A landing waypoint carries an approach with altitudes of its own. Held against the
       sea they were measured over the ground the waypoint used to stand on, so they are
       shifted onto the new ground and keep the height above it they had. Held against home
       the terrain never entered into them and they are left alone. */
    function settleLandingApproach(wp, elevationAtWP, isSelected) {
        if (wp.getAction() != MWNP.WPTYPE.LAND) return;

        const approach = FC.FW_APPROACH.get()[FC.SAFEHOMES.getMaxSafehomeCount() + wp.getMultiMissionIdx()];
        if (approach.getIsSeaLevelRef()) {
            if (approach.getElevation() != 0) {
                approach.setApproachAltAsl(approach.getApproachAltAsl() - approach.getElevation() + elevationAtWP * 100);
                approach.setLandAltAsl(approach.getLandAltAsl() - approach.getElevation() + elevationAtWP * 100);
            }
            approach.setElevation(elevationAtWP * 100);
            if (isSelected) {
                $('#wpApproachAlt').val(approach.getApproachAltAsl());
                $('#wpLandAlt').val(approach.getLandAltAsl());
                $('#wpLandAltM').text(approach.getLandAltAsl() / 100 + " m");
                $('#wpApproachAltM').text(approach.getApproachAltAsl() / 100 + " m");
            }
        }
    }

    /* A dragged waypoint now sits over different ground. Measured from the sea its number
       says nothing about how high it flies any more, so it keeps the clearance it had and
       the altitude follows the new terrain. Measured from home the terrain never entered
       into the number, so only the sanity check applies, as before. The landing approach
       of a LAND waypoint is settled separately, on its own reference. */
    async function settleDraggedWaypoint(wp, isSelected) {
        if (!wp) return;

        const groundBeforeCm = await groundBeforeDragCm;
        let elevationAtWP = Number.NaN;
        try {
            elevationAtWP = Number(await wp.getElevation(globalSettings));
        } catch (error) {
            console.warn('elevation lookup failed:', error.message);
        }
        if (Number.isNaN(elevationAtWP)) {
            plotElevation();
            return;
        }
        rememberTerrain(wp, elevationAtWP);

        if (groundBeforeCm !== undefined && missionControlTab.isBitSet(wp.getP3(), MWNP.P3.ALT_TYPE)) {
            wp.setAlt(Math.round(elevationAtWP * 100 + (wp.getAlt() - groundBeforeCm)));
        }
        wp.setAlt(checkAltElevSanity(false, wp.getAlt(), elevationAtWP, wp.getP3()));

        settleLandingApproach(wp, elevationAtWP, isSelected);

        mission.updateWaypoint(wp);
        renderWaypointSelect();
        if (isSelected && selectedMarker === wp) {
            $('#elevationValueAtWP').text(elevationAtWP);
            syncEditPanelWithSelection();
            refreshGroundClearanceDisplay(elevationAtWP);
        }
        plotElevation();
    }

    /* Some editor fields check what was typed and keep the stored value when it does not
       hold up. The field handler says so here, so the tick in the title bar does not
       claim an edit was taken that never reached the waypoint. */
    let pointEditRefused = false;
    function refusePointEdit() {
        pointEditRefused = true;
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
                    refreshSeaLevelSwitch();
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

            const isInteractable = (layer) => layer?.get('no_interaction') !== true;

            var feature = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return isInteractable(layer) ? feature : null;
                });

            tempMarker = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return isInteractable(layer) ? layer : null;
                });

            if (feature) {
                this.coordinate_ = evt.coordinate;
                this.feature_ = feature;
                this.layer_ = tempMarker;
            }

            captureGroundBeforeDrag(feature && tempMarker?.kind == "waypoint"
                ? mission.getWaypoint(tempMarker.number) : null);

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
        // Asking what lies under the cursor reads pixels back from the map, which Chrome
        // warns about once per read; on every mouse move that is thousands of warnings in
        // a session. A few checks per second is as much as a cursor change needs.
        let lastHoverCheckAt = 0;
        app.handleMoveEvent = function (evt) {
            if (this.cursor_) {
                const now = Date.now();
                if (now - lastHoverCheckAt < 150) return;
                lastHoverCheckAt = now;

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
                renderWaypointSelect();
                settleDraggedWaypoint(mission.getWaypoint(tempMarker.number),
                                      selectedMarker != null && tempMarker.number == selectedMarker.getLayerNumber());
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
        // Load previously saved GEO files from electron store
        //////////////////////////////////////////////////////////////////////////
        if (store.get('custom_overlay_list') === undefined) {
            store.set('custom_overlay_list', []);
        }

        for (let savedLayer of store.get('custom_overlay_list')) {
            const features = new GeoJSON().readFeatures(savedLayer.layer_data, {
                dataProjection: 'EPSG:4326',
                featureProjection: map.getView().getProjection()
            });
            createGeoLayer(features, savedLayer.name, savedLayer.visible !== false);
        }
        updateLayerListUI();

        //////////////////////////////////////////////////////////////////////////
        // Add drag-and-drop support for GEO files
        //////////////////////////////////////////////////////////////////////////
        const dragAndDropInteraction = new DragAndDrop({
            formatConstructors: [
                GPX,
                GeoJSON,
                IGC,
                KML,
                KMZ,
                TopoJSON,
            ],
        });

        dragAndDropInteraction.on('addfeatures', function(event) {
            const fileName = event.file.name;
            GUI.log(`Drag-and-dropped file: ${fileName}`);
            addGeoLayerToMap(event.features, fileName);
        });

        map.addInteraction(dragAndDropInteraction);

        //////////////////////////////////////////////////////////////////////////
        // Feature hover info display
        //////////////////////////////////////////////////////////////////////////
        const displayFeatureInfo = function(pixel) {
            const features = [];
            const geoInfoEl = document.getElementById('geo_info');
            map.forEachFeatureAtPixel(pixel, function(feature) {
                if (feature.get('show_info_on_hover') === true) {
                    features.push(feature);
                }
            });

            if (features.length > 0) {
                const info = [];
                for (const feature of features) {
                    info.push(feature.get('name') || 'Unknown');
                }
                geoInfoEl.innerHTML = info.join(', ');
                geoInfoEl.style.opacity = '1';
            } else {
                geoInfoEl.style.opacity = '0';
            }
        };

        // Hit-testing reads pixels back from the canvas, which is expensive and floods
        // the console with Chrome's readback warning when done on every mouse move, so
        // both hover handlers are held to a few checks per second.
        let lastHoverInfoAt = 0;
        map.on('pointermove', function(evt) {
            if (evt.dragging) {
                return;
            }
            const now = Date.now();
            if (now - lastHoverInfoAt < 150) return;
            lastHoverInfoAt = now;
            const pixel = map.getEventPixel(evt.originalEvent);
            displayFeatureInfo(pixel);
        });

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
                selectWaypointMarkerByNumber(tempMarker.number, tempSelectedMarkerIndex);
            }
            else if (selectedFeature && tempMarker.kind == "line" && tempMarker.selection && !disableMarkerEdit) {
                let tempWpCoord = toLonLat(evt.coordinate);
                const insertAt = tempMarker.number;
                const wpLat = Math.round(tempWpCoord[1] * 10000000);
                const wpLon = Math.round(tempWpCoord[0] * 10000000);

                queueWaypointAddition(async () => {
                    const snapshot = mission.get().slice();
                    let tempWp = new Waypoint(insertAt, MWNP.WPTYPE.WAYPOINT, wpLat, wpLon, Number(settings.alt), Number(settings.speed));
                    tempWp.setMultiMissionIdx(mission.getWaypoint(0).getMultiMissionIdx());

                    let elevationAtWP;
                    if (homeMarkers.length && HOME.getAlt() != "N/A") {
                        // Placing a waypoint must not hinge on the elevation service; with
                        // no answer it keeps the default altitude.
                        try {
                            elevationAtWP = await tempWp.getElevation(globalSettings);
                            tempWp.setAlt(checkAltElevSanity(false, settings.alt, elevationAtWP, false));
                        } catch (error) {
                            console.warn('elevation lookup failed:', error.message);
                            elevationAtWP = undefined;
                        }
                    }
                    await adoptMissionAltitudeReference(tempWp, elevationAtWP);
                    if (collectionChangedSince(snapshot)) {
                        GUI.log(i18n.getMessage('missionApplyMissionChanged'));
                        return;
                    }

                    mission.insertWaypoint(tempWp, insertAt);
                    mission.update(singleMissionActive());
                    refreshLayers();
                    plotElevation();
                    // the counters read the mission, so they are refreshed once it holds
                    // the new point rather than when the click was taken
                    updateMultimissionState();
                });
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
                const wpLat = Math.round(tempWpCoord[1] * 10000000);
                const wpLon = Math.round(tempWpCoord[0] * 10000000);

                queueWaypointAddition(async () => {
                    // The number and the mission it belongs to are read here, once the
                    // click ahead of this one has finished appending.
                    const snapshot = mission.get().slice();
                    let tempWp = new Waypoint(snapshot.length, MWNP.WPTYPE.WAYPOINT, wpLat, wpLon, Number(settings.alt), Number(settings.speed));

                    if (snapshot.length == 0) {
                        tempWp.setMultiMissionIdx(multimissionCount == 0 ? 0 : multimissionCount - 1);
                        FC.FW_APPROACH.clean(FC.SAFEHOMES.getMaxSafehomeCount() + tempWp.getMultiMissionIdx());
                    } else {
                        tempWp.setMultiMissionIdx(mission.getWaypoint(snapshot.length - 1).getMultiMissionIdx());
                    }

                    let elevationAtWP;
                    if (homeMarkers.length && HOME.getAlt() != "N/A") {
                        // Placing a waypoint must not hinge on the elevation service; with
                        // no answer it keeps the default altitude.
                        try {
                            elevationAtWP = await tempWp.getElevation(globalSettings);
                            tempWp.setAlt(checkAltElevSanity(false, settings.alt, elevationAtWP, false));
                        } catch (error) {
                            console.warn('elevation lookup failed:', error.message);
                            elevationAtWP = undefined;
                        }
                    }
                    await adoptMissionAltitudeReference(tempWp, elevationAtWP);
                    if (collectionChangedSince(snapshot)) {
                        GUI.log(i18n.getMessage('missionApplyMissionChanged'));
                        return;
                    }

                    mission.put(tempWp);
                    mission.update(singleMissionActive());
                    refreshLayers();
                    plotElevation();
                    updateLocationButtonsVisibility();
                    // the counters read the mission, so they are refreshed once it holds
                    // the new point rather than when the click was taken
                    updateMultimissionState();
                });
            }
            //mission.missionDisplayDebug();
            updateMultimissionState();
        });

        //////////////////////////////////////////////////////////////////////////
        // change mouse cursor when over marker
        //////////////////////////////////////////////////////////////////////////
        let lastHoverCursorAt = 0;
        $(map.getViewport()).on('mousemove', function (e) {
            const nowCursor = Date.now();
            if (nowCursor - lastHoverCursorAt < 150) return;
            lastHoverCursorAt = nowCursor;
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

        function setupShowHidePanel(buttonId, contentId) {
            $(`#${buttonId}`).on('click', function () {
                const wasVisible = $(this).children().attr('class') === 'ic_hide';
                $(this).children().attr('class', wasVisible ? 'ic_show' : 'ic_hide');
                $(`#${contentId}`)[wasVisible ? 'fadeOut' : 'fadeIn'](300);
            });
        }

        // Ensure ActionContent is visible initially
        if ($('#showHideActionButton').children().attr('class') === 'ic_hide') {
            $('#ActionContent').show();
        }

        setupShowHidePanel('showHideActionButton',      'ActionContent');
        setupShowHidePanel('showHideInfoButton',        'InfoContent');
        setupShowHidePanel('showHideSafehomeButton',    'SafehomeContent');
        setupShowHidePanel('showHideHomeButton',        'HomeContent');
        setupShowHidePanel('showHideWPeditButton',      'WPeditContent');
        setupShowHidePanel('showHideMultimissionButton','multimissionContent');
        setupShowHidePanel('showHideGeozonesButton',    'geozoneContent');
        setupShowHidePanel('showHideWpListButton',      'wpListContent');

        renderWaypointSelect();

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
                if (returnAltitude !== Number($('#pointAlt').val())) {
                    // the sanity check kept the stored altitude, so show that one back
                    $('#pointAlt').val(returnAltitude);
                    $('#altitudeInMeters').text(' ' + convertCentimetersToMeters(returnAltitude) + 'm');
                    refusePointEdit();
                }
                selectedMarker.setAlt(returnAltitude);
                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
                plotElevation();
            }
        });

        $('#pointP1').on('change', function (event) {
            if (selectedMarker) {
                if (selectedMarker.getAction() != MWNP.WPTYPE.SET_HEAD) {
                    $('#pointP1').val(Math.abs(Number($('#pointP1').val())));
                }
                selectedMarker.setP1(Number($('#pointP1').val()));
                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        $('#pointP2').on('change', function (event) {
            if (selectedMarker) {
                if (selectedMarker.getAction() == MWNP.WPTYPE.POSHOLD_TIME) {
                    $('#pointP2').val(Math.abs(Number($('#pointP2').val())));
                }
                selectedMarker.setP2(Number($('#pointP2').val()));
                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        /////////////////////////////////////////////
        // Callback for the waypoint selector panel
        /////////////////////////////////////////////
        $('#wpListSelect').on('change', function () {
            const wpNumber = Number($(this).val());
            if (!Number.isNaN(wpNumber) && mission.getWaypoint(wpNumber)) {
                selectWaypointFromList(wpNumber);
            }
        });

        $('#wpListPrev').on('click', function (event) {
            event.preventDefault();
            stepWaypointSelection(-1);
        });

        $('#wpListNext').on('click', function (event) {
            event.preventDefault();
            stepWaypointSelection(1);
        });

        $('#pointP3Alt').on('change', function (event) {
            if (selectedMarker) {
                var P3Value = selectedMarker.getP3();

                if (disableMarkerEdit) {
                    changeSwitch($('#pointP3Alt'), missionControlTab.isBitSet(P3Value, MWNP.P3.ALT_TYPE));
                }

                P3Value = missionControlTab.setBit(P3Value, MWNP.P3.ALT_TYPE, $('#pointP3Alt').prop("checked"));
                (async () => {
                    // The elevation lookup takes a moment and the selector makes it easy to
                    // move on meanwhile; the answer belongs to the waypoint that asked for it.
                    const wp = selectedMarker;
                    const elevationAtWP = await wp.getElevation(globalSettings);
                    if (selectedMarker !== wp) return;

                    $('#elevationValueAtWP').text(elevationAtWP);
                    rememberTerrain(wp, elevationAtWP);
                    var altitude = Number($('#pointAlt').val());

                    if (P3Value != selectedMarker.getP3()) {
                        selectedMarker.setP3(P3Value);

                        let groundClearance = 100 * Number($('#groundClearanceValueAtWP').val());
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
                    changeSwitch($('#pointP3UserAction1'), missionControlTab.isBitSet(selectedMarker.getP3(), MWNP.P3.USER_ACTION_1));
                }

                var P3Value = missionControlTab.setBit(selectedMarker.getP3(), MWNP.P3.USER_ACTION_1, $('#pointP3UserAction1').prop("checked"));
                selectedMarker.setP3(P3Value);

                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        $('#pointP3UserAction2').on('change', function(event){
            if (selectedMarker) {
                if (disableMarkerEdit) {
                    changeSwitch($('#pointP3UserAction2'), missionControlTab.isBitSet(selectedMarker.getP3(), MWNP.P3.USER_ACTION_2));
                }

                var P3Value = missionControlTab.setBit(selectedMarker.getP3(), MWNP.P3.USER_ACTION_2, $('#pointP3UserAction2').prop("checked"));
                selectedMarker.setP3(P3Value);

                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        $('#pointP3UserAction3').on('change', function(event){
            if (selectedMarker) {
                if (disableMarkerEdit) {
                    changeSwitch($('#pointP3UserAction3'), missionControlTab.isBitSet(selectedMarker.getP3(), MWNP.P3.USER_ACTION_3));
                }

                var P3Value = missionControlTab.setBit(selectedMarker.getP3(), MWNP.P3.USER_ACTION_3, $('#pointP3UserAction3').prop("checked"));
                selectedMarker.setP3(P3Value);

                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        $('#pointP3UserAction4').on('change', function(event){
            if (selectedMarker) {
                if (disableMarkerEdit) {
                    changeSwitch($('#pointP3UserAction4'), missionControlTab.isBitSet(selectedMarker.getP3(), MWNP.P3.USER_ACTION_4));
                }

                var P3Value = missionControlTab.setBit(selectedMarker.getP3(), MWNP.P3.USER_ACTION_4, $('#pointP3UserAction4').prop("checked"));
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
                } else {
                    refusePointEdit();
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

        $('#saveEepromGeozoneButton').on('click', async event => {

            if (invalidGeoZones) {
                dialog.alert(i18n.getMessage("geozoneUnableToSave"));
                return;
            }
            
            if (await dialog.confirm(i18n.getMessage("missionGeozoneReboot"))) {
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
        $('#removeAllPoints').on('click', async function () {
            if (markers.length && await dialog.confirm(i18n.getMessage('confirm_delete_all_points'))) {
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

        // Address search button
        $(document).on('click', '#searchAddressButton, #searchAddress', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // Remove any existing dialog
            $('#addressSearchDialog, #addressSearchBackdrop').remove();

            // Create dialog
            const addressDialog = $(`
                <div id="addressSearchBackdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                     background: rgba(0,0,0,0.5); z-index: 10000;">
                    <div id="addressSearchDialog" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                         background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                        <h3>Search for Location</h3>
                        <input type="text" id="addressInput" style="width: 280px; padding: 8px 12px; margin: 10px 0; border: 1px solid #ccc; font-size: 14px;" 
                               placeholder="Enter address, city, or coordinates" value="" autocomplete="off">
                        <div style="margin-top: 15px; text-align: right;">
                            <button id="searchCancel" style="padding: 8px 16px; margin-right: 10px;">Cancel</button>
                            <button id="searchOK" style="padding: 8px 16px; background: #007cba; color: white; border: none;">Search</button>
                        </div>
                    </div>
                </div>
            `);

            $('body').append(addressDialog);

          
            // Search function
            function doSearch() {
                const address = $('#addressInput').val().trim();
                $('#addressSearchBackdrop').remove();

                if (address) {
                    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
                    
                    fetch(url)
                        .then(response => response.json())
                        .then(data => {
                            if (data && data.length > 0) {
                                const result = data[0];
                                const coord = fromLonLat([parseFloat(result.lon), parseFloat(result.lat)]);
                                map.getView().setCenter(coord);
                                dialog.alert(`Found: ${result.display_name}`);
                            } else {
                                dialog.alert('Address not found.');
                            }
                        })
                        .catch(err => {
                            console.error('Search failed:', err);
                            dialog.alert('Search failed. Check your connection.');
                        });
                }

                setTimeout(() => {
                    const input = document.getElementById('addressInput');
                    input?.focus();
                    input?.select();
                }, 50);

            }

            // Event handlers
            $('#searchOK').click(doSearch);
            $('#searchCancel').click(() => $('#addressSearchBackdrop').remove());
            $('#addressInput').keypress(function(e) {
                if (e.which === 13) doSearch();
            });
            
            // Only close on backdrop click, not dialog content click
            $('#addressSearchBackdrop').click(function(e) {
                if (e.target === this) {
                    $('#addressSearchBackdrop').remove();
                }
            });
            
            // Prevent clicks inside the dialog from closing it
            $('#addressSearchDialog').click(function(e) {
                e.stopPropagation();
            });
        });

        $(document).on('click', '#centerOnDroneButton, #centerOnDrone', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (lastGpsPos && map && map.getView()) {
                map.getView().setCenter(lastGpsPos);
            }
        });

        // Keyboard shortcuts (ignored when typing in inputs):
        //  C -> center on latest GPS fix
        //  Ctrl+L -> load mission from file
        //  Ctrl+S -> save mission to file
        //  Ctrl+D -> delete all points
        //  Ctrl+A -> address search dialog
        $(document).off('keydown.mcCenter').on('keydown.mcCenter', function (e) {
            const key = (e.key || '').toLowerCase();
            const target = e.target;
            const isTyping = target && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable ||
                target.tagName === 'SELECT'
            );
            if (isTyping) return;

            // Center on GPS fix (plain C or Ctrl+C)
            if (!e.repeat && key === 'c') {
                if (lastGpsPos && map && map.getView()) {
                    map.getView().setCenter(lastGpsPos);
                }
            }

            // Ctrl+L: open mission from file
            if (!e.repeat && e.ctrlKey && key === 'l') {
                e.preventDefault();
                $('#loadFileMissionButton').trigger('click');
            }

            // Ctrl+S: save mission to file
            if (!e.repeat && e.ctrlKey && key === 's') {
                e.preventDefault();
                $('#saveFileMissionButton').trigger('click');
            }

            // Ctrl+D: delete all points
            if (!e.repeat && e.ctrlKey && key === 'd') {
                e.preventDefault();
                $('#removeAllPoints').trigger('click');
            }

            // Ctrl+A: address search
            if (!e.repeat && e.ctrlKey && key === 'a') {
                e.preventDefault();
                $('#searchAddressButton').trigger('click');
            }
        });

        $('#removePoint').on('click', async function () {
            if (selectedMarker) {
                if (mission.isJumpTargetAttached(selectedMarker)) {
                    dialog.alert(i18n.getMessage('MissionPlannerJumpTargetRemoval'));
                }
                else if (mission.getAttachedFromWaypoint(selectedMarker) && mission.getAttachedFromWaypoint(selectedMarker).length != 0) {
                    if (await dialog.confirm(i18n.getMessage('confirm_delete_point_with_options'))) {
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
                        updateLocationButtonsVisibility();
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
                updateLocationButtonsVisibility();
            }
        });

        /////////////////////////////////////////////
        // Callback for Save/load buttons
        /////////////////////////////////////////////
        $('#loadFileMissionButton').off('click').on('click', async function () {
            if (!await fileLoadMultiMissionCheck()) return;

            if (markers.length && !await dialog.confirm(i18n.getMessage('confirm_delete_all_points'))) return;
            var options = {
                filters: [ { name: "Mission file", extensions: ['mission'] } ]
            };
            const result = await dialog.showOpenDialog(options);
            if (!result.canceled && result.filePaths.length == 1) {
                loadMissionFile(result.filePaths[0]);
            }
        });

        $('#saveFileMissionButton').off('click').on('click', function () {
            var options = {
                filters: [ { name: "Mission file", extensions: ['mission'] } ]
            };
            dialog.showSaveDialog(options).then(result =>  {
                if (result.canceled) {
                    return;
                }
                let filePath = result.filePath;
                if (!filePath.endsWith('.mission')) {
                    filePath += '.mission';
                }
                saveMissionFile(filePath);
            });
        });

        $('#loadMissionButton').on('click', async function () {
            let message = multimissionCount ? 'confirm_overwrite_multimission_file_load_option' : 'confirm_delete_all_points';
            if ((markers.length || multimissionCount) && !await dialog.confirm(i18n.getMessage(message))) return;
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

        $('#loadEepromMissionButton').on('click', async function () {
            let message = multimissionCount ? 'confirm_overwrite_multimission_file_load_option' : 'confirm_delete_all_points';
            if ((markers.length || multimissionCount) && !await dialog.confirm(i18n.getMessage(message))) return;
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
        // Callback for Layer management buttons
        /////////////////////////////////////////////
        $('#loadGeoFileButton').on('click', async function() {
            const options = {
                filters: [
                    { name: 'GEO Files', extensions: ['kml', 'kmz', 'geojson', 'json', 'gpx', 'igc', 'topojson'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            };

            let result;
            try {
                result = await dialog.showOpenDialog(options);
            } catch (error) {
                GUI.log(`Error opening file dialog: ${error.message || error}`);
                dialog.alert(i18n.getMessage('layerLoadError'));
                return;
            }

            if (result.canceled || result.filePaths.length !== 1) return;

            try {
                await loadGeoFile(result.filePaths[0]);
            } catch (error) {
                GUI.log(`Error loading file: ${error.message}`);
                dialog.alert(i18n.getMessage('layerParseError'));
            }
        });

        setupShowHidePanel('showHideLayersButton', 'layerContent');

        /////////////////////////////////////////////
        // Callback for settings
        /////////////////////////////////////////////
        $('#saveSettings').on('click', async function () {
            if ($(this).hasClass('disabled')) return;
            $(this).addClass('disabled');
            try {
                await saveSettingsAndApply();
            } finally {
                $(this).removeClass('disabled');
            }
        });

        async function saveSettingsAndApply() {
            let oldSafeRadiusSH = settings.safeRadiusSH;
            const oldAlt = settings.alt;
            const oldSpeed = settings.speed;

            // update only default settings
            settings.alt = readNumericSetting('#MPdefaultPointAlt', oldAlt);
            settings.speed = readNumericSetting('#MPdefaultPointSpeed', oldSpeed);
            settings.safeRadiusSH = readNumericSetting('#MPdefaultSafeRangeSH', oldSafeRadiusSH);
            settings.fwApproachAlt = readNumericSetting('#MPdefaultFwApproachAlt', settings.fwApproachAlt);
            settings.fwLandAlt = readNumericSetting('#MPdefaultLandAlt', settings.fwLandAlt);

            saveSettings();

            if (settings.safeRadiusSH != oldSafeRadiusSH  && $('#showHideSafehomeButton').is(":visible")) {
                cleanSafehomeLayers();
                renderSafehomesOnMap();
                $('#SafeHomeSafeDistance').text(settings.safeRadiusSH);
            }

            // The box stays open on save so the ticks next to the fields are visible;
            // the cancel button is what closes it.
            await applyMissionDefaults(oldAlt, oldSpeed);

            // The clearance display warns against the default altitude, which may just
            // have changed, so recompute it against the terrain already on screen.
            refreshGroundClearanceDisplay(Number($('#elevationValueAtWP').text()));
        }

        $('#cancelSettings').on('click', function () {
            loadSettings();
            refreshSeaLevelSwitch();
            closeSettingsPanel();
        });

        // Editing a value clears the tick of the previous save
        $('#MPapplySlrValue').on('change', function () {
            $('#MPapplySlrSaved').hide();
        });
        $('#MPdefaultPointAlt').on('input change', function () {
            $('#MPapplyAltSaved').hide();
            updateDefaultUnitHints();
        });
        $('#MPdefaultPointSpeed').on('input change', function () {
            $('#MPapplySpeedSaved').hide();
            updateDefaultUnitHints();
        });

        // Typing the wanted ground clearance computes the altitude, instead of the
        // pilot adding terrain height and clearance by hand.
        $('#groundClearanceValueAtWP').on('change', function () {
            if (!selectedMarker || disableMarkerEdit) return;

            const clearance = Number($(this).val());
            const elevation = Number($('#elevationValueAtWP').text());
            if (Number.isNaN(clearance) || Number.isNaN(elevation)) {
                refreshGroundClearanceDisplay();
                return;
            }

            // Inverse of the two display formulas: absolute is clearance above the
            // terrain; relative counts from home, so the terrain-home offset is added.
            let altitude;
            if (missionControlTab.isBitSet(selectedMarker.getP3(), MWNP.P3.ALT_TYPE)) {
                altitude = Math.round((clearance + elevation) * 100);
            } else if (homeMarkers.length && HOME.getAlt() != "N/A") {
                altitude = Math.round((clearance + elevation - Number(HOME.getAlt())) * 100);
            } else {
                // without home a relative altitude cannot be derived from a clearance
                refreshGroundClearanceDisplay(elevation);
                return;
            }

            selectedMarker.setAlt(altitude);
            mission.updateWaypoint(selectedMarker);
            mission.update(singleMissionActive());
            $('#pointAlt').val(altitude);
            $('#altitudeInMeters').text(' ' + convertCentimetersToMeters(altitude) + 'm');
            redrawLayer();
            plotElevation();
            refreshGroundClearanceDisplay(elevation);
        });

        // The editor fields write into the waypoint when they commit (on change), so
        // the tick in the title tracks that: typing hides it, a committed change shows
        // it, and the save button commits whatever is still being typed. These handlers
        // sit after the field handlers above, so the tick appears once the value is in.
        const pointEditorFields = '#pointType, #pointLat, #pointLon, #pointAlt, #pointP1, #pointP2,'
            + ' #groundClearanceValueAtWP, #pointP3Alt, #pointP3UserAction1, #pointP3UserAction2,'
            + ' #pointP3UserAction3, #pointP3UserAction4, #wpApproachAlt, #wpLandAlt,'
            + ' #wpApproachDirection, #wpLandHeading1, #wpLandHeading1Excl, #wpLandHeading2, #wpLandHeading2Excl';
        $(pointEditorFields).on('input', function () {
            $('#pointSavedTick').hide();
            pointEditRefused = false;
        });
        $(pointEditorFields).on('change', function () {
            // A field that kept its stored value has nothing to confirm, and neither has
            // a panel that is read only right now.
            const taken = selectedMarker && !disableMarkerEdit && !pointEditRefused;
            pointEditRefused = false;
            $('#pointSavedTick').toggle(!!taken);
        });

        // The elevation profile floats over the map with both sides anchored, so its
        // width always follows the map. The title bar drags it vertically, clamped to
        // the map area; a double click puts it back onto its default spot at the bottom.
        (function () {
            const panel = $('#missionPlannerElevation');
            const bar = panel.find('.gui_box_titlebar');
            bar.css('cursor', 'ns-resize');
            let dragging = false, startY = 0, startTop = 0;

            const clampTop = function (top) {
                const parentH = panel[0].offsetParent.getBoundingClientRect().height;
                const panelH = panel[0].getBoundingClientRect().height;
                return Math.min(Math.max(top, 10), Math.max(10, parentH - panelH - 10));
            };

            bar.on('mousedown', function (e) {
                if ($(e.target).closest('a').length) return;   // the close button stays a button
                const rect = panel[0].getBoundingClientRect();
                const parentRect = panel[0].offsetParent.getBoundingClientRect();
                startTop = rect.top - parentRect.top;
                panel.css({top: startTop + 'px', bottom: 'auto'});
                dragging = true;
                startY = e.clientY;
                e.preventDefault();
            });

            $(document).on('mousemove.elevationDrag', function (e) {
                if (!dragging) return;
                panel.css('top', clampTop(startTop + e.clientY - startY) + 'px');
            });

            $(document).on('mouseup.elevationDrag', function () {
                if (!dragging) return;
                dragging = false;
                // a window resize must never leave it outside the map
                panel.css('top', clampTop(panel[0].getBoundingClientRect().top - panel[0].offsetParent.getBoundingClientRect().top) + 'px');
            });

            bar.on('dblclick', function () {
                panel.css({bottom: '10px', top: 'auto'});
            });
        })();

        $('#savePointButton').on('click', function (event) {
            event.preventDefault();
            if (!selectedMarker) return;
            // The change handler is what writes a value into the waypoint, and a field
            // still being typed in has not fired it yet - so fire it, then leave the
            // field. Fields already committed just show the tick.
            const active = document.activeElement;
            if (active && $(active).closest('#MPeditPoint').length) {
                // the change handler above sets the tick according to what was taken
                $(active).trigger('change');
                active.blur();
                return;
            }
            $('#pointSavedTick').toggle(!disableMarkerEdit);
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

        window.electronAPI.readFile(filename).then(async response => {
            if (response.error) {
                GUI.log(i18n.getMessage('errorReadingFile'));
                console.error(response.error);
                return;
            }

            let result;
            try {
                result = await new Promise((resolve, reject) => {
                    xml2js.Parser({ 'explicitChildren': true, 'preserveChildrenOrder': true }).parseString(response.data, (err, res) => {
                        if (err) reject(err);
                        else resolve(res);
                    });
                });
            } catch (err) {
                GUI.log(i18n.getMessage('errorParsingFile'));
                console.error(err);
                return;
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
                if (multimissionCount && ! await dialog.confirm(i18n.getMessage('confirm_multimission_file_load'))) {
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
            updateLocationButtonsVisibility();

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

        window.electronAPI.writeFile(filename, xml).then((err) => {
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
                updateLocationButtonsVisibility();
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
        AbsAltCheck = (typeof AbsAltCheck == "boolean") ? AbsAltCheck : missionControlTab.isBitSet(AbsAltCheck, MWNP.P3.ALT_TYPE);

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
                    let currentGroundClearance = 100 * Number($('#groundClearanceValueAtWP').val());
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
        $('#groundClearanceValueAtWP').val(groundClearance);

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
                if (elevationChartInstance) {
                    elevationChartInstance.destroy();
                    elevationChartInstance = null;
                }

                // Create empty chart with message
                elevationChartInstance = new Chart(ctx, {
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

                        // reuse only if still bound to the current canvas (replaced on tab reload)
                        if (elevationChartInstance && elevationChartInstance.canvas === ctx) {
                            // Update data
                            elevationChartInstance.data = newData;
                            elevationChartInstance.options.plugins.title.text = chartTitle;
                            elevationChartInstance.options.scales.y.min = Math.floor(-10 + Math.min(minMission, minElevation));
                            elevationChartInstance.options.scales.y.max = Math.ceil(10 + Math.max(maxMission, maxElevation));
                            // Trigger re-render without animation for better performance during drag operations
                            elevationChartInstance.update('none');
                        } else {
                            if (elevationChartInstance) {
                                elevationChartInstance.destroy();
                            }
                            // Create new chart
                            elevationChartInstance = new Chart(ctx, {
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

missionControlTab.isBitSet = function(bits, testBit) {
    let isTrue = ((bits & (1 << testBit)) != 0);

    return isTrue;
}

missionControlTab.setBit = function(bits, bit, value) {
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

missionControlTab.cleanup = function (callback) {
    // The elevation panel's drag listens on the document, so it outlives the tab unless
    // it is taken off here - reopening the tab would otherwise stack one pair per visit.
    $(document).off('.elevationDrag');
    if (elevationChartInstance) {
        elevationChartInstance.destroy();
        elevationChartInstance = null;
    }
    if (callback) callback();
};

export default missionControlTab;
