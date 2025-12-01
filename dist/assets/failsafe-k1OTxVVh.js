const a=`<div class="tab-failsafe toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <div class="tab_title" data-i18n="tabFailsafe">Failsafe</div>\r
        <div class="gui_box grey">\r
            <div class="gui_box_titlebar">\r
                <div class="spacer_box_title" data-i18n="failsafeStageTwoSettingsTitle"></div>\r
            </div>\r
            <div class="spacer_box">\r
                <div class="number">\r
                    <input id="failsafeDelay" type="number" name="failsafe_delay" data-unit="dsec" data-setting="failsafe_delay" min="0" max="200" />\r
                    <label><span data-i18n="failsafeDelayItem"></span></label>\r
                    <div for="failsafeDelay" class="helpicon cf_tip" data-i18n_title="failsafeDelayHelp"></div>\r
                </div>\r
                <!-- radio buttons  -->\r
                <div class="subline" data-i18n="failsafeSubTitle1"></div>\r
                <div class="radioarea pro1">\r
                    <div class="radiobuttons"><input class="procedure" id="drop" name="group1" type="radio" />\r
                        <label for="drop" data-i18n="failsafeProcedureItemSelect2"></label>\r
                    </div>\r
                </div>\r
                <div class="radioarea pro2">\r
                    <div class="radiobuttons"><input class="procedure" id="land" name="group1" type="radio" checked/>\r
                        <label for="land" data-i18n="failsafeProcedureItemSelect1"></label>\r
                    </div>\r
                    <div class="proceduresettings">\r
                        <div class="number">\r
                            <input type="number" name="failsafe_throttle" data-setting="failsafe_throttle" data-unit="us" min="0" max="2000" />\r
                            <label><span data-i18n="failsafeThrottleItem"></span></label>\r
                        </div>\r
                        <div class="number">\r
                            <input id="failsafeOffDelay" type="number" name="failsafe_off_delay" data-setting="failsafe_off_delay" data-unit="dsec" min="0" max="200" />\r
                            <label><span data-i18n="failsafeOffDelayItem"></span></label>\r
                            <div for="failsafeOffDelay" class="helpicon cf_tip" data-i18n_title="failsafeOffDelayHelp"></div>\r
                        </div>\r
                    </div>\r
                </div>\r
                <div class="radioarea pro4">\r
                    <div class="radiobuttons"><input class="procedure" id="rth" name="group1" type="radio" />\r
                        <label for="rth" data-i18n="failsafeProcedureItemSelect3"></label>\r
                    </div>\r
                </div>\r
                <div class="radioarea pro5">\r
                    <div class="radiobuttons"><input class="procedure" id="nothing" name="group1" type="radio" />\r
                        <label for="nothing" data-i18n="failsafeProcedureItemSelect4"></label>\r
                    </div>\r
                </div>\r
                <!-- Minimum Failsafe Distance controls -->\r
                <div class="checkbox">\r
                    <div class="numberspacer">\r
                        <input type="checkbox" name="failsafe_use_minimum_distance" class="toggle" id="failsafe_use_minimum_distance" />\r
                    </div>\r
                    <label for="failsafe_use_minimum_distance"><span data-i18n="failsafeUseMinimumDistanceItem"></span>\r
                    </label>\r
                    <div for="failsafe_use_minimum_distance" class="helpicon cf_tip" data-i18n_title="failsafeUseMinimumDistanceHelp"></div>\r
                </div>\r
\r
                <div class="number" id="failsafe_min_distance_elements">\r
                    <input class="minimumDistance" id="failsafe_min_distance" type="number" data-unit="cm" data-setting="failsafe_min_distance" data-setting-multiplier="1" step="1" min="0" max="65000" />\r
                    <label for="failsafe_min_distance"><span data-i18n="failsafeMinDistanceItem"></span></label>\r
                    <div for="failsafe_min_distance" class="helpicon cf_tip" data-i18n_title="failsafeMinDistanceHelp"></div>\r
                </div>\r
\r
                <div class="select" id="failsafe_min_distance_procedure_elements">\r
                    <select id="failsafe_min_distance_procedure" class="minimumDistance" data-setting="failsafe_min_distance_procedure"></select>\r
                    <label for="failsafe_min_distance_procedure"> <span data-i18n="failsafeMinDistanceProcedureItem"></span></label>\r
                    <div for="failsafe_min_distance_procedure" class="helpicon cf_tip" data-i18n_title="failsafeMinDistanceProcedureHelp"></div>\r
                </div>\r
            </div>\r
        </div>\r
    </div>\r
    <div class="content_toolbar">\r
        <div class="btn save_btn">\r
            <a class="save" href="#" data-i18n="configurationButtonSave"></a>\r
        </div>\r
    </div>\r
</div>`;export{a as default};
