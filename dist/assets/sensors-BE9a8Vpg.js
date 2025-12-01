const r=`<div class="tab-sensors">\r
    <div class="content_wrapper">\r
        <div class="tab_title" i18n="tabRawSensorData">tabRawSensorData</div>\r
        <div class="note" style="margin-bottom: 10px;">\r
            <div class="note_spacer">\r
                <p i18n="sensorsInfo">Keep in mind that using fast update periods and rendering multiple graphs at\r
                    the same time is resource heavy and will burn your battery quicker if you use a laptop. We recommend\r
                    to only render graphs for sensors you are interested in while using reasonable update periods.</p>\r
            </div>\r
        </div>\r
        <div class="gui_box">\r
            <div class="info">\r
                <div class="checkboxes">\r
                    <label><input type="checkbox" name="gyro_on" class="first" /><span i18n="sensorsGyroSelect"></label> <label><input\r
                        type="checkbox" name="accel_on" /><span i18n="sensorsAccelSelect"></span></label> <label><input type="checkbox"\r
                        name="mag_on" /><span i18n="sensorsMagSelect"></span></label> <label><input type="checkbox" name="baro_on" /><span i18n="sensorsAltitudeSelect"></span></label> <label><input\r
                        type="checkbox" name="sonar_on" /><span i18n="sensorsSonarSelect"></span></label> <label><input type="checkbox" name="airspeed_on" /><span i18n="sensorsAirSpeedSelect"></span></label> <label><input\r
                        type="checkbox" name="temperature_on" /><span i18n="sensorsTemperaturesSelect"></span></label><label><input type="checkbox" name="debug_on" /><span i18n="sensorsDebugSelect"></span></label>\r
\r
                    <a class="debug-trace" href="javascript:void(0);"><span i18n="sensorsDebugTrace"></span></a>\r
                </div>\r
            </div>\r
        </div>\r
        <div class="wrapper gyro">\r
            <div class="gui_box grey">\r
                <div class="plot_control">\r
                    <div class="title" i18n="sensorsGyroscope"></div>\r
                    <dl>\r
                        <dt i18n="sensorsRefresh"></dt>\r
                        <dd class="rate">\r
                            <select name="gyro_refresh_rate">\r
                                <option value="10">10 ms</option>\r
                                <option value="20">20 ms</option>\r
                                <option value="30">30 ms</option>\r
                                <option value="40">40 ms</option>\r
                                <option value="50" selected="selected">50 ms</option>\r
                                <option value="100">100 ms</option>\r
                                <option value="250">250 ms</option>\r
                                <option value="500">500 ms</option>\r
                                <option value="1000">1000 ms</option>\r
                            </select>\r
                        </dd>\r
                        <dt i18n="sensorsScale"></dt>\r
                        <dd class="scale">\r
                            <select name="gyro_scale">\r
                                <option value="100">100</option>\r
                                <option value="500">500</option>\r
                                <option value="1000">1000</option>\r
                                <option value="2000" selected="selected">2000</option>\r
                            </select>\r
                        </dd>\r
                        <dt>X:</dt>\r
                        <dd class="x">0</dd>\r
                        <dt>Y:</dt>\r
                        <dd class="y">0</dd>\r
                        <dt>Z:</dt>\r
                        <dd class="z">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="gyro">\r
            <g class="grid x" transform="translate(40, 120)"></g>\r
            <g class="grid y" transform="translate(40, 10)"></g>\r
            <g class="data" transform="translate(41, 10)"></g>\r
            <g class="axis x" transform="translate(40, 120)"></g>\r
            <g class="axis y" transform="translate(40, 10)"></g>\r
        </svg>\r
                <div class="clear-both"></div>\r
            </div>\r
        </div>\r
        <div class="wrapper accel">\r
            <div class="gui_box grey">\r
                <div class="plot_control">\r
                    <div class="title" i18n="sensorsAccelerometer"></div>\r
                    <dl>\r
                        <dt i18n="sensorsRefresh"></dt>\r
                        <dd class="rate">\r
                            <select name="accel_refresh_rate">\r
                                <option value="10">10 ms</option>\r
                                <option value="20">20 ms</option>\r
                                <option value="30">30 ms</option>\r
                                <option value="40">40 ms</option>\r
                                <option value="50" selected="selected">50 ms</option>\r
                                <option value="100">100 ms</option>\r
                                <option value="250">250 ms</option>\r
                                <option value="500">500 ms</option>\r
                                <option value="1000">1000 ms</option>\r
                            </select>\r
                        </dd>\r
                        <dt i18n="sensorsScale"></dt>\r
                        <dd class="scale">\r
                            <select name="accel_scale">\r
                                <option value="0.5">0.5</option>\r
                                <option value="1">1</option>\r
                                <option value="2" selected="selected">2</option>\r
                            </select>\r
                        </dd>\r
                        <dt>X:</dt>\r
                        <dd class="x">0</dd>\r
                        <dt>Y:</dt>\r
                        <dd class="y">0</dd>\r
                        <dt>Z:</dt>\r
                        <dd class="z">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="accel">\r
            <g class="grid x" transform="translate(40, 120)"></g>\r
            <g class="grid y" transform="translate(40, 10)"></g>\r
            <g class="data" transform="translate(41, 10)"></g>\r
            <g class="axis x" transform="translate(40, 120)"></g>\r
            <g class="axis y" transform="translate(40, 10)"></g>\r
        </svg>\r
                <div class="clear-both"></div>\r
            </div>\r
        </div>\r
\r
        <div class="wrapper mag">\r
            <div class="gui_box grey">\r
                <div class="plot_control">\r
                    <div class="title" i18n="sensorsMagnetometer"></div>\r
                    <dl>\r
                        <dt i18n="sensorsRefresh"></dt>\r
                        <dd class="rate">\r
                            <select name="mag_refrash_rate">\r
                                <option value="10">10 ms</option>\r
                                <option value="20">20 ms</option>\r
                                <option value="30">30 ms</option>\r
                                <option value="40">40 ms</option>\r
                                <option value="50" selected="selected">50 ms</option>\r
                                <option value="100">100 ms</option>\r
                                <option value="250">250 ms</option>\r
                                <option value="500">500 ms</option>\r
                                <option value="1000">1000 ms</option>\r
                            </select>\r
                        </dd>\r
                        <dt i18n="sensorsScale"></dt>\r
                        <dd class="scale">\r
                            <select name="mag_scale">\r
                                <option value="0.5">0.5</option>\r
                                <option value="1" selected="selected">1</option>\r
                            </select>\r
                        </dd>\r
                        <dt>X:</dt>\r
                        <dd class="x">0</dd>\r
                        <dt>Y:</dt>\r
                        <dd class="y">0</dd>\r
                        <dt>Z:</dt>\r
                        <dd class="z">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="mag">\r
            <g class="grid x" transform="translate(40, 120)"></g>\r
            <g class="grid y" transform="translate(40, 10)"></g>\r
            <g class="data" transform="translate(41, 10)"></g>\r
            <g class="axis x" transform="translate(40, 120)"></g>\r
            <g class="axis y" transform="translate(40, 10)"></g>\r
        </svg>\r
                <div class="clear-both"></div>\r
            </div>\r
        </div>\r
        <div class="wrapper altitude">\r
            <div class="gui_box grey">\r
                <div class="plot_control">\r
                    <div class="title" i18n="sensorsBarometer"></div>\r
                    <dl>\r
                        <dt i18n="sensorsRefresh"></dt>\r
                        <dd class="rate">\r
                            <select name="baro_refresh_rate">\r
                                <option value="10">10 ms</option>\r
                                <option value="20">20 ms</option>\r
                                <option value="30">30 ms</option>\r
                                <option value="40">40 ms</option>\r
                                <option value="50">50 ms</option>\r
                                <option value="100" selected="selected">100 ms</option>\r
                                <option value="250">250 ms</option>\r
                                <option value="500">500 ms</option>\r
                                <option value="1000">1000 ms</option>\r
                            </select>\r
                        </dd>\r
                        <dt>Alt:</dt>\r
                        <dd class="x">0</dd>\r
                        <dt>Baro:</dt>\r
                        <dd class="y">0</dd>\r
                    </dl>\r
                </div>\r
\r
                <svg id="altitude">\r
            <g class="grid x" transform="translate(40, 120)"></g>\r
            <g class="grid y" transform="translate(40, 10)"></g>\r
            <g class="data" transform="translate(41, 10)"></g>\r
            <g class="axis x" transform="translate(40, 120)"></g>\r
            <g class="axis y" transform="translate(40, 10)"></g>\r
        </svg>\r
                <div class="clear-both"></div>\r
            </div>\r
        </div>\r
        <div class="wrapper sonar">\r
            <div class="gui_box grey">\r
                <div class="plot_control">\r
                    <div class="title" i18n="sensorsSonar"></div>\r
                    <dl>\r
                        <dt i18n="sensorsRefresh"></dt>\r
                        <dd class="rate">\r
                            <select name="sonar_refresh_rate">\r
                                <option value="10">10 ms</option>\r
                                <option value="20">20 ms</option>\r
                                <option value="30">30 ms</option>\r
                                <option value="40">40 ms</option>\r
                                <option value="50">50 ms</option>\r
                                <option value="100" selected="selected">100 ms</option>\r
                                <option value="250">250 ms</option>\r
                                <option value="500">500 ms</option>\r
                                <option value="1000">1000 ms</option>\r
                            </select>\r
                        </dd>\r
                        <dt>X:</dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="sonar">\r
            <g class="grid x" transform="translate(40, 120)"></g>\r
            <g class="grid y" transform="translate(40, 10)"></g>\r
            <g class="data" transform="translate(41, 10)"></g>\r
            <g class="axis x" transform="translate(40, 120)"></g>\r
            <g class="axis y" transform="translate(40, 10)"></g>\r
        </svg>\r
                <div class="clear-both"></div>\r
            </div>\r
        </div>\r
        <div class="wrapper airspeed">\r
            <div class="gui_box grey">\r
                <div class="plot_control">\r
                    <div class="title" i18n="sensorsAirspeed"></div>\r
                    <dl>\r
                        <dt i18n="sensorsRefresh"></dt>\r
                        <dd class="rate">\r
                            <select name="airspeed_refresh_rate">\r
                                <option value="10">10 ms</option>\r
                                <option value="20">20 ms</option>\r
                                <option value="30">30 ms</option>\r
                                <option value="40">40 ms</option>\r
                                <option value="50" selected="selected">50 ms</option>\r
                                <option value="100">100 ms</option>\r
                                <option value="250">250 ms</option>\r
                                <option value="500">500 ms</option>\r
                                <option value="1000">1000 ms</option>\r
                            </select>\r
                        </dd>\r
                        <dt>IAS:</dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="airspeed">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
            </div>\r
        </div>\r
\r
        <div class="wrapper temperature">\r
            <div class="gui_box grey">\r
                <div class="plot_control">\r
                    <div class="title" i18n="sensorsTemperature0"></div>\r
                    <dl>\r
                        <dt i18n="sensorsTemperatureValue"></dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="temperature1">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
                <div class="plot_control">\r
                    <div class="title" i18n="sensorsTemperature1"></div>\r
                    <dl>\r
                        <dt i18n="sensorsTemperatureValue"></dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="temperature2">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
                <div class="plot_control">\r
                    <div class="title" i18n="sensorsTemperature2"></div>\r
                    <dl>\r
                        <dt i18n="sensorsTemperatureValue"></dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="temperature3">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
                <div class="plot_control">\r
                    <div class="title" i18n="sensorsTemperature3"></div>\r
                    <dl>\r
                        <dt i18n="sensorsTemperatureValue"></dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="temperature4">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
                <div class="plot_control">\r
                    <div class="title" i18n="sensorsTemperature4"></div>\r
                    <dl>\r
                        <dt i18n="sensorsTemperatureValue"></dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="temperature5">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
                <div class="plot_control">\r
                    <div class="title" i18n="sensorsTemperature5"></div>\r
                    <dl>\r
                        <dt i18n="sensorsTemperatureValue"></dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="temperature6">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
                <div class="plot_control">\r
                    <div class="title" i18n="sensorsTemperature6"></div>\r
                    <dl>\r
                        <dt i18n="sensorsTemperatureValue"></dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="temperature7">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
                <div class="plot_control">\r
                    <div class="title" i18n="sensorsTemperature7"></div>\r
                    <dl>\r
                        <dt i18n="sensorsTemperatureValue"></dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="temperature8">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
            </div>\r
        </div>\r
\r
        <div class="wrapper debug">\r
            <div class="gui_box grey">\r
                <div class="plot_control">\r
                    <div class="title">Debug 0</div>\r
                    <dl>\r
                        <dt i18n="sensorsRefresh"></dt>\r
                        <dd class="rate">\r
                        <select name="debug_refresh_rate">\r
                            <option value="10">10 ms</option>\r
                            <option value="20">20 ms</option>\r
                            <option value="30">30 ms</option>\r
                            <option value="40">40 ms</option>\r
                            <option value="50">50 ms</option>\r
                            <option value="100">100 ms</option>\r
                            <option value="250">250 ms</option>\r
                            <option value="500" selected="selected">500 ms</option>\r
                            <option value="1000">1000 ms</option>\r
                        </select>\r
                        </dd>\r
                        <dt>X:</dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="debug1">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
                <div class="plot_control">\r
                    <div class="title">Debug 1</div>\r
                    <dl>\r
                        <dt>X:</dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="debug2">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
                <div class="plot_control">\r
                    <div class="title">Debug 2</div>\r
                    <dl>\r
                        <dt>X:</dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="debug3">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
                <div class="plot_control">\r
                    <div class="title">Debug 3</div>\r
                    <dl>\r
                        <dt>X:</dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="debug4">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
                <div class="plot_control">\r
                    <div class="title">Debug 4</div>\r
                    <dl>\r
                        <dt>X:</dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="debug5">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
                <div class="plot_control">\r
                    <div class="title">Debug 5</div>\r
                    <dl>\r
                        <dt>X:</dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="debug6">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
                <div class="plot_control">\r
                    <div class="title">Debug 6</div>\r
                    <dl>\r
                        <dt>X:</dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="debug7">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
                <div class="clear-both"></div>\r
                <div class="plot_control">\r
                    <div class="title">Debug 7</div>\r
                    <dl>\r
                        <dt>X:</dt>\r
                        <dd class="x">0</dd>\r
                    </dl>\r
                </div>\r
                <svg id="debug8">\r
                    <g class="grid x" transform="translate(40, 120)"></g>\r
                    <g class="grid y" transform="translate(40, 10)"></g>\r
                    <g class="data" transform="translate(41, 10)"></g>\r
                    <g class="axis x" transform="translate(40, 120)"></g>\r
                    <g class="axis y" transform="translate(40, 10)"></g>\r
                </svg>\r
            </div>\r
        </div>\r
    </div>\r
`;export{r as default};
