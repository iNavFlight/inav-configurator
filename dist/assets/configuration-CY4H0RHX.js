const n=`<div class="tab-configuration toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <div class="tab_title" data-i18n="tabConfiguration">Configuration</div>\r
        \r
        <div class="require-support">\r
            <div class="note spacebottom">\r
                <div class="note_spacer"><p data-i18n="configurationFeaturesHelp"></p></div>\r
            </div>\r
        </div>\r
\r
        <div class="leftWrapper">\r
            <div class="config-section sensors gui_box grey">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="configurationSensors"></div>\r
                </div>\r
                <div class="spacer_box">\r
                    <div class="select">\r
                        <select id="sensor-acc" data-setting="acc_hardware"></select>\r
                        <label for="sensor-acc"> <span data-i18n="sensorAccelerometer"></span></label>\r
                    </div>\r
\r
                    <div class="select">\r
                        <select id="sensor-mag" data-setting="mag_hardware"></select>\r
                        <label for="sensor-mag"> <span data-i18n="sensorMagnetometer"></span></label>\r
                    </div>\r
\r
                    <div class="select">\r
                        <select id="sensor-baro" data-setting="baro_hardware"></select>\r
                        <label for="sensor-baro"> <span data-i18n="sensorBarometer"></span></label>\r
                    </div>\r
\r
                    <div class="select">\r
                        <select id="sensor-pitot" data-setting="pitot_hardware"></select>\r
                        <label for="sensor-pitot"> <span data-i18n="sensorPitot"></span></label>\r
                    </div>\r
\r
                    <div class="select">\r
                        <select id="sensor-rangefinder" data-setting="rangefinder_hardware"></select>\r
                        <label for="sensor-rangefinder"> <span data-i18n="sensorRangefinder"></span></label>\r
                    </div>\r
\r
                    <div class="select">\r
                        <select id="sensor-opflow" data-setting="opflow_hardware"></select>\r
                        <label for="sensor-opflow"> <span data-i18n="sensorOpflow"></span></label>\r
                    </div>\r
\r
                    <div id="i2c_speed-info" class="info-box"></div>\r
                    <div class="select">\r
                        <select id="i2c_speed" data-setting="i2c_speed"></select>\r
                        <label for="i2c_speed">\r
                            <span data-i18n="configurationI2cSpeed"></span>\r
                        </label>\r
                        <div for="i2c_speed" class="helpicon cf_tip" data-i18n_title="configurationI2cSpeedHelp"></div>\r
                    </div>\r
\r
                </div>\r
            </div>\r
\r
            <div class="config-section gui_box grey other">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="configurationFeatures"></div>\r
                </div>\r
\r
                <div class="spacer_box">\r
                    <div class="features other"></div>\r
                    <!--feature list generated content-->\r
                </div>\r
            </div>\r
\r
        </div>\r
\r
        <!--Right column begins here-->\r
\r
        <div class="rightWrapper">\r
            <div class="config-section gui_box grey">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="configurationVoltageCurrentSensor"></div>\r
                </div>\r
                <div class="spacer_box">\r
                    <div class="features batteryVoltage"></div>\r
                    <div class="select">\r
                        <select id="vbat_meter_type" data-setting="vbat_meter_type"></select>\r
                        <label for="vbat_meter_type">\r
                            <span data-i18n="configurationVoltageMeterType"></span>\r
                        </label>\r
                    </div>\r
                    <div class="select">\r
                        <select id="voltagesource" class="voltagesource" data-setting-placeholder="bat_voltage_src">\r
                            <option value="0">Raw</option>\r
                            <option value="1">Sag compensated</option>\r
                        </select>\r
                        <label for="voltagesource">\r
                            <span data-i18n="configurationVoltageSource"></span>\r
                        </label>\r
                        <div for="voltagesource" class="helpicon cf_tip" data-i18n_title="configurationVoltageSourceHelp"></div>\r
                    </div>\r
                    \r
                    <div class="number">\r
                        <input type="number" id="voltagescale" name="voltagescale" step="1" min="10" max="65535" />\r
                        <label for="voltagescale">\r
                            <span data-i18n="configurationBatteryScale"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="text" id="batteryvoltage" name="batteryvoltage" readonly class="disabled" />\r
                        <label for="batteryvoltage">\r
                            <span data-i18n="configurationBatteryVoltage"></span>\r
                        </label>\r
                    </div>\r
                    <div class="features batteryCurrent"></div>\r
                    <div class="select">\r
                        <select id="current_meter_type" data-setting="current_meter_type"></select>\r
                        <label for="current_meter_type">\r
                            <span data-i18n="configurationCurrentMeterType"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" id="currentscale" name="currentscale" step="1" min="-10000" max="10000" data-setting-placeholder="current_meter_scale" />\r
                        <label for="currentscale">\r
                            <span data-i18n="configurationCurrentScale"></span>\r
                        </label>\r
                        <div for="currentscale" class="helpicon cf_tip" data-i18n_title="configurationCurrentScaleHelp"></div>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" id="currentoffset" name="currentoffset" step="0.1" min="-3276.8" max="3276.7" />\r
                        <label for="currentoffset">\r
                            <span data-i18n="configurationCurrentOffset"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="text" id="batterycurrent" name="batterycurrent" readonly class="disabled" />\r
                        <label for="batterycurrent">\r
                            <span data-i18n="configurationBatteryCurrent"></span>\r
                        </label>\r
                    </div>\r
                </div>\r
            </div>\r
            <div class="config-section gui_box grey">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="configurationBatterySettings"></div>\r
                    <div class="helpicon cf_tip" data-i18n_title="configurationBatterySettingsHelp"></div>\r
                </div>\r
                <div class="spacer_box">\r
                    <div class="number">\r
                        <input type="number" class="batteryProfileHighlight" id="cells" name="cells" step="1" min="0" max="12" data-setting-placeholder="bat_cells" />\r
                        <label for="cells"><span data-i18n="configurationBatteryCells"></span></label>\r
                        <div for="cells" class="helpicon cf_tip" data-i18n_title="configurationBatteryCellsHelp"></div>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" class="batteryProfileHighlight" id="celldetectvoltage" name="celldetectvoltage" step="0.01" min="1" max="5" data-setting-placeholder="vbat_cell_detect_voltage" />\r
                        <label for="celldetectvoltage"><span data-i18n="configurationBatteryCellDetectVoltage"></span></label>\r
                        <div for="celldetectvoltage" class="helpicon cf_tip" data-i18n_title="configurationBatteryCellDetectVoltageHelp"></div>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" class="batteryProfileHighlight" id="mincellvoltage" name="mincellvoltage" step="0.01" min="1" max="5" />\r
                        <label for="mincellvoltage"><span data-i18n="configurationBatteryMinimum"></span></label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" class="batteryProfileHighlight" id="maxcellvoltage" name="maxcellvoltage" step="0.01" min="1" max="5" />\r
                        <label for="maxcellvoltage">\r
                            <span data-i18n="configurationBatteryMaximum"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" class="batteryProfileHighlight" id="warningcellvoltage" name="warningcellvoltage" step="0.01" min="1" max="5" />\r
                        <label for="warningcellvoltage">\r
                            <span data-i18n="configurationBatteryWarning"></span>\r
                        </label>\r
                    </div>\r
                    <div class="select">\r
                        <select id="battery_capacity_unit">\r
                            <option value="mAh">mAh</option>\r
                            <option value="mWh">mWh</option>\r
                        </select>\r
                        <label for="warningcellvoltage">\r
                            <span data-i18n="configurationBatteryCapacityUnit"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" class="batteryProfileHighlight" id="battery_capacity" name="battery_capacity" step="1" min="0" max="4294967296" />\r
                        <label for="battery_capacity">\r
                            <span data-i18n="configurationBatteryCapacityValue"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" class="batteryProfileHighlight" id="battery_capacity_warning" name="battery_capacity_warning" step="1" min="0" max="100" />\r
                        <label for="battery_capacity_warning">\r
                            <span data-i18n="configurationBatteryCapacityWarning"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" class="batteryProfileHighlight" id="battery_capacity_critical" name="battery_capacity_critical" step="1" min="0" max="100" />\r
                        <label for="battery_capacity_critical">\r
                            <span data-i18n="configurationBatteryCapacityCritical"></span>\r
                        </label>\r
                    </div>\r
                </div>\r
            </div>\r
\r
            <div class="config-section gui_box grey config-vtx">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="configurationVTX"></div>\r
                </div>\r
                <div class="spacer_box">\r
                    <div class="info-box" data-i18n="vtxDisclaimer"></div>\r
                    <div class="note" id="vtx_no_band">\r
                        <div class="note_spacer">\r
                            <p data-i18n="configurationVTXNoBandHelp"></p>\r
                        </div>\r
                    </div>\r
\r
                    <div class="select vtx_band_wrapper">\r
                        <select id="vtx_band"></select>\r
                        <label for="vtx_band">\r
                            <span data-i18n="configurationVTXBand"></span>\r
                        </label>\r
                    </div>\r
\r
                    <div class="select vtx_channel_wrapper">\r
                        <select id="vtx_channel"></select>\r
                        <label for="vtx_channel"> <span data-i18n="configurationVTXChannel"></span></label>\r
                    </div>\r
\r
                    <div class="select">\r
                        <select id="vtx_power" data-setting-placeholder="vtx_power"></select>\r
                        <label for="vtx_power"><span data-i18n="configurationVTXPower"></span></label>\r
                        <div for="vtx_power" class="helpicon cf_tip" data-i18n_title="configurationVTXPowerHelp"></div>\r
                    </div>\r
\r
                    <div class="select">\r
                        <select id="vtx_low_power_disarm" data-setting-placeholder="vtx_low_power_disarm"></select>\r
                        <label for="vtx_low_power_disarm"><span data-i18n="configurationVTXLowerPowerDisarm"></span></label>\r
                        <div for="vtx_low_power_disarm" class="helpicon cf_tip" data-i18n_title="configurationVTXLowerPowerDisarmHelp"></div>\r
                    </div>\r
                </div>\r
            </div>\r
\r
            <div class="config-section gui_box grey config-gimbal">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="configurationGimbal"></div>\r
                </div>\r
                <div class="spacer_box">\r
                    <div class="number">\r
                        <input type="number" id="gimbal_sensitivity" name="gimbal_sensitivity" data-setting="gimbal_sensitivity" />\r
                        <label for="gimbal_sensitivity">\r
                            <span data-i18n="configurationGimbalSensitivity"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" id="gimbal_pan_channel" name="gimbal_pan_channel" data-setting="gimbal_pan_channel" />\r
                        <label for="gimbal_pan_channel">\r
                            <span data-i18n="configurationGimbalPanChannel"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" id="gimbal_tilt_channel" name="gimbal_tilt_channel" data-setting="gimbal_tilt_channel" />\r
                        <label for="gimbal_tilt_channel">\r
                            <span data-i18n="configurationGimbalTiltChannel"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" id="gimbal_roll_channel" name="gimbal_roll_channel" data-setting="gimbal_roll_channel" />\r
                        <label for="gimbal_roll_channel">\r
                            <span data-i18n="configurationGimbalRollChannel"></span>\r
                        </label>\r
                    </div>\r
                </div>\r
            </div>\r
\r
            <div class="config-section gui_box grey config-headtracker">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="configurationHeadtracker"></div>\r
                </div>\r
                <div class="spacer_box">\r
                    <div class="number">\r
                        <select id="headtracker-type" data-setting="headtracker_type"></select>\r
                        <label for="headtrack-type">\r
                            <span data-i18n="configurationHeadtrackerType"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" data-step="0.01" min="0" max="5" id="headtracker_pan_ratio" data-setting="headtracker_pan_ratio">\r
                        <label for="headtracker_pan_ratio">\r
                            <span data-i18n="configurationHeadtrackerPanRatio"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" data-step="0.01" min="0" max="5" id="headtracker_tilt_ratio" data-setting="headtracker_tilt_ratio">\r
                        <label for="headtracker_tilt_ratio">\r
                            <span data-i18n="configurationHeadtrackerTiltRatio"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" data-step="0.01" id="headtracker_roll_ratio" data-setting="headtracker_roll_ratio">\r
                        <label for="headtracker_roll_ratio">\r
                            <span data-i18n="configurationHeadtrackerRollRatio"></span>\r
                        </label>\r
                    </div>\r
                </div>\r
            </div>\r
        </div>\r
\r
        <div class="clear-both"></div>\r
    </div>\r
\r
    <div class="content_toolbar">\r
        <div class="btn save_btn">\r
            <a class="save" href="#" data-i18n="configurationButtonSave"></a>\r
        </div>\r
    </div>\r
</div>\r
`;export{n as default};
