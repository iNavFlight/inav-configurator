const n=`<!--suppress ALL -->\r
<div id="content-watermark"></div>\r
<div class="tab-pid_tuning toolbar_fixed_bottom">\r
    <div id="tuning-wrapper" class="content_wrapper">\r
        <div class="tab_title subtab__header">\r
            <span class="subtab__header_label subtab__header_label--current" for="subtab-pid" data-i18n="pidTuning_PIDmain"></span>\r
            <span class="subtab__header_label" for="subtab-pid-other" data-i18n="pidTuning_PIDother"></span>\r
            <span class="subtab__header_label" for="subtab-rates" data-i18n="pidTuning_RatesAndExpo"></span>\r
            <span class="subtab__header_label" for="subtab-filters" data-i18n="pidTuning_Filters"></span>\r
            <span class="subtab__header_label" for="subtab-mechanics" data-i18n="pidTuning_Mechanics"></span>\r
        </div>\r
        <div id="subtab-pid" class="subtab__content subtab__content--current">\r
            <div class="cf_column right" style="margin-top: -6px;">\r
                <div class="default_btn resetbt">\r
                    <a href="#" class="action-resetDefaults" data-i18n="pidTuning_SelectNewDefaults"></a>\r
                </div>\r
                <div class="default_btn resetbt">\r
                    <a href="#" class="action-resetPIDs" data-i18n="pidTuning_ResetPIDController"></a>\r
                </div>\r
            </div>\r
            <div class="clear-both"></div>\r
\r
            <div id="" class="cf_column">\r
                <div class="pid-sliders-axis" style="background-color: #2a9d8f;">\r
                    <div style="padding: 1em;" data-i18n="ezTuneEnabledTips"></div>\r
                    <div class="pid-switch-row">\r
                        <span data-i18n="configurationFeatureEnabled" class="bold label"></span>\r
                        <div class="checkbox no-border">\r
                            <input id="ez_tune_enabled" type="checkbox" class="ez-element toggle" />\r
                        </div>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
\r
            </div>\r
\r
            <div class="for-ez-tune">\r
                <div style="display: flex;">\r
\r
                    <div>\r
                        <div class="pid-sliders-axis" data-axis="roll">\r
                            <div style="padding: 1em;" data-i18n="ezTuneFilterHzTips"></div>\r
                            <div class="pid-slider-row">\r
                                <span data-i18n="ezTuneFilterHz" class="bold"></span>\r
                                <div class="number no-border">\r
                                    <input id="ez_tune_filter_hz" type="number" class="ez-element" />\r
                                </div>\r
                            </div>\r
                            <div class="clear-both"></div>\r
                        </div>\r
        \r
                        <div class="pid-sliders-axis" data-axis="pitch">\r
                            <div style="padding: 1em;" data-i18n="ezTuneAxisRatioTips"></div>\r
                            <div class="pid-slider-row">\r
        \r
                                <span data-i18n="ezTuneAxisRatio" class="bold"></span>\r
                                <div class="number no-border">\r
                                    <input id="ez_tune_axis_ratio" type="number" class="ez-element" />\r
                                </div>\r
                                <div class="clear-both"></div>\r
                            </div>\r
        \r
                            <div style="padding: 1em;" data-i18n="ezTuneResponseTips"></div>\r
                            <div class="pid-slider-row">\r
                                <span data-i18n="ezTuneResponse" class="bold"></span>\r
                                <div class="number no-border">\r
                                    <input id="ez_tune_response" type="number" class="ez-element" />\r
                                </div>\r
                                <div class="clear-both"></div>\r
                            </div>\r
        \r
                            <div style="padding: 1em;" data-i18n="ezTuneDampingTips"></div>\r
                            <div class="pid-slider-row">\r
                                <span data-i18n="ezTuneDamping" class="bold"></span>\r
                                <div class="number no-border">\r
                                    <input id="ez_tune_damping" type="number" class="ez-element" />\r
                                </div>\r
                                <div class="clear-both"></div>\r
                            </div>\r
        \r
                            <div style="padding: 1em;" data-i18n="ezTuneStabilityTips"></div>\r
                            <div class="pid-slider-row">\r
                                <span data-i18n="ezTuneStability" class="bold"></span>\r
                                <div class="number no-border">\r
                                    <input id="ez_tune_stability" type="number" class="ez-element" />\r
                                </div>\r
                                <div class="clear-both"></div>\r
                            </div>\r
        \r
                            <div style="padding: 1em;" data-i18n="ezTuneAggressivenessTips"></div>\r
                            <div class="pid-slider-row">\r
                                <span data-i18n="ezTuneAggressiveness" class="bold"></span>\r
                                <div class="number no-border">\r
                                    <input id="ez_tune_aggressiveness" type="number" class="ez-element" />\r
                                </div>\r
                                <div class="clear-both"></div>\r
                            </div>\r
        \r
                        </div>\r
        \r
                        <div class="pid-sliders-axis" data-axis="yaw">\r
                            <div style="padding: 1em;" data-i18n="ezTuneRateTips"></div>\r
                            <div class="pid-slider-row">\r
                                <span data-i18n="ezTuneRate" class="bold"></span>\r
                                <div class="number no-border">\r
                                    <input id="ez_tune_rate" type="number" class="ez-element" />\r
                                </div>\r
                                <div class="clear-both"></div>\r
                            </div>\r
        \r
                            <div style="padding: 1em;" data-i18n="ezTuneExpoTips"></div>\r
                            <div class="pid-slider-row">\r
                                <span data-i18n="ezTuneExpo" class="bold"></span>\r
                                <div class="number no-border">\r
                                    <input id="ez_tune_expo" type="number" class="ez-element" />\r
                                </div>\r
                                <div class="clear-both"></div>\r
                            </div>\r
                        </div>\r
        \r
                        <div class="pid-sliders-axis" data-axis="3">\r
                            <div style="padding: 1em;" data-i18n="ezTuneSnappinessTips"></div>\r
                            <div class="pid-slider-row">\r
                                <span data-i18n="ezTuneSnappiness" class="bold"></span>\r
                                <div class="number no-border">\r
                                    <input id="ez_tune_snappiness" type="number" class="ez-element" />\r
                                </div>\r
                                <div class="clear-both"></div>\r
                            </div>\r
                        </div>\r
                    </div>\r
        \r
                    <div class="ez-tune-preview">\r
                        <h2 data-i18n="ezTunePidPreview"></h2>\r
                        <table>\r
                            <tr>\r
                                <th>&nbsp;</th>\r
                                <th>P</th>\r
                                <th>I</th>\r
                                <th>D</th>\r
                                <th>FF</th>\r
                            </tr>\r
                            <tr>\r
                                <th data-i18n="axisRoll"></th>\r
                                <td id="preview-roll-p"></td>\r
                                <td id="preview-roll-i"></td>\r
                                <td id="preview-roll-d"></td>\r
                                <td id="preview-roll-ff"></td>\r
                            </tr>\r
                            <tr>\r
                                <th data-i18n="axisPitch"></th>\r
                                <td id="preview-pitch-p"></td>\r
                                <td id="preview-pitch-i"></td>\r
                                <td id="preview-pitch-d"></td>\r
                                <td id="preview-pitch-ff"></td>\r
                            </tr>\r
                            <tr>\r
                                <th data-i18n="axisYaw"></th>\r
                                <td id="preview-yaw-p"></td>\r
                                <td id="preview-yaw-i"></td>\r
                                <td id="preview-yaw-d"></td>\r
                                <td id="preview-yaw-ff"></td>\r
                            </tr>\r
                        </table>\r
                        <h2 data-i18n="ezTuneRatePreview"></h2>\r
                        <table>\r
                            <tr>\r
                                <th data-i18n="ezTuneRatePreviewAxis"></th>\r
                                <th data-i18n="ezTuneRatePreviewRate"></th>\r
                                <th data-i18n="ezTuneRatePreviewExpo"></th>\r
                            </tr>\r
                            <tr>\r
                                <th data-i18n="axisRoll"></th>\r
                                <td id="preview-roll-rate"></td>\r
                                <td id="preview-roll-expo"></td>\r
                            </tr>\r
                            <tr>\r
                                <th data-i18n="axisPitch"></th>\r
                                <td id="preview-pitch-rate"></td>\r
                                <td id="preview-pitch-expo"></td>\r
                            </tr>\r
                            <tr>\r
                                <th data-i18n="axisYaw"></th>\r
                                <td id="preview-yaw-rate"></td>\r
                                <td id="preview-yaw-expo"></td>\r
                            </tr>\r
                        </table>\r
                        <div style="margin-top: 1em;">\r
                            <div id="ez_tune_expo_curve" class="expo-chart" style="width: 250px; height: 200px; margin: auto;">\r
                                <canvas width="250" height="200"></canvas>\r
                            </div>\r
                        </div>\r
                    </div>\r
        \r
                </div>\r
            </div>\r
\r
            <div class="cf_column not-for-ez-tune" id="pid-sliders">\r
                <div class="pid-sliders-axis" data-axis="roll">\r
                    <h3 data-i18n="axisRoll"></h3>\r
                    <div class="pid-slider-row">\r
                        <span data-i18n="pidTuning_Proportional"></span>\r
                        <input type="number" name="value-input" value="42" min="0" max="255" step="1" class="controlProfileHighlightActive">\r
                        <input type="range" name="value-slider" value="42" min="0" max="1000" step="1" data-normal-max="110">\r
                    </div>\r
\r
                    <div class="pid-slider-row">\r
                        <span data-i18n="pidTuning_Integral"></span>\r
                        <input type="number" name="value-input" value="42" min="0" max="255" step="1" class="controlProfileHighlightActive">\r
                        <input type="range" name="value-slider" value="42" min="0" max="1000" step="1" data-normal-max="110">\r
                    </div>\r
\r
                    <div class="pid-slider-row">\r
                        <span data-i18n="pidTuning_Derivative"></span>\r
                        <input type="number" name="value-input" value="42" min="0" max="255" step="1" class="controlProfileHighlightActive">\r
                        <input type="range" name="value-slider" value="42" min="0" max="1000" step="1"  data-normal-max="60">\r
                    </div>\r
\r
                    <div class="pid-slider-row">\r
                        <span data-i18n="pidTuning_FeedForward"></span>\r
                        <input type="number" name="value-input" value="42" min="0" max="255" step="1" class="controlProfileHighlightActive">\r
                        <input type="range" name="value-slider" value="42" min="0" max="1000" step="1"  data-normal-max="150">\r
                    </div>\r
\r
                </div>\r
\r
                <div class="pid-sliders-axis" data-axis="pitch">\r
                    <h3 data-i18n="axisPitch"></h3>\r
                    <div class="pid-slider-row">\r
                        <span data-i18n="pidTuning_Proportional"></span>\r
                        <input type="number" name="value-input" value="42" min="0" max="255" step="1" class="controlProfileHighlightActive">\r
                        <input type="range" name="value-slider" value="42" min="0" max="1000" step="1" data-normal-max="110">\r
                    </div>\r
\r
                    <div class="pid-slider-row">\r
                        <span data-i18n="pidTuning_Integral"></span>\r
                        <input type="number" name="value-input" value="42" min="0" max="255" step="1" class="controlProfileHighlightActive">\r
                        <input type="range" name="value-slider" value="42" min="0" max="1000" step="1" data-normal-max="110">\r
                    </div>\r
\r
                    <div class="pid-slider-row">\r
                        <span data-i18n="pidTuning_Derivative"></span>\r
                        <input type="number" name="value-input" value="42" min="0" max="255" step="1" class="controlProfileHighlightActive">\r
                        <input type="range" name="value-slider" value="42" min="0" max="1000" step="1" data-normal-max="60">\r
                    </div>\r
\r
                    <div class="pid-slider-row">\r
                        <span data-i18n="pidTuning_FeedForward"></span>\r
                        <input type="number" name="value-input" value="42" min="0" max="255" step="1" class="controlProfileHighlightActive">\r
                        <input type="range" name="value-slider" value="42" min="0" max="1000" step="1" data-normal-max="150">\r
                    </div>\r
\r
                </div>\r
\r
                <div class="pid-sliders-axis" data-axis="yaw">\r
                    <h3 data-i18n="axisYaw"></h3>\r
                    <div class="pid-slider-row">\r
                        <span data-i18n="pidTuning_Proportional"></span>\r
                        <input type="number" name="value-input" value="42" min="0" max="255" step="1" class="controlProfileHighlightActive">\r
                        <input type="range" name="value-slider" value="42" min="0" max="1000" step="1" data-normal-max="110">\r
                    </div>\r
\r
                    <div class="pid-slider-row">\r
                        <span data-i18n="pidTuning_Integral"></span>\r
                        <input type="number" name="value-input" value="42" min="0" max="255" step="1" class="controlProfileHighlightActive">\r
                        <input type="range" name="value-slider" value="42" min="0" max="1000" step="1" data-normal-max="110">\r
                    </div>\r
\r
                    <div class="pid-slider-row">\r
                        <span data-i18n="pidTuning_Derivative"></span>\r
                        <input type="number" name="value-input" value="42" min="0" max="255" step="1" class="controlProfileHighlightActive">\r
                        <input type="range" name="value-slider" value="42" min="0" max="1000" step="1" data-normal-max="60">\r
                    </div>\r
\r
                    <div class="pid-slider-row">\r
                        <span data-i18n="pidTuning_FeedForward"></span>\r
                        <input type="number" name="value-input" value="42" min="0" max="255" step="1" class="controlProfileHighlightActive">\r
                        <input type="range" name="value-slider" value="42" min="0" max="1000" step="1" data-normal-max="150">\r
                    </div>\r
\r
                </div>\r
            </div>\r
        </div>\r
\r
        <div id="subtab-pid-other" class="subtab__content">\r
            <div class="cf_column right" style="margin-top: -6px;">\r
                <div class="default_btn resetbt">\r
                    <a href="#" id="resetDefaults" class="action-resetDefaults" data-i18n="pidTuning_SelectNewDefaults"></a>\r
                </div>\r
                <div class="default_btn resetbt">\r
                    <a href="#" class="action-resetPIDs" data-i18n="pidTuning_ResetPIDController"></a>\r
                </div>\r
            </div>\r
            <div class="clear-both"></div>\r
\r
            <div class="cf_column pid-section" id="the-other-pids">\r
                <div class="gui_box grey">\r
                    <table class="pid_titlebar">\r
                        <tr>\r
                            <th class="name" data-i18n="pidTuning_Name"></th>\r
                            <th class="proportional" data-i18n="pidTuning_Proportional"></th>\r
                            <th class="integral" data-i18n="pidTuning_Integral"></th>\r
                            <th class="derivative" data-i18n="pidTuning_Derivative"></th>\r
                            <th class="feedforward" data-i18n="pidTuning_FeedForward"></th>\r
                        </tr>\r
                    </table>\r
                    <table id="pid_main" class="pid_tuning">\r
                        <tr class="is-hidden">\r
                            <th colspan="5">\r
                                <div class="pid_mode" data-i18n="pidTuning_Basic"></div>\r
                            </th>\r
                        </tr>\r
                        <tr class="is-hidden" class="ROLL" data-pid-bank-position="0">\r
                            <!-- 0 -->\r
                            <td></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="p" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="i" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" class="rpy_d" name="d" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" class="rpy_ff" name="ff" step="1" min="0" max="255" /></td>\r
                        </tr>\r
                        <tr class="is-hidden" class="PITCH" data-pid-bank-position="1">\r
                            <!-- 1 -->\r
                            <td></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="p" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="i" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" class="rpy_d" name="d" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" class="rpy_ff" name="ff" step="1" min="0" max="255" /></td>\r
                        </tr>\r
                        <tr class="is-hidden" class="YAW" data-pid-bank-position="2">\r
                            <!-- 2 -->\r
                            <td></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="p" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="i" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" class="rpy_d" name="d" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" class="rpy_ff" name="ff" step="1" min="0" max="255" /></td>\r
                        </tr>\r
                    </table>\r
                    <table id="pid_baro" class="pid_tuning">\r
                        <tr>\r
                            <th colspan="5">\r
                                <div class="pid_mode" data-i18n="pidTuning_Altitude"></div>\r
                            </th>\r
                        </tr>\r
                        <tr class="ALT" data-pid-bank-position="3">\r
                            <!-- 3 -->\r
                            <td></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="p" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="i" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="d" step="1" min="0" max="255" /></td>\r
                            <td></td>\r
                        </tr>\r
                        <tr class="Vario" data-pid-bank-position="9">\r
                            <!-- 9 -->\r
                            <td>VEL</td>\r
                            <td><input class="controlProfileHighlight" type="number" name="p" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="i" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="d" step="1" min="0" max="255" /></td>\r
                            <td></td>\r
                        </tr>\r
                    </table>\r
                    <table id="pid_mag" class="pid_tuning">\r
                        <tr>\r
                            <th colspan="5">\r
                                <div class="pid_mode" data-i18n="pidTuning_Mag"></div>\r
                            </th>\r
                        </tr>\r
                        <tr class="MAG" data-pid-bank-position="8">\r
                            <!-- 8 -->\r
                            <td></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="p" step="1" min="0" max="255" /></td>\r
                            <td></td>\r
                            <td></td>\r
                            <td></td>\r
                        </tr>\r
                        <tr class="HEADING" data-pid-bank-position="10">\r
                            <!-- 8 -->\r
                            <td></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="p" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="i" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="d" step="1" min="0" max="255" /></td>\r
                            <td></td>\r
                        </tr>\r
                    </table>\r
                    <table id="pid_gps" class="pid_tuning">\r
                        <tr>\r
                            <th colspan="5">\r
                                <div class="pid_mode" data-i18n="pidTuning_GPS"></div>\r
                            </th>\r
                        </tr>\r
                        <tr class="Pos" data-pid-bank-position="4">\r
                            <!-- 4 -->\r
                            <td></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="p" step="1" min="0" max="255" /></td>\r
                            <td></td>\r
                            <td></td>\r
                            <td></td>\r
                        </tr>\r
                        <tr class="PosR" data-pid-bank-position="5">\r
                            <!-- 5 -->\r
                            <td></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="p" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="i" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="d" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="ff" step="1" min="0" max="255" /></td>\r
                        </tr>\r
                        <tr class="NavR" data-pid-bank-position="6">\r
                            <!-- 6 -->\r
                            <td></td>\r
                            <td><input type="number" name="p" step="1" min="0" max="255" /></td>\r
                            <td><input type="number" name="i" step="1" min="0" max="255" /></td>\r
                            <td><input type="number" name="d" step="1" min="0" max="255" /></td>\r
                            <td></td>\r
                        </tr>\r
                    </table>\r
                </div>\r
                <div class="gui_box grey topspacer">\r
                    <table id="pid_accel" class="pid_tuning">\r
                        <tr>\r
                            <th colspan="4">\r
                                <div class="pid_mode borderleft">\r
                                    <div class="textleft">\r
                                        <div class="pidTuningLevel" data-i18n="pidTuning_Level"></div>\r
                                        <div class="helpicon cf_tip" data-i18n_title="pidTuning_LevelHelp"></div>\r
                                    </div>\r
                                    <div class="pids" data-i18n="pidTuning_LevelP"></div>\r
                                    <div class="pids" data-i18n="pidTuning_LevelI"></div>\r
                                    <div class="pids" data-i18n="pidTuning_LevelD"></div>\r
                                </div>\r
                            </th>\r
                        </tr>\r
                        <tr class="LEVEL" data-pid-bank-position="7">\r
                            <!-- 7 -->\r
                            <td></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="p" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="i" step="1" min="0" max="255" /></td>\r
                            <td><input class="controlProfileHighlight" type="number" name="d" step="1" min="0" max="255" /></td>\r
                        </tr>\r
                    </table>\r
                </div>\r
            </div>\r
        </div>\r
\r
        <div id="subtab-rates" class="subtab__content">\r
\r
            <div class="clear-both"></div>\r
            <div class="tab_subtitle" style="margin-top: 1em;" data-i18n="pidTuning_RatesAndExpo"></div>\r
\r
            <div class="pid-sliders-axis not-for-ez-tune" data-axis="roll">\r
                <h3 data-i18n="pidTuning_Rates_Stabilized"></h3>\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_Rates_Roll"></span>\r
                    <div class="number no-border">\r
                        <input id="rate_roll_rate" class="controlProfileHighlightActive" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_Rates_Pitch"></span>\r
                    <div class="number no-border">\r
                        <input id="rate_pitch_rate" class="controlProfileHighlightActive" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_Rates_Yaw"></span>\r
                    <div class="number no-border">\r
                        <input id="rate_yaw_rate" class="controlProfileHighlightActive" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
            </div>\r
\r
            <div class="pid-sliders-axis not-for-ez-tune" data-axis="pitch">\r
                <div style="float: right">\r
                    <div class="pitch_roll_curve expo-chart">\r
                        <canvas width="200" height="117"></canvas>\r
                    </div>\r
                </div>\r
                <h3 data-i18n="pidTuning_Expo_Stabilized"></h3>\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_Expo_RollPitch"></span>\r
                    <div class="number no-border">\r
                        <input id="rate_rollpitch_expo" class="controlProfileHighlightActive" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_Expo_Yaw"></span>\r
                    <div class="number no-border">\r
                        <input id="rate_yaw_expo" class="controlProfileHighlightActive" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
            </div>\r
\r
            <div class="pid-sliders-axis not-for-multirotor" data-axis="yaw">\r
                <h3 data-i18n="pidTuning_Manual_Rates"></h3>\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_Manual_Roll"></span>\r
                    <div class="number no-border">\r
                        <input id="rate_manual_roll" class="controlProfileHighlightActive" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_Manual_Pitch"></span>\r
                    <div class="number no-border">\r
                        <input id="rate_manual_pitch" class="controlProfileHighlightActive" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_Manual_Yaw"></span>\r
                    <div class="number no-border">\r
                        <input id="rate_manual_yaw" class="controlProfileHighlightActive" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
                \r
            </div>\r
\r
            <div class="pid-sliders-axis not-for-multirotor" data-axis="3">\r
                <div style="float: right">\r
                    <div class="manual_expo_curve expo-chart">\r
                        <canvas width="200" height="117"></canvas>\r
                    </div>\r
                </div>\r
                <h3 data-i18n="pidTuning_Expo_Manual"></h3>\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_Expo_RollPitch"></span>\r
                    <div class="number no-border">\r
                        <input id="manual_rollpitch_expo" class="controlProfileHighlightActive" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_Expo_Yaw"></span>\r
                    <div class="number no-border">\r
                        <input id="manual_yaw_expo" class="controlProfileHighlightActive" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
            </div>\r
\r
            <div class="pid-sliders-axis only-for-multirotor" data-axis="3">\r
                <h3 data-i18n="pidTuning_Other"></h3>\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_HeadingHold_Rate"></span>\r
                    <div class="number no-border">\r
                        <input id="heading_hold_rate_limit" class="controlProfileHighlightActive rate-tpa_input" data-setting="heading_hold_rate_limit" type="number" data-presentation="range" />\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>       \r
            </div>\r
\r
            <div class="tab_subtitle" style="margin-top: 1em;" data-i18n="pidTuning_Limits"></div>\r
\r
            <div class="pid-sliders-axis" data-axis="roll">\r
                <h3 data-i18n="pidTuning_Max_Inclination_Angle"></h3>\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_Max_Roll"></span>\r
                    <div class="number no-border">\r
                        <input id="max_angle_inclination_rll" class="controlProfileHighlightActive rate-tpa_input" data-setting="max_angle_inclination_rll" type="number" data-presentation="range" />\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>   \r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_Max_Pitch"></span>\r
                    <div class="number no-border">\r
                        <input id="max_angle_inclination_pit" class="controlProfileHighlightActive rate-tpa_input" data-setting="max_angle_inclination_pit" type="number" data-presentation="range" />\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>       \r
            </div>\r
\r
            <div class="clear-both"></div>\r
            <div class="tab_subtitle" style="margin-top: 1em;" data-i18n="pidTuning_RateDynamics"></div>\r
            <div class="clear-both"></div>\r
            <div class="cf_doc_version_bt"><a href="https://github.com/iNavFlight/inav/wiki/Rate-Dynamics" target="_blank" style="margin-top: -35px;">Rate Dynamics Documentation</a></div>\r
\r
            <div class="pid-sliders-axis" data-axis="roll">\r
                <h3 data-i18n="pidTuning_RateDynamics_Sensitivity"></h3>\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_RateDynamics_Center"></span>\r
                    <div class="number no-border">\r
                        <input id="rate_dynamics_center_sensitivity" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_RateDynamics_End"></span>\r
                    <div class="number no-border">\r
                        <input id="rate_dynamics_end_sensitivity" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
\r
            </div>\r
\r
            <div class="pid-sliders-axis" data-axis="pitch">\r
                <h3 data-i18n="pidTuning_RateDynamics_Correction"></h3>\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_RateDynamics_Center"></span>\r
                    <div class="number no-border">\r
                        <input id="rate_dynamics_center_correction" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_RateDynamics_End"></span>\r
                    <div class="number no-border">\r
                        <input id="rate_dynamics_end_correction" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
\r
            </div>\r
\r
            <div class="pid-sliders-axis" data-axis="yaw">\r
                <h3 data-i18n="pidTuning_RateDynamics_Weight"></h3>\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_RateDynamics_Center"></span>\r
                    <div class="number no-border">\r
                        <input id="rate_dynamics_center_weight" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
\r
                <div class="pid-slider-row">\r
                    <span data-i18n="pidTuning_RateDynamics_End"></span>\r
                    <div class="number no-border">\r
                        <input id="rate_dynamics_end_weight" type="number"/>\r
                    </div>\r
                    <div class="clear-both"></div>\r
                </div>\r
\r
            </div>\r
\r
        </div>\r
\r
        <div id="subtab-filters" class="subtab__content">\r
            <div class="tab_subtitle not-for-ez-tune" data-i18n="pidTuning_mainFilters" style="margin-top: 1em;"></div>\r
            <div class="clear-both not-for-ez-tune"></div>\r
            <div class="cf_column not-for-ez-tune">\r
                <table class="settings-table settings-table--filtering not-for-ez-tune">\r
                    <tbody>\r
                        <tr class="for_static_gyro_lpf">\r
                            <th data-i18n="pidTuning_gyro_main_lpf_hz"></th>\r
                            <td>\r
                                <div class="pidTuning_number">\r
                                    <input id="gyroLPFHz" data-setting="gyro_main_lpf_hz" type="number" data-presentation="range" class="rate-tpa_input" data-normal-max="250" />\r
                                    <div for="gyroLPFHz" class="helpicon cf_tip" data-i18n_title="pidTuning_gyro_main_lpf_hz_help"></div>\r
                                </div>\r
                            </td>\r
                        </tr>\r
                        <tr class="for_dynamic_gyro_lpf">\r
                            <th data-i18n="pidTuning_gyro_dyn_lpf_min_hz"></th>\r
                            <td>\r
                                <div class="pidTuning_number">\r
                                    <input id="gyro_dyn_lpf_min_hz" data-setting="gyro_dyn_lpf_min_hz" type="number" data-presentation="range" class="rate-tpa_input" data-normal-max="150" />\r
                                    <div for="gyro_dyn_lpf_min_hz" class="helpicon cf_tip" data-i18n_title="pidTuning_gyro_dyn_lpf_min_hz_help"></div>\r
                                </div>\r
                            </td>\r
                        </tr>\r
                        <tr class="for_dynamic_gyro_lpf">\r
                            <th data-i18n="pidTuning_gyro_dyn_lpf_max_hz"></th>\r
                            <td>\r
                                <div class="pidTuning_number">\r
                                    <input id="gyro_dyn_lpf_max_hz" data-setting="gyro_dyn_lpf_max_hz" type="number" data-presentation="range" class="rate-tpa_input" data-normal-max="500" />\r
                                    <div for="gyro_dyn_lpf_max_hz" class="helpicon cf_tip" data-i18n_title="pidTuning_gyro_dyn_lpf_man_hz_help"></div>\r
                                </div>\r
                            </td>\r
                        </tr>\r
                        <tr class="for_dynamic_gyro_lpf">\r
                            <th data-i18n="pidTuning_gyro_dyn_lpf_curve_expo"></th>\r
                            <td>\r
                                <div class="pidTuning_number">\r
                                    <input id="gyro_dyn_lpf_curve_expo" data-setting="gyro_dyn_lpf_curve_expo" type="number" data-presentation="range" class="rate-tpa_input" />\r
                                    <!-- <div for="gyro_dyn_lpf_curve_expo" class="helpicon cf_tip" data-i18n_title="pidTuning_gyro_dyn_lpf_curve_expo_help"></div> -->\r
                                </div>\r
                            </td>\r
                        </tr>\r
                    </tbody>\r
                </table>\r
            </div>\r
            \r
            <div class="clear-both not-for-ez-tune"></div>\r
            <div class="tab_subtitle not-for-ez-tune" data-i18n="pidTuning_advancedFilters" style="margin-top: 1em;"></div>\r
            <div class="clear-both not-for-ez-tune"></div>\r
            <div class="cf_column not-for-ez-tune">\r
                <table class="settings-table settings-table--filtering">\r
                    <tbody>\r
                        <tr>\r
                            <th data-i18n="pidTuning_MatrixFilterType"></th>\r
                            <td>\r
                                <div class="pidTuning_select">\r
                                    <select id="matrixFilterType" data-setting="dynamic_gyro_notch_mode">\r
                                    <div for="matrixFilterType" class="helpicon cf_tip" data-i18n_title="pidTuning_MatrixFilterTypeHelp"></div>\r
                                </div>\r
                            </td>\r
                        </tr>\r
                        <tr>\r
                            <th data-i18n="pidTuning_MatrixFilterMinFrequency"></th>\r
                            <td>\r
                                <div class="pidTuning_number">\r
                                    <input id="gyroNotchMinHz" data-setting="dynamic_gyro_notch_min_hz" data-presentation="range" type="number" class="rate-tpa_input" data-normal-max="150" />\r
                                    <div for="gyroNotchMinHz" class="helpicon cf_tip" data-i18n_title="pidTuning_MatrixFilterMinFrequencyHelp"></div>\r
                                </div>\r
                            </td>\r
                        </tr>\r
                        <tr>\r
                            <th data-i18n="pidTuning_MatrixFilterQFactor"></th>\r
                            <td>\r
                                <div class="pidTuning_number">\r
                                    <input id="gyroNotchQ" data-setting="dynamic_gyro_notch_q" data-presentation="range" type="number" class="rate-tpa_input" data-normal-max="300" />\r
                                    <div for="gyroNotchQ" class="helpicon cf_tip" title=""></div>\r
                                </div>\r
                            </td>\r
                        </tr>\r
                        <tr>\r
                            <th data-i18n="pidTuning_UnicornFilterQFactor"></th>\r
                            <td>\r
                                <div class="pidTuning_number">\r
                                    <input data-setting="setpoint_kalman_q" data-presentation="range" type="number" class="rate-tpa_input" data-normal-max="500" />\r
                                </div>\r
                            </td>\r
                        </tr>\r
                    </tbody>\r
                </table>\r
            </div>\r
\r
            <div class="clear-both not-for-ez-tune"></div>\r
            <div class="tab_subtitle not-for-ez-tune" data-i18n="pidTuning_dtermFilters" style="margin-top: 1em;"></div>\r
            <div class="cf_column not-for-ez-tune">\r
                <table class="settings-table settings-table--filtering">\r
                    <tbody>\r
                        <tr>\r
                            <th data-i18n="pidTuning_dtermLpfCutoffFrequency"></th>\r
                            <td>\r
                                <div class="pidTuning_number">\r
                                    <input id="dTermLPFHz" data-setting="dterm_lpf_hz" type="number" data-presentation="range" class="rate-tpa_input" data-normal-max="200" />\r
                                    <div for="dTermLPFHz" class="helpicon cf_tip" data-i18n_title="pidTuning_dtermLpfCutoffFrequencyHelp"></div>\r
                                </div>\r
                            </td>\r
                        </tr>\r
                    </tbody>\r
                </table>\r
            </div>\r
\r
            <div class="clear-both"></div>\r
            <div class="tab_subtitle" data-i18n="pidTuning_rpmFilters" style="margin-top: 1em;"></div>\r
            <div class="cf_column">\r
                <table class="settings-table settings-table--filtering">\r
                    <tbody>\r
                        <tr>\r
                            <th data-i18n="pidTuning_rpm_gyro_filter_enabled"></th>\r
                            <td>\r
                                <div class="pidTuning_number"><input type="checkbox" class="toggle update_preview" data-setting="rpm_gyro_filter_enabled" /></div>\r
                            </td>\r
                        </tr>\r
                        <tr>\r
                            <th data-i18n="pidTuning_rpm_gyro_min_hz"></th>\r
                            <td>\r
                                <div class="pidTuning_number">\r
                                    <input data-setting="rpm_gyro_min_hz" type="number" class="rate-tpa_input" data-presentation="range" />\r
                                </div>\r
                            </td>\r
                        </tr>\r
                    </tbody>\r
                </table>\r
            </div>\r
        </div>\r
\r
        <div id="subtab-mechanics" class="subtab__content">\r
            <div class="clear-both not-for-ez-tune"></div>\r
            <div class="tab_subtitle not-for-ez-tune" data-i18n="pidTuning_ITermMechanics" style="margin-top: 1em;"></div>\r
            <div class="cf_column not-for-ez-tune">\r
                <table class="settings-table settings-table--filtering">\r
                    <tbody>\r
                        <tr>\r
                            <th data-i18n="pidTuning_itermRelaxCutoff"></th>\r
                            <td>\r
                                <div class="pidTuning_number">\r
                                    <input id="mcITermRelaxCutoff" type="number" data-setting="mc_iterm_relax_cutoff" class="rate-tpa_input"  data-presentation="range" />\r
                                    <div for="mcITermRelaxCutoff" class="helpicon cf_tip" data-i18n_title="pidTuning_itermRelaxCutoffHelp"></div>\r
                                </div>\r
                            </td>\r
                        </tr>\r
                        <tr>\r
                            <th data-i18n="pidTuning_antigravityGain"></th>\r
                            <td>\r
                                <div class="pidTuning_number"><input type="number" class="rate-tpa_input" data-setting="antigravity_gain" data-step="0.001" /></div>\r
                            </td>\r
                        </tr>\r
                        <tr>\r
                            <th data-i18n="pidTuning_antigravityAccelerator"></th>\r
                            <td>\r
                                <div class="pidTuning_number"><input type="number" class="rate-tpa_input" data-setting="antigravity_accelerator" data-step="0.001" /></div>\r
                            </td>\r
                        </tr>\r
                        <tr>\r
                            <th data-i18n="pidTuning_antigravityCutoff"></th>\r
                            <td>\r
                                <div class="pidTuning_number"><input type="number" class="rate-tpa_input" data-setting="antigravity_cutoff_lpf_hz" /></div>\r
                            </td>\r
                        </tr>\r
                    </tbody>\r
                </table>\r
            </div>\r
\r
            <div class="clear-both not-for-ez-tune"></div>\r
            <div class="tab_subtitle not-for-ez-tune" data-i18n="pidTuning_dTermMechanics" style="margin-top: 1em;"></div>\r
            <div class="cf_column not-for-ez-tune">\r
                <table class="settings-table settings-table--filtering">\r
                    <tbody>\r
                        <tr>\r
                            <th data-i18n="pidTuning_d_boost_min"></th>\r
                            <td>\r
                                <div class="pidTuning_number"><input id="dBoostMin" type="number" class="rate-tpa_input" data-setting="d_boost_min" data-step="0.001" /></div>\r
                                <div for="dBoostMin" class="helpicon cf_tip" data-i18n_title="pidTuning_d_boost_min_help"></div>\r
                            </td>\r
                        </tr>\r
                        <tr>\r
                            <th data-i18n="pidTuning_d_boost_max"></th>\r
                            <td>\r
                                <div class="pidTuning_number"><input id="dBoostMax" type="number" class="rate-tpa_input" data-setting="d_boost_max" data-step="0.001" /></div>\r
                                <div for="dBoostMax" class="helpicon cf_tip" data-i18n_title="pidTuning_d_boost_max_help"></div>\r
                            </td>\r
                        </tr>\r
                        <tr>\r
                            <th data-i18n="pidTuning_d_boost_max_at_acceleration"></th>\r
                            <td>\r
                                <div class="pidTuning_number"><input id="dBoostMaxAccel" type="number" class="rate-tpa_input" data-setting="d_boost_max_at_acceleration" /></div>\r
                                <div for="dBoostMaxAccel" class="helpicon cf_tip" data-i18n_title="pidTuning_d_boost_max_at_acceleration_help"></div>\r
                            </td>\r
                        </tr>\r
                        <tr>\r
                            <th data-i18n="pidTuning_d_boost_gyro_delta_lpf_hz"></th>\r
                            <td>\r
                                <div class="pidTuning_number">\r
                                    <input id="dBoostGyroDelta" type="number" class="rate-tpa_input" data-setting="d_boost_gyro_delta_lpf_hz" data-presentation="range" data-normal-max="160" />\r
                                    <div for="dBoostGyroDelta" class="helpicon cf_tip" data-i18n_title="pidTuning_d_boost_gyro_delta_lpf_hz_help"></div>\r
                                </div>\r
                            </td>\r
                        </tr>\r
                    </tbody>\r
                </table>\r
            </div>\r
\r
            <div class="clear-both"></div>\r
            <div class="tab_subtitle" data-i18n="pidTuning_tpaMechanics" style="margin-top: 1em;"></div>\r
            <div class="cf_column" style="margin-top:1em;">\r
                <table class="settings-table settings-table--misc">\r
                    <tr>\r
                        <th data-i18n="pidTuning_TPA"></th>\r
                        <td>\r
                            <div class="pidTuning_number">\r
                                <input id="tpaRate" type="number" class="rate-tpa_input" data-setting="tpa_rate" data-unit="percent"  data-presentation="range" />\r
                                <div for="tpaRate" class="helpicon cf_tip" data-i18n_title="pidTuningTPAHelp"></div>\r
                            </div>\r
                        </td>\r
                    </tr>\r
                    <tr>\r
                        <th data-i18n="pidTuning_TPABreakPoint"></th>\r
                        <td>\r
                            <div class="pidTuning_number">\r
                                <input id="tpaBreakpoint" type="number" class="rate-tpa_input" data-setting="tpa_breakpoint" data-presentation="range" data-step="5" />\r
                                <div for="tpaBreakpoint" class="helpicon cf_tip" data-i18n_title="pidTuningTPABreakPointHelp"></div>\r
                            </div>\r
                        </td>\r
                    </tr>\r
                    <tr>\r
                        <th data-i18n="pidTuning_FW_TPATimeConstant"></th>\r
                        <td>\r
                            <div class="pidTuning_number"><input id="tpaTimeConstant" type="number" class="rate-tpa_input" data-setting="fw_tpa_time_constant" data-unit="msec" /></div>\r
                            <div for="tpaTimeConstant" class="helpicon cf_tip" data-i18n_title="pidTuning_FW_TPATimeConstantHelp"></div>\r
                        </td>\r
                    </tr>\r
                </table>\r
            </div>\r
            <div class="clear-both"></div>\r
            <div class="tab_subtitle" data-i18n="pidTuning_fwLevelTrimMechanics" style="margin-top: 1em;"></div>\r
            <div class="cf_column">\r
                <table class="settings-table settings-table--filtering">\r
                    <tbody>\r
                        <tr>\r
                            <th data-i18n="pidTuning_fw_level_pitch_trim"></th>\r
                            <td>\r
                                <div class="pidTuning_number"><input id="fwLevelTrim" type="number" class="rate-tpa_input" data-setting="fw_level_pitch_trim" data-unit="deg" data-step="0.001" /></div>\r
                                <div for="fwLevelTrim" class="helpicon cf_tip" data-i18n_title="pidTuning_fw_level_pitch_trim_help"></div>\r
                            </td>\r
                        </tr>\r
                        <tr>\r
                            <th data-i18n="pidTuning_itermBankAngleFreeze"></th>\r
                            <td>\r
                                <div class="pidTuning_number">\r
                                    <input id="fwYawItermFreeze" type="number" class="rate-tpa_input" data-setting="fw_yaw_iterm_freeze_bank_angle" data-presentation="range" />\r
                                    <div for="fwYawItermFreeze" class="helpicon cf_tip" data-i18n_title="pidTuning_itermBankAngleFreezeHelp"></div>\r
                                </div>\r
                            </td>\r
                        </tr>\r
                    </tbody>\r
                </table>\r
            </div>\r
        </div>\r
    </div>\r
    <div class="clear-both"></div>\r
    <div id="tuning-footer" class="content_toolbar">\r
        <div class="btn save_btn">\r
            <a class="update" href="#" data-i18n="pidTuning_ButtonSave"></a>\r
        </div>\r
        <div class="btn refresh_btn">\r
            <a class="refresh" href="#" data-i18n="pidTuning_ButtonRefresh"></a>\r
        </div>\r
    </div>\r
</div>`;export{n as default};
