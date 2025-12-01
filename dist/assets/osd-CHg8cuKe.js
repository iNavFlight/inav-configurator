const a=`<div class="tab-osd toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <h1 class="tab_title" data-i18n="tabOSD"></h1>\r
        <div class="unsupported hide">\r
            <p data-i18n="osd_unsupported_msg1" class="note"></p>\r
            <p data-i18n="osd_unsupported_msg2" class="note"></p>\r
        </div>\r
        <div class="supported hide">\r
            <div class="cf_column third_left osd__elements">\r
                <div class="settings spacer_right">\r
                    <select class="osd_layouts">\r
                    </select>\r
                    <span class="btn btn_blue">\r
                        <a class="active osd_copy" href="#" data-i18n="copy"></a>\r
                    </span>\r
                    <span class="btn btn_blue">\r
                        <a class="active osd_paste" href="#" data-i18n="paste"></a>\r
                    </span>\r
                    <span class="btn btn_danger">\r
                        <a class="active osd_clear" href="#" data-i18n="clear"></a>\r
                    </span>\r
                    <input class="osd_search" placeholder="Search...">\r
                </div>\r
                <div class="spacer_right">\r
                    <div id="osd_group_template" class="gui_box grey">\r
                        <div\r
                            class="gui_box_titlebar"\r
                            style="margin-bottom: 0">\r
                            <div class="spacer_box_title" data-i18n="osd_elements"></div>\r
                        </div>\r
                        <div class="spacer_box">\r
                            <div class="display-fields"></div>\r
                        </div>\r
                    </div>\r
                </div>\r
            </div>\r
            <div class="gui_box preview" style="float: left; position: fixed;">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="osd_preview_title"></div>\r
                </div>\r
                <div class="display-layout">\r
                    <div class="col right">\r
                        <div class="hd_43_margin_left"></div>\r
                        <div class="hd_43_margin_right"></div>\r
                        <div class="hd_3016_box_top"></div>\r
                        <div class="hd_3016_box_bottom"></div>\r
                        <div class="hd_3016_box_left"></div>\r
                        <div class="hd_3016_box_right"></div>\r
                        <div class="pal_ntsc_box_bottom"></div>\r
                        <div class="hd_avatar_storage_box_top"></div>\r
                        <div class="hd_avatar_storage_box_bottom"></div>\r
                        <div class="hd_avatar_storage_box_left"></div>\r
                        <div class="hd_avatar_storage_box_right"></div>\r
                        <div class="hd_avatar_bottom_bar"></div>\r
                        <div class="hd_bfhdcompat_storage_box"></div>\r
                        <div class="hd_bfhdcompat_bottom_box"></div>\r
                        <div class="preview"></div>\r
                    </div>\r
                </div>\r
            </div>\r
            <div class="cf_column third_right osd_settings">\r
                <div class="gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="osd_video_format"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <select class="video-types"></select>\r
                    </div>\r
                    <div class="spacer_box settings">\r
                        <div for="osd_video_show_guides" class="helpicon cf_tip" data-i18n_title="osd_video_HELP"></div>\r
                        <label id="videoGuides">\r
                           <span data-i18n="osd_video_show_guides"></span>\r
                        </label>\r
                    </div>\r
                </div>\r
                <div class="gui_box grey settings-container">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="settings"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <div class="settings">\r
                            <label class="pilot_name">\r
                                <input type="text" id="pilot_name" data-setting="pilot_name" data-live="true" />\r
                                <span data-i18n="osd_pilot_name"></span>\r
                            </label>\r
                            <div for="usePilotLogo" class="helpicon cf_tip osd_use_large_pilot_logo" data-i18n_title="osd_use_large_pilot_logo_help"></div>\r
                            <label>\r
                                <input type="checkbox" id="usePilotLogo" class="toggle update_preview" data-setting="osd_use_pilot_logo" data-live="true">\r
                                <span data-i18n="osd_use_pilot_logo"></span>\r
                            </label>\r
                            <label class="craft_name">\r
                                <input type="text" id="craft_name" data-setting="name" data-live="true" />\r
                                <span data-i18n="osd_craft_name"></span>\r
                            </label>\r
                            <label class="units">\r
                                <select id="unit_mode" name="unit_mode" data-setting-placeholder="osd_units"></select>\r
                                <span data-i18n="osd_units"></span>\r
                                <div for="unit_mode" class="helpicon cf_tip" style="margin-top: 2px"></div>\r
                            </label>\r
                            <label>\r
                                <select class="update_preview" data-setting="osd_crosshairs_style" data-live="true"></select>\r
                                <span data-i18n="osd_crosshairs_style"></span>\r
                            </label>\r
                            <label>\r
                                <select class="update_preview" data-setting="osd_left_sidebar_scroll" data-live="true"></select>\r
                                <span data-i18n="osd_left_sidebar_scroll"></span>\r
                            </label>\r
                            <label>\r
                                <select class="update_preview" data-setting="osd_right_sidebar_scroll" data-live="true"></select>\r
                                <span data-i18n="osd_right_sidebar_scroll"></span>\r
                            </label>\r
                            <div for="crsfLQFormat" class="helpicon cf_tip osd_use_crsf" data-i18n_title="osdSettingCRSF_LQ_FORMAT_HELP"></div>\r
                            <label class="osd_use_crsf">\r
                                <select id="crsfLQFormat" class="update_preview" data-setting="osd_crsf_lq_format" data-live="true"></select>\r
                                <span data-i18n="osd_crsf_lq_format"></span>\r
                            </label>\r
                            <label>\r
                                <input type="checkbox" class="toggle update_preview" data-setting="osd_sidebar_scroll_arrows" data-live="true">\r
                                <span data-i18n="osd_sidebar_scroll_arrows"></span>\r
                            </label>\r
                            <label>\r
                                <input type="checkbox" class="toggle update_preview" data-setting="osd_home_position_arm_screen" data-live="true">\r
                                <span data-i18n="osd_home_position_arm_screen"></span>\r
                            </label>\r
                        </div>\r
                    </div>\r
                </div>\r
                <div class="gui_box grey decimals-container">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="decimals"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <div class="settings">\r
                            <label>\r
                                <select class="update_preview" data-setting="osd_main_voltage_decimals" data-live="true"></select>\r
                                <span data-i18n="osd_main_voltage_decimals"></span>\r
                            </label>\r
                            <label>\r
                                <select class="update_preview" data-setting="osd_decimals_altitude" data-live="true"></select>\r
                                <span data-i18n="osd_decimals_altitude"></span>\r
                            </label>\r
                            <label>\r
                                <select class="update_preview" data-setting="osd_decimals_distance" data-live="true"></select>\r
                                <span data-i18n="osd_decimals_distance"></span>\r
                            </label>\r
                            <label>\r
                                <select class="update_preview" data-setting="osd_mah_precision" data-live="true"></select>\r
                                <span data-i18n="osd_mah_precision"></span>\r
                            </label>\r
                            <label>\r
                                <select class="update_preview" data-setting="osd_coordinate_digits" data-live="true"></select>\r
                                <span data-i18n="osd_coordinate_digits"></span>\r
                            </label>\r
                            <div for="plusCodeDigits" class="helpicon cf_tip" data-i18n_title="osdSettingPLUS_CODE_DIGITS_HELP"></div>\r
                            <label>\r
                                <select id="plusCodeDigits" class="update_preview" data-setting="osd_plus_code_digits" data-live="true"></select>\r
                                <span data-i18n="osd_plus_code_digits"></span>\r
                            </label>\r
                            <div for="plusCodeShort" class="helpicon cf_tip" data-i18n_title="osdSettingPLUS_CODE_SHORT_HELP"></div>\r
                            <label>\r
                                <select id="plusCodeShort" class="update_preview" data-setting="osd_plus_code_short" data-live="true"></select>\r
                                <span data-i18n="osd_plus_code_short"></span>\r
                            </label>\r
                            <div for="rpmPrecision" class="helpicon cf_tip osd_use_esc_telemetry" data-i18n_title="osd_esc_rpm_precision_help"></div>\r
                            <label class="osd_use_esc_telemetry">\r
                                <select id="rpmPrecision" class="update_preview" data-setting="osd_esc_rpm_precision" data-live="true"></select>\r
                                <span data-i18n="osd_esc_rpm_precision"></span>\r
                            </label>\r
                        </div>\r
                    </div>\r
                </div>\r
                <div class="gui_box grey alarms-container">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="osd_alarms"></div>\r
                    </div>\r
                    <div class="spacer_box settings">\r
                        <label for="rssi_alarm">\r
                            <input id="osd_rssi_alarm" data-setting="osd_rssi_alarm" data-setting-multiplier="1" type="number" data-step="1" />\r
                            <span data-i18n="osd_rssi_alarm"></span>\r
                        </label>\r
                        <div for="link_quality_alarm" class="helpicon cf_tip osd_use_rx" data-i18n_title="osdalarmLQ_HELP"></div>\r
                        <label for="link_quality_alarm" class="osd_use_rx">\r
                            <input id="link_quality_alarm" data-setting="osd_link_quality_alarm" data-setting-multiplier="1" type="number" data-step="1" />\r
                            <span data-i18n="osd_link_quality_alarm"></span>\r
                        </label>\r
                        <div for="rssi_dbm_alarm" class="helpicon cf_tip osd_use_rx" data-i18n_title="osd_rssi_dbm_alarm_HELP"></div>\r
                        <label for="rssi_dbm_alarm" class="osd_use_rx">\r
                            <input id="rssi_dbm_alarm" data-setting="osd_rssi_dbm_alarm" data-setting-multiplier="1" type="number" data-step="1" />\r
                            <span data-i18n="osd_rssi_dbm_alarm"></span>\r
                        </label>\r
                        <div for="snr_alarm" class="helpicon cf_tip osd_use_rx" data-i18n_title="osdalarmSNR_HELP"></div>\r
                        <label for="snr_alarm" class="osd_use_rx">\r
                            <input id="snr_alarm" data-setting="osd_snr_alarm" data-setting-multiplier="1" type="number" data-step="1" />\r
                            <span data-i18n="osd_snr_alarm"></span>\r
                        </label>\r
\r
                        <label for="osd_alt_alarm">\r
                            <input id="osd_alt_alarm" data-setting="osd_alt_alarm" data-unit="m" data-setting-multiplier="1" type="number" data-step="1" />\r
                            <span data-i18n="osd_alt_alarm"></span>\r
                        </label>\r
                        <div for="osd_neg_alt_alarm" class="helpicon cf_tip" data-i18n_title="osdAlarmMAX_NEG_ALTITUDE_HELP"></div>\r
                        <label for="osd_neg_alt_alarm">\r
                            <input id="osd_neg_alt_alarm" data-setting="osd_neg_alt_alarm" data-unit="m" data-setting-multiplier="1" type="number" data-step="1" />\r
                            <span data-i18n="osd_neg_alt_alarm"></span>\r
                        </label>\r
                        <div for="osd_dist_alarm" class="helpicon cf_tip" data-i18n_title="osdAlarmDIST_HELP"></div>\r
                        <label for="osd_dist_alarm">\r
                            <input id="osd_dist_alarm" data-setting="osd_dist_alarm" data-unit="m-lrg" data-setting-multiplier="1" type="number" data-step="1" />\r
                            <span data-i18n="osd_dist_alarm"></span>\r
                        </label>\r
                        <div for="osd_airspeed_min_alarm" class="helpicon cf_tip osd_use_airspeed_alarm" data-i18n_title="osd_airspeed_min_alarm_HELP"></div>\r
                        <label for="osd_airspeed_min_alarm" class="osd_use_airspeed_alarm">\r
                            <input id="osd_airspeed_min_alarm" data-setting="osd_airspeed_alarm_min" data-unit="cms" data-setting-multiplier="1" type="number" data-step="1" />\r
                            <span data-i18n="osd_airspeed_min_alarm"></span>\r
                        </label>\r
                        <div for="osd_airspeed_max_alarm" class="helpicon cf_tip osd_use_airspeed_alarm" data-i18n_title="osd_airspeed_max_alarm_HELP"></div>\r
                        <label for="osd_airspeed_max_alarm" class="osd_use_airspeed_alarm">\r
                            <input id="osd_airspeed_max_alarm" data-setting="osd_airspeed_alarm_max" data-unit="cms" data-setting-multiplier="1" type="number" data-step="1" />\r
                            <span data-i18n="osd_airspeed_max_alarm"></span>\r
                        </label>\r
                        <div for="osd_current_alarm" class="helpicon cf_tip" data-i18n_title="osdAlarmCURRENT_HELP"></div>\r
                        <label for="osd_current_alarm">\r
                            <input id="osd_current_alarm" data-setting="osd_current_alarm" data-setting-multiplier="1" type="number" data-step="1" />\r
                            <span data-i18n="osd_current_alarm"></span>\r
                        </label>\r
                        <label for="time_alarm">\r
                            <input id="osd_time_alarm" data-setting="osd_time_alarm" data-setting-multiplier="1" type="number" data-step="1" />\r
                            <span data-i18n="osd_time_alarm"></span>\r
                        </label>\r
\r
                        <label for="imu_temp_alarm_min">\r
                            <input id="imu_temp_alarm_min" data-setting="osd_imu_temp_alarm_min" data-unit="decidegc" data-setting-multiplier="1" type="number" data-step="0.5" />\r
                            <span data-i18n="osd_imu_temp_alarm_min"></span>\r
                        </label>\r
                        <label for="imu_temp_alarm_max">\r
                            <input id="imu_temp_alarm_max" data-setting="osd_imu_temp_alarm_max" data-unit="decidegc" data-setting-multiplier="1" type="number" data-step="0.5" />\r
                            <span data-i18n="osd_imu_temp_alarm_max"></span>\r
                        </label>\r
                        <label for="baro_temp_alarm_min" class="osd_use_baro_temp_alarm">\r
                            <input id="baro_temp_alarm_min" data-setting="osd_baro_temp_alarm_min" data-unit="decidegc" data-setting-multiplier="1" type="number" data-step="0.5" />\r
                            <span data-i18n="osd_baro_temp_alarm_min"></span>\r
                        </label>\r
                        <label for="baro_temp_alarm_max" class="osd_use_baro_temp_alarm">\r
                            <input id="baro_temp_alarm_max" data-setting="osd_baro_temp_alarm_max" data-unit="decidegc" data-setting-multiplier="1" type="number" data-step="0.5" />\r
                            <span data-i18n="osd_baro_temp_alarm_max"></span>\r
                        </label>\r
                        <label for="esc_temp_alarm_min" class="osd_use_esc_telemetry">\r
                            <input id="esc_temp_alarm_min" data-setting="osd_esc_temp_alarm_min" data-unit="decidegc" data-setting-multiplier="1" type="number" data-step="0.5" />\r
                            <span data-i18n="osd_esc_temp_alarm_min"></span>\r
                        </label>\r
                        <label for="esc_temp_alarm_max" class="osd_use_esc_telemetry">\r
                            <input id="esc_temp_alarm_max" data-setting="osd_esc_temp_alarm_max" data-unit="decidegc" data-setting-multiplier="1" type="number" data-step="0.5" />\r
                            <span data-i18n="osd_esc_temp_alarm_max"></span>\r
                        </label>\r
\r
                        <div for="osd_gforce_alarm" class="helpicon cf_tip" data-i18n_title="osdAlarmGFORCE_HELP"></div>\r
                        <label for="osd_gforce_alarm">\r
                            <input id="osd_gforce_alarm" data-setting="osd_gforce_alarm" data-setting-multiplier="1" type="number" data-step="0.1" />\r
                            <span data-i18n="osd_gforce_alarm"></span>\r
                        </label>\r
                        <div for="osd_gforce_axis_alarm_min" class="helpicon cf_tip" data-i18n_title="osdAlarmGFORCE_AXIS_MIN_HELP"></div>\r
                        <label for="osd_gforce_axis_alarm_min">\r
                            <input id="osd_gforce_axis_alarm_min" data-setting="osd_gforce_axis_alarm_min" data-setting-multiplier="1" type="number" data-step="0.1" />\r
                            <span data-i18n="osd_gforce_axis_alarm_min"></span>\r
                        </label>\r
                        <div for="osd_gforce_axis_alarm_max" class="helpicon cf_tip" data-i18n_title="osdAlarmGFORCE_AXIS_MAX_HELP"></div>\r
                        <label for="osd_gforce_axis_alarm_max">\r
                            <input id="osd_gforce_axis_alarm_max" data-setting="osd_gforce_axis_alarm_max" data-setting-multiplier="1" type="number" data-step="0.1" />\r
                            <span data-i18n="osd_gforce_axis_alarm_max"></span>\r
                        </label>\r
        \r
                        <div for="adsb_distance_alert" class="helpicon cf_tip" data-i18n_title="osdAlarmADSB_MAX_DISTANCE_ALERT"></div>\r
                        <label for="adsb_distance_alert">\r
                            <input id="adsb_distance_alert" data-setting="osd_adsb_distance_alert" data-unit="m" data-setting-multiplier="1" type="number" data-step="1" />\r
                            <span data-i18n="osd_adsb_distance_alert"></span>\r
                        </label>\r
                        <div for="adsb_distance_warning" class="helpicon cf_tip" data-i18n_title="osdAlarmADSB_MAX_DISTANCE_WARNING"></div>\r
                        <label for="adsb_distance_warning">\r
                            <input id="adsb_distance_warning" data-setting="osd_adsb_distance_warning" data-unit="m" data-setting-multiplier="1" type="number" data-step="1" />\r
                            <span data-i18n="osd_adsb_distance_warning"></span>\r
                        </label>\r
                    </div>\r
                </div>\r
                <div class="gui_box grey dji-hd-container" id="dji_settings">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="osd_dji_HD_FPV"></div>\r
                    </div>\r
                    <div class="spacer_box settings">\r
                        <label id="djiUnsupportedElements">\r
                           <span data-i18n="osd_dji_hide_unsupported"></span>\r
                        </label>\r
                        <label>\r
                            <select id="djiEscTempSource" data-setting="dji_esc_temp_source" data-live="true"></select>\r
                            <span data-i18n="osd_dji_ESC_temp"></span>\r
                        </label>\r
                        <label>\r
                            <select id="djiRssiSource" data-setting="dji_rssi_source" data-live="true"></select>\r
                            <span data-i18n="osd_dji_RSSI_source"></span>\r
                        </label>\r
                        <label>\r
                            <select data-setting="osd_speed_source" data-live="true"></select>\r
                            <span data-i18n="osd_dji_GPS_source"></span>\r
                        </label>\r
                        <label>\r
                            <select data-setting="dji_message_speed_source" data-live="true"></select>\r
                            <span data-i18n="osd_dji_speed_source"></span>\r
                        </label>\r
                        <label class="djiCraftNameElements">\r
                                <input type="checkbox" id="useCraftnameForMessages" data-setting="dji_use_name_for_messages" data-live="true" class="toggle"/>\r
                                <span data-i18n="osd_dji_use_craft_name_elements"></span>\r
                        </label>\r
                        <label>\r
                            <input type="checkbox" id="djiAdjustments" data-setting="dji_use_adjustments" data-live="true" class="toggle"></select>\r
                            <span data-i18n="osd_dji_adjustments"></span>\r
                        </label>\r
                        <label for="cn_alternating_duration">\r
                            <input id="cn_alternating_duration" data-setting="dji_cn_alternating_duration" data-setting-multiplier="1" type="number" data-step="1"></input>\r
                            <span data-i18n="osd_dji_cn_alternating_duration"></span>\r
                        </label>\r
                    </div>\r
                </div>\r
\r
                <div class="gui_box grey switch-indicator-container">\r
                    <div class="gui_box_titlebar">\r
                        <div for="osd_switch_indicator_settings" class="helpicon cf_tip" data-i18n_title="osd_switch_indicator_settings_HELP"></div>\r
                        <div class="spacer_box_title" data-i18n="osd_switch_indicator_settings"></div>\r
                    </div>\r
                    <div class="spacer_box settings">\r
                        <label>\r
                            <input type="checkbox" id="switchIndicators_alignLeft" data-setting="osd_switch_indicators_align_left" data-live="true" class="toggle"></select>\r
                            <span data-i18n="osd_switch_indicators_align_left"></span>\r
                        </label>\r
                        <label>\r
                            <input type="text" class="osdSwitchIndName" id="osdSwitchInd0_name" data-setting="osd_switch_indicator_zero_name" />\r
                            <select class="osdSwitchInd_channel" data-setting="osd_switch_indicator_zero_channel" data-live="true"></select>\r
                            <span data-i18n="osdSwitchInd0"></span>\r
                        </label>\r
\r
                        <label>\r
                            <input type="text" class="osdSwitchIndName" id="osdSwitchInd1_name" data-setting="osd_switch_indicator_one_name" />\r
                            <select class="osdSwitchInd_channel" data-setting="osd_switch_indicator_one_channel" data-live="true"></select>\r
                            <span data-i18n="osdSwitchInd1"></span>\r
                        </label>\r
\r
                        <label>\r
                            <input type="text" class="osdSwitchIndName" id="osdSwitchInd2_name" data-setting="osd_switch_indicator_two_name" />\r
                            <select class="osdSwitchInd_channel" data-setting="osd_switch_indicator_two_channel" data-live="true"></select>\r
                            <span data-i18n="osdSwitchInd2"></span>\r
                        </label>\r
\r
                        <label>\r
                            <input type="text" class="osdSwitchIndName" id="osdSwitchInd3_name" data-setting="osd_switch_indicator_three_name" />\r
                            <select class="osdSwitchInd_channel" data-setting="osd_switch_indicator_three_channel" data-live="true"></select>\r
                            <span data-i18n="osdSwitchInd3"></span>\r
                        </label>\r
                    </div>\r
                </div>\r
\r
                <div class="gui_box grey custom-element-container">\r
                    <div class="gui_box_titlebar">\r
                        <a href="https://github.com/iNavFlight/inav/wiki/OSD-custom-messages" target="_blank"><div for="osd_custom_element_settings" class="helpicon cf_tip" data-i18n_title="osd_custom_element_settings_HELP"></div></a>\r
                        <div class="spacer_box_title" data-i18n="osd_custom_element_settings"></div>\r
                    </div>\r
                    <div class="spacer_box settings" id="osdCustomElements"></div>\r
                    <div class="spacer_box osd_customelement_icons_help">\r
                        <a href="https://github.com/iNavFlight/inav-configurator/tree/master/resources/osd/INAV%20Character%20Map.md" id="INAVCharacterMapDocURL" target="_blank"><div for="osd_custom_element_settings_icons" class="helpicon cf_tip osd_customelement_icons_help" data-i18n_title="osd_custom_element_settings_icons_HELP"></div></a>\r
                    </div>\r
                </div>\r
\r
\r
                <div class="gui_box grey pan-servo-container">\r
                    <div class="gui_box_titlebar">\r
                        <div for="osd_pan_servo_settings" class="helpicon cf_tip" data-i18n_title="osd_pan_servo_settings_HELP"></div>\r
                        <div class="spacer_box_title" data-i18n="osd_pan_servo_settings"></div>\r
                    </div>\r
                    <div class="spacer_box settings">\r
                        <div for="panServoOutput" class="helpicon cf_tip" data-i18n_title="osdPanServoIndex_HELP"></div>\r
                        <label>\r
                            <select id="panServoOutput" data-setting="osd_pan_servo_index" data-live="true"></select>\r
                            <span data-i18n="osdPanServoIndex"></span>\r
                        </label>\r
\r
                        <div id="osd_pan_settings">\r
                            <div for="osdPanServoRangeDecadegrees" class="helpicon cf_tip" data-i18n_title="osdPanServoRangeDecadegrees_HELP"></div>\r
                            <label for="osdPanServoRangeDecadegrees">\r
                                <input id="osdPanServoRangeDecadegrees" data-setting="osd_pan_servo_range_decadegrees" data-unit="decadeg" data-setting-multiplier="1" type="number" data-step="1" />\r
                                <span data-i18n="osdPanServoRangeDecadegrees"></span>\r
                            </label>\r
                            <label for="osdPanServoIndicatorShowDegrees">\r
                                <input type="checkbox" id="osdPanServoIndicatorShowDegrees" data-setting="osd_pan_servo_indicator_show_degrees" data-live="true" class="toggle"></select>\r
                                <span data-i18n="osdPanServoIndicatorShowDegrees"></span>\r
                            </label>\r
                            <div for="osdPanServoOffcentreWarning" class="helpicon cf_tip" data-i18n_title="osdPanServoOffcentreWarning_HELP"></div>\r
                            <label for="osdPanServoOffcentreWarning">\r
                                <input id="osdPanServoOffcentreWarning" data-setting="osd_pan_servo_offcentre_warning" data-unit="deg" data-setting-multiplier="1" type="number" data-step="1" />\r
                                <span data-i18n="osdPanServoOffcentreWarning"></span>\r
                            </label>\r
                        </div>\r
                    </div>\r
                </div>\r
                <div class="gui_box grey hud-settings-container"> \r
                    <div class="gui_box_titlebar">\r
                        <div for="osd_hud_settings" class="helpicon cf_tip" data-i18n_title="osd_hud_settings_HELP"></div>\r
                        <div class="spacer_box_title" data-i18n="osd_hud_settings"></div>\r
                    </div>\r
                    <div class="spacer_box settings">\r
                        <div id="osd_hud_settings">\r
                            <div for="osd_horizon_offset" class="helpicon cf_tip" data-i18n_title="osd_horizon_offset_help"></div>\r
                            <label>\r
                                <select class="update_preview" id="osd_horizon_offset" data-setting="osd_horizon_offset" data-setting-invert-select="true" data-live="true"></select>\r
                                <span data-i18n="osd_horizon_offset"></span>\r
                            </label>\r
                            <div for="osd_hud_wp_disp" class="helpicon cf_tip" data-i18n_title="osd_hud_wp_disp_help"></div>\r
                            <label>\r
                                <input type="number" data-step="1" data-setting-multiplier="1" data-setting="osd_hud_wp_disp" class="update_preview" data-live="true">\r
                                <span data-i18n="osd_hud_wp_disp"></span>\r
                            </label>\r
                            <div for="osd_hud_radar_disp" class="helpicon cf_tip" data-i18n_title="osd_hud_radar_disp_help"></div>\r
                            <label>\r
                                <input type="number" data-step="1" data-setting-multiplier="1" data-setting="osd_hud_radar_disp" class="update_preview" data-live="true">\r
                                <span data-i18n="osd_hud_radar_disp"></span>\r
                            </label>\r
\r
                            <div for="osd_hud_radar_range_min" class="helpicon cf_tip" data-i18n_title="osd_hud_radar_range_min_help"></div>\r
                            <label>\r
                                <input type="number" data-step="1" data-unit="m" data-setting-multiplier="1" data-setting="osd_hud_radar_range_min" class="update_preview" data-live="true">\r
                                <span data-i18n="osd_hud_radar_range_min"></span>\r
                            </label>\r
                            <div for="osd_hud_radar_range_max" class="helpicon cf_tip" data-i18n_title="osd_hud_radar_range_max_help"></div>\r
                            <label>\r
                                <input type="number" data-step="1" data-unit="m" data-setting-multiplier="1" data-setting="osd_hud_radar_range_max" class="update_preview" data-live="true">\r
                                <span data-i18n="osd_hud_radar_range_max"></span>\r
                            </label>\r
\r
                            <div for="osd_camera_fov_h" class="helpicon cf_tip" data-i18n_title="osd_camera_fov_h_help"></div>\r
                            <label>\r
                                <input type="number" data-step="1" data-setting-multiplier="1" data-setting="osd_camera_fov_h" class="update_preview" data-live="true">\r
                                <span data-i18n="osd_camera_fov_h"></span>\r
                            </label>\r
                            <div for="osd_camera_fov_v" class="helpicon cf_tip" data-i18n_title="osd_camera_fov_v_help"></div>\r
                            <label>\r
                                <input type="number" data-step="1" data-setting-multiplier="1" data-setting="osd_camera_fov_v" class="update_preview" data-live="true">\r
                                <span data-i18n="osd_camera_fov_v"></span>\r
                            </label>\r
                            <div for="osd_camera_uptilt" class="helpicon cf_tip" data-i18n_title="osd_camera_uptilt_help"></div>\r
                            <label>\r
                                <input type="number" data-step="1" data-setting-multiplier="1" data-setting="osd_camera_uptilt" class="update_preview" data-live="true">\r
                                <span data-i18n="osd_camera_uptilt"></span>\r
                            </label>\r
                        </div>\r
                    </div>\r
                </div>\r
\r
            </div>\r
            <div id="fontmanagercontent" style="display:none; width:712px;">\r
                <div class="font-picker" style="margin-bottom: 10px;">\r
                    <h1 class="tab_title">Font:</h1>\r
                    <div class="content_wrapper font-preview"></div>\r
                    <div class="fontbuttons">\r
                        <button data-font-file="default" data-i18n="osd_font_default"></button>\r
                        <button data-font-file="bold" data-i18n="osd_font_bold"></button>\r
                        <button data-font-file="clarity" data-i18n="osd_font_clarity"></button>\r
                        <button data-font-file="clarity_medium" data-i18n="osd_font_clarity_medium"></button>\r
                        <button data-font-file="impact" data-i18n="osd_font_impact"></button>\r
                        <button data-font-file="impact_mini" data-i18n="osd_font_impact_mini"></button>\r
                        <button data-font-file="large" data-i18n="osd_font_large"></button>\r
                        <button data-font-file="vision" data-i18n="osd_font_vision"></button>\r
                        <button class="load_font_file" data-i18n="osd_font_load_file"></button>\r
                    </div>\r
                    <div class="info">\r
                        <a name="progressbar"></a>\r
                        <progress class="progress" value="0" min="0" max="100"></progress>\r
                        <div class="progressLabel" style="margin-top: -21px; width: 95%; text-align: center; color: white; position: absolute;"></div>\r
                    </div>\r
                </div>\r
                <div class="default_btn green" style="width:100%; float:left; margin-bottom: 0;">\r
                    <a class="flash_font active" data-i18n="osd_font_upload"></a>\r
                </div>\r
            </div>\r
            <div id="fonttypeselectorcontent" style="display:none; width:712px;">\r
                <div class="font-picker" style="margin-bottom: 10px;">\r
                    <h1 class="tab_title">Font:</h1>\r
                    <div class="content_wrapper font-preview"></div>\r
                </div>\r
            </div>\r
            <div class="clear-both"></div>\r
        </div>\r
    </div>\r
    <div class="content_toolbar supported hide">\r
        <div class="btn">\r
            <a class="active save" href="#" data-i18n="save"></a>\r
        </div>\r
        <div class="btn">\r
            <a class="fonts" id="fontmanager" href="#" data-i18n="osd_font_manager"></a>\r
        </div>\r
    </div>\r
</div>`;export{a as default};
