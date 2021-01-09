'use strict';

// MultiWii NAV Protocol
var MWNP = MWNP || {};

// WayPoint type
MWNP.WPTYPE = {
    WAYPOINT:     1,
    PH_UNLIM:     2,
    PH_TIME:      3,
    RTH:          4,
    SET_POI:      5,
    JUMP:         6,
    SET_HEAD:     7,
    LAND:         8
};

// Reverse WayPoint type dictionary
MWNP.WPTYPE.REV = {
    1:     'WAYPOINT',
    2:     'PH_UNLIM',
    3:      'PH_TIME',
    4:          'RTH',
    5:      'SET_POI',
    6:         'JUMP',
    7:     'SET_HEAD',
    8:         'LAND'
};

// Dictionary of Parameter1,2,3 definition depending on type of action selected (refer to MWNP.WPTYPE)
var dictOfLabelParameterPoint = {
	1: 	  {parameter1: 'Speed (cm/s)', parameter2: '', parameter3: ''},
	2:    {parameter1: '', parameter2: '', parameter3: ''},
	3:    {parameter1: 'Wait time (s)', parameter2: 'Speed (cm/s)', parameter3: ''},
	4:    {parameter1: 'Force land (non zero)', parameter2: '', parameter3: ''},
	5:    {parameter1: '', parameter2: '', parameter3: ''},
	6:    {parameter1: 'Target WP number', parameter2: 'Number of repeat (-1: infinite)', parameter3: ''},
	7:    {parameter1: 'Heading (deg)', parameter2: '', parameter3: ''},
	8:    {parameter1: '', parameter2: '', parameter3: ''}
};

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
            mspHelper.getMissionInfo
        ]);
        loadChainer.setExitPoint(loadHtml);
        loadChainer.execute();
    } else {

        // FC not connected, load page anyway
        loadHtml();
    }

    function updateTotalInfo() {
        if (CONFIGURATOR.connectionValid) {
            $('#availablePoints').text(MISSION_PLANER.countBusyPoints + '/' + MISSION_PLANER.maxWaypoints);
            $('#missionValid').html(MISSION_PLANER.isValidMission ? chrome.i18n.getMessage('armingCheckPass') : chrome.i18n.getMessage('armingCheckFail'));
        }
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
                MISSION_PLANER.bufferPoint.number = -1; //needed to get point 0 which id RTH
                MSP.send_message(MSPCodes.MSP_WP, mspHelper.crunch(MSPCodes.MSP_WP), false, function rth_update() {
                    var coord = ol.proj.fromLonLat([MISSION_PLANER.bufferPoint.lon, MISSION_PLANER.bufferPoint.lat]);
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

    var markers = [];
    var lines = [];
    var map;
    var selectedMarker = null;
    var pointForSend = 0;
    var settings = { speed: 0, alt: 5000};

	// Function to clear/reinit Jquery variable 
    function clearEditForm() {
        $('#pointLat').val('');
        $('#pointLon').val('');
        $('#pointAlt').val('');
        $('#pointP1').val('');
		$('#pointP2').val('');
		$('#pointP3').val('');
		$('[name=Options]').filter('[value=None]').prop('checked', true);
		$('#Options_LandRTH').prop('checked', false);
		$('#Options_TargetJUMP').val(0);
		$('#Options_NumberJUMP').val(0);
		$('#Options_HeadingHead').val(-1);
        $('[name=pointNumber]').val('');
        $('#MPeditPoint').fadeOut(300);
    }

    function loadSettings() {
        chrome.storage.local.get('missionPlanerSettings', function (result) {
            if (result.missionPlanerSettings) {
                settings = result.missionPlanerSettings;
            }
            refreshSettings();
        });
    }

    function saveSettings() {
        chrome.storage.local.set({'missionPlanerSettings': settings});
    }

    function refreshSettings() {
        $('#MPdefaultPointAlt').val(settings.alt);
        $('#MPdefaultPointSpeed').val(settings.speed);
    }

	// Function to repaint lines between markers 
    function repaint() {
        var oldPos;
		var oldAction;
		var poiNumber;
		var poiList;
		var lengthPoiList;
		var activatePoi = false;
		var activateHead = false;
		var oldHeading;
		var xmlItemNumber = 0;
		
        for (var i in lines) {
            map.removeLayer(lines[i]);
        }
        lines = [];
		poiList = [];
        $('#missionDistance').text(0);

        map.getLayers().forEach(function (t) {
            if (t instanceof ol.layer.Vector && typeof t.alt !== 'undefined') {
                var geometry = t.getSource().getFeatures()[0].getGeometry();
				var action = t.action;
				var markerNumber = t.number;
				var options = t.options;
				if (action == 5) {
					// If action is Set_POI, increment counter of POI
					poiNumber = markerNumber;
					lengthPoiList = poiList.push(poiNumber);
					activatePoi = true;
				}
				else {
					// If classic WPs, draw standard line in-between 
					if (typeof oldPos !== 'undefined' && activatePoi != true && activateHead != true){
						paintLine(oldPos, geometry.getCoordinates());
					}
					// If one is POI, draw orange line in-between and modulate dashline each time a new POI is defined
					else if (typeof oldPos !== 'undefined' && activatePoi == true && activateHead != true) {
						if ((lengthPoiList % 2) == 0) {
							paintLine(oldPos, geometry.getCoordinates(), '#ffb725', 5);
						}
						else {
							paintLine(oldPos, geometry.getCoordinates(), '#ffb725');
						}
					}
					// If one is SET_HEAD, draw labelled line in-between with heading value
					else if (typeof oldPos !== 'undefined' && activatePoi != true && activateHead == true) {
						console.log(oldHeading);
						paintLine(oldPos, geometry.getCoordinates(), '#1497f1', 0, lineText=String(oldHeading)+"°");
					}
					
					// If classic WPs is defined with a JUMP options, draw pink dashed line in-between 
					if (options.key == "JUMP") {
						paintLine(geometry.getCoordinates(), markers[options.targetWP-1].getSource().getFeatures()[0].getGeometry().getCoordinates(), '#e935d6', 5, "Repeat x"+String(options.numRepeat));
					}
					// If classic WPs is defined with a heading = -1, change Boolean for POI to false. If it is defined with a value different from -1, activate Heading boolean
					else if (options.key == "SET_HEAD") {
						if (options.heading == "-1") {
							activatePoi = false;
							activateHead = false;
							oldHeading = 'undefined'
						}
						else if (typeof options.heading != 'undefined' && options.heading != "-1") {
							activateHead = true;
							oldHeading = options.heading
						}
					}
					oldPos = geometry.getCoordinates();
				}
            }
        });
        //reset text position
        if (textGeom) {
            textGeom.setCoordinates(map.getCoordinateFromPixel([0,0]));
        }
    }
	
	// function modified to tale into account optional arguement such color, linedash and line label 
    function paintLine(pos1, pos2, color='#1497f1', lineDash=0, lineText="") {
        var line = new ol.geom.LineString([pos1, pos2]);

        var feature = new ol.Feature({
            geometry: line
        });
        feature.setStyle(new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: color,
                width: 3,
				lineDash: [lineDash]
            }),
			text: new ol.style.Text({
                text: lineText,
				placement : 'line',
				textBaseline: 'ideographic',
				stroke: new ol.style.Stroke({
					color: color
				}),
            }),
        }));

        var vectorSource = new ol.source.Vector({
            features: [feature]
        });

        var vectorLayer = new ol.layer.Vector({
            source: vectorSource
        });

        lines.push(vectorLayer);

        var length = ol.Sphere.getLength(line) + parseFloat($('#missionDistance').text());
        $('#missionDistance').text(length.toFixed(3));

        map.addLayer(vectorLayer);
    }
	
	// Function modified to add action name and marker numbering to help changing icon depending on those items
    function getPointIcon(_action, isEdit, markerNumber='') {
		var dictofPoint = {
			1: 	  'WP',
			2:    'PH',
			3:    'PH',
			//4:    '',
			5:    'POI',
			//6:    '',
			//7:    'head',
			8:    'LDG'
		};
		
        return new ol.style.Style({
			image: new ol.style.Icon(({
                anchor: [0.5, 1],
                opacity: 1,
                scale: 0.5,
                src: '../images/icons/cf_icon_position' + (dictofPoint[_action] != '' ? '_'+dictofPoint[_action] : '') + (isEdit ? '_edit' : '')+ '.png'
            })),
			text: new ol.style.Text(({
                text: String(Number(markerNumber)+1),
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

	// Function modified by adding parameter 1,2,3 needed in MSP, plus options dictionary to take into account WP behavior changer such as JUMP, SET_HEAD, RTH
    function addMarker(_pos, _alt, _action, _parameter1=0, _parameter2=0, _parameter3=0, _options={key: "None"}) {
        var iconFeature = new ol.Feature({
            geometry: new ol.geom.Point(_pos),
            name: 'Null Island',
            population: 4000,
            rainfall: 500
        });

        iconFeature.setStyle(getPointIcon(_action, false, String(markers.length)));

        var vectorSource = new ol.source.Vector({
            features: [iconFeature]
        });

        var vectorLayer = new ol.layer.Vector({
            source: vectorSource
        });

        vectorLayer.alt = _alt;
        vectorLayer.number = markers.length;
        vectorLayer.action = _action;
        vectorLayer.parameter1 = _parameter1;
		vectorLayer.parameter2 = _parameter2;
		vectorLayer.parameter3 = _parameter3;
		vectorLayer.options = _options;

        markers.push(vectorLayer);

        return vectorLayer;
    }

    function initMap() {
        var app = {};

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
                $('#MPeditPoint, #missionPalnerTotalInfo').hide();
                $('#missionPlanerSettings').fadeIn(300);
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
        app.PlannerTemplateControl = function (opt_options) {
            var options = opt_options || {};
            var button = document.createElement('button');

            button.innerHTML = ' ';
            button.style = 'background: url(\'../images/CF_settings_white.svg\') no-repeat 1px -1px;background-color: rgba(0,60,136,.5);';

            var handleShowSettings = function () {
                $('#MPeditPoint, #missionPalnerTotalInfo', '#missionPlanerSettings').hide();
                $('#missionPlanerSettings').fadeIn(300);
            };

            button.addEventListener('click', handleShowSettings, false);
            button.addEventListener('touchstart', handleShowSettings, false);

            var element = document.createElement('div');
            element.className = 'mission-control-template ol-unselectable ol-control';
            element.appendChild(button);
            element.title = 'MP Template';

            ol.control.Control.call(this, {
                element: element,
                target: options.target
            });

        };
        ol.inherits(app.PlannerTemplateControl, ol.control.Control);

		
        /**
         * @param {ol.MapBrowserEvent} evt Map browser event.
         * @return {boolean} `true` to start the drag sequence.
         */
        app.Drag.prototype.handleDownEvent = function (evt) {
            var map = evt.map;

            var feature = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return feature;
                });

            if (feature) {
                this.coordinate_ = evt.coordinate;
                this.feature_ = feature;
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
            geometry.translate(deltaX, deltaY);

            this.coordinate_[0] = evt.coordinate[0];
            this.coordinate_[1] = evt.coordinate[1];
            repaint();
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
                if (feature) {
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

        map = new ol.Map({
            controls: ol.control.defaults({
                attributionOptions: {
                    collapsible: false
                }
            }).extend([
                new app.PlannerSettingsControl(),
				new app.PlannerTemplateControl()
            ]),
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

        // Set the attribute link to open on an external browser window, so
        // it doesn't interfere with the configurator.
        setTimeout(function() {
            $('.ol-attribution a').attr('target', '_blank');
        }, 100);

        // save map view settings when user moves it
        map.on('moveend', function (evt) {
            chrome.storage.local.set({'missionPlanerLastValues': {
                center: ol.proj.toLonLat(map.getView().getCenter()),
                zoom: map.getView().getZoom()
            }});
        });

        // load map view settings on startup
        chrome.storage.local.get('missionPlanerLastValues', function (result) {
            if (result.missionPlanerLastValues && result.missionPlanerLastValues.center) {
                map.getView().setCenter(ol.proj.fromLonLat(result.missionPlanerLastValues.center));
                map.getView().setZoom(result.missionPlanerLastValues.zoom);
            }
        });

        map.on('click', function (evt) {
            if (selectedMarker != null) {
                try {
                    selectedMarker.getSource().getFeatures()[0].setStyle(getPointIcon(selectedMarker.action, false, selectedMarker.number));
                    selectedMarker = null;
                    clearEditForm();
                } catch (e) {
                    GUI.log(e);
                }
            }

            var selectedFeature = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return feature;
                });
            var tempMarker = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return layer;
                });
			
			
            if (selectedFeature)
            {
                for (var i in markers)
                {
                    if (markers[i] == tempMarker)
                    {
                      selectedMarker = tempMarker;

                      var geometry = selectedFeature.getGeometry();
                      var coord = ol.proj.toLonLat(geometry.getCoordinates());

                      selectedFeature.setStyle(getPointIcon(selectedMarker.action, true, selectedMarker.number));

                      var altitudeMeters = app.ConvertCentimetersToMeters(selectedMarker.alt);
                      
                      $('#altitudeInMeters').text(` ${altitudeMeters}m`);
                      $('#pointLon').val(Math.round(coord[0] * 10000000) / 10000000);
                      $('#pointLat').val(Math.round(coord[1] * 10000000) / 10000000);
                      $('#pointAlt').val(selectedMarker.alt);
                      $('#pointType').val(selectedMarker.action);
					  // Change SpeedValue to Parameter1, 2, 3
                      $('#pointP1').val(selectedMarker.parameter1);
					  $('#pointP2').val(selectedMarker.parameter2);
					  $('#pointP3').val(selectedMarker.parameter3);
					  $('[name=Options]').filter('[value='+selectedMarker.options['key']+']').prop('checked', true);
					  if (selectedMarker.options.key == "RTH") {
						  console.log(selectedMarker.options.landAfter);
						  $('#Options_LandRTH').prop('checked', selectedMarker.options.landAfter);
					  }
					  else if (selectedMarker.options.key == "JUMP") {
						  $('#Options_TargetJUMP').val(selectedMarker.options.targetWP);
						  $('#Options_NumberJUMP').val(selectedMarker.options.numRepeat);
					  }
					  else if (selectedMarker.options.key == "SET_HEAD") {
						  $('#Options_HeadingHead').val(selectedMarker.options.heading);
					  }
					  // Selection box update depending on choice of type of waypoint
					  for (var j in dictOfLabelParameterPoint[selectedMarker.action])
					  {
						if (dictOfLabelParameterPoint[selectedMarker.action][j] != '') 
						{
							$('#pointP'+String(j).slice(-1)+'class').fadeIn(300);
							$('label[for=pointP'+String(j).slice(-1)+']').html(dictOfLabelParameterPoint[selectedMarker.action][j]);
						}
						else {$('#pointP'+String(j).slice(-1)+'class').fadeOut(300);}
					  }
					  console.log(selectedMarker.action);
					  console.log(typeof selectedMarker.action);
					  if ([1,2,3,8].includes(selectedMarker.action) || ['1','2','3','8'].includes(selectedMarker.action)) {
						  $('#pointOptionclass').fadeIn(300);
					  }
					  else {$('#pointOptionclass').fadeOut(300);}
                      $('#MPeditPoint').fadeIn(300);
                    }
                }
            } else {
                map.addLayer(addMarker(evt.coordinate, settings.alt, MWNP.WPTYPE.WAYPOINT, settings.speed));
                repaint();
            }
        });

        // change mouse cursor when over marker
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

        // handle map size on container resize
        setInterval(function () {
            let width = $("#missionMap canvas").width(), height = $("#missionMap canvas").height();
            if ((map.width_ != width) || (map.height_ != height)) map.updateSize();
            map.width_ = width; map.height_ = height;
        }, 200);

        $('#pointAlt').keyup(function(){
            let altitudeMeters = app.ConvertCentimetersToMeters($(this).val());
            $('#altitudeInMeters').text(` ${altitudeMeters}m`);
        });

        $('#removeAllPoints').on('click', function () {
            if (markers.length && confirm(chrome.i18n.getMessage('confirm_delete_all_points'))) {
                removeAllPoints();
            }
        });

        $('#removePoint').on('click', function () {
            if (selectedMarker) {

                var tmp = [];
                for (var i in markers) {
                    if (markers[i] !== selectedMarker && typeof markers[i].action !== "undefined") {
                        tmp.push(markers[i]);
                    }
                }
                map.removeLayer(selectedMarker);
                markers = tmp;
                selectedMarker = null;

                clearEditForm();
                repaint();
            }
        });

        $('#savePoint').on('click', function () {
            if (selectedMarker) {
                map.getLayers().forEach(function (t) {
                    if (t === selectedMarker) {
                        var geometry = t.getSource().getFeatures()[0].getGeometry();
                        geometry.setCoordinates(ol.proj.fromLonLat([parseFloat($('#pointLon').val()), parseFloat($('#pointLat').val())]));
                        t.alt = $('#pointAlt').val();
                        t.action = $('#pointType').val();
                        t.P1Value = $('#pointP1').val();
						t.P2Value = $('#pointP2').val();
						t.P3Value = $('#pointP3').val();
						if ($('input[name=Options]:checked').val() == "RTH") {
							t.options = {key: $('input[name=Options]:checked').val(),
										 landAfter: $('#Options_LandRTH').prop('checked')
										};
						}
						else if ($('input[name=Options]:checked').val() == "JUMP") {
							console.log(Array.from({length: markers.length}, (v, i) => i+1));
							console.log($('#Options_TargetJUMP').val());
							console.log(typeof $('#Options_TargetJUMP').val());
							if (!Array.from({length: markers.length}, (v, i) => i+1).includes(Number($('#Options_TargetJUMP').val())) || (Number($('#Options_NumberJUMP').val())<0 || Number($('#Options_NumberJUMP').val())>99)) {
								alert(chrome.i18n.getMessage('MissionPlannerJumpSettingsCheck'))
								t.options = {key: 'None'}
							}
							else {
								t.options = {key: $('input[name=Options]:checked').val(),
										 targetWP: $('#Options_TargetJUMP').val(),
										 numRepeat: $('#Options_NumberJUMP').val()
										};
							}
						}
						else if ($('input[name=Options]:checked').val() == "SET_HEAD") {
							if ($('#Options_HeadingHead').val()>360 || ($('#Options_HeadingHead').val()<0 && $('#Options_HeadingHead').val() !=-1)) {
								alert(chrome.i18n.getMessage('MissionPlannerHeadSettingsCheck'))
								t.options = {key: 'None'}
							}
							else {
								t.options = {key: $('input[name=Options]:checked').val(),
										 heading: $('#Options_HeadingHead').val()
										};
							}
						}
						else {
							t.options = {key: $('input[name=Options]:checked').val()}
						}
						console.log(t.options);
                    }
                });

                selectedMarker.getSource().getFeatures()[0].setStyle(getPointIcon(selectedMarker.action, false, selectedMarker.number));
                selectedMarker = null;
                clearEditForm();
                repaint();
            }
        });

        $('#loadFileMissionButton').on('click', function () {
            if (markers.length && !confirm(chrome.i18n.getMessage('confirm_delete_all_points'))) return;
            removeAllPoints();
            nwdialog.setContext(document);
            nwdialog.openFileDialog(function(result) {
                loadMissionFile(result);
            })
        });

        $('#saveFileMissionButton').on('click', function () {
            //if (!markers.length) return;
            nwdialog.setContext(document);
            nwdialog.saveFileDialog('', '.mission', function(result) {
                saveMissionFile(result);
            })
        });

        $('#loadMissionButton').on('click', function () {
            if (markers.length && !confirm(chrome.i18n.getMessage('confirm_delete_all_points'))) return;
            removeAllPoints();
            $(this).addClass('disabled');
            GUI.log('Start get point');

            pointForSend = 0;
            getNextPoint();
        });

        $('#saveMissionButton').on('click', function () {
            $(this).addClass('disabled');
            GUI.log('Start send point');

            pointForSend = 0;
            sendNextPoint();
        });

        $('#loadEepromMissionButton').on('click', function () {
            if (markers.length && !confirm(chrome.i18n.getMessage('confirm_delete_all_points'))) return;
            removeAllPoints();
            GUI.log(chrome.i18n.getMessage('eeprom_load_ok'));

            MSP.send_message(MSPCodes.MSP_WP_MISSION_LOAD, [0], getPointsFromEprom);
        });
        $('#saveEepromMissionButton').on('click', function () {
            GUI.log(chrome.i18n.getMessage('eeprom_saved_ok'));
            MSP.send_message(MSPCodes.MSP_WP_MISSION_SAVE, [0], false);
        });

        /*$('#rthEndMission').on('change', function () {
            if ($(this).is(':checked')) {
                $('#rthSettings').fadeIn(300);
            } else {
                $('#rthSettings').fadeOut(300);
            }
        });*/

        $('#saveSettings').on('click', function () {
            settings = { speed: $('#MPdefaultPointSpeed').val(), alt: $('#MPdefaultPointAlt').val() };
            saveSettings();
            closeSettingsPanel();
        });

        $('#cancelSettings').on('click', function () {
            loadSettings();
            closeSettingsPanel();
        });
		
		// Add function to update parameter i field in the selected Edit WP Box
		$('#pointType').on('change', function () {
			selectedMarker.action = $('#pointType').val();
            for (var j in dictOfLabelParameterPoint[selectedMarker.action])
				{
				if (dictOfLabelParameterPoint[selectedMarker.action][j] != '') 
				{
					$('#pointP'+String(j).slice(-1)+'class').fadeIn(300);
					$('label[for=pointP'+String(j).slice(-1)+']').html(dictOfLabelParameterPoint[selectedMarker.action][j]);
				}
				else {$('#pointP'+String(j).slice(-1)+'class').fadeOut(300);}
				}
			if (["1","2","3"].includes(selectedMarker.action)) {
				$('#pointOptionclass').fadeIn(300);
			}
			else {$('#pointOptionclass').fadeOut(300);}
        });

        updateTotalInfo();
    }

    function closeSettingsPanel() {
        $('#missionPlanerSettings').hide();
        $('#missionPalnerTotalInfo').fadeIn(300);
        if (selectedMarker !== null) {
            $('#MPeditPoint').fadeIn(300);
        }
    }

    function removeAllPoints() {
        for (var i in markers) {
            map.removeLayer(markers[i]);
        }
        markers = [];
        clearEditForm();
        updateTotalInfo();
        /*$('#rthEndMission').prop('checked', false);
        $('#rthSettings').fadeOut(300);
        $('#rthLanding').prop('checked', false);*/
        repaint();
    }

    function loadMissionFile(filename) {
        const fs = require('fs');
        if (!window.xml2js) return GUI.log('<span style="color: red">Error reading file (xml2js not found)</span>');

        fs.readFile(filename, (err, data) => {
            if (err) {
                GUI.log('<span style="color: red">Error reading file</span>');
                return console.error(err);
            }

            window.xml2js.Parser({ 'explicitChildren': true, 'preserveChildrenOrder': true }).parseString(data, (err, result) => {
                if (err) {
                    GUI.log('<span style="color: red">Error parsing file</span>');
                    return console.error(err);
                }

                // parse mission file
                var mission = { points: [] };
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
                                            mission.version = node.$[attr]
                                        }
                                    }
                                } else if (node['#name'].match(/mwp/i) && node.$) {
                                    mission.center = {};
                                    for (var attr in node.$) {
                                        if (attr.match(/zoom/i)) {
                                            mission.center.zoom = parseInt(node.$[attr]);
                                        } else if (attr.match(/cx/i)) {
                                            mission.center.lon = parseFloat(node.$[attr]);
                                        } else if (attr.match(/cy/i)) {
                                            mission.center.lat = parseFloat(node.$[attr]);
                                        }
                                    }
                                } else if (node['#name'].match(/missionitem/i) && node.$) {
                                    var point = {};
                                    for (var attr in node.$) {
                                        if (attr.match(/no/i)) {
                                            point.index = parseInt(node.$[attr]);
                                        } else if (attr.match(/action/i)) {
                                            if (node.$[attr].match(/WAYPOINT/i)) {
                                                point.action = MWNP.WPTYPE.WAYPOINT;
                                            } else if (node.$[attr].match(/PH_UNLIM/i) || node.$[attr].match(/POSHOLD_UNLIM/i)) {
                                                point.action = MWNP.WPTYPE.PH_UNLIM;
                                            } else if (node.$[attr].match(/PH_TIME/i) || node.$[attr].match(/POSHOLD_TIME/i)) {
                                                point.action = MWNP.WPTYPE.PH_TIME;
                                            } else if (node.$[attr].match(/RTH/i)) {
                                                point.action = MWNP.WPTYPE.RTH;
                                            } else if (node.$[attr].match(/SET_POI/i)) {
                                                point.action = MWNP.WPTYPE.SET_POI;
                                            } else if (node.$[attr].match(/JUMP/i)) {
                                                point.action = MWNP.WPTYPE.JUMP;
                                            } else if (node.$[attr].match(/SET_HEAD/i)) {
                                                point.action = MWNP.WPTYPE.SET_HEAD;
                                            } else if (node.$[attr].match(/LAND/i)) {
                                                point.action = MWNP.WPTYPE.LAND;
                                            } else {
                                                point.action = 0;
                                            }
                                        } else if (attr.match(/lat/i)) {
                                            point.lat = parseFloat(node.$[attr]);
                                        } else if (attr.match(/lon/i)) {
                                            point.lon = parseFloat(node.$[attr]);
                                        } else if (attr.match(/alt/i)) {
                                            point.alt = (parseInt(node.$[attr]) * 100);
                                        } else if (attr.match(/parameter1/i)) {
                                            point.p1 = parseInt(node.$[attr]);
                                        } else if (attr.match(/parameter2/i)) {
                                            point.p2 = parseInt(node.$[attr]);
                                        } else if (attr.match(/parameter3/i)) {
                                            point.p3 = parseInt(node.$[attr]);
                                        }
                                    }
                                    mission.points.push(point);
                                }
                            }
                        }
                    }
                }

                // draw actual mission
                removeAllPoints();
				console.log(mission);
                for (var i = 0; i < mission.points.length; i++) {
                    if ([MWNP.WPTYPE.WAYPOINT,MWNP.WPTYPE.PH_UNLIM,MWNP.WPTYPE.PH_TIME,MWNP.WPTYPE.LAND, MWNP.WPTYPE.SET_POI].includes(mission.points[i].action)) {
						if (i < mission.points.length-1) {
							var coord = ol.proj.fromLonLat([mission.points[i].lon, mission.points[i].lat]);
							if (mission.points[i+1].action == MWNP.WPTYPE.SET_HEAD) {
								var options = {key: 'SET_HEAD',
											 heading: mission.points[i+1].p1
											};
							}
							else if (mission.points[i+1].action == MWNP.WPTYPE.JUMP) {
								var options = {key: 'JUMP',
										 targetWP: mission.points[i+1].p1,
										 numRepeat: mission.points[i+1].p2
										};
							}
							else if (mission.points[i+1].action == MWNP.WPTYPE.RTH) {
								var options = {key: 'RTH',
										 landAfter: mission.points[i+1].p1
										};
							}
							else {
								var options = {key: 'None'};
							}
							map.addLayer(addMarker(coord, mission.points[i].alt, mission.points[i].action, mission.points[i].p1, mission.points[i].p2, mission.points[i].p3, options));
							if (i == 0) {
								map.getView().setCenter(coord);
								map.getView().setZoom(16);
							}
						}
						else {
							var coord = ol.proj.fromLonLat([mission.points[i].lon, mission.points[i].lat]);
							map.addLayer(addMarker(coord, mission.points[i].alt, mission.points[i].action, mission.points[i].p1, mission.points[i].p2, mission.points[i].p3));
							if (i == 0) {
								map.getView().setCenter(coord);
								map.getView().setZoom(16);
							}
						}
					}
                }

                if (mission.center) {
                    var coord = ol.proj.fromLonLat([mission.center.lon, mission.center.lat]);
                    map.getView().setCenter(coord);
                    if (mission.center.zoom) map.getView().setZoom(mission.center.zoom);
                }

                repaint();
                updateTotalInfo();

            });

        });
    }

    function saveMissionFile(filename) {
        const fs = require('fs');
        if (!window.xml2js) return GUI.log('<span style="color: red">Error writing file (xml2js not found)</span>');

        var center = ol.proj.toLonLat(map.getView().getCenter());
        var zoom = map.getView().getZoom();

        var data = {
            'version': { $: { 'value': '2.3-pre8' } },
            'mwp': { $: { 'cx': (Math.round(center[0] * 10000000) / 10000000), 'cy': (Math.round(center[1] * 10000000) / 10000000), 'zoom': zoom } },
            'missionitem': []
        };
		// init secondary counter for real marker numbers taking into account JUMP, SET_HEAD, RTH insertion
		var j = 1;
		var nonMarkerPoint = [];
        for (var i = 0; i < markers.length; i++) {
            var geometry = markers[i].getSource().getFeatures()[0].getGeometry();
            var coordinate = ol.proj.toLonLat(geometry.getCoordinates());
            /*var point = { $: {
                'no': (i + 1),
                'action': ((markers[i].action == MWNP.WPTYPE.WAYPOINT) ? 'WAYPOINT' : markers[i].action),
                'lon': (Math.round(coordinate[0] * 10000000) / 10000000),
                'lat': (Math.round(coordinate[1] * 10000000) / 10000000),
                'alt': (markers[i].alt / 100)
            } };*/
			var point = { $: {
                'no': (j),
                'action': MWNP.WPTYPE.REV[markers[i].action],
                'lon': (Math.round(coordinate[0] * 10000000) / 10000000),
                'lat': (Math.round(coordinate[1] * 10000000) / 10000000),
                'alt': (markers[i].alt / 100),
				'parameter1': markers[i].parameter1,
				'parameter2': markers[i].parameter2,
				'parameter3': markers[i].parameter3,
            } };
            //if ((markers[i].action == MWNP.WPTYPE.WAYPOINT) && (markers[i].parameter1 > 0)) point.$['parameter1'] = markers[i].parameter1; /*parameter1 = SpeedValue in this case*/
           data.missionitem.push(point);
		   j++;
		   if (markers[i].options.key == "JUMP") {
			    nonMarkerPoint.push(i);
			    console.log(nonMarkerPoint);
				console.log(Number(markers[i].options.targetWP));
			    console.log(getNumberOfNonMarkerForJump(nonMarkerPoint, Number(markers[i].options.targetWP)-1));
				point = { $: {
					'no': (j),
					'action': 'JUMP',
					'lon': 0,
					'lat': 0,
					'alt': 0,
					'parameter1': String(Number(markers[i].options.targetWP)+getNumberOfNonMarkerForJump(nonMarkerPoint, Number(markers[i].options.targetWP)-1)),
					'parameter2': markers[i].options.numRepeat,
					'parameter3': 0
				} };
				data.missionitem.push(point);
				j++;
			}
			else if (markers[i].options.key == "SET_HEAD") {
				point = { $: {
					'no': (j),
					'action': 'SET_HEAD',
					'lon': 0,
					'lat': 0,
					'alt': 0,
					'parameter1': markers[i].options.heading,
					'parameter2': 0,
					'parameter3': 0
				} };
				data.missionitem.push(point);
				nonMarkerPoint.push(i);
				j++;
			}
			else if (markers[i].options.key == "RTH") {
				point = { $: {
					'no': (j),
					'action': 'RTH',
					'lon': 0,
					'lat': 0,
					'alt': (markers[i].alt / 100),
					'parameter1': (markers[i].options.landAfter) ? 1: 0,
					'parameter2': 0,
					'parameter3': 0
				} };
				data.missionitem.push(point);
				nonMarkerPoint.push(i);
				j++;
			};
        }

        // add last RTH point
        /*if ($('#rthEndMission').is(':checked')) {
            data.missionitem.push({ $: { 'no': (markers.length + 1), 'action': 'RTH', 'lon': 0, 'lat': 0, 'alt': (settings.alt / 100), 'parameter1': ($('#rthLanding').is(':checked') ? 1 : 0) } });
        }*/

        var builder = new window.xml2js.Builder({ 'rootName': 'mission', 'renderOpts': { 'pretty': true, 'indent': '\t', 'newline': '\n' } });
        var xml = builder.buildObject(data);
        fs.writeFile(filename, xml, (err) => {
            if (err) {
                GUI.log('<span style="color: red">Error writing file</span>');
                return console.error(err);
            }
            GUI.log('File saved');
        });
    }

	function getNumberOfNonMarkerForJump(nonMarkerPointList, numTargetMarker) {
		console.log(nonMarkerPointList.length);
		for (i = 0; i < nonMarkerPointList.length; i++) {
			console.log(String(nonMarkerPointList[i+1])+" "+String(nonMarkerPointList[i]));
		    if (numTargetMarker<=nonMarkerPointList[i+1] && numTargetMarker>nonMarkerPointList[i]) {
				console.log(i+1);
			    return i+1;
		    }
			else {
				return 0;
			}
		}
	}

    function getPointsFromEprom() {
        pointForSend = 0;
        MSP.send_message(MSPCodes.MSP_WP_GETINFO, false, false, getNextPoint);
    }

    function endGetPoint() {
        GUI.log('End get point');
        $('#loadMissionButton').removeClass('disabled');
        repaint();
        updateTotalInfo();
    }

    function getNextPoint() {
        if (MISSION_PLANER.countBusyPoints == 0) {
            endGetPoint();
            return;
        }

        if (pointForSend > 0) {
            // console.log(MISSION_PLANER.bufferPoint.lon);
            // console.log(MISSION_PLANER.bufferPoint.lat);
            // console.log(MISSION_PLANER.bufferPoint.alt);
            // console.log(MISSION_PLANER.bufferPoint.action);
            /*if (MISSION_PLANER.bufferPoint.action == 4) {
                $('#rthEndMission').prop('checked', true);
                $('#rthSettings').fadeIn(300);
                if (MISSION_PLANER.bufferPoint.p1 > 0) {
                    $('#rthLanding').prop('checked', true);
                }
            } else {
                var coord = ol.proj.fromLonLat([MISSION_PLANER.bufferPoint.lon, MISSION_PLANER.bufferPoint.lat]);
                map.addLayer(addMarker(coord, MISSION_PLANER.bufferPoint.alt, MISSION_PLANER.bufferPoint.action, MISSION_PLANER.bufferPoint.p1));
                if (pointForSend === 1) {
                    map.getView().setCenter(coord);
                }
            */
			var coord = ol.proj.fromLonLat([MISSION_PLANER.bufferPoint.lon, MISSION_PLANER.bufferPoint.lat]);
			map.addLayer(addMarker(coord, MISSION_PLANER.bufferPoint.alt, MISSION_PLANER.bufferPoint.action, MISSION_PLANER.bufferPoint.p1));
			if (pointForSend === 1) {
				map.getView().setCenter(coord);
			}
        }

        if (pointForSend >= MISSION_PLANER.countBusyPoints) {
            endGetPoint();
            return;
        }

        MISSION_PLANER.bufferPoint.number = pointForSend;

        pointForSend++;

        MSP.send_message(MSPCodes.MSP_WP, mspHelper.crunch(MSPCodes.MSP_WP), false, getNextPoint);
    }

    function sendNextPoint() {
        //var isRTH = $('#rthEndMission').is(':checked');
		console.log(pointForSend);
        if (pointForSend >= markers.length) {
            /*if (isRTH) {
                MISSION_PLANER.bufferPoint.number = pointForSend + 1;
                MISSION_PLANER.bufferPoint.action = 4;
                MISSION_PLANER.bufferPoint.lon = 0;
                MISSION_PLANER.bufferPoint.lat = 0;
                MISSION_PLANER.bufferPoint.alt = 0;
                MISSION_PLANER.bufferPoint.endMission = 0xA5;
                MISSION_PLANER.bufferPoint.p1 = $('#rthLanding').is(':checked') ? 1 : 0;
                MSP.send_message(MSPCodes.MSP_SET_WP, mspHelper.crunch(MSPCodes.MSP_SET_WP), false, endSendPoint);
            } else {
                endSendPoint();
            }*/
			endSendPoint();

            return;
        }

        var geometry = markers[pointForSend].getSource().getFeatures()[0].getGeometry();
        var coordinate = ol.proj.toLonLat(geometry.getCoordinates());

        MISSION_PLANER.bufferPoint.number = pointForSend + 1;
        MISSION_PLANER.bufferPoint.action = markers[pointForSend].action;
        MISSION_PLANER.bufferPoint.lon = parseInt(coordinate[0] * 10000000);
        MISSION_PLANER.bufferPoint.lat = parseInt(coordinate[1] * 10000000);
        MISSION_PLANER.bufferPoint.alt = markers[pointForSend].alt;
        MISSION_PLANER.bufferPoint.p1 = markers[pointForSend].parameter1;
		MISSION_PLANER.bufferPoint.p2 = markers[pointForSend].parameter2;
		MISSION_PLANER.bufferPoint.p3 = markers[pointForSend].parameter3;
        pointForSend++;
        if (pointForSend >= markers.length && !isRTH) {
            MISSION_PLANER.bufferPoint.endMission = 0xA5;
        } else {
            MISSION_PLANER.bufferPoint.endMission = 0;
        }

        MSP.send_message(MSPCodes.MSP_SET_WP, mspHelper.crunch(MSPCodes.MSP_SET_WP), false, sendNextPoint);
    }

    function endSendPoint() {
        GUI.log('End send point');

        MSP.send_message(MSPCodes.MSP_WP_GETINFO, false, false, updateTotalInfo);

        $('#saveMissionButton').removeClass('disabled');
    }


};

TABS.mission_control.cleanup = function (callback) {
    if (callback) callback();
};
