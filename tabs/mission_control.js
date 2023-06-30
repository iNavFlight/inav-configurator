'use strict';

////////////////////////////////////
//
// global Parameters definition
//
////////////////////////////////////


// MultiWii NAV Protocol
var MWNP = MWNP || {};

// WayPoint type
MWNP.WPTYPE = {
    WAYPOINT:           1,
    POSHOLD_UNLIM:      2,
    POSHOLD_TIME:       3,
    RTH:                4,
    SET_POI:            5,
    JUMP:               6,
    SET_HEAD:           7,
    LAND:               8
};

MWNP.P3 = {
    ALT_TYPE:       0,  // Altitude (alt) : Relative (to home altitude) (0) or Absolute (AMSL) (1).
    USER_ACTION_1:  1,  // WP Action 1
    USER_ACTION_2:  2,  // WP Action 2
    USER_ACTION_3:  3,  // WP Action 3
    USER_ACTION_4:  4,  // WP Action 4
}

// Reverse WayPoint type dictionary
function swap(dict) {
    let rev_dict = {};
    for (let key in dict) {
        rev_dict[dict[key]] = key;
    }
    return rev_dict;
}

MWNP.WPTYPE.REV = swap(MWNP.WPTYPE);

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
    let rthUpdateInterval = 0;

    if (GUI.active_tab != 'mission_control') {
        GUI.active_tab = 'mission_control';
        googleAnalytics.sendAppView('Mission Control');
    }

    if (CONFIGURATOR.connectionValid) {
        var loadChainer = new MSPChainerClass();
        loadChainer.setChain([
            mspHelper.getMissionInfo,
            //mspHelper.loadWaypoints,
            //mspHelper.loadSafehomes
        ]);
        loadChainer.setExitPoint(loadHtml);
        loadChainer.execute();
    } else {

        // FC not connected, load page anyway
        loadHtml();
    }

    function loadHtml() {
        GUI.load("./tabs/mission_control.html", process_html);
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

        $safehomesTable = $('.safehomesTable');
        $safehomesTableBody = $('#safehomesTableBody');
        $waypointOptionsTable = $('.waypointOptionsTable');
        $waypointOptionsTableBody = $('#waypointOptionsTableBody');

        if (typeof require !== "undefined") {
            loadSettings();
            // let the dom load finish, avoiding the resizing of the map
            setTimeout(initMap, 200);
        } else {
            $('#missionMap, #missionControls').hide();
            $('#notLoadMap').show();
        }
        localize();

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

          let lat = GPS_DATA.lat / 10000000;
          let lon = GPS_DATA.lon / 10000000;

          //Update map
          if (GPS_DATA.fix >= 2) {

              if (!cursorInitialized) {
                  cursorInitialized = true;

                  /////////////////////////////////////
                  //create layer for current position
                  curPosStyle = new ol.style.Style({
                      image: new ol.style.Icon(({
                          anchor: [0.5, 0.5],
                          opacity: 1,
                          scale: 0.6,
                          src: '../images/icons/icon_mission_airplane.png'
                      }))
                  });

                  let currentPositionLayer;
                  curPosGeo = new ol.geom.Point(ol.proj.fromLonLat([lon, lat]));

                  let curPosFeature = new ol.Feature({
                      geometry: curPosGeo
                  });

                  curPosFeature.setStyle(curPosStyle);

                  let vectorSource = new ol.source.Vector({
                      features: [curPosFeature]
                  });
                  currentPositionLayer = new ol.layer.Vector({
                      source: vectorSource
                  });

                  ///////////////////////////
                  //create layer for RTH Marker
                  let rthStyle = new ol.style.Style({
                      image: new ol.style.Icon(({
                          anchor: [0.5, 1.0],
                          opacity: 1,
                          scale: 0.5,
                          src: '../images/icons/cf_icon_RTH.png'
                      }))
                  });

                  rthGeo = new ol.geom.Point(ol.proj.fromLonLat([90, 0]));

                  let rthFeature = new ol.Feature({
                      geometry: rthGeo
                  });

                  rthFeature.setStyle(rthStyle);

                  let rthVector = new ol.source.Vector({
                      features: [rthFeature]
                  });
                  let rthLayer = new ol.layer.Vector({
                      source: rthVector
                  });

                  //////////////////////////////
                  //create layer for bread crumbs
                  breadCrumbLS = new ol.geom.LineString([ol.proj.fromLonLat([lon, lat]), ol.proj.fromLonLat([lon, lat])]);

                  breadCrumbStyle = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                      color: '#ffcc33',
                      width: 6
                    })
                  });

                  breadCrumbFeature = new ol.Feature({
                    geometry: breadCrumbLS
                  });

                  breadCrumbFeature.setStyle(breadCrumbStyle);

                  breadCrumbSource = new ol.source.Vector({
                    features: [breadCrumbFeature]
                  });

                  breadCrumbVector = new ol.layer.Vector({
                    source: breadCrumbSource
                  });

                  /////////////////////////////
                  //create layer for heading, alt, groundspeed
                  textGeom = new ol.geom.Point([0,0]);

                  textStyle = new ol.style.Style({
                    text: new ol.style.Text({
                      font: 'bold 35px Calibri,sans-serif',
                      fill: new ol.style.Fill({ color: '#fff' }),
                      offsetX: map.getSize()[0]-260,
                      offsetY: 80,
                      textAlign: 'left',
                      backgroundFill: new ol.style.Fill({ color: '#000' }),
                      stroke: new ol.style.Stroke({
                        color: '#fff', width: 2
                      }),
                      text: 'H: XXX\nAlt: XXXm\nSpeed: XXXcm/s'
                    })
                  });

                  textFeature = new ol.Feature({
                    geometry: textGeom
                  });

                  textFeature.setStyle(textStyle);

                  var textSource = new ol.source.Vector({
                    features: [textFeature]
                  });

                  var textVector = new ol.layer.Vector({
                    source: textSource
                  });

                  map.addLayer(rthLayer);
                  map.addLayer(breadCrumbVector);
                  map.addLayer(currentPositionLayer);
                  map.addControl(textVector);
              }

              let gpsPos = ol.proj.fromLonLat([lon, lat]);
              curPosGeo.setCoordinates(gpsPos);

              breadCrumbLS.appendCoordinate(gpsPos);

              var coords = breadCrumbLS.getCoordinates();
              if(coords.length > 100)
              {
                coords.shift();
                breadCrumbLS.setCoordinates(coords);
              }

              curPosStyle.getImage().setRotation((SENSOR_DATA.kinematics[2]/360.0) * 6.28318);

              //update data text
              textGeom.setCoordinates(map.getCoordinateFromPixel([0,0]));
              let tmpText = textStyle.getText();
              tmpText.setText('                                \n' +
                              'H: ' + SENSOR_DATA.kinematics[2] +
                              '\nAlt: ' + SENSOR_DATA.altitude +
                              'm\nSpeed: ' + GPS_DATA.speed + 'cm/s\n' +
                              'Dist: ' + GPS_DATA.distanceToHome + 'm');

              //update RTH every 5th GPS update since it really shouldn't change
              if(rthUpdateInterval >= 5)
              {
                MISSION_PLANNER.bufferPoint.number = -1; //needed to get point 0 which id RTH
                MSP.send_message(MSPCodes.MSP_WP, mspHelper.crunch(MSPCodes.MSP_WP), false, function rth_update() {
                    var coord = ol.proj.fromLonLat([MISSION_PLANNER.bufferPoint.lon, MISSION_PLANNER.bufferPoint.lat]);
                    rthGeo.setCoordinates(coord);
                  });
                rthUpdateInterval = 0;
              }
              rthUpdateInterval++;
          }
        }

        /*
         * enable data pulling if not offline
         * Refreshing data at 5Hz...  Could slow this down if we have performance issues
         */
        if(!isOffline)
        {
          helper.mspBalancedInterval.add('gps_pull', 200, 3, function gps_update() {
              // avoid usage of the GPS commands until a GPS sensor is detected for targets that are compiled without GPS support.
              if (!have_sensor(CONFIG.activeSensors, 'gps')) {
                  update_gpsTrack();
                  return;
              }

              if (helper.mspQueue.shouldDrop()) {
                  return;
              }

              get_raw_gps_data();
          });
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
    var safehomeMarkers = [];    // layer for Safehome points

    var map;

    //////////////////////////////////////////////////////////////////////////////////////////////
    //      define & init parameters for Selected Marker
    //////////////////////////////////////////////////////////////////////////////////////////////
    var selectedMarker = null;
    var selectedFeature = null;
    var tempMarker = null;
    var disableMarkerEdit = false;

    //////////////////////////////////////////////////////////////////////////////////////////////
    //      define & init parameters for default Settings
    //////////////////////////////////////////////////////////////////////////////////////////////
    var vMaxDistSH = 0;
    var settings = {};
    if (CONFIGURATOR.connectionValid) {
        mspHelper.getSetting("safehome_max_distance").then(function (s) {
            if (s) {
                vMaxDistSH = Number(s.value)/100;
                settings = { speed: 0, alt: 5000, safeRadiusSH : 50, maxDistSH : vMaxDistSH};
            }
            else {
                vMaxDistSH = 0;
                settings = { speed: 0, alt: 5000, safeRadiusSH : 50, maxDistSH : vMaxDistSH};
            }
        });
    }
    else {
        vMaxDistSH = 0;
        settings = { speed: 0, alt: 5000, safeRadiusSH : 50, maxDistSH : vMaxDistSH};
    }

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
    //var SAFEHOMES = new SafehomeCollection(); // TO COMMENT FOR RELEASE : DECOMMENT FOR DEBUG
    //SAFEHOMES.inflate(); // TO COMMENT FOR RELEASE : DECOMMENT FOR DEBUG
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
        chrome.storage.local.get('missionPlannerSettings', function (result) {
            if (result.missionPlannerSettings) {
                settings = result.missionPlannerSettings;
            }
            refreshSettings();
        });
    }

    function saveSettings() {
        chrome.storage.local.set({'missionPlannerSettings': settings});
    }

    function refreshSettings() {
        $('#MPdefaultPointAlt').val(String(settings.alt));
        $('#MPdefaultPointSpeed').val(String(settings.speed));
        $('#MPdefaultSafeRangeSH').val(String(settings.safeRadiusSH));
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

    function renderSafehomesTable() {
        /*
         * Process safehome table UI
         */
        let safehomes = SAFEHOMES.get();
        $safehomesTableBody.find("*").remove();
        for (let safehomeIndex in safehomes) {
            if (safehomes.hasOwnProperty(safehomeIndex)) {
                const safehome = safehomes[safehomeIndex];

                $safehomesTableBody.append('\
                    <tr>\
                    <td><div id="viewSafomePoint" class="btnTable btnTableIcon"> \
                            <a class="ic_center" data-role="safehome-center" href="#"  title="move to center view"></a> \
                        </div>\
                    </td> \
                    <td><span class="safehome-number"/></td>\
                    <td class="safehome-enabled"><input type="checkbox" class="togglesmall safehome-enabled-value"/></td> \
                    <td><input type="number" class="safehome-lat" /></td>\
                    <td><input type="number" class="safehome-lon" /></td>\
                    </tr>\
                ');

                const $row = $safehomesTableBody.find('tr:last');

                $row.find(".safehome-number").text(safehome.getNumber()+1);

                $row.find(".safehome-enabled-value").prop('checked',safehome.isUsed()).change(function () {
                    safehome.setEnabled((($(this).prop('checked')) ? 1 : 0));
                    SAFEHOMES.updateSafehome(safehome);
                    cleanSafehomeLayers();
                    renderSafehomesOnMap();
                });

                $row.find(".safehome-lon").val(safehome.getLonMap()).change(function () {
                    safehome.setLon(Math.round(Number($(this).val()) * 10000000));
                    SAFEHOMES.updateSafehome(safehome);
                    cleanSafehomeLayers();
                    renderSafehomesOnMap();
                });

                $row.find(".safehome-lat").val(safehome.getLatMap()).change(function () {
                    safehome.setLat(Math.round(Number($(this).val()) * 10000000));
                    SAFEHOMES.updateSafehome(safehome);
                    cleanSafehomeLayers();
                    renderSafehomesOnMap();
                });

                $row.find("[data-role='safehome-center']").attr("data-index", safehomeIndex);
            }
        }
        GUI.switchery();
        localize();
    }


    function renderSafehomesOnMap() {
        /*
         * Process safehome on Map
         */
        SAFEHOMES.get().forEach(function (safehome) {
            map.addLayer(addSafeHomeMarker(safehome));
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
        return new ol.style.Style({
            image: new ol.style.Icon(({
                anchor: [0.5, 1],
                opacity: 1,
                scale: 0.5,
                src: '../images/icons/cf_icon_safehome' + (safehome.isUsed() ? '_used' : '')+ '.png'
            })),
            text: new ol.style.Text(({
                text: String(Number(safehome.getNumber())+1),
                font: '12px sans-serif',
                offsetY: -15,
                offsetX: -2,
                fill: new ol.style.Fill({
                    color: '#FFFFFF'
                }),
                stroke: new ol.style.Stroke({
                    color: '#FFFFFF'
                }),
            }))
        });
    }

    function addSafeHomeMarker(safehome) {
        /*
         * add safehome on Map
         */
        let coord = ol.proj.fromLonLat([safehome.getLonMap(), safehome.getLatMap()]);
        var iconFeature = new ol.Feature({
            geometry: new ol.geom.Point(coord),
            name: 'safehome'
        });

        //iconFeature.setStyle(getSafehomeIcon(safehome, safehome.isUsed()));

        let circleStyle = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(144, 12, 63, 0.5)',
                width: 3,
                lineDash : [10]
            }),
            // fill: new ol.style.Fill({
                // color: 'rgba(251, 225, 155, 0.1)'
            // })
        });

        let circleSafeStyle = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(136, 204, 62, 1)',
                width: 3,
                lineDash : [10]
            }),
            /* fill: new ol.style.Fill({
                color: 'rgba(136, 204, 62, 0.1)'
            }) */
        });

        var vectorLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                        features: [iconFeature]
                    }),
            style : function(iconFeature) {
                let styles = [getSafehomeIcon(safehome)];
                if (safehome.isUsed()) {
                    circleStyle.setGeometry(new ol.geom.Circle(iconFeature.getGeometry().getCoordinates(), getProjectedRadius(settings.maxDistSH)));
                    circleSafeStyle.setGeometry(new ol.geom.Circle(iconFeature.getGeometry().getCoordinates(), getProjectedRadius(Number(settings.safeRadiusSH))));
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

        return vectorLayer;
    }

    function getProjectedRadius(radius) {
        let projection = map.getView().getProjection();
        let resolutionAtEquator = map.getView().getResolution();
        let resolutionRate = resolutionAtEquator / ol.proj.getPointResolution(projection, resolutionAtEquator, map.getView().getCenter());
        let radiusProjected = (radius / ol.proj.METERS_PER_UNIT.m) * resolutionRate;
        return radiusProjected;
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

        $(".home-lat").val(HOME.getLatMap()).change(function () {
            HOME.setLat(Math.round(Number($(this).val()) * 10000000));
            cleanHomeLayers();
            renderHomeOnMap();
        });

        $(".home-lon").val(HOME.getLonMap()).change(function () {
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

        if (globalSettings.mapProviderType == 'bing') {
            $('#elevationEarthModelclass').fadeIn(300);
        } else {
            $('#elevationEarthModelclass').fadeOut(300);
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
        let coord = ol.proj.fromLonLat([home.getLonMap(), home.getLatMap()]);
        var iconFeature = new ol.Feature({
            geometry: new ol.geom.Point(coord),
            name: 'home'
        });

        //iconFeature.setStyle(getSafehomeIcon(safehome, safehome.isUsed()));

        var vectorLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
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
        return new ol.style.Style({
            image: new ol.style.Icon(({
                anchor: [0.5, 1],
                opacity: 1,
                scale: 0.5,
                src: '../images/icons/cf_icon_home.png'
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
        tempMissionData = multimission.get().slice(startWPCount, endWPCount + 1);   // copy selected single mission from MM
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
        $('#multimissionOptionList').val(MMCount).change();
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
        } else if (confirm(chrome.i18n.getMessage('confirm_overwrite_multimission_file_load_option'))) {
            nwdialog.setContext(document);
            nwdialog.openFileDialog(function(result) {
                loadMissionFile(result);
                multimissionCount = 0;
                multimission.flush();
                renderMultimissionTable();
            })
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
        let coord = ol.proj.fromLonLat([waypoint.getLonMap(), waypoint.getLatMap()]);
        var iconFeature = new ol.Feature({
            geometry: new ol.geom.Point(coord),
            name: 'Null Island',
            population: 4000,
            rainfall: 500
        });
        iconFeature.setStyle(getWaypointIcon(waypoint, isEdit));
        var vectorSource = new ol.source.Vector({
            features: [iconFeature]
        });

        var vectorLayer = new ol.layer.Vector({
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

        return new ol.style.Style({
            image: new ol.style.Icon(({
                anchor: [0.5, 1],
                opacity: 1,
                scale: 0.5,
                src: '../images/icons/cf_icon_position' + (dictofPointIcon[waypoint.getAction()] != '' ? '_'+dictofPointIcon[waypoint.getAction()] : '') + (isEdit ? '_edit' : '')+ '.png'
            })),
            text: new ol.style.Text(({
                text: String(Number(waypoint.getLayerNumber()+1)),
                font: '12px sans-serif',
                offsetY: -15,
                offsetX: -2,
                fill: new ol.style.Fill({
                    color: '#FFFFFF'
                }),
                stroke: new ol.style.Stroke({
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
                let coord = ol.proj.fromLonLat([element.getLonMap(), element.getLatMap()]);
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
                            paintLine(oldPos, coord, element.getNumber(), color='#ffb725', lineDash=5);
                        }
                        else {
                            paintLine(oldPos, coord, element.getNumber(), color='#ffb725');
                        }
                    }
                    // If one is SET_HEAD, draw labelled line in-between with heading value
                    else if (typeof oldPos !== 'undefined' && activatePoi != true && activateHead == true) {
                        paintLine(oldPos, coord, element.getNumber(), color='#1497f1', lineDash=0, lineText=String(oldHeading)+"°");
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
                    let coord = ol.proj.fromLonLat([mission.getWaypoint(jumpWPIndex).getLonMap(), mission.getWaypoint(jumpWPIndex).getLatMap()]);
                    paintLine(oldPos, coord, element.getNumber(), color='#e935d6', lineDash=5, lineText="Repeat x"+(element.getP2() == -1 ? " infinite" : String(element.getP2())), selection=false, arrow=true);
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
        });
        //reset text position
        if (textGeom) {
            textGeom.setCoordinates(map.getCoordinateFromPixel([0,0]));
        }
        let lengthMission = mission.getDistance(true);

        if (disableMarkerEdit) {
            $('#missionDistance').text('N/A');
        } else {
            $('#missionDistance').text(lengthMission[lengthMission.length -1] != -1 ? lengthMission[lengthMission.length -1].toFixed(1) : 'infinite');
        }
    }

    function paintLine(pos1, pos2, pos2ID, color='#1497f1', lineDash=0, lineText="", selection=true, arrow=false) {
        var line = new ol.geom.LineString([pos1, pos2]);

        var feature = new ol.Feature({
            geometry: line
        });

        feature.setStyle(
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: color,
                    width: 3,
                    lineDash: [lineDash]
                }),
                text: new ol.style.Text({
                    text: lineText,
                    font: '14px sans-serif',
                    placement : 'line',
                    textBaseline: 'ideographic',
                    stroke: new ol.style.Stroke({
                        color: color
                    }),
                }),
            }),
        );

        if (arrow) {
            let dx = pos2[0] - pos1[0];
            let dy = pos2[1] - pos1[1];
            let rotation = Math.atan2(dx, dy);
            var featureArrow = new ol.Feature({
                geometry: new ol.geom.Point([pos1[0]+dx/2, pos1[1]+dy/2])
            });
            featureArrow.setStyle(
                new ol.style.Style({
                    image: new ol.style.Icon({
                        src: '../images/icons/cf_icon_arrow.png',
                        scale: 0.3,
                        anchor: [0.5, 0.5],
                        rotateWithView: true,
                        rotation: rotation,
                    }),
                })
            );
        }

        if (arrow) {
            var vectorSource = new ol.source.Vector({
                features: [feature, featureArrow]
            });
        }
        else {
            var vectorSource = new ol.source.Vector({
                features: [feature]
            });
        }

        var vectorLayer = new ol.layer.Vector({
            source: vectorSource
        });

        vectorLayer.kind = "line";
        vectorLayer.selection = selection;
        vectorLayer.number = pos2ID;

        lines.push(vectorLayer);

/*         var length = ol.Sphere.getLength(line) + parseFloat($('#missionDistance').text());
        $('#missionDistance').text(length.toFixed(3)); */

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
            mission.get().forEach(function (element) {
                if (!element.isAttached()) {
                    map.addLayer(addWaypointMarker(element));
                }
            });
            repaintLine4Waypoints(mission);
        }
    }

    function redrawLayer() {
        if (selectedFeature && selectedMarker) {
            selectedFeature.setStyle(getWaypointIcon(selectedMarker, true));
        }
        repaintLine4Waypoints(mission);
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

            $row.find(".waypointOptions-action").val(waypointOptions.indexOf(MWNP.WPTYPE.REV[element.getAction()])).change(function () {
                element.setAction(MWNP.WPTYPE[waypointOptions[$(this).val()]]);
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

            $row.find(".waypointOptions-p1").val((MWNP.WPTYPE.REV[element.getAction()] == "JUMP" ? element.getP1()+1 : element.getP1())).change(function () {
                if (MWNP.WPTYPE.REV[element.getAction()] == "SET_HEAD") {
                    if ($(this).val() >= 360 || ($(this).val() < 0 && $(this).val() != -1))
                    {
                      $(this).val(-1);
                      alert(chrome.i18n.getMessage('MissionPlannerHeadSettingsCheck'));
                    }
                }
                else if (MWNP.WPTYPE.REV[element.getAction()] == "RTH") {
                    if ($(this).val() != 0 && $(this).val() != 1)
                    {
                      $(this).val(0);
                      alert(chrome.i18n.getMessage('MissionPlannerRTHSettingsCheck'));
                    }
                }
                else if (MWNP.WPTYPE.REV[element.getAction()] == "JUMP") {
                    if ($(this).val() > mission.getNonAttachedList().length || $(this).val() < 1)
                    {
                      $(this).val(1);
                      alert(chrome.i18n.getMessage('MissionPlannerJumpSettingsCheck'));
                    }
                    else if (mission.getPoiList().length != 0 && mission.getPoiList()) {
                        if (mission.getPoiList().includes(mission.convertJumpNumberToWaypoint(Number($(this).val())-1))) {
                            $(this).val(1);
                            alert(chrome.i18n.getMessage('MissionPlannerJump3SettingsCheck'));
                        }
                    }
                }
                element.setP1((MWNP.WPTYPE.REV[element.getAction()] == "JUMP" ? mission.convertJumpNumberToWaypoint(Number($(this).val())-1) : Number($(this).val())));
                mission.updateWaypoint(element);
                cleanLines();
                redrawLayer();
            });

            $row.find(".waypointOptions-p2").val(element.getP2()).change(function () {
                if (MWNP.WPTYPE.REV[element.getAction()] == "JUMP") {
                    if ($(this).val() > 10 || ($(this).val() < 0 && $(this).val() != -1))
                    {
                      $(this).val(0);
                      alert(chrome.i18n.getMessage('MissionPlannerJump2SettingsCheck'));
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
        localize();
        return waypoint;
    }

    function setView(zoom) {
        var coord = ol.proj.fromLonLat([mission.getWaypoint(0).getLonMap(), mission.getWaypoint(0).getLatMap()]);
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

        /**
         * @constructor
         * @extends {ol.interaction.Pointer}
         */
        app.Drag = function () {

            ol.interaction.Pointer.call(this, {
                handleDownEvent: app.Drag.prototype.handleDownEvent,
                handleDragEvent: app.Drag.prototype.handleDragEvent,
                handleMoveEvent: app.Drag.prototype.handleMoveEvent,
                handleUpEvent: app.Drag.prototype.handleUpEvent
            });

            /**
             * @type {ol.Pixel}
             * @private
             */
            this.coordinate_ = null;

            /**
             * @type {string|undefined}
             * @private
             */
            this.cursor_ = 'pointer';

            /**
             * @type {ol.Feature}
             * @private
             */
            this.feature_ = null;

            /**
             * @type {string|undefined}
             * @private
             */
            this.previousCursor_ = undefined;

        };
        ol.inherits(app.Drag, ol.interaction.Pointer);

        app.ConvertCentimetersToMeters = function (val) {
            return parseInt(val) / 100;
        };

        /**
         * @constructor
         * @extends {ol.control.Control}
         * @param {Object=} opt_options Control options.
         */
        app.PlannerSettingsControl = function (opt_options) {
            var options = opt_options || {};
            var button = document.createElement('button');

            button.innerHTML = ' ';
            button.style = 'background: url(\'../images/CF_settings_white.svg\') no-repeat 1px -1px;background-color: rgba(0,60,136,.5);';

            var handleShowSettings = function () {
                $('#missionPlannerSettings').fadeIn(300);
            };

            button.addEventListener('click', handleShowSettings, false);
            button.addEventListener('touchstart', handleShowSettings, false);

            var element = document.createElement('div');
            element.className = 'mission-control-settings ol-unselectable ol-control';
            element.appendChild(button);
            element.title = 'MP Settings';

            ol.control.Control.call(this, {
                element: element,
                target: options.target
            });

        };
        ol.inherits(app.PlannerSettingsControl, ol.control.Control);

        /**
         * @constructor
         * @extends {ol.control.Control}
         * @param {Object=} opt_options Control options.
         */
        app.PlannerSafehomeControl = function (opt_options) {
            var options = opt_options || {};
            var button = document.createElement('button');

            button.innerHTML = ' ';
            button.style = 'background: url(\'../images/icons/cf_icon_safehome_white.svg\') no-repeat 1px -1px;background-color: rgba(0,60,136,.5);';

            var handleShowSafehome = function () {
                $('#missionPlannerSafehome').fadeIn(300);
                //SAFEHOMES.flush();
                //mspHelper.loadSafehomes();
                cleanSafehomeLayers();
                renderSafehomesTable();
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

            ol.control.Control.call(this, {
                element: element,
                target: options.target
            });
        };
        ol.inherits(app.PlannerSafehomeControl, ol.control.Control);

        /**
         * @constructor
         * @extends {ol.control.Control}
         * @param {Object=} opt_options Control options.
         */
        app.PlannerElevationControl = function (opt_options) {
            var options = opt_options || {};
            var button = document.createElement('button');

            button.innerHTML = ' ';
            button.style = 'background: url(\'../images/icons/cf_icon_elevation_white.svg\') no-repeat 1px -1px;background-color: rgba(0,60,136,.5);';

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

            ol.control.Control.call(this, {
                element: element,
                target: options.target
            });
        };
        ol.inherits(app.PlannerElevationControl, ol.control.Control);

        // /**
         // * @constructor
         // * @extends {ol.control.Control}
         // * @param {Object=} opt_options Control options.
         // */
        app.PlannerMultiMissionControl = function (opt_options) {
            
            var options = opt_options || {};
            var button = document.createElement('button');

            button.innerHTML = ' ';
            button.style = 'background: url(\'../images/icons/cf_icon_multimission_white.svg\') no-repeat 1px -1px;background-color: rgba(0,60,136,.5);';

            var handleShowSettings = function () {
                $('#missionPlannerMultiMission').fadeIn(300);
            };

            button.addEventListener('click', handleShowSettings, false);
            button.addEventListener('touchstart', handleShowSettings, false);

            var element = document.createElement('div');
            element.className = 'mission-control-multimission ol-unselectable ol-control';
            element.appendChild(button);
            element.title = 'MP MultiMission';

            ol.control.Control.call(this, {
                element: element,
                target: options.target
            });
        };
        ol.inherits(app.PlannerMultiMissionControl, ol.control.Control);

        /**
         * @param {ol.MapBrowserEvent} evt Map browser event.
         * @return {boolean} `true` to start the drag sequence.
         */
        app.Drag.prototype.handleDownEvent = function (evt) {
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
        app.Drag.prototype.handleDragEvent = function (evt) {
            var map = evt.map;

            var feature = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return feature;
                });

            var deltaX = evt.coordinate[0] - this.coordinate_[0];
            var deltaY = evt.coordinate[1] - this.coordinate_[1];

            var geometry = /** @type {ol.geom.SimpleGeometry} */
                (this.feature_.getGeometry());
            if (tempMarker.kind == "waypoint" || tempMarker.kind == "safehome" || tempMarker.kind == "home") {
                geometry.translate(deltaX, deltaY);
                this.coordinate_[0] = evt.coordinate[0];
                this.coordinate_[1] = evt.coordinate[1];
            }

            let coord = ol.proj.toLonLat(geometry.getCoordinates());
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
                let tempSH = SAFEHOMES.getSafehome(tempMarker.number);
                tempSH.setLon(Math.round(coord[0] * 10000000));
                tempSH.setLat(Math.round(coord[1] * 10000000));
                SAFEHOMES.updateSafehome(tempSH);
                $safehomesTableBody.find('tr:nth-child('+String(tempMarker.number+1)+') > td > .safehome-lon').val(Math.round(coord[0] * 10000000) / 10000000);
                $safehomesTableBody.find('tr:nth-child('+String(tempMarker.number+1)+') > td > .safehome-lat').val(Math.round(coord[1] * 10000000) / 10000000);
            }
            else if (tempMarker.kind == "home") {
                HOME.setLon(Math.round(coord[0] * 10000000));
                HOME.setLat(Math.round(coord[1] * 10000000));
                $('.home-lon').val(Math.round(coord[0] * 10000000) / 10000000);
                $('.home-lat').val(Math.round(coord[1] * 10000000) / 10000000);
            }
        };

        /**
         * @param {ol.MapBrowserEvent} evt Event.
         */
        app.Drag.prototype.handleMoveEvent = function (evt) {
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
        app.Drag.prototype.handleUpEvent = function (evt) {
            if (tempMarker.kind == "waypoint") {
                if (selectedMarker != null && tempMarker.number == selectedMarker.getLayerNumber()) {
                    (async () => {
                        const elevationAtWP = await mission.getWaypoint(tempMarker.number).getElevation(globalSettings);
                        $('#elevationValueAtWP').text(elevationAtWP);
                        const returnAltitude = checkAltElevSanity(false, mission.getWaypoint(tempMarker.number).getAlt(), elevationAtWP, mission.getWaypoint(tempMarker.number).getP3());
                        mission.getWaypoint(tempMarker.number).setAlt(returnAltitude);
                        plotElevation();
                    })()
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
            this.coordinate_ = null;
            this.feature_ = null;
            return false;
        };

        var lat = (GPS_DATA ? (GPS_DATA.lat / 10000000) : 0);
        var lon = (GPS_DATA ? (GPS_DATA.lon / 10000000) : 0);

        let mapLayer;

        if (globalSettings.mapProviderType == 'bing') {
            mapLayer = new ol.source.BingMaps({
                key: globalSettings.mapApiKey,
                imagerySet: 'AerialWithLabels',
                maxZoom: 19
            });
        } else if ( globalSettings.mapProviderType == 'mapproxy' ) {
            mapLayer = new ol.source.TileWMS({
                url: globalSettings.proxyURL,
                params: {'LAYERS':globalSettings.proxyLayer}
            })
        } else {
            mapLayer = new ol.source.OSM();
        }

        if (CONFIGURATOR.connectionValid) {
            control_list = [
                new app.PlannerSettingsControl(),
                new app.PlannerMultiMissionControl(),
                new app.PlannerSafehomeControl(),
                new app.PlannerElevationControl(),
            ]
        }
        else {
            control_list = [
                new app.PlannerSettingsControl(),
                new app.PlannerMultiMissionControl(),
                new app.PlannerElevationControl(),
                //new app.PlannerSafehomeControl() // TO COMMENT FOR RELEASE : DECOMMENT FOR DEBUG
            ]
        }

        //////////////////////////////////////////////////////////////////////////////////////////////
        // Map object definition
        //////////////////////////////////////////////////////////////////////////////////////////////
        map = new ol.Map({
            controls: ol.control.defaults({
                attributionOptions: {
                    collapsible: false
                }
            }).extend(control_list),
            interactions: ol.interaction.defaults().extend([new app.Drag()]),
            layers: [
                new ol.layer.Tile({
                    source: mapLayer
                })
            ],
            target: document.getElementById('missionMap'),
            view: new ol.View({
                center: ol.proj.fromLonLat([lon, lat]),
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
            chrome.storage.local.set({'missionPlannerLastValues': {
                center: ol.proj.toLonLat(map.getView().getCenter()),
                zoom: map.getView().getZoom()
            }});
        });
        //////////////////////////////////////////////////////////////////////////
        // load map view settings on startup
        //////////////////////////////////////////////////////////////////////////
        chrome.storage.local.get('missionPlannerLastValues', function (result) {
            if (result.missionPlannerLastValues && result.missionPlannerLastValues.center) {
                map.getView().setCenter(ol.proj.fromLonLat(result.missionPlannerLastValues.center));
                map.getView().setZoom(result.missionPlannerLastValues.zoom);
            }
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
                    GUI.log(chrome.i18n.getMessage('notAWAYPOINT'));
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
                var geometry = selectedFeature.getGeometry();
                var coord = ol.proj.toLonLat(geometry.getCoordinates());

                selectedFeature.setStyle(getWaypointIcon(selectedMarker, true));

                let P3Value = selectedMarker.getP3();

                changeSwitchery($('#pointP3Alt'), TABS.mission_control.isBitSet(P3Value, MWNP.P3.ALT_TYPE));
                changeSwitchery($('#pointP3UserAction1'), TABS.mission_control.isBitSet(P3Value, MWNP.P3.USER_ACTION_1));
                changeSwitchery($('#pointP3UserAction2'), TABS.mission_control.isBitSet(P3Value, MWNP.P3.USER_ACTION_2));
                changeSwitchery($('#pointP3UserAction3'), TABS.mission_control.isBitSet(P3Value, MWNP.P3.USER_ACTION_3));
                changeSwitchery($('#pointP3UserAction4'), TABS.mission_control.isBitSet(P3Value, MWNP.P3.USER_ACTION_4));

                var altitudeMeters = app.ConvertCentimetersToMeters(selectedMarker.getAlt());

                if (tempSelectedMarkerIndex == null || tempSelectedMarkerIndex != selectedMarker.getLayerNumber()) {
                    (async () => {
                        const elevationAtWP = await selectedMarker.getElevation(globalSettings);
                        $('#elevationValueAtWP').text(elevationAtWP);
                        const returnAltitude = checkAltElevSanity(false, selectedMarker.getAlt(), elevationAtWP, P3Value);
                        selectedMarker.setAlt(returnAltitude);
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
                let tempWpCoord = ol.proj.toLonLat(evt.coordinate);
                let tempWp = new Waypoint(tempMarker.number, MWNP.WPTYPE.WAYPOINT, Math.round(tempWpCoord[1] * 10000000), Math.round(tempWpCoord[0] * 10000000), alt=Number(settings.alt), p1=Number(settings.speed));
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
                selectedMarker = SAFEHOMES.getSafehome(tempMarker.number);
                var geometry = selectedFeature.getGeometry();
                var coord = ol.proj.toLonLat(geometry.getCoordinates());
                $safehomesTableBody.find('tr:nth-child('+String(tempMarker.number+1)+') > td > .safehome-enabled-value').val(selectedMarker.isUsed());
                $safehomesTableBody.find('tr:nth-child('+String(tempMarker.number+1)+') > td > .safehome-lon').val(Math.round(coord[0] * 10000000) / 10000000);
                $safehomesTableBody.find('tr:nth-child('+String(tempMarker.number+1)+') > td > .safehome-lat').val(Math.round(coord[1] * 10000000) / 10000000);
            }
            else if (selectedFeature && tempMarker.kind == "home" && tempMarker.selection) {
                selectedMarker = HOME;
                var geometry = selectedFeature.getGeometry();
                var coord = ol.proj.toLonLat(geometry.getCoordinates());
                $('.home-lon').val(Math.round(coord[0] * 10000000) / 10000000);
                $('.home-lat').val(Math.round(coord[1] * 10000000) / 10000000);
            }
            else if (!disableMarkerEdit) {
                let tempWpCoord = ol.proj.toLonLat(evt.coordinate);
                let tempWp = new Waypoint(mission.get().length, MWNP.WPTYPE.WAYPOINT, Math.round(tempWpCoord[1] * 10000000), Math.round(tempWpCoord[0] * 10000000), alt=Number(settings.alt), p1=Number(settings.speed));
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
            var hit = map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                return true;
            });
            if (hit) {
                map.getTarget().style.cursor = 'pointer';
            } else {
                map.getTarget().style.cursor = '';
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
        $('#pointAlt').keyup(function(){
            let altitudeMeters = app.ConvertCentimetersToMeters($(this).val());
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

        /////////////////////////////////////////////
        // Callback for Waypoint edition
        /////////////////////////////////////////////
        $('#pointType').change(function () {
            if (selectedMarker) {
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
                P3Value = selectedMarker.getP3();
                
                if (disableMarkerEdit) {
                    changeSwitchery($('#pointP3Alt'), TABS.mission_control.isBitSet(P3Value, MWNP.P3.ALT_TYPE));
                }

                P3Value = TABS.mission_control.setBit(P3Value, MWNP.P3.ALT_TYPE, $('#pointP3Alt').prop("checked"));
                (async () => {
                    const elevationAtWP = await selectedMarker.getElevation(globalSettings);
                    $('#elevationValueAtWP').text(elevationAtWP);
                    var altitude = Number($('#pointAlt').val());
                    if (P3Value != selectedMarker.getP3()) {
                        selectedMarker.setP3(P3Value);
                        
                        if ($('#pointP3Alt').prop("checked")) {
                            if (altitude < 0) {
                                altitude = settings.alt;
                            }
                            selectedMarker.setAlt(altitude + elevationAtWP * 100);
                        } else {
                            selectedMarker.setAlt(altitude - Number(elevationAtWP) * 100);
                        }
                    }
                    const returnAltitude = checkAltElevSanity(false, selectedMarker.getAlt(), elevationAtWP, selectedMarker.getP3());
                    selectedMarker.setAlt(returnAltitude);
                    $('#pointAlt').val(selectedMarker.getAlt());
                    altitudeMeters = app.ConvertCentimetersToMeters(selectedMarker.getAlt());
                    $('#altitudeInMeters').text(` ${altitudeMeters}m`);

                    mission.updateWaypoint(selectedMarker);
                    mission.update(singleMissionActive());
                    redrawLayer();
                    plotElevation();
                })()
            }
        });

        $('#pointP3UserAction1').on('change', function(event){
            if (selectedMarker) {
                if (disableMarkerEdit) {
                    changeSwitchery($('#pointP3UserAction1'), TABS.mission_control.isBitSet(selectedMarker.getP3(), MWNP.P3.USER_ACTION_1));
                }

                P3Value = TABS.mission_control.setBit(selectedMarker.getP3(), MWNP.P3.USER_ACTION_1, $('#pointP3UserAction1').prop("checked"));
                selectedMarker.setP3(P3Value);
    
                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        $('#pointP3UserAction2').on('change', function(event){
            if (selectedMarker) {
                if (disableMarkerEdit) {
                    changeSwitchery($('#pointP3UserAction2'), TABS.mission_control.isBitSet(selectedMarker.getP3(), MWNP.P3.USER_ACTION_2));
                }

                P3Value = TABS.mission_control.setBit(selectedMarker.getP3(), MWNP.P3.USER_ACTION_2, $('#pointP3UserAction2').prop("checked"));
                selectedMarker.setP3(P3Value);

                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        $('#pointP3UserAction3').on('change', function(event){
            if (selectedMarker) {
                if (disableMarkerEdit) {
                    changeSwitchery($('#pointP3UserAction3'), TABS.mission_control.isBitSet(selectedMarker.getP3(), MWNP.P3.USER_ACTION_3));
                }
    
                P3Value = TABS.mission_control.setBit(selectedMarker.getP3(), MWNP.P3.USER_ACTION_3, $('#pointP3UserAction3').prop("checked"));
                selectedMarker.setP3(P3Value);

                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
            }
        });

        $('#pointP3UserAction4').on('change', function(event){
            if (selectedMarker) {
                if (disableMarkerEdit) {
                    changeSwitchery($('#pointP3UserAction4'), TABS.mission_control.isBitSet(selectedMarker.getP3(), MWNP.P3.USER_ACTION_4));
                }
    
                P3Value = TABS.mission_control.setBit(selectedMarker.getP3(), MWNP.P3.USER_ACTION_4, $('#pointP3UserAction4').prop("checked"));
                selectedMarker.setP3(P3Value);

                mission.updateWaypoint(selectedMarker);
                mission.update(singleMissionActive());
                redrawLayer();
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

        $("[data-role='waypointOptions-add']").click(function () {
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
        // Callback for SAFEHOMES Table
        /////////////////////////////////////////////
        $safehomesTableBody.on('click', "[data-role='safehome-center']", function (event) {
            let mapCenter = map.getView().getCenter();
            let tmpSH = SAFEHOMES.getSafehome($(event.currentTarget).attr("data-index"));
            tmpSH.setLon(Math.round(ol.proj.toLonLat(mapCenter)[0] * 1e7));
            tmpSH.setLat(Math.round(ol.proj.toLonLat(mapCenter)[1] * 1e7));
            SAFEHOMES.updateSafehome(tmpSH);
            renderSafehomesTable();
            cleanSafehomeLayers();
            renderSafehomesOnMap();
        });

        $('#cancelSafehome').on('click', function () {
            closeSafehomePanel();
        });

        $('#loadEepromSafehomeButton').on('click', function () {
            $(this).addClass('disabled');
            GUI.log(chrome.i18n.getMessage('startGettingSafehomePoints'));
            mspHelper.loadSafehomes();
            setTimeout(function(){
                renderSafehomesTable();
                cleanSafehomeLayers();
                renderSafehomesOnMap();
                GUI.log(chrome.i18n.getMessage('endGettingSafehomePoints'));
                $('#loadEepromSafehomeButton').removeClass('disabled');
            }, 500);

        });

        $('#saveEepromSafehomeButton').on('click', function() {
            $(this).addClass('disabled');
            GUI.log(chrome.i18n.getMessage('startSendingSafehomePoints'));
            mspHelper.saveSafehomes();
            setTimeout(function(){
                mspHelper.saveToEeprom();
                GUI.log(chrome.i18n.getMessage('endSendingSafehomePoints'));
                $('#saveEepromSafehomeButton').removeClass('disabled');
            }, 500);
        });

        /////////////////////////////////////////////
        // Callback for HOME Table
        /////////////////////////////////////////////
        $('#homeTableBody').on('click', "[data-role='home-center']", function (event) {
            let mapCenter = map.getView().getCenter();
            HOME.setLon(Math.round(ol.proj.toLonLat(mapCenter)[0] * 1e7));
            HOME.setLat(Math.round(ol.proj.toLonLat(mapCenter)[1] * 1e7));
            updateHome();
        });

        $('#cancelHome').on('click', function () {
            closeHomePanel();
        });

        $('#cancelPlot').on('click', function () {
            closeHomePanel();
        });

        $('#elevationEarthModel').on('change', function (event) {
            if (globalSettings.mapProviderType == 'bing') {
                (async () => {
                    const elevationAtHome = await HOME.getElevation(globalSettings);
                    $('#elevationValueAtHome').text(elevationAtHome+' m');
                    HOME.setAlt(elevationAtHome);

                    if (selectedMarker) {
                        const elevationAtWP = await selectedMarker.getElevation(globalSettings);
                        $('#elevationValueAtWP').text(elevationAtWP);
                        const returnAltitude = checkAltElevSanity(false, selectedMarker.getAlt(), elevationAtWP, selectedMarker.getP3());
                        selectedMarker.setAlt(returnAltitude);
                        mission.updateWaypoint(selectedMarker);
                    }

                    redrawLayer();
                    plotElevation();
                })()
            }
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
            $('#multimissionOptionList').val('0').change();
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
            if (markers.length && confirm(chrome.i18n.getMessage('confirm_delete_all_points'))) {
                if (removeAllMultiMissionCheck()) {
                    removeAllWaypoints();
                    updateMultimissionState();
                }

                plotElevation();
            }
        });

        $('#removePoint').on('click', function () {
            if (selectedMarker) {
                if (mission.isJumpTargetAttached(selectedMarker)) {
                    alert(chrome.i18n.getMessage('MissionPlannerJumpTargetRemoval'));
                }
                else if (mission.getAttachedFromWaypoint(selectedMarker) && mission.getAttachedFromWaypoint(selectedMarker).length != 0) {
                    if (confirm(chrome.i18n.getMessage('confirm_delete_point_with_options'))) {
                        mission.getAttachedFromWaypoint(selectedMarker).forEach(function (element) {
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

            if (markers.length && !confirm(chrome.i18n.getMessage('confirm_delete_all_points'))) return;
            nwdialog.setContext(document);
            nwdialog.openFileDialog('.mission', function(result) {
                loadMissionFile(result);
            })
        });

        $('#saveFileMissionButton').on('click', function () {
            nwdialog.setContext(document);
            nwdialog.saveFileDialog('', '.mission', function(result) {
                saveMissionFile(result);
            })
        });

        $('#loadMissionButton').on('click', function () {
            let message = multimissionCount ? 'confirm_overwrite_multimission_file_load_option' : 'confirm_delete_all_points';
            if ((markers.length || multimissionCount) && !confirm(chrome.i18n.getMessage(message))) return;
            removeAllWaypoints();
            $(this).addClass('disabled');
            GUI.log(chrome.i18n.getMessage('startGetPoint'));
            getWaypointsFromFC(false);
        });

        $('#saveMissionButton').on('click', function () {
            if (mission.isEmpty()) {
                alert(chrome.i18n.getMessage('no_waypoints_to_save'));
                return;
            }
            $(this).addClass('disabled');
            GUI.log(chrome.i18n.getMessage('startSendPoint'));
            sendWaypointsToFC(false);
        });

        $('#loadEepromMissionButton').on('click', function () {
            let message = multimissionCount ? 'confirm_overwrite_multimission_file_load_option' : 'confirm_delete_all_points';
            if ((markers.length || multimissionCount) && !confirm(chrome.i18n.getMessage(message))) return;
            removeAllWaypoints();
            $(this).addClass('disabled');
            GUI.log(chrome.i18n.getMessage('startGetPoint'));
            getWaypointsFromFC(true);
        });

        $('#saveEepromMissionButton').on('click', function () {
            if (mission.isEmpty()) {
                alert(chrome.i18n.getMessage('no_waypoints_to_save'));
                return;
            }
            $(this).addClass('disabled');
            GUI.log(chrome.i18n.getMessage('startSendPoint'));
            sendWaypointsToFC(true);
        });

        /////////////////////////////////////////////
        // Callback for settings
        /////////////////////////////////////////////
        $('#saveSettings').on('click', function () {
            let oldSafeRadiusSH = settings.safeRadiusSH;
            settings = { speed: Number($('#MPdefaultPointSpeed').val()), alt: Number($('#MPdefaultPointAlt').val()), safeRadiusSH: Number($('#MPdefaultSafeRangeSH').val()), maxDistSH : vMaxDistSH};
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
        const fs = require('fs');
        if (!window.xml2js) return GUI.log(chrome.i18n.getMessage('errorReadingFileXml2jsNotFound'));

        fs.readFile(filename, (err, data) => {
            if (err) {
                GUI.log(chrome.i18n.getMessage('errorReadingFile'));
                return console.error(err);
            }

            window.xml2js.Parser({ 'explicitChildren': true, 'preserveChildrenOrder': true }).parseString(data, (err, result) => {
                if (err) {
                    GUI.log(chrome.i18n.getMessage('errorParsingFile'));
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
                                        if (attr.match(/zoom/i)) {
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
                                    mission.put(point);
                                }
                            }
                        }
                    }
                }

                if (missionEndFlagCount > 1) {
                    if (multimissionCount && !confirm(chrome.i18n.getMessage('confirm_multimission_file_load'))) {
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
                    var coord = ol.proj.fromLonLat([mission.getCenter().lon / 10000000 , mission.getCenter().lat / 10000000]);
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
                GUI.log(sFilename + chrome.i18n.getMessage('loadedSuccessfully'));
                updateFilename(sFilename);
            });
        });
    }

    function saveMissionFile(filename) {
        const fs = require('fs');
        if (!window.xml2js) return GUI.log(chrome.i18n.getMessage('errorWritingFileXml2jsNotFound'));

        var center = ol.proj.toLonLat(map.getView().getCenter());
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
            'missionitem': []
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

        var builder = new window.xml2js.Builder({ 'rootName': 'mission', 'renderOpts': { 'pretty': true, 'indent': '\t', 'newline': '\n' } });
        var xml = builder.buildObject(data);
        xml = xml.replace(/missionitem mission/g, 'meta mission');
        fs.writeFile(filename, xml, (err) => {
            if (err) {
                GUI.log(chrome.i18n.getMessage('ErrorWritingFile'));
                return console.error(err);
            }
            let sFilename = String(filename.split('\\').pop().split('/').pop());
            GUI.log(sFilename + chrome.i18n.getMessage('savedSuccessfully'));
            updateFilename(sFilename);
        });
    }

    /////////////////////////////////////////////
    // Load/Save FC mission Toolbox
    // mission = configurator store, WP number indexed from 0, MISSION_PLANNER = FC NVM store, WP number indexed from 1
    /////////////////////////////////////////////
    function getWaypointsFromFC(loadEeprom) {
        if (loadEeprom) {
            MSP.send_message(MSPCodes.MSP_WP_MISSION_LOAD, [0], getWaypointData);
        } else {
            getWaypointData();
        }

        function getWaypointData() {
            mspHelper.loadWaypoints(function() {
                GUI.log(chrome.i18n.getMessage('endGetPoint'));
                if (loadEeprom) {
                    GUI.log(chrome.i18n.getMessage('eeprom_load_ok'));
                    $('#loadEepromMissionButton').removeClass('disabled');
                } else {
                    $('#loadMissionButton').removeClass('disabled');
                }
                if (!MISSION_PLANNER.getCountBusyPoints()) {
                    alert(chrome.i18n.getMessage('no_waypoints_to_load'));
                    return;
                }
                mission.reinit();
                mission.copy(MISSION_PLANNER);
                mission.update(false, true);

                /* check multimissions */
                multimissionCount = 0;
                mission.get().forEach(function (element) {
                    if (element.getEndMission() == 0xA5) {
                        multimissionCount ++;
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
        };
    }

    function sendWaypointsToFC(saveEeprom) {
        MISSION_PLANNER.reinit();
        MISSION_PLANNER.copy(mission);
        MISSION_PLANNER.update(false, true, true);
        mspHelper.saveWaypoints(function() {
            GUI.log(chrome.i18n.getMessage('endSendPoint'));
            if (saveEeprom) {
                $('#saveEepromMissionButton').removeClass('disabled');
                GUI.log(chrome.i18n.getMessage('eeprom_saved_ok'));
                MSP.send_message(MSPCodes.MSP_WP_MISSION_SAVE, [0], false, setMissionIndex);
            } else {
                $('#saveMissionButton').removeClass('disabled');
            }
            mission.setMaxWaypoints(MISSION_PLANNER.getMaxWaypoints());
            mission.setValidMission(MISSION_PLANNER.getValidMission());
            mission.setCountBusyPoints(MISSION_PLANNER.getCountBusyPoints());
            multimission.setMaxWaypoints(mission.getMaxWaypoints());
            updateTotalInfo();
            mission.reinit();
            mission.copy(MISSION_PLANNER);
            mission.update(false, true);
            refreshLayers();
            $('#MPeditPoint').fadeOut(300);
        });
        function setMissionIndex() {
            let activeIndex = singleMissionActive() ? 1 : $('#activeNissionIndex').text();
            mspHelper.setSetting("nav_wp_multi_mission_index", activeIndex, function () {
                MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, function () {
                    GUI.log(chrome.i18n.getMessage('multimission_active_index_saved_eeprom'));
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
            $('#missionValid').html(mission.getValidMission() ? chrome.i18n.getMessage('armingCheckPass') : chrome.i18n.getMessage('armingCheckFail'));
        }
    }

    function updateFilename(filename) {
        $('#missionFilename').text(filename);
        $('#infoMissionFilename').show();
    }

    function changeSwitchery(element, checked) {
        if ( ( element.is(':checked') && checked == false ) || ( !element.is(':checked') && checked == true ) ) {
            element.parent().find('.switcherymid').trigger('click');
        }
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
                    alert(chrome.i18n.getMessage('MissionPlannerAltitudeChangeReset'));
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
                    alert(chrome.i18n.getMessage('MissionPlannerAltitudeChangeReset'));
                    altitude = selectedMarker.getAlt();
                } else {
                    altitude = settings.alt + 100 * (elevation - elevationAtHome);
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

    function plotElevation() {
        if ($('#missionPlannerElevation').is(":visible") && !disableMarkerEdit) {
            if (mission.isEmpty()) {
                var data = [[0], [0]];
                var layout = {showlegend: true,
                              legend: {
                                    "orientation": "h",
                                    xanchor: "center",
                                    y: 1.3,
                                    x: 0.5
                              },
                              title: 'Mission Elevation Profile',
                              xaxis: {
                                title: 'Distance (m)'
                              },
                              yaxis: {
                                title: 'Elevation (m)',
                              },
                              height: 300,
                              }
                Plotly.newPlot('elevationDiv', data, layout);
            }
            else {
                (async () => {
                    const [lengthMission, totalMissionDistance, samples, elevation, altPoint2measure, namePoint2measure, refPoint2measure] = await mission.getElevation(globalSettings);
                    let x_elevation = Array.from(Array(samples+1), (_,i)=> i*totalMissionDistance/samples);
                    var trace_WGS84 = {
                        x: x_elevation,
                        y: elevation,
                        type: 'scatter',
                        name: 'WGS84 elevation',
                        hovertemplate: '<b>Elevation</b>: %{y} m',
                        fill: 'tozeroy',
                        line: {
                            color: '#ff7f0e',
                        },
                    };
                    let y_missionElevation = altPoint2measure.map((x,i) => x / 100 + HOME.getAlt()*(1-refPoint2measure[i]));
                    let y_elevationReference = refPoint2measure.map((x,i) => (x == 1 ? "WGS84" : "Take-off Home"));
                    var trace_missionHeight = {
                        x: lengthMission,
                        y: y_missionElevation ,
                        type: 'scatter',
                        mode: 'lines+markers+text',
                        name: 'Mission altitude',
                        text: namePoint2measure,
                        textposition: 'top center',
                        textfont: {
                            family:  'Raleway, sans-serif'
                        },
                        customdata: y_elevationReference,
                        hovertemplate: '<b>WP</b>: %{text}' +
                                '<br><b>Elevation</b>: %{y} m<br>' +
                                '<b>Reference</b>: %{customdata}',
                        line: {
                            color: '#1497f1',
                        },
                        marker: {
                            color: '#1f77b4',
                        },
                    };
                    /* Show multi mission number in plot title when single mission displayed
                     * Not updated when ALL multi missions displayed since plot disabled */
                    let missionNumber = '';
                    if (multimissionCount) {
                        missionNumber = ' ' + ($('#multimissionOptionList').val());
                    }
                    var layout = {showlegend: true,
                                  legend: {
                                        "orientation": "h",
                                        xanchor: "center",
                                        y: 1.3,
                                        x: 0.5
                                  },
                                  title: 'Mission' + missionNumber + ' Elevation Profile',
                                  xaxis: {
                                    title: 'Distance (m)'
                                  },
                                  yaxis: {
                                    title: 'Elevation (m)',
                                    range: [-10 + Math.min(Math.min(...y_missionElevation), Math.min(...elevation)), 10 + Math.max(Math.max(...y_missionElevation), Math.max(...elevation))],
                                  },
                                  height: 300,
                                  }

                    var data = [trace_WGS84, trace_missionHeight];

                    Plotly.newPlot('elevationDiv', data, layout);
                })()
            }
        }
    }
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
      // alert("error: "+evt.message +" at linenumber: "+evt.lineno+" of file: "+evt.filename);
    // } else {
      // alert("error: "+evt.type+" from element: "+(evt.srcElement || evt.target));
    // }
// }

TABS.mission_control.cleanup = function (callback) {
    if (callback) callback();
};
