const r=`<!--suppress HtmlFormInputWithoutLabel -->\r
<div class="tab-receiver toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <div class="tab_title" data-i18n="tabReceiver"></div>\r
        <div class="note" style="margin-bottom: 20px;">\r
            <div class="note_spacer">\r
                <p data-i18n="receiverHelp"></p>\r
            </div>\r
        </div>\r
        <div class="bars">\r
            <div class="rssi_channel_wrapper">\r
                <div class="head" data-i18n="receiverRssiChannel"></div>\r
                <select name="rssi_channel">\r
                    <!-- list generated here -->\r
                </select>\r
            </div>\r
            <div class="rssi_channel_wrapper">\r
                <div class="head" data-i18n="receiverRssiSource"></div>\r
                <select name="rssi_source" data-setting="rssi_source"></select>\r
            </div>\r
            <div class="rcmap_wrapper">\r
                <div class="head">\r
                    <span data-i18n="receiverChannelMap" data-i18n_title="receiverChannelMapTitle"></span>\r
                </div>\r
                <div class="hybrid_element">\r
                    <input type="text" name="rcmap" spellcheck="false" /> \r
                    <select class="hybrid_helper"\r
                        name="rcmap_helper">\r
                        <option value="AETR">Default</option>\r
                        <option value="AETR">Futaba / Hitec</option>\r
                        <option value="TAER">JR / Spektrum / Graupner</option>\r
                    </select>\r
                </div>\r
            </div>\r
        </div>\r
        <div class="fc_column half" style="margin-left: 20px;">\r
            \r
            <div class="gui_box grey config-section">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="configurationReceiver"></div>\r
                </div>\r
                <div class="spacer_box">\r
                    <div class="select">\r
                        <select id="receiver_type" data-setting="receiver_type"></select>\r
                        <label for="receiver_type">\r
                            <span data-i18n="receiverType"></span>\r
                        </label>\r
                    </div>\r
                    <div id="serialrx_provider-wrapper">\r
                        <div class="info-box ok-box" data-i18n="configurationSerialRXHelp"></div>\r
                        <div class="select">\r
                            <select id="serialrx_provider" data-setting="serialrx_provider"></select>\r
                            <label for="serialrx_provider">\r
                                <span data-i18n="configurationSerialRX"></span>\r
                            </label>\r
                        </div>\r
                        <div class="select">\r
                            <select id="serialrx_inverted" data-setting="serialrx_inverted"></select>\r
                            <label for="serialrx_inverted">\r
                                <span data-i18n="serialrx_inverted"></span>\r
                            </label>\r
                        </div><div class="select">\r
                            <select id="serialrx_halfduplex" data-setting="serialrx_halfduplex"></select>\r
                            <label for="serialrx_halfduplex">\r
                                <span data-i18n="serialrx_halfduplex"></span>\r
                            </label>\r
                        </div>\r
                    </div>\r
                </div>\r
            </div>\r
                \r
            <div class="gui_box grey config-section" id="frSkyOptions">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="configurationFrSkyOptions"></div><div for="osd_switch_indicator_settings" class="helpicon cf_tip" data-i18n_title="configurationFrSkyOptions_HELP"></div>\r
                </div>\r
                <div class="spacer_box">\r
                    <div class="checkbox">\r
                        <input type="checkbox" class="toggle update_preview" id="frSkyPitchRoll" data-setting="frsky_pitch_roll" data-live="true" />\r
                        <label for="frSkyPitchRoll"><span data-i18n="serialrx_frSkyPitchRollLabel"></span></label>\r
                        <div for="frSkyPitchRoll" class="helpicon cf_tip" data-i18n_title="serialrx_frSkyPitchRollHelp"></div>\r
                    </div>\r
                    <div class="select">\r
                        <select id="frSkyFuelUnit" data-setting="smartport_fuel_unit"></select>\r
                        <label for="frSkyFuelUnit">\r
                            <span data-i18n="serialrx_frSkyFuelUnitLabel"></span>\r
                        </label>\r
                        <div for="frSkyFuelUnit" class="helpicon cf_tip" data-i18n_title="serialrx_frSkyFuelUnitHelp"></div>\r
                    </div>\r
                </div>\r
            </div>\r
\r
            <div class="gui_box grey config-section config-section--full-width">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="rcSmoothing"></div>\r
                </div>\r
                <div class="spacer_box">                   \r
                    <div class="number">\r
                        <input id="rc_filter_smoothing_factor" data-setting="rc_filter_smoothing_factor" type="number" data-presentation="range" />\r
                        <label for="rc_filter_smoothing_factor">\r
                            <span data-i18n="rc_filter_smoothing_factor"></span>\r
                        </label>\r
                    </div>\r
                </div>\r
            </div>\r
\r
            <div class="gui_box grey">\r
                <div class="spacer" style="margin-top: 10px; margin-bottom: 10px;">\r
                    <div class="cf_column curves" style="width: calc(55% - 10px); min-width: 200px;">\r
                        <div class="throttle_curve">\r
                            <canvas width="200" height="117"></canvas>\r
                        </div>\r
                    </div>\r
                    <div class="fc_column half tunings">\r
                        <table class="throttle">\r
                            <tr>\r
                                <th data-i18n="receiverThrottleMid"></th>\r
                                <th data-i18n="receiverThrottleExpo"></th>\r
                            </tr>\r
                            <tr>\r
                                <td><input class="controlProfileHighlight" type="number" name="mid" step="0.01" min="0" max="1" /></td>\r
                                <td><input class="controlProfileHighlight" type="number" name="expo" step="0.01" min="0" max="1" /></td>\r
                            </tr>\r
                        </table>\r
                        <table class="deadband">\r
                            <tr>\r
                                <th data-i18n="receiverDeadband"></th>\r
                                <th data-i18n="receiverYawDeadband"></th>\r
                            </tr>\r
                            <tr>\r
                                <td>\r
                                    <div class="cf_tip" data-i18n_title="receiverHelpDeadband">\r
                                        <input type="number" name="deadband" step="1" min="0" max="32" />\r
                                    </div>\r
                                </td>\r
                                <td>\r
                                    <div class="cf_tip" data-i18n_title="receiverHelpYawDeadband">\r
                                        <input type="number" name="yaw_deadband" step="1" min="0" max="100" />\r
                                    </div>\r
                                </td>\r
                            </tr>\r
                        </table>\r
                    </div>\r
                </div>\r
            </div>\r
            \r
        </div>\r
    </div>\r
    <div class="content_toolbar">\r
        <div class="btn update_btn">\r
            <a class="update" href="#" data-i18n="configurationButtonSave"></a>\r
        </div>\r
        <div class="btn sticks_btn">\r
            <a class="sticks" href="#" data-i18n="receiverButtonSticks"></a>\r
        </div>\r
    </div>\r
</div>\r
`;export{r as default};
