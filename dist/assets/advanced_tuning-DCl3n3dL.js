const n=`<div class="tab-configuration tab-advanced-tuning toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <div class="tab_title"><span data-i18n="tabAdvancedTuningTitle"></span><span class="airplaneTuningTitle" data-i18n="tabAdvancedTuningAirplaneTuningTitle"></span><span class="multirotorTuningTitle" data-i18n="tabAdvancedTuningMultirotorTuningTitle"></span></div>\r
\r
        <!-- Airplane Advanced Tuning-->\r
        <div class="airplaneTuning">\r
            <div class="leftWrapper">\r
                <div class="config-section gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="configurationLaunch"></div>\r
                    </div>\r
                    <div class="spacer_box settings">\r
                        <div class="number">\r
                            <input type="number" id="launchIdleThr" data-unit="us" data-setting="nav_fw_launch_idle_thr" data-setting-multiplier="1" step="1" min="1000" max="2000" />\r
                            <label for="launchIdleThr"><span data-i18n="configurationLaunchIdleThr"></span></label>\r
                            <div for="launchIdleThr" class="helpicon cf_tip" data-i18n_title="configurationLaunchIdleThrHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="launchIdleDelay" data-unit="msec" data-setting="nav_fw_launch_idle_motor_delay" data-setting-multiplier="1" step="1" min="0" max="60000" />\r
                            <label for="launchIdleDelay"><span data-i18n="configurationLaunchIdleDelay"></span></label>\r
                            <div for="launchIdleDelay" class="helpicon cf_tip" data-i18n_title="configurationLaunchIdleDelayHelp"></div>\r
                        </div>\r
                        <div class="select">\r
                            <select id="wiggleWakeIdle" data-setting="nav_fw_launch_wiggle_to_wake_idle"></select>\r
                            <label for="wiggleWakeIdle"><span data-i18n="configurationWiggleWakeIdle"></span></label>\r
                            <div for="wiggleWakeIdle" class="helpicon cf_tip" data-i18n_title="configurationWiggleWakeIdleHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="launchMaxAngle" data-unit="deg" data-setting="nav_fw_launch_max_angle" data-setting-multiplier="1" step="1" min="5" max="180" />\r
                            <label for="launchMaxAngle"><span data-i18n="configurationLaunchMaxAngle"></span></label>\r
                            <div for="launchMaxAngle" class="helpicon cf_tip" data-i18n_title="configurationLaunchMaxAngleHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="launchMotorDelay" data-unit="msec-nc" data-setting="nav_fw_launch_motor_delay" data-setting-multiplier="1" step="1" min="0" max="5000" />\r
                            <label for="launchMotorDelay"><span data-i18n="configurationLaunchMotorDelay"></span></label>\r
                            <div for="launchMotorDelay" class="helpicon cf_tip" data-i18n_title="configurationLaunchMotorDelayHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="launchMinTime" data-unit="msec" data-setting="nav_fw_launch_min_time" data-setting-multiplier="1" step="1" min="0" max="60000" />\r
                            <label for="launchMinTime"><span data-i18n="configurationLaunchMinTime"></span></label>\r
                            <div for="launchMinTime" class="helpicon cf_tip" data-i18n_title="configurationLaunchMinTimeHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="launchSpinupTime" data-unit="msec-nc" data-setting="nav_fw_launch_spinup_time" data-setting-multiplier="1" step="1" min="0" max="1000" />\r
                            <label for="launchSpinupTime"><span data-i18n="configurationLaunchSpinupTime"></span></label>\r
                            <div for="launchSpinupTime" class="helpicon cf_tip" data-i18n_title="configurationLaunchSpinupTimeHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="launchThr" data-unit="us" data-setting="nav_fw_launch_thr" data-setting-multiplier="1" step="1" min="1000" max="2000" />\r
                            <label for="launchThr"><span data-i18n="configurationLaunchThr"></span></label>\r
                            <div for="launchThr" class="helpicon cf_tip" data-i18n_title="configurationLaunchThrHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="launchClimbAngle" data-unit="deg" data-setting="nav_fw_launch_climb_angle" data-setting-multiplier="1" step="1" min="0" max="45" />\r
                            <label for="launchClimbAngle"><span data-i18n="configurationLaunchClimbAngle"></span></label>\r
                            <div for="launchClimbAngle" class="helpicon cf_tip" data-i18n_title="configurationLaunchClimbAngleHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="launchTimeout" data-unit="msec" data-setting="nav_fw_launch_timeout" data-setting-multiplier="1" step="1" min="0" max="60000" />\r
                            <label for="launchTimeout"><span data-i18n="configurationLaunchTimeout"></span></label>\r
                            <div for="launchTimeout" class="helpicon cf_tip" data-i18n_title="configurationLaunchTimeoutHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="launchMaxAltitude" data-unit="cm" data-setting="nav_fw_launch_max_altitude" data-setting-multiplier="1" step="1" min="0" max="60000" />\r
                            <label for="launchMaxAltitude"><span data-i18n="configurationLaunchMaxAltitude"></span></label>\r
                            <div for="launchMaxAltitude" class="helpicon cf_tip" data-i18n_title="configurationLaunchMaxAltitudeHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="launchEndTime" data-unit="msec" data-setting="nav_fw_launch_end_time" data-setting-multiplier="1" step="1" min="0" max="5000" />\r
                            <label for="launchEndTime"><span data-i18n="configurationLaunchEndTime"></span></label>\r
                            <div for="launchEndTime" class="helpicon cf_tip" data-i18n_title="configurationLaunchEndTimeHelp"></div>\r
                        </div>\r
                    </div>\r
                </div>\r
\r
                <div class="config-section gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="fixedWingLandingConfiguration"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <div class="number">\r
                            <input id="fwLandApproachLength" type="number" data-unit="cm" data-setting="nav_fw_land_approach_length" data-setting-multiplier="1" step="1" min="100" max="100000" />\r
                            <label for="fwLandApproachLength"><span data-i18n="fwLandApproachLength"></span></label>\r
                            <div for="fwLandApproachLength" class="helpicon cf_tip" data-i18n_title="fwLandApproachLengthHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input id="fwLandFinalApproachPitch2throttle" type="number" data-unit="percent" data-setting="nav_fw_land_final_approach_pitch2throttle_mod" data-setting-multiplier="1" step="1" min="100" max="400" />\r
                            <label for="fwLandFinalApproachPitch2throttle"><span data-i18n="fwLandFinalApproachPitch2throttle"></span></label>\r
                            <div for="fwLandFinalApproachPitch2throttle" class="helpicon cf_tip" data-i18n_title="fwLandFinalApproachPitch2throttleHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input id="fwLandGlideAlt" type="number" data-unit="cm" data-setting="nav_fw_land_glide_alt" data-setting-multiplier="1" step="1" min="100" max="5000" />\r
                            <label for="fwLandGlideAlt"><span data-i18n="fwLandGlideAlt"></span></label>\r
                            <div for="fwLandGlideAlt" class="helpicon cf_tip" data-i18n_title="fwLandGlideAltHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input id="fwLandFlareAlt" type="number" data-unit="cm" data-setting="nav_fw_land_flare_alt" data-setting-multiplier="1" step="1" min="0" max="10000" />\r
                            <label for="fwLandFlareAlt"><span data-i18n="fwLandFlareAlt"></span></label>\r
                            <div for="fwLandFlareAlt" class="helpicon cf_tip" data-i18n_title="fwLandFlareAltHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input id="fwLandGlidePitch" type="number" data-unit="deg" data-setting="nav_fw_land_glide_pitch" data-setting-multiplier="1" step="1" min="0" max="45" />\r
                            <label for="fwLandGlidePitch"><span data-i18n="fwLandGlidePitch"></span></label>\r
                            <div for="fwLandGlidePitch" class="helpicon cf_tip" data-i18n_title="fwLandGlidePitchHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input id="fwLandFlarePitch" type="number" data-unit="deg" data-setting="nav_fw_land_flare_pitch" data-setting-multiplier="1" step="1" min="0" max="45" />\r
                            <label for="fwLandFlarePitch"><span data-i18n="fwLandFlarePitch"></span></label>\r
                            <div for="fwLandFlarePitch" class="helpicon cf_tip" data-i18n_title="fwLandFlarePitchHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input id="fwLandMaxTailwind" type="number" data-unit="cms" data-setting="nav_fw_land_max_tailwind" data-setting-multiplier="1" step="1" min="0" max="3000" />\r
                            <label for="fwLandMaxTailwind"><span data-i18n="fwLandMaxTailwind"></span></label>\r
                            <div for="fwLandMaxTailwind" class="helpicon cf_tip" data-i18n_title="fwLandMaxTailwindHelp"></div>\r
                        </div>\r
                    </div>\r
                </div>\r
\r
                <div class="config-section gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="powerConfiguration"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <div class="number">\r
                            <input type="number" id="idlePower" data-unit="cw" data-setting="idle_power" data-setting-multiplier="1" step="1" min="0" max="65535" />\r
                            <label for="idlePower"><span data-i18n="idlePower"></span></label>\r
                            <div for="idlePower" class="helpicon cf_tip" data-i18n_title="idlePowerHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="cruisePower" data-unit="cw" data-setting="cruise_power" data-setting-multiplier="1" step="1" min="0" max="4294967295" />\r
                            <label for="cruisePower"><span data-i18n="cruisePower"></span></label>\r
                            <div for="cruisePower" class="helpicon cf_tip" data-i18n_title="cruisePowerHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="cruiseSpeed" data-unit="cms" data-setting="nav_fw_cruise_speed" data-setting-multiplier="1" step="1" min="0" max="65535" />\r
                            <label for="cruiseSpeed"><span data-i18n="cruiseSpeed"></span></label>\r
                            <div for="cruiseSpeed" class="helpicon cf_tip" data-i18n_title="cruiseSpeedHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="rthEnergyMargin" data-unit="percent" data-setting="rth_energy_margin" data-setting-multiplier="1" step="1" min="0" max="100" />\r
                            <label for="rthEnergyMargin"><span data-i18n="rthEnergyMargin"></span></label>\r
                            <div for="rthEnergyMargin" class="helpicon cf_tip" data-i18n_title="rthEnergyMarginHelp"></div>\r
                        </div>\r
                    </div>\r
                </div>\r
\r
            </div>\r
            <!-- left wrapper -->\r
\r
            <div class="rightWrapper">\r
                <div class="config-section gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="fixedWingNavigationConfiguration"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <div class="number">\r
                            <input id="minThrottle" type="number" data-unit="us" data-setting="nav_fw_min_thr" data-setting-multiplier="1" step="1" min="1000" max="2000" />\r
                            <label for="minThrottle"><span data-i18n="minThrottle"></span></label>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="maxThrottle" type="number" data-unit="us" data-setting="nav_fw_max_thr" data-setting-multiplier="1" step="1" min="1000" max="2000" />\r
                            <label for="maxThrottle"><span data-i18n="maxThrottle"></span></label>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="cruiseThrottle" type="number" data-unit="us" data-setting="nav_fw_cruise_thr" data-setting-multiplier="1" step="1" min="1000" max="2000" />\r
                            <label for="cruiseThrottle"><span data-i18n="cruiseThrottle"></span></label>\r
                        </div>\r
\r
                        <div class="checkbox">\r
                            <input type="checkbox" class="toggle update_preview" id="cruiseManualThrottle" data-setting="nav_fw_allow_manual_thr_increase" data-live="true" />\r
                            <label for="cruiseManualThrottle"><span data-i18n="cruiseManualThrottleLabel"></span></label>\r
                            <div for="cruiseManualThrottle" class="helpicon cf_tip" data-i18n_title="cruiseManualThrottleHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="minThrottleDownPitch" type="number" data-unit="decideg" data-setting="fw_min_throttle_down_pitch" data-setting-multiplier="1" step="1" min="0" max="450" />\r
                            <label for="minThrottleDownPitch"><span data-i18n="minThrottleDownPitch"></span></label>\r
                            <div for="minThrottleDownPitch" class="helpicon cf_tip" data-i18n_title="minThrottleDownPitchHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="pitchToThrottle" type="number" data-unit="us" data-setting="nav_fw_pitch2thr" data-setting-multiplier="1" step="1" min="0" max="100" />\r
                            <label for="pitchToThrottle"><span data-i18n="pitchToThrottle"></span></label>\r
                            <div for="pitchToThrottle" class="helpicon cf_tip" data-i18n_title="pitchToThrottleHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="pitchToThrottleSmoothing" type="number" data-setting="nav_fw_pitch2thr_smoothing" data-setting-multiplier="1" step="0" min="0" max="9" />\r
                            <label for="pitchToThrottleSmoothing"><span data-i18n="pitchToThrottleSmoothing"></span></label>\r
                            <div for="pitchToThrottleSmoothing" class="helpicon cf_tip" data-i18n_title="pitchToThrottleSmoothingHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="pitchToThrottleThreshold" type="number" data-unit="decideg" data-setting="nav_fw_pitch2thr_threshold" data-setting-multiplier="1" step="1" min="0" max="900" />\r
                            <label for="pitchToThrottleThreshold"><span data-i18n="pitchToThrottleThreshold"></span></label>\r
                            <div for="pitchToThrottleThreshold" class="helpicon cf_tip" data-i18n_title="pitchToThrottleThresholdHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="maxBankAngle" type="number" data-unit="deg" data-setting="nav_fw_bank_angle" data-setting-multiplier="1" step="1" min="5" max="80" />\r
                            <label for="maxBankAngle"><span data-i18n="maxBankAngle"></span></label>\r
                            <div for="maxBankAngle" class="helpicon cf_tip" data-i18n_title="maxBankAngleHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="navManualClimbRate" data-unit="v-cms" data-setting="nav_fw_manual_climb_rate" data-setting-multiplier="1" step="1" min="10" max="2000" />\r
                            <label for="navManualClimbRate"><span data-i18n="navManualClimbRate"></span></label>\r
                            <div for="navManualClimbRate" class="helpicon cf_tip" data-i18n_title="navManualClimbRateHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input id="maxClimbAngle" type="number" data-unit="deg" data-setting="nav_fw_climb_angle" data-setting-multiplier="1" step="1" min="5" max="80" />\r
                            <label for="maxClimbAngle"><span data-i18n="maxClimbAngle"></span></label>\r
                            <div for="maxClimbAngle" class="helpicon cf_tip" data-i18n_title="maxClimbAngleHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="maxDiveAngle" type="number" data-unit="deg" data-setting="nav_fw_dive_angle" data-setting-multiplier="1" step="1" min="5" max="80" />\r
                            <label for="maxDiveAngle"><span data-i18n="maxDiveAngle"></span></label>\r
                            <div for="maxDiveAngle" class="helpicon cf_tip" data-i18n_title="maxDiveAngleHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input type="number" id="cruiseYawRate" data-setting="nav_cruise_yaw_rate" data-setting-multiplier="1" step="1" min="0" max="60" />\r
                            <label for="cruiseYawRate"><span data-i18n="cruiseYawRateLabel"></span></label>\r
                            <div for="cruiseYawRate" class="helpicon cf_tip" data-i18n_title="cruiseYawRateHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="loiterRadius" type="number" data-unit="cm" data-setting="nav_fw_loiter_radius" data-setting-multiplier="1" step="1" min="0" max="30000" />\r
                            <label for="loiterRadius"><span data-i18n="loiterRadius"></span></label>\r
                        </div>\r
\r
                        <div class="select">\r
                            <select id="loiterDirection" data-setting="fw_loiter_direction"></select>\r
                            <label for="loiterDirection"><span data-i18n="loiterDirectionLabel"></span></label>\r
                            <div for="loiterDirection" class="helpicon cf_tip" data-i18n_title="loiterDirectionHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input type="number" id="controlSmoothness" data-setting="nav_fw_control_smoothness" data-setting-multiplier="1" step="1" min="0" max="9" />\r
                            <label for="controlSmoothness"><span data-i18n="controlSmoothness"></span></label>\r
                            <div for="controlSmoothness" class="helpicon cf_tip" data-i18n_title="controlSmoothnessHelp"></div>\r
                        </div>\r
\r
                        <div class="checkbox">\r
                            <input type="checkbox" class="toggle update_preview" id="soarMotorStop" data-setting="nav_fw_soaring_motor_stop" data-live="true" />\r
                            <label for="soarMotorStop"><span data-i18n="soarMotorStop"></span></label>\r
                            <div for="soarMotorStop" class="helpicon cf_tip" data-i18n_title="soarMotorStopHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input type="number" id="soarPitchDeadband" data-unit="deg" data-setting="nav_fw_soaring_pitch_deadband" data-setting-multiplier="1" step="1" min="0" max="15" />\r
                            <label for="soarPitchDeadband"><span data-i18n="soarPitchDeadband"></span></label>\r
                            <div for="soarPitchDeadband" class="helpicon cf_tip" data-i18n_title="soarPitchDeadbandHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input type="number" id="altControlResponse" data-unit="deg" data-setting="nav_fw_alt_control_response" data-setting-multiplier="1" step="1" min="5" max="100" />\r
                            <label for="altControlResponse"><span data-i18n="altControlResponse"></span></label>\r
                            <div for="altControlResponse" class="helpicon cf_tip" data-i18n_title="altControlResponseHelp"></div>\r
                        </div>\r
\r
                    </div>\r
                </div>\r
            </div>\r
            <!-- right wrapper -->\r
\r
            <div class="clear-both"></div>\r
        </div>\r
        <!-- Airplane Advanced Tuning -->\r
\r
        <!-- Multirotor Advanced tuning -->\r
        <div class="multirotorTuning">\r
            <div class="leftWrapper">\r
                <div class="config-section gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="multiRotorNavigationConfiguration"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <div class="select">\r
                            <select id="user-control-mode" data-setting="nav_user_control_mode"></select>\r
                            <label for="user-control-mode"><span data-i18n="userControlMode"></span></label>\r
                        </div>\r
                        <div class="number">\r
                            <input id="default-auto-speed" type="number" data-unit="cms" data-setting="nav_auto_speed" data-setting-multiplier="1" step="1" min="10" max="2000" />\r
                            <label for="default-auto-speed"><span data-i18n="posholdDefaultSpeed"></span></label>\r
                            <div for="default-auto-speed" class="helpicon cf_tip" data-i18n_title="posholdDefaultSpeedHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input id="max-auto-speed" type="number" data-unit="cms" data-setting="nav_max_auto_speed" data-setting-multiplier="1" step="1" min="10" max="2000" />\r
                            <label for="max-auto-speed"><span data-i18n="posholdMaxSpeed"></span></label>\r
                        </div>\r
                        <div class="number">\r
                            <input id="max-manual-speed" data-unit="cms" type="number" data-setting="nav_manual_speed" data-setting-multiplier="1" step="1" min="10" max="2000" />\r
                            <label for="max-manual-speed"><span data-i18n="posholdMaxManualSpeed"></span></label>\r
                            <div for="max-manual-speed" class="helpicon cf_tip" data-i18n_title="posholdMaxManualSpeedHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="navAutoClimbRate" data-unit="v-cms" data-setting="nav_mc_auto_climb_rate" data-setting-multiplier="1" step="1" min="10" max="2000" />\r
                            <label for="navAutoClimbRate"><span data-i18n="navAutoClimbRate"></span></label>\r
                            <div for="navAutoClimbRate" class="helpicon cf_tip" data-i18n_title="navAutoClimbRateHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="navManualClimbRate" data-unit="v-cms" data-setting="nav_mc_manual_climb_rate" data-setting-multiplier="1" step="1" min="10" max="2000" />\r
                            <label for="navManualClimbRate"><span data-i18n="navManualClimbRate"></span></label>\r
                            <div for="navManualClimbRate" class="helpicon cf_tip" data-i18n_title="navManualClimbRateHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input id="max-bank-angle" type="number" data-unit="deg" data-setting="nav_mc_bank_angle" data-setting-multiplier="1" step="1" min="15" max="45" />\r
                            <label for="max-bank-angle"><span data-i18n="posholdMaxBankAngle"></span></label>\r
                            <div for="max-bank-angle" class="helpicon cf_tip" data-i18n_title="posholdMaxBankAngleHelp"></div>\r
                        </div>\r
\r
                        <div class="select">\r
                            <select id="nav-mc-althold-throttle" data-setting="nav_mc_althold_throttle"></select>\r
                            <label for="nav-mc-althold-throttle"><span data-i18n="navmcAltholdThrottle"></span></label>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="hover-throttle" type="number" data-unit="us" data-setting="nav_mc_hover_thr" data-setting-multiplier="1" step="1" min="1000" max="2000" />\r
                            <label for="hover-throttle"><span data-i18n="posholdHoverThrottle"></span></label>\r
                        </div>\r
                        <div class="checkbox">\r
                            <input id="wp-slowdown" type="checkbox" class="toggle update_preview" data-setting="nav_mc_wp_slowdown" data-live="true" />\r
                            <label for="wp-slowdown"><span data-i18n="mcWpSlowdown"></span></label>\r
                            <div for="wp-slowdown" class="helpicon cf_tip" data-i18n_title="mcWpSlowdownHelp"></div>\r
                        </div>\r
                    </div>\r
                </div>\r
            </div>\r
            <!-- left wrapper -->\r
\r
            <div class="rightWrapper">\r
                <div class="config-section gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="multirotorBrakingConfiguration"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
\r
                        <div class="number">\r
                            <input id="brakingSpeedThreshold" type="number" data-unit="cms" data-setting="nav_mc_braking_speed_threshold" data-setting-multiplier="1" step="1" min="0" max="1000" />\r
                            <label for="brakingSpeedThreshold"><span data-i18n="brakingSpeedThreshold"></span></label>\r
                            <div for="brakingSpeedThreshold" class="helpicon cf_tip" data-i18n_title="brakingSpeedThresholdTip"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="brakingDisengageSpeed" type="number" data-unit="cms" data-setting="nav_mc_braking_disengage_speed" data-setting-multiplier="1" step="1" min="0" max="1000" />\r
                            <label for="brakingDisengageSpeed"><span data-i18n="brakingDisengageSpeed"></span></label>\r
                            <div for="brakingDisengageSpeed" class="helpicon cf_tip" data-i18n_title="brakingDisengageSpeedTip"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="brakingTimeout" type="number" data-unit="msec" data-setting="nav_mc_braking_timeout" data-setting-multiplier="1" step="1" min="100" max="5000" />\r
                            <label for="brakingTimeout"><span data-i18n="brakingTimeout"></span></label>\r
                            <div for="brakingTimeout" class="helpicon cf_tip" data-i18n_title="brakingTimeoutTip"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="brakingBoostFactor" type="number" data-setting="nav_mc_braking_boost_factor" data-setting-multiplier="1" step="1" min="0" max="200" />\r
                            <label for="brakingBoostFactor"><span data-i18n="brakingBoostFactor"></span></label>\r
                            <div for="brakingBoostFactor" class="helpicon cf_tip" data-i18n_title="brakingBoostFactorTip"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="brakingBoostTimeout" type="number" data-unit="msec" data-setting="nav_mc_braking_boost_timeout" data-setting-multiplier="1" step="1" min="0" max="5000" />\r
                            <label for="brakingBoostTimeout"><span data-i18n="brakingBoostTimeout"></span></label>\r
                            <div for="brakingBoostTimeout" class="helpicon cf_tip" data-i18n_title="brakingBoostTimeoutTip"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="brakingBoostSpeedThreshold" type="number" data-unit="cms" data-setting="nav_mc_braking_boost_speed_threshold" data-setting-multiplier="1" step="1" min="100" max="1000" />\r
                            <label for="brakingBoostSpeedThreshold"><span data-i18n="brakingBoostSpeedThreshold"></span></label>\r
                            <div for="brakingBoostSpeedThreshold" class="helpicon cf_tip" data-i18n_title="brakingBoostSpeedThresholdTip"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="brakingBoostDisengageSpeed" type="number" data-unit="cms" data-setting="nav_mc_braking_boost_disengage_speed" data-setting-multiplier="1" step="1" min="100" max="1000" />\r
                            <label for="brakingBoostDisengageSpeed"><span data-i18n="brakingBoostDisengageSpeed"></span></label>\r
                            <div for="brakingBoostDisengageSpeed" class="helpicon cf_tip" data-i18n_title="brakingBoostDisengageSpeedTip"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="brakingBankAngle" type="number" data-unit="deg" data-setting="nav_mc_braking_bank_angle" data-setting-multiplier="1" step="1" min="15" max="60" />\r
                            <label for="brakingBankAngle"><span data-i18n="brakingBankAngle"></span></label>\r
                            <div for="brakingBankAngle" class="helpicon cf_tip" data-i18n_title="brakingBankAngleTip"></div>\r
                        </div>\r
\r
                    </div>\r
                </div>\r
            </div>\r
            <!-- right wrapper -->\r
\r
            <div class="clear-both"></div>\r
        </div>\r
        <!-- Multirotor Advanced Tuning -->\r
\r
        <!-- Common tuning -->\r
        <div class="tab_subtitle" data-i18n="tabAdvancedTuningGenericTitle">Advanced Tuning: Generic settings</div>\r
        <div>\r
            <div class="leftWrapper">\r
\r
                <div class="config-section gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="rthConfiguration"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
\r
                        <div class="select">\r
                            <select id="rthAltControlMode" data-setting="nav_rth_alt_mode"></select>\r
                            <label for="rthAltControlMode"><span data-i18n="rthAltControlMode"></span></label>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input type="number" id="rthAltitude" data-unit="cm" data-setting="nav_rth_altitude" data-setting-multiplier="1" step="1" min="0" max="65000" />\r
                            <label for="rthAltitude"><span data-i18n="rthAltitude"></span></label>\r
                            <div for="rthAltitude" class="helpicon cf_tip" data-i18n_title="rthAltitudeHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input type="number" id="rthHomeAltitude" data-unit="cm" data-setting="nav_rth_home_altitude" data-setting-multiplier="1" step="1" min="0" max="65000" />\r
                            <label for="rthHomeAltitude"><span data-i18n="rthHomeAltitudeLabel"></span></label>\r
                            <div for="rthHomeAltitude" class="helpicon cf_tip" data-i18n_title="rthHomeAltitudeHelp"></div>\r
                        </div>\r
\r
                        <div class="select">\r
                            <select id="rth-climb-first" data-setting="nav_rth_climb_first"></select>\r
                            <label for="rth-climb-first"><span data-i18n="rthClimbFirst"></span></label>\r
                            <div for="rth-climb-first" class="helpicon cf_tip" data-i18n_title="rthClimbFirstHelp"></div>\r
                        </div>\r
\r
                        <div class="select">\r
                            <select id="rthTwoStage" data-setting="nav_rth_climb_first_stage_mode"></select>\r
                            <label for="rthTwoStage"><span data-i18n="rthTwoStage"></span></label>\r
                            <div for="rthTwoStage" class="helpicon cf_tip" data-i18n_title="rthTwoStageHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input type="number" id="rthTwoStageAlt" data-unit="cm" data-setting="nav_rth_climb_first_stage_altitude" data-setting-multiplier="1" step="1" min="0" max="65000" />\r
                            <label for="rthTwoStageAlt"><span data-i18n="rthTwoStageAlt"></span></label>\r
                            <div for="rthTwoStageAlt" class="helpicon cf_tip" data-i18n_title="rthTwoStageAltHelp"></div>\r
                        </div>\r
\r
                        <div class="checkbox">\r
                            <input type="checkbox" class="toggle update_preview" id="rthUseLinearDescent" data-setting="nav_rth_use_linear_descent" data-live="true" />\r
                            <label for="rthUseLinearDescent"><span data-i18n="rthUseLinearDescent"></span></label>\r
                            <div for="rthUseLinearDescent" class="helpicon cf_tip" data-i18n_title="rthUseLinearDescentHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input type="number" id="rthLinearDescentStart" data-unit="m" data-setting="nav_rth_linear_descent_start_distance" data-setting-multiplier="1" step="1" min="0" max="10000" />\r
                            <label for="rthLinearDescentStart"><span data-i18n="rthLinearDescentStart"></span></label>\r
                            <div for="rthLinearDescentStart" class="helpicon cf_tip" data-i18n_title="rthLinearDescentStartHelp"></div>\r
                        </div>\r
\r
                        <div class="checkbox">\r
                            <input type="checkbox" class="toggle update_preview" id="rthClimbIgnoreEmergency" data-setting="nav_rth_climb_ignore_emerg" data-live="true" />\r
                            <label for="rthClimbIgnoreEmergency"><span data-i18n="rthClimbIgnoreEmergency"></span></label>\r
                        </div>\r
\r
                        <div class="checkbox">\r
                            <input type="checkbox" class="toggle update_preview" id="rthAltControlOverride" data-setting="nav_rth_alt_control_override" data-live="true" />\r
                            <label for="rthAltControlOverride"><span data-i18n="rthAltControlOverride"></span></label>\r
                            <div for="rthAltControlOverride" class="helpicon cf_tip" data-i18n_title="rthAltControlOverrideHelp"></div>\r
                        </div>\r
\r
                        <div class="select">\r
                            <select id="rthTrackBack" data-setting="nav_rth_trackback_mode"></select>\r
                            <label for="rthTrackBack"><span data-i18n="rthTrackBack"></span></label>\r
                            <div for="rthTrackBack" class="helpicon cf_tip" data-i18n_title="rthTrackBackHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input type="number" id="rthTrackBackDistance" data-unit="m" data-setting="nav_rth_trackback_distance" data-setting-multiplier="1" step="1" min="50" max="2000" />\r
                            <label for="rthTrackBackDistance"><span data-i18n="rthTrackBackDistance"></span></label>\r
                            <div for="rthTrackBackDistance" class="helpicon cf_tip" data-i18n_title="rthTrackBackDistanceHelp"></div>\r
                        </div>\r
\r
                        <div class="select">\r
                            <select id="rthSafeHome" data-setting="safehome_usage_mode"></select>\r
                            <label for="rthSafeHome"><span data-i18n="rthSafeHome"></span></label>\r
                            <div for="rthSafeHome" class="helpicon cf_tip" data-i18n_title="rthSafeHomeHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input type="number" id="rthTrackBackDistance" data-unit="cm" data-setting="safehome_max_distance" data-setting-multiplier="1" step="1" min="0" max="65000" />\r
                            <label for="rthSafeHomeDistance"><span data-i18n="rthSafeHomeDistance"></span></label>\r
                            <div for="rthSafeHomeDistance" class="helpicon cf_tip" data-i18n_title="rthSafeHomeDistanceHelp"></div>\r
                        </div>\r
\r
                        <div class="checkbox notFixedWingTuning">\r
                            <input type="checkbox" class="toggle update_preview" id="rthTailFirst" data-setting="nav_rth_tail_first" data-live="true" />\r
                            <label for="rthTailFirst"><span data-i18n="rthTailFirst"></span></label>\r
                        </div>\r
\r
                        <div class="select">\r
                            <select id="rthAllowLanding" data-setting="nav_rth_allow_landing"></select>\r
                            <label for="rthAllowLanding"><span data-i18n="rthAllowLanding"></span></label>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="rth-min-distance" type="number" data-unit="cm" data-setting="nav_min_rth_distance" data-setting-multiplier="1" step="1" min="0" max="5000" />\r
                            <label for="rth-min-distance"><span data-i18n="minRthDistance"></span></label>\r
                            <div for="rth-min-distance" class="helpicon cf_tip" data-i18n_title="minRthDistanceHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="rthAbortThreshold" type="number" data-unit="cm" data-setting="nav_rth_abort_threshold" data-setting-multiplier="1" step="1" min="0" max="65000" />\r
                            <label for="rthAbortThreshold"><span data-i18n="rthAbortThreshold"></span></label>\r
                            <div for="rthAbortThreshold" class="helpicon cf_tip" data-i18n_title="rthAbortThresholdHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input id="fsMissionDelay" type="number" data-unit="sec" data-setting="failsafe_mission_delay" data-setting-multiplier="1" step="1" min="-1" max="600" />\r
                            <label for="fsMissionDelay"><span data-i18n="fsMissionDelay"></span></label>\r
                            <div for="fsMissionDelay" class="helpicon cf_tip" data-i18n_title="fsMissionDelayHelp"></div>\r
                        </div>\r
                        <!--\r
                        <div class="checkbox">\r
                            <input type="checkbox" class="toggle update_preview" id="drNavigation" data-setting="inav_allow_dead_reckoning" data-live="true" />\r
                            <label for="drNavigation"><span data-i18n="drNavigation"></span></label>\r
                            <div for="drNavigation" class="helpicon cf_tip" data-i18n_title="drNavigationHelp"></div>\r
                        </div>\r
-->\r
                    </div>\r
                </div>\r
                <div id="geozoneSettings" class="config-section gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="GeozoneSettings"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <div class="number">\r
                            <input type="number" id="geozoneDetectionDistance" data-unit="cm" data-setting="geozone_detection_distance" data-setting-multiplier="1" step="1" min="0" max="1000000" />\r
                            <label for="geozoneDetectionDistance"><span data-i18n="geozoneDetectionDistance"></span></label>\r
                            <div for="geozoneDetectionDistance" class="helpicon cf_tip" data-i18n_title="geozoneDetectionDistanceHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="geozoneAvoidAltitudeRange" data-unit="cm" data-setting="geozone_avoid_altitude_range" data-setting-multiplier="1" step="1" min="0" max="1000000" />\r
                            <label for="geozoneAvoidAltitudeRange"><span data-i18n="geozoneAvoidAltitudeRange"></span></label>\r
                            <div for="geozoneAvoidAltitudeRange" class="helpicon cf_tip" data-i18n_title="geozoneAvoidAltitudeRangeHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="geozoneSafeAltitudeDistance" data-unit="cm" data-setting="geozone_safe_altitude_distance" data-setting-multiplier="1" step="1" min="0" max="10000" />\r
                            <label for="geozoneSafeAltitudeDistance"><span data-i18n="geozoneSafeAltitudeDistance"></span></label>\r
                            <div for="geozoneSafeAltitudeDistance" class="helpicon cf_tip" data-i18n_title="geozoneSafeAltitudeDistanceHelp"></div>\r
                        </div>\r
                        <div class="checkbox">\r
                            <input type="checkbox" class="toggle update_preview" id="geozoneSafehomeAsInclusive" data-setting="geozone_safehome_as_inclusive" data-live="true" />\r
                            <label for="geozoneSafehomeAsInclusive"><span data-i18n="geozoneSafehomeAsInclusive"></span></label>\r
                            <div for="geozoneSafehomeAsInclusive" class="helpicon cf_tip" data-i18n_title="geozoneSafehomeAsInclusiveHelp"></div>\r
                        </div>\r
                        <div class="select">\r
                            <select id="geozoneSafehomeZoneAction" data-setting="geozone_safehome_zone_action"></select>\r
                            <label for="geozoneSafehomeZoneAction"><span data-i18n="geozoneSafehomeZoneAction"></span></label>\r
                            <div for="geozoneSafehomeZoneAction" class="helpicon cf_tip" data-i18n_title="geozoneSafehomeZoneActionHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="geozoneMrStopDistance" data-unit="cm" data-setting="geozone_mr_stop_distance" data-setting-multiplier="1" step="1" min="0" max="1000000" />\r
                            <label for="geozoneMrStopDistance"><span data-i18n="geozoneMrStopDistance"></span></label>\r
                            <div for="geozoneMrStopDistance" class="helpicon cf_tip" data-i18n_title="geozoneMrStopDistanceHelp"></div>\r
                        </div>\r
                        <div class="select">\r
                            <select id="geozoneNoWayHomeAction" data-setting="geozone_no_way_home_action"></select>\r
                            <label for="geozoneNoWayHomeAction"><span data-i18n="geozoneNoWayHomeAction"></span></label>\r
                            <div for="geozoneNoWayHomeAction" class="helpicon cf_tip" data-i18n_title="geozoneNoWayHomeActionHelp"></div>\r
                        </div>\r
                    </div>\r
                </div>\r
\r
            </div>\r
            <!-- Left wrapper -->\r
\r
            <div class="rightWrapper">\r
\r
                <div class="config-setion gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="generalNavigationSettings"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
\r
                        <div class="number">\r
                            <input type="number" id="navMaxAltitude" data-unit="cm" data-setting="nav_max_altitude" data-setting-multiplier="1" step="1" min="0" max="65000" />\r
                            <label for="navMaxAltitude"><span data-i18n="navMaxAltitude"></span></label>\r
                            <div for="navMaxAltitude" class="helpicon cf_tip" data-i18n_title="navMaxAltitudeHelp"></div>\r
                        </div>\r
\r
                        <div class="select">\r
                            <select id="navMotorStop" data-setting="nav_overrides_motor_stop"></select>\r
                            <label for="navMotorStop"><span data-i18n="navMotorStop"></span></label>\r
                            <div for="navMotorStop" class="helpicon cf_tip" data-i18n_title="navMotorStopHelp"></div>\r
                        </div>\r
\r
                    </div>\r
                </div>\r
\r
                <div class="config-section gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="waypointConfiguration"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
\r
                        <div class="number">\r
                            <input type="number" id="waypointRadius" data-unit="cm" data-setting="nav_wp_radius" data-setting-multiplier="1" step="1" min="10" max="10000" />\r
                            <label for="waypointRadius"><span data-i18n="waypointRadius"></span></label>\r
                            <div for="waypointRadius" class="helpicon cf_tip" data-i18n_title="waypointRadiusHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input type="number" id="waypointSafeDistance" data-unit="m" data-setting="nav_wp_max_safe_distance" data-setting-multiplier="1" step="1" min="0" max="1500" />\r
                            <label for="waypointSafeDistance"><span data-i18n="waypointSafeDistance"></span></label>\r
                            <div for="waypointSafeDistance" class="helpicon cf_tip" data-i18n_title="waypointSafeDistanceHelp"></div>\r
                        </div>\r
\r
                        <div class="checkbox">\r
                            <input type="checkbox" class="toggle update_preview" id="wpLoadBoot" data-setting="nav_wp_load_on_boot" data-live="true" />\r
                            <label for="wpLoadBoot"><span data-i18n="wpLoadBoot"></span></label>\r
                            <div for="wpLoadBoot" class="helpicon cf_tip" data-i18n_title="wpLoadBootHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input type="number" id="wpEnforceAlt" data-unit="cm" data-setting="nav_wp_enforce_altitude" data-setting-multiplier="1" step="1" min="0" max="2000" />\r
                            <label for="wpEnforceAlt"><span data-i18n="wpEnforceAlt"></span></label>\r
                            <div for="wpEnforceAlt" class="helpicon cf_tip" data-i18n_title="wpEnforceAltHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input type="number" id="wpTrackingAccuracy" data-setting="nav_fw_wp_tracking_accuracy" data-setting-multiplier="1" step="1" min="0" max="10" />\r
                            <label for="wpTrackingAccuracy"><span data-i18n="wpTrackingAccuracy"></span></label>\r
                            <div for="wpTrackingAccuracy" class="helpicon cf_tip" data-i18n_title="wpTrackingAccuracyHelp"></div>\r
                        </div>\r
\r
                        <div class="number">\r
                            <input type="number" id="wpTrackingAngle" data-unit="deg" data-setting="nav_fw_wp_tracking_max_angle" data-setting-multiplier="1" step="1" min="30" max="80" />\r
                            <label for="wpTrackingAngle"><span data-i18n="wpTrackingAngle"></span></label>\r
                            <div for="wpTrackingAngle" class="helpicon cf_tip" data-i18n_title="wpTrackingAngleHelp"></div>\r
                        </div>\r
\r
                        <div class="select">\r
                            <select id="wpTurnSmoothing" data-setting="nav_fw_wp_turn_smoothing"></select>\r
                            <label for="wpTurnSmoothing"><span data-i18n="wpTurnSmoothing"></span></label>\r
                            <div for="wpTurnSmoothing" class="helpicon cf_tip" data-i18n_title="wpTurnSmoothingHelp"></div>\r
                        </div>\r
\r
                        <div class="select">\r
                            <select id="wpRestartMission" data-setting="nav_wp_mission_restart"></select>\r
                            <label for="wpRestartMission"><span data-i18n="wpRestartMission"></span></label>\r
                            <div for="wpRestartMission" class="helpicon cf_tip" data-i18n_title="wpRestartMissionHelp"></div>\r
                        </div>\r
\r
                    </div>\r
                </div>\r
\r
                <div class="config-section gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="autoLandingSettings"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <div class="number">\r
                            <input id="landMaxAltVspd" type="number" data-unit="v-cms" data-setting="nav_land_maxalt_vspd" data-setting-multiplier="1" step="1" min="100" max="2000" />\r
                            <label for="landMaxAltVspd"><span data-i18n="landMaxAltVspd"></span></label>\r
                            <div for="landMaxAltVspd" class="helpicon cf_tip" data-i18n_title="landMaxAltVspdHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input id="landSlowdownMaxAlt" type="number" data-unit="cm" data-setting="nav_land_slowdown_maxalt" data-setting-multiplier="1" step="1" min="500" max="4000" />\r
                            <label for="landSlowdownMaxAlt"><span data-i18n="landSlowdownMaxAlt"></span></label>\r
                            <div for="landSlowdownMaxAlt" class="helpicon cf_tip" data-i18n_title="landSlowdownMaxAltHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input id="landSlowdownMinAlt" type="number" data-unit="cm" data-setting="nav_land_slowdown_minalt" data-setting-multiplier="1" step="1" min="50" max="1000" />\r
                            <label for="landSlowdownMinAlt"><span data-i18n="landSlowdownMinAlt"></span></label>\r
                        </div>\r
                        <div class="number">\r
                            <input id="landMinAltVspd" type="number" data-unit="v-cms" data-setting="nav_land_minalt_vspd" data-setting-multiplier="1" step="1" min="50" max="500" />\r
                            <label for="landMinAltVspd"><span data-i18n="landMinAltVspd"></span></label>\r
                            <div for="landMinAltVspd" class="helpicon cf_tip" data-i18n_title="landMinAltVspdHelp"></div>\r
                        </div>\r
                        <div class="number">\r
                            <input id="emergencyDescentRate" type="number" data-unit="cms" data-setting="nav_emerg_landing_speed" data-setting-multiplier="1" step="1" min="100" max="2000" />\r
                            <label for="emergencyDescentRate"><span data-i18n="emergencyDescentRate"></span></label>\r
                        </div>\r
                    </div>\r
                </div>\r
\r
            </div>\r
            <!-- Right wrapper -->\r
\r
        </div>\r
        <!-- Common tuning -->\r
\r
        <div class="clear-both"></div>\r
\r
    </div>\r
\r
    <div class="content_toolbar">\r
        <div class="btn save_btn">\r
            <a id="advanced-tuning-save-button" class="save" href="#" data-i18n="advancedTuningSave"></a>\r
        </div>\r
    </div>\r
</div>\r
`;export{n as default};
