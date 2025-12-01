const r=`<div class="tab-motors toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <div class="tab_title" data-i18n="tabOutputs"></div>\r
\r
        <div class="gui_box grey config-section">\r
            <div class="gui_box_titlebar">\r
                <div class="spacer_box_title" data-i18n="ouptputsConfiguration"></div>\r
            </div>\r
            <div class="spacer">\r
                <div class="checkbox">\r
                    <input type="checkbox" data-bit="28" class="feature toggle" name="PWM_OUTPUT_ENABLE" title="PWM_OUTPUT_ENABLE" id="feature-28">\r
                    <label for="feature-28">\r
                        <span data-i18n="featurePWM_OUTPUT_ENABLE"></span>\r
                    </label>\r
                    <div for="feature-28" class="helpicon cf_tip" data-i18n_title="featurePWM_OUTPUT_ENABLETip"></div>\r
                </div>\r
                <!--list of generated features goes here-->\r
                <div id="esc-protocols">\r
                    <div class="select">\r
                        <select name="esc-protocol" id="esc-protocol" data-setting-placeholder="motor_pwm_protocol"></select>\r
                        <label for="esc-protocol">\r
                            <span data-i18n="escProtocol"></span>\r
                        </label>\r
                        <div for="esc-protocol" class="helpicon cf_tip" data-i18n_title="escProtocolHelp"></div>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
\r
                <div id="servo-rate-container">\r
                    <div class="select">\r
                        <select name="servo-rate" id="servo-rate" data-setting-placeholder="servo_pwm_rate"></select>\r
                        <label for="servo-rate">\r
                            <span data-i18n="servoRefreshRate"></span>\r
                        </label>\r
                        <div for="servo-rate" class="helpicon cf_tip" data-i18n_title="servoRefreshRatelHelp"></div>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
\r
                <div id="motor-stop-warning" data-i18n="motorStopWarning" class="warning-box"></div>\r
                <div class="checkbox">\r
                    <input id="feature-4" type="checkbox" class="toggle" data-setting="motorstop_on_low" />\r
                    <label for="feature-4">\r
                        <span data-i18n="featureMOTOR_STOP"></span>\r
                    </label>\r
                </div>\r
\r
                <div id="throttle_idle-info" class="info-box"></div>\r
                <div class="number">\r
                    <input id="throttle_idle" data-setting="throttle_idle" type="number" data-step="1.0" />\r
                    <label for="throttle_idle">\r
                        <span data-i18n="throttleIdle"></span>\r
                    </label>\r
                </div>\r
\r
                <div class="number">\r
                    <input id="throttle_scale" data-setting="throttle_scale" type="number" data-step="0.01" />\r
                    <label for="throttle_scale">\r
                        <span data-i18n="throttle_scale"></span>\r
                    </label>\r
                    <div for="throttle_scale" class="helpicon cf_tip" data-i18n_title="throttle_scale_help"></div>\r
                </div>\r
\r
                <div class="number">\r
                    <input id="motor_poles" data-setting="motor_poles" type="number" />\r
                    <label for="motor_poles">\r
                        <span data-i18n="motor_poles"></span>\r
                    </label>\r
                </div>\r
                <div data-i18n="reversibleEscWarning" class="info-box for-reversible-motors"></div>\r
                <div class="checkbox">\r
                    <input type="checkbox" data-bit="12" class="feature toggle" name="REVERSIBLE_MOTORS" title="REVERSIBLE_MOTORS" id="feature-12">\r
                    <label for="feature-12">\r
                        <span data-i18n="featureREVERSIBLE_MOTORS"></span>\r
                    </label>\r
                </div>\r
                <div class="for-reversible-motors">\r
                    <div class="number">\r
                        <input type="number" id="3ddeadbandlow" name="3ddeadbandlow" step="1" min="1425" max="1500" />\r
                        <label for="3ddeadbandlow">\r
                            <span data-i18n="configuration3dDeadbandLow"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" id="3ddeadbandhigh" name="3ddeadbandhigh" step="1" min="1500" max="1575" />\r
                        <label for="3ddeadbandhigh">\r
                            <span data-i18n="configuration3dDeadbandHigh"></span>\r
                        </label>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" id="3dneutral" name="3dneutral" step="1" min="1475" max="1525" />\r
                        <label for="3dneutral">\r
                            <span data-i18n="configuration3dNeutral"></span>\r
                        </label>\r
                    </div>\r
                </div>\r
\r
            </div>\r
        </div>\r
        <div class="gui_box grey">\r
            <div class="gui_box_titlebar">\r
                <div class="spacer_box_title" data-i18n="motors"></div>\r
            </div>\r
            <div class="spacer">\r
                <div class="left motors">\r
                    <ul class="titles motor-titles">\r
                    </ul>\r
                    <div class="bar-wrapper"></div>\r
                    <div class="clear-both"></div>\r
                    <div class="motor_testing">\r
                        <div class="sliders motor-sliders"></div>\r
                        <div class="values">\r
                            <ul class="motor-values"></ul>\r
                        </div>\r
                    </div>\r
                </div>\r
                <div class="motors right">\r
                    <div class="half">\r
                        <div class="mixerPreview">\r
                            <img src="./resources/motor_order/custom.svg" id="motor-mixer-preview-img" />\r
                                <div class="motorNumber" id="motorNumber1">1</div>\r
                                <div class="motorNumber" id="motorNumber2">2</div>\r
                                <div class="motorNumber" id="motorNumber3">3</div>\r
                                <div class="motorNumber" id="motorNumber4">4</div>\r
                        </div>\r
                    </div>\r
                    <div class="half">\r
                        <table class="output-stats-table">\r
                            <tr>\r
                                <th i18n="outputStatsTableAcc"></th>\r
                                <td class="acc-rms"></td>\r
                            </tr>\r
                            <tr>\r
                                <th i18n="outputStatsTableCurrent"></th>\r
                                <td class="current-current"></td>\r
                            </tr>\r
                            <tr>\r
                                <th i18n="outputStatsTableVoltage"></th>\r
                                <td class="current-voltage"></td>\r
                            </tr>\r
                        </table>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                    <div class="motor_testing_notice">\r
                        <p i18n="motorsNotice"></p>\r
                        <label><input id="motorsEnableTestMode" type="checkbox" class="togglesmall"/><span\r
                            class="motorsEnableTestMode" i18n="motorsEnableControl"></span></label>\r
                    </div>\r
                </div>\r
                <div class="clear-both"></div>\r
\r
            </div>\r
        </div>\r
        <div class="gui_box grey">\r
            <div class="gui_box_titlebar">\r
                <div class="spacer_box_title" data-i18n="servos"></div>\r
            </div>\r
            <div class="spacer" style="padding-left: 0">\r
                <div class="servos">\r
                    <ul class="titles">\r
                        <li title="Servo - 8">15</li>\r
                        <li title="Servo - 7">14</li>\r
                        <li title="Servo - 6">13</li>\r
                        <li title="Servo - 5">12</li>\r
                        <li title="Servo - 4">11</li>\r
                        <li title="Servo - 3">10</li>\r
                        <li title="Servo - 2">9</li>\r
                        <li title="Servo - 1">8</li>\r
                        <li title="Servo - 8">7</li>\r
                        <li title="Servo - 7">6</li>\r
                        <li title="Servo - 6">5</li>\r
                        <li title="Servo - 5">4</li>\r
                        <li title="Servo - 4">3</li>\r
                        <li title="Servo - 3">2</li>\r
                        <li title="Servo - 2">1</li>\r
                        <li title="Servo - 1">0</li>\r
                    </ul>\r
                    <div class="bar-wrapper"></div>\r
                </div>\r
            </div>\r
            <div class="tab-servos" id="servo-config-table-container">\r
                <table id="servo-config-table" class="fields">\r
                    <tr class="main">\r
                        <th width="110px" data-i18n="servosName"></th>\r
                        <th data-i18n="servosMid"></th>\r
                        <th data-i18n="servosMin"></th>\r
                        <th data-i18n="servosMax"></th>\r
                        <th data-i18n="servosRate"></th>\r
                        <th data-i18n="servosReverse"></th>\r
                        <th data-i18n="servoOutput"></th>\r
                    </tr>\r
                </table>\r
                <div class="live">\r
                    <input type="checkbox" class="togglemedium" /> <span data-i18n="servosLiveMode"></span>\r
                </div>\r
            </div>\r
        </div>\r
    </div>\r
    <div class="content_toolbar">\r
        <div class="btn save_btn">\r
            <a class="update" href="#" data-i18n="servosButtonSave"></a>\r
            <a class="save" href="#" data-i18n="configurationButtonSave"></a>\r
        </div>\r
    </div>\r
</div>\r
`;export{r as default};
