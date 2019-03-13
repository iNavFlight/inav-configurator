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


TABS.mission_control = {};
TABS.mission_control.isYmapLoad = false;
TABS.mission_control.initialize = function (callback) {

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
        $('#content').load("./tabs/mission_control.html", process_html);
    }

    function process_html() {

        // set GUI for offline operations
        if (!CONFIGURATOR.connectionValid) {
            $('#infoAvailablePoints').hide();
            $('#infoMissionValid').hide();
            $('#loadMissionButton').addClass('disabled');
            $('#saveMissionButton').addClass('disabled');
            $('#loadEepromMissionButton').addClass('disabled');
            $('#saveEepromMissionButton').addClass('disabled');
        }

        if (typeof require !== "undefined") {
            loadSettings();
            initMap();
        } else {
            $('#missionMap, #missionControls').hide();
            $('#notLoadMap').show();
        }
        localize();

/* * /
// TESTING: load mission file at startup
nw.Window.get().showDevTools(null, function() {
//    let fileXml = "./131208-0513.mission";
    let fileXml = "./131227-0505.mission";
//    let fileXml = "./131227-0511.mission";
    loadMissionFile(fileXml);
});
/* */

        GUI.content_ready(callback);
    }

    var markers = [];
    var lines = [];
    var map;
    var selectedMarker = null;
    var pointForSend = 0;
    var settings = { speed: 0, alt: 5000 };

    function clearEditForm() {
        $('#pointLat').val('');
        $('#pointLon').val('');
        $('#pointAlt').val('');
        $('#pointSpeed').val('');
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

    function repaint() {
        var oldPos;
        for (var i in lines) {
            map.removeLayer(lines[i]);
        }
        lines = [];
        $('#missionDistance').text(0);

        map.getLayers().forEach(function (t) {
            //feature.getGeometry().getType()
            if (t instanceof ol.layer.Vector && typeof t.alt !== 'undefined') {
                var geometry = t.getSource().getFeatures()[0].getGeometry();
                if (typeof oldPos !== 'undefined') {
                    paintLine(oldPos, geometry.getCoordinates());
                }

                oldPos = geometry.getCoordinates();
            }
        });
    }

    function paintLine(pos1, pos2) {
        var line = new ol.geom.LineString([pos1, pos2]);

        var feature = new ol.Feature({
            geometry: line
        });
        feature.setStyle(new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#1497f1',
                width: 3
            })
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

    function getPointIcon(isEdit) {
        return new ol.style.Style({
            image: new ol.style.Icon(({
                anchor: [0.5, 1],
                opacity: 1,
                scale: 0.5,
                src: '../images/icons/cf_icon_position' + (isEdit ? '_edit' : '') + '.png'
            }))
            /*
            text: new ol.style.Text({
                text: '10',
                offsetX: -1,
                offsetY: -30,
                overflow: true,
                scale: 2,
                fill: new ol.style.Fill({ color: 'black' })
            })
            */
        });
    }

    function addMarker(_pos, _alt, _action, _speed) {
        var iconFeature = new ol.Feature({
            geometry: new ol.geom.Point(_pos),
            name: 'Null Island',
            population: 4000,
            rainfall: 500
        });

        iconFeature.setStyle(getPointIcon());

        var vectorSource = new ol.source.Vector({
            features: [iconFeature]
        });

        var vectorLayer = new ol.layer.Vector({
            source: vectorSource
        });

        vectorLayer.alt = _alt;
        vectorLayer.number = markers.length;
        vectorLayer.action = _action;
        vectorLayer.speedValue = _speed;

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
                new app.PlannerSettingsControl()
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
                zoom: 14
            })
        });

        // Set the attribute link to open on an external browser window, so
        // it doesn't interfere with the configurator.
        var interval;
        interval = setInterval(function() {
            var anchor = $('.ol-attribution a');
            if (anchor.length) {
                anchor.attr('target', '_blank');
                clearInterval(interval);
            }
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
                    selectedMarker.getSource().getFeatures()[0].setStyle(getPointIcon());
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
            selectedMarker = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return layer;
                });
            if (selectedFeature) {
                var geometry = selectedFeature.getGeometry();
                var coord = ol.proj.toLonLat(geometry.getCoordinates());

                selectedFeature.setStyle(getPointIcon(true));

                $('#pointLon').val(Math.round(coord[0] * 10000000) / 10000000);
                $('#pointLat').val(Math.round(coord[1] * 10000000) / 10000000);
                $('#pointAlt').val(selectedMarker.alt);
                $('#pointType').val(selectedMarker.action);
                $('#pointSpeed').val(selectedMarker.speedValue);
                $('#MPeditPoint').fadeIn(300);
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
                        t.speedValue = $('#pointSpeed').val();
                    }
                });

                selectedMarker.getSource().getFeatures()[0].setStyle(getPointIcon());
                selectedMarker = null;
                clearEditForm();
                repaint();
            }
        });

        $('#loadFileMissionButton').on('click', function () {
            if (markers.length && !confirm(chrome.i18n.getMessage('confirm_delete_all_points'))) return;
            removeAllPoints();
            var dialog = require('nw-dialog');
            dialog.setContext(document);
            dialog.openFileDialog(function(result) {
                loadMissionFile(result);
            })
        });

        $('#saveFileMissionButton').on('click', function () {
            //if (!markers.length) return;
            var dialog = require('nw-dialog');
            dialog.setContext(document);
            dialog.saveFileDialog('', '.mission', function(result) {
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

        $('#rthEndMission').on('change', function () {
            if ($(this).is(':checked')) {
                $('#rthSettings').fadeIn(300);
            } else {
                $('#rthSettings').fadeOut(300);
            }
        });

        $('#saveSettings').on('click', function () {
            settings = { speed: $('#MPdefaultPointSpeed').val(), alt: $('#MPdefaultPointAlt').val() };
            saveSettings();
            closeSettingsPanel();
        });

        $('#cancelSettings').on('click', function () {
            loadSettings();
            closeSettingsPanel();
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
        $('#rthEndMission').prop('checked', false);
        $('#rthSettings').fadeOut(300);
        $('#rthLanding').prop('checked', false);
        repaint();
    }

    function loadMissionFile(filename) {
        const fs = require('fs-extra');
        const xml2js = require('xml2js');

        fs.readFile(filename, (err, data) => {
            if (err) {
                GUI.log('<span style="color: red">Error reading file</span>');
                return console.error(err);
            }

            xml2js.Parser({ 'explicitChildren': true, 'preserveChildrenOrder': true }).parseString(data, (err, result) => {
                if (err) {
                    GUI.log('<span style="color: red">Error parsing file</span>');
                    return console.error(err);
                }

                var mission = { points: [] };

                // parse mission file

                var nodemission = null;
                for (var noderoot in result) {
                    if (!nodemission && noderoot.match(/mission/i)) {
                        nodemission = result[noderoot];
                        if (nodemission.$$ && nodemission.$$.length) {
                            for (var i = 0; i < nodemission.$$.length; i++) {
                                if (nodemission.$$[i]['#name'].match(/version/i) && nodemission.$$[i].$) {
                                    for (var attr in nodemission.$$[i].$) {
                                        if (attr.match(/value/i)) {
                                            mission.version = nodemission.$$[i].$[attr]
                                        }
                                    }
                                } else if (nodemission.$$[i]['#name'].match(/mwp/i) && nodemission.$$[i].$) {
                                    mission.center = {};
                                    for (var attr in nodemission.$$[i].$) {
                                        if (attr.match(/zoom/i)) {
                                            mission.center.zoom = parseInt(nodemission.$$[i].$[attr]);
                                        } else if (attr.match(/cx/i)) {
                                            mission.center.lon = parseFloat(nodemission.$$[i].$[attr]);
                                        } else if (attr.match(/cy/i)) {
                                            mission.center.lat = parseFloat(nodemission.$$[i].$[attr]);
                                        }
                                    }
                                } else if (nodemission.$$[i]['#name'].match(/missionitem/i) && nodemission.$$[i].$) {
                                    var point = {};
                                    for (var attr in nodemission.$$[i].$) {
                                        if (attr.match(/no/i)) {
                                            point.index = parseInt(nodemission.$$[i].$[attr]);
                                        } else if (attr.match(/action/i)) {
                                            if (nodemission.$$[i].$[attr].match(/WAYPOINT/i)) {
                                                point.action = MWNP.WPTYPE.WAYPOINT;
                                            } else if (nodemission.$$[i].$[attr].match(/PH_UNLIM/i) || nodemission.$$[i].$[attr].match(/POSHOLD_UNLIM/i)) {
                                                point.action = MWNP.WPTYPE.PH_UNLIM;
                                            } else if (nodemission.$$[i].$[attr].match(/PH_TIME/i) || nodemission.$$[i].$[attr].match(/POSHOLD_TIME/i)) {
                                                point.action = MWNP.WPTYPE.PH_TIME;
                                            } else if (nodemission.$$[i].$[attr].match(/RTH/i)) {
                                                point.action = MWNP.WPTYPE.RTH;
                                            } else if (nodemission.$$[i].$[attr].match(/SET_POI/i)) {
                                                point.action = MWNP.WPTYPE.SET_POI;
                                            } else if (nodemission.$$[i].$[attr].match(/JUMP/i)) {
                                                point.action = MWNP.WPTYPE.JUMP;
                                            } else if (nodemission.$$[i].$[attr].match(/SET_HEAD/i)) {
                                                point.action = MWNP.WPTYPE.SET_HEAD;
                                            } else if (nodemission.$$[i].$[attr].match(/LAND/i)) {
                                                point.action = MWNP.WPTYPE.LAND;
                                            } else {
                                                point.action = 0;
                                            }
                                        } else if (attr.match(/lat/i)) {
                                            point.lat = parseFloat(nodemission.$$[i].$[attr]);
                                        } else if (attr.match(/lon/i)) {
                                            point.lon = parseFloat(nodemission.$$[i].$[attr]);
                                        } else if (attr.match(/alt/i)) {
                                            point.alt = (parseInt(nodemission.$$[i].$[attr]) * 100);
                                        } else if (attr.match(/parameter1/i)) {
                                            point.p1 = parseInt(nodemission.$$[i].$[attr]);
                                        } else if (attr.match(/parameter2/i)) {
                                            point.p2 = parseInt(nodemission.$$[i].$[attr]);
                                        } else if (attr.match(/parameter3/i)) {
                                            point.p3 = parseInt(nodemission.$$[i].$[attr]);
                                        }
                                    }
                                    mission.points.push(point);
                                }
                            }
                        }
                    }
                }
                //console.log(mission);

                // draw actual mission

                removeAllPoints();

                for (var i = 0; i < mission.points.length; i++) {
                    //if ([MWNP.WPTYPE.WAYPOINT,MWNP.WPTYPE.PH_UNLIM,MWNP.WPTYPE.PH_TIME,MWNP.WPTYPE.LAND].includes(mission.points[i].action)) {
                    if (mission.points[i].action == MWNP.WPTYPE.WAYPOINT) {
                        var coord = ol.proj.fromLonLat([mission.points[i].lon, mission.points[i].lat]);
                        map.addLayer(addMarker(coord, mission.points[i].alt, mission.points[i].action, mission.points[i].p1));
                        if (i == 0) {
                            map.getView().setCenter(coord);
                            map.getView().setZoom(16);
                        }
                    } else if (mission.points[i].action == MWNP.WPTYPE.RTH) {
                        $('#rthEndMission').prop('checked', true);
                        $('#rthSettings').fadeIn(300);
                        if (mission.points[i].p1 > 0) {
                            $('#rthLanding').prop('checked', true);
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
        const fs = require('fs-extra');
        const xml2js = require('xml2js');

        var center = ol.proj.toLonLat(map.getView().getCenter());
        var zoom = map.getView().getZoom();

        var data = {
            'version': { $: { 'value': '2.3-pre8' } },
            'mwp': { $: { 'cx': (Math.round(center[0] * 10000000) / 10000000), 'cy': (Math.round(center[1] * 10000000) / 10000000), 'zoom': zoom } },
            'missionitem': []
        };

        for (var i = 0; i < markers.length; i++) {
            var geometry = markers[i].getSource().getFeatures()[0].getGeometry();
            var coordinate = ol.proj.toLonLat(geometry.getCoordinates());
            var point = { $: {
                'no': (i + 1),
                'action': ((markers[i].action == MWNP.WPTYPE.WAYPOINT) ? 'WAYPOINT' : markers[i].action),
                'lon': (Math.round(coordinate[0] * 10000000) / 10000000),
                'lat': (Math.round(coordinate[1] * 10000000) / 10000000),
                'alt': (markers[i].alt / 100)
            } };
            if ((markers[i].action == MWNP.WPTYPE.WAYPOINT) && (markers[i].speedValue > 0)) point.$['parameter1'] = markers[i].speedValue;
            data.missionitem.push(point);
        }

        // add last RTH point
        if ($('#rthEndMission').is(':checked')) {
            data.missionitem.push({ $: { 'no': (markers.length + 1), 'action': 'RTH', 'lon': 0, 'lat': 0, 'alt': (settings.alt / 100), 'parameter1': ($('#rthLanding').is(':checked') ? 1 : 0) } });
        }

        var builder = new xml2js.Builder({ 'rootName': 'mission', 'renderOpts': { 'pretty': true, 'indent': '\t', 'newline': '\n' } });
        var xml = builder.buildObject(data);
        fs.writeFile(filename, xml, (err) => {
            if (err) {
                GUI.log('<span style="color: red">Error writing file</span>');
                return console.error(err);
            }
            GUI.log('File saved');
        });
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
            if (MISSION_PLANER.bufferPoint.action == 4) {
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
        var isRTH = $('#rthEndMission').is(':checked');

        if (pointForSend >= markers.length) {
            if (isRTH) {
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
            }

            return;
        }

        var geometry = markers[pointForSend].getSource().getFeatures()[0].getGeometry();
        var coordinate = ol.proj.toLonLat(geometry.getCoordinates());

        MISSION_PLANER.bufferPoint.number = pointForSend + 1;
        MISSION_PLANER.bufferPoint.action = markers[pointForSend].action;
        MISSION_PLANER.bufferPoint.lon = parseInt(coordinate[0] * 10000000);
        MISSION_PLANER.bufferPoint.lat = parseInt(coordinate[1] * 10000000);
        MISSION_PLANER.bufferPoint.alt = markers[pointForSend].alt;
        MISSION_PLANER.bufferPoint.p1 = markers[pointForSend].speedValue;
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
