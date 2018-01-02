'use strict';

TABS.mission_control = {};
TABS.mission_control.isYmapLoad = false;
TABS.mission_control.initialize = function (callback) {

    if (GUI.active_tab != 'mission_control') {
        GUI.active_tab = 'mission_control';
        googleAnalytics.sendAppView('Mission Control');
    }

    function load_html() {
        $('#content').load("./tabs/mission_control.html", process_html);
    }

    load_html();

    function process_html() {
        initMap();
        localize();

        GUI.content_ready(callback);
    }

    var markers = [];
    var lines = [];
    var map;
    var selectedMarker;

    function clearEditForm() {
        $('#pointLat').val('');
        $('#pointLon').val('');
        $('#pointAlt').val('');
        $('[name=pointNumber]').val('')
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

    function addMarker(pos) {
        var iconFeature = new ol.Feature({
            geometry: new ol.geom.Point(pos),
            name: 'Null Island',
            population: 4000,
            rainfall: 500
        });

        var iconStyle = new ol.style.Style({
            image: new ol.style.Icon(({
                anchor: [0.5, 1],
                opacity: 1,
                scale: 0.5,
                src: '../images/icons/cf_icon_position.png'
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

        iconFeature.setStyle(iconStyle);

        var vectorSource = new ol.source.Vector({
            features: [iconFeature]
        });

        var vectorLayer = new ol.layer.Vector({
            source: vectorSource
        });

        vectorLayer.alt = 0;
        vectorLayer.number = markers.length;

        markers.push(vectorLayer);

        return vectorLayer;
    }

    function initMap() {
        // var center = ol.proj.fromLonLat([e.data.lon, e.data.lat]);
        //
        // mapView.setCenter(center);
        // iconGeometry.setCoordinates(center);

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
            interactions: ol.interaction.defaults().extend([new app.Drag()]),
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            target: document.getElementById('missionMap'),
            view: new ol.View({
                center: ol.proj.fromLonLat([lon, lat]),
                zoom: 10
            })
        });

        map.on('click', function (evt) {
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

                $('#pointLat').val(coord[0]);
                $('#pointLon').val(coord[1]);
                $('#pointAlt').val(selectedMarker.alt);
            } else {
                map.addLayer(addMarker(evt.coordinate));
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
            for (var i in markers) {
                map.removeLayer(markers[i]);
            }
            markers = [];
            clearEditForm();
            repaint();
        });

        $('#removePoint').on('click', function () {
            if (selectedMarker) {
                map.removeLayer(selectedMarker);
                var tmp = [];
                for (var i in markers) {
                    if (markers[i] !== selectedMarker) {
                        tmp.push(markers[i]);
                    }
                }
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
                        geometry.setCoordinates(ol.proj.fromLonLat([parseFloat($('#pointLat').val()), parseFloat($('#pointLon').val())]));
                        t.alt = $('#pointAlt').val();
                    }
                });

                selectedMarker = null;
                clearEditForm();
                repaint();
            }
        });
    }
};

TABS.mission_control.cleanup = function (callback) {
    if (callback) callback();
};