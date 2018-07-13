'use strict';

TABS.mission_control = {};
TABS.mission_control.isYmapLoad = false;
TABS.mission_control.initialize = function (callback) {

    if (GUI.active_tab != 'mission_control') {
        GUI.active_tab = 'mission_control';
        googleAnalytics.sendAppView('Mission Control');
    }

    var loadChainer = new MSPChainerClass();
    loadChainer.setChain([
        mspHelper.getMissionInfo
    ]);
    loadChainer.setExitPoint(loadHtml);
    loadChainer.execute();

    function updateTotalInfo() {
        $('#availablePoints').text(MISSION_PLANER.countBusyPoints + '/' + MISSION_PLANER.maxWaypoints);
        $('#missionValid').html(MISSION_PLANER.isValidMission ? chrome.i18n.getMessage('armingCheckPass') : chrome.i18n.getMessage('armingCheckFail'));
    }

    function loadHtml() {
        $('#content').load("./tabs/mission_control.html", process_html);
    }

    function process_html() {
        if (typeof require !== "undefined") {
            chrome.storage.local.get('missionPlanerSettings', function (result) {
                if (result.missionPlanerSettings) {
                    $('#MPdefaultPointAlt').val(result.missionPlanerSettings.alt);
                    $('#MPdefaultPointSpeed').val(result.missionPlanerSettings.speed);
                } else {
                    chrome.storage.local.set({'missionPlanerSettings': {speed: 0, alt: 5000}});
                    $('#MPdefaultPointAlt').val(5000);
                    $('#MPdefaultPointSpeed').val(0);
                }
            });


            initMap();
        } else {
            $('#missionMap, #missionControls').hide();
            $('#notLoadMap').show();
        }
        localize();

        GUI.content_ready(callback);
    }

    var markers = [];
    var lines = [];
    var map;
    var selectedMarker = null;
    var pointForSend = 0;

    function clearEditForm() {
        $('#pointLat').val('');
        $('#pointLon').val('');
        $('#pointAlt').val('');
        $('#pointSpeed').val('');
        $('[name=pointNumber]').val('');
        $('#MPeditPoint').fadeOut(300);
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
//            text: new ol.style.Text({
//                text: '10',
//                offsetX: -1,
//                offsetY: -30,
//                overflow: true,
//                scale: 2,
//                fill: new ol.style.Fill({
//                    color: 'black'
//                })
//            })
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

        var lat = GPS_DATA.lat / 10000000;
        var lon = GPS_DATA.lon / 10000000;

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
                    source: new ol.source.OSM()
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

                $('#pointLon').val(coord[0]);
                $('#pointLat').val(coord[1]);
                $('#pointAlt').val(selectedMarker.alt);
                $('#pointType').val(selectedMarker.action);
                $('#pointSpeed').val(selectedMarker.speedValue);
                $('#MPeditPoint').fadeIn(300);
            } else {
                map.addLayer(addMarker(evt.coordinate, $('#MPdefaultPointAlt').val(), 1, $('#MPdefaultPointSpeed').val()));
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
            if (confirm(chrome.i18n.getMessage('confirm_delete_all_points'))) {
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

        $('#loadMissionButton').on('click', function () {
            if (markers.length) {
                if (!confirm(chrome.i18n.getMessage('confirm_delete_all_points'))) {
                    return;
                }
                removeAllPoints();
            }
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
            if (markers.length) {
                if (!confirm(chrome.i18n.getMessage('confirm_delete_all_points'))) {
                    return;
                }
                removeAllPoints();
            }
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
            chrome.storage.local.set({'missionPlanerSettings': {speed: $('#MPdefaultPointSpeed').val(), alt: $('#MPdefaultPointAlt').val()}});
            $('#missionPlanerSettings').hide();
            $('#missionPalnerTotalInfo').fadeIn(300);
            if (selectedMarker !== null) {
                $('#MPeditPoint').fadeIn(300);
            }
        });

        updateTotalInfo();
    }

    function removeAllPoints() {
        for (var i in markers) {
            map.removeLayer(markers[i]);
        }
        markers = [];
        clearEditForm();
        repaint();
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
                $('#rthEndMission').attr('checked', true);
                $('#rthSettings').fadeIn(300);
                if (MISSION_PLANER.bufferPoint.p1 > 0) {
                    $('#rthLanding').attr('checked', true);
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
