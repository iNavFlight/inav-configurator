const t=`<div class="tab-setup">\r
    <div class="content_wrapper initialstyle">\r
        <!-- should be the first DIV on each tab -->\r
        <div class="cf_column full spacerbottom">\r
            <div class="tab_title" data-i18n="tabSetup">Setup</div>\r
            <div class="cf_column fourth buttonarea">\r
                <div class="spacer_right">\r
                    <div class="default_btn">\r
                        <a class="resetSettings" href="#" data-i18n="initialSetupButtonReset"></a>\r
                    </div>\r
                </div>\r
            </div>\r
            <div class="threefourth_right setupinfo">\r
                <div class="cell_setup">\r
                    <span data-i18n="initialSetupResetText"></span>\r
                </div>\r
            </div>\r
        </div>\r
        <div class="modelwrapper"></div>\r
        <div class="cf_column threefourth_left">\r
            <div class="spacer_right">\r
                <div class="model-and-info">\r
                    <div id="interactive_block">\r
                        <div id="canvas_wrapper">\r
                            <canvas id="canvas"></canvas>\r
                            <div class="attitude_info">\r
                                <dl>\r
                                    <dt>Heading:</dt>\r
                                    <dd class="heading">&nbsp;</dd>\r
                                    <dt>Pitch:</dt>\r
                                    <dd class="pitch">&nbsp;</dd>\r
                                    <dt>Roll:</dt>\r
                                    <dd class="roll">&nbsp;</dd>\r
                                </dl>\r
                            </div>\r
                        </div>\r
                        <a class="reset" href="#" data-i18n="initialSetupButtonResetZaxis"></a>\r
                    </div>\r
                </div>\r
            </div>\r
        </div>\r
        <div class="cf_column fourth">\r
            <div class="spacer_left">\r
\r
                <div class="gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="armingFailureReasonTitle"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <table width="100%" cellpadding="0" cellspacing="0" class="cf_table">\r
                            <tbody>\r
                                <tr>\r
                                    <td data-i18n="BLOCKED_UAV_NOT_LEVEL"></td><td id="reason-BLOCKED_UAV_NOT_LEVEL"></td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="BLOCKED_SENSORS_CALIBRATING"></td><td id="reason-BLOCKED_SENSORS_CALIBRATING"></td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="BLOCKED_SYSTEM_OVERLOADED"></td><td id="reason-BLOCKED_SYSTEM_OVERLOADED"></td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="BLOCKED_NAVIGATION_SAFETY"></td><td id="reason-BLOCKED_NAVIGATION_SAFETY"></td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="BLOCKED_COMPASS_NOT_CALIBRATED"></td><td id="reason-BLOCKED_COMPASS_NOT_CALIBRATED"></td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="BLOCKED_ACCELEROMETER_NOT_CALIBRATED"></td><td id="reason-BLOCKED_ACCELEROMETER_NOT_CALIBRATED"></td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="BLOCKED_INVALID_SETTING"></td><td id="reason-BLOCKED_INVALID_SETTING"></td>\r
                                </tr>\r
                                <tr class="noboarder">\r
                                    <td data-i18n="BLOCKED_HARDWARE_FAILURE"></td><td id="reason-BLOCKED_HARDWARE_FAILURE"></td>\r
                                </tr>\r
                            </tbody>\r
                        </table>\r
\r
                        <ul id="armingFailuresList">\r
\r
                        </ul>\r
                    </div>\r
                </div>\r
\r
                <div class="gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="initialSetupInfoHead"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" class="cf_table">\r
                            <tbody>\r
                                <tr>\r
                                    <td data-i18n="initialSetupBatteryDetectedCells"></td>\r
                                    <td class="bat-cells">0</td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="initialSetupBatteryVoltage"></td>\r
                                    <td class="bat-voltage">0 V</td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="initialSetupBatteryPercentage"></td>\r
                                    <td class="bat-percent">0 %</td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="initialSetupBatteryRemainingCapacity"></td>\r
                                    <td class="bat-remain-cap">NA</td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="initialSetupBatteryFull"></td>\r
                                    <td class="bat-full">0</td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="initialSetupBatteryThresholds"></td>\r
                                    <td class="bat-thresh">0</td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="initialSetupCurrentDraw"></td>\r
                                    <td class="bat-current-draw">0.00 A</td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="initialSetupPowerDraw"></td>\r
                                    <td class="bat-power-draw">0.00 W</td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="initialSetupDrawn"></td>\r
                                    <td class="bat-mah-drawn">0 mAh</td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="initialSetup_Wh_drawn"></td>\r
                                    <td class="bat-mwh-drawn">0 Wh</td>\r
                                </tr>\r
                                <tr class="noboarder">\r
                                    <td data-i18n="initialSetupRSSI"></td>\r
                                    <td class="rssi">0 %</td>\r
                                </tr>\r
                            </tbody>\r
                        </table>\r
                    </div>\r
                </div>\r
            </div>\r
            <div class="spacer_left">\r
                <div class="gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="initialSetupGPSHead"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <table width="100%" cellpadding="0" cellspacing="0" class="cf_table">\r
                            <tbody>\r
                                <tr>\r
                                    <td data-i18n="gpsFix"></td>\r
                                    <td class="gpsFixType"></td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="gpsSats"></td>\r
                                    <td class="gpsSats"></td>\r
                                </tr>\r
                                <tr>\r
                                    <td data-i18n="gpsLat"></td>\r
                                    <td class="gpsLat"></td>\r
                                </tr>\r
                                <tr class="noboarder">\r
                                    <td data-i18n="gpsLon"></td>\r
                                    <td class="gpsLon"></td>\r
                                </tr>\r
                            </tbody>\r
                        </table>\r
                    </div>\r
                </div>\r
            </div>\r
            <div class="spacer_left">\r
                <div class="gui_box grey instrumentsbox">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="initialSetupInstrumentsHead"></div>\r
                    </div>\r
                    <span id="attitude"></span> <span id="heading"></span>\r
                </div>\r
            </div>\r
        </div>\r
    </div>\r
</div>\r
`;export{t as default};
