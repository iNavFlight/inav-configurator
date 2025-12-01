const i=`<div class="content_wrapper">\r
    <div id="optionsClose">X</div>\r
    <div class="tab_title"><span data-i18n="options_title"></span>\r
    </div>\r
    \r
    <div class="Wrapper">\r
        <div class="options-section gui_box grey">\r
\r
            <div class="spacer_box settings">\r
                <div class="checkbox notifications">\r
                    <input id="notificationsOptions" type="checkbox" />\r
                    <label for="notificationsOptions"><span data-i18n="options_receive_app_notifications"></span></label>\r
                </div>\r
                <!--\r
                <div class="checkbox statistics">\r
                    <input id="improveConfigurator" type="checkbox" />\r
                    <label for="improveConfigurator"><span data-i18n="options_improve_configurator"></span></label>\r
                </div>\r
                -->\r
                <div class="checkbox show_profile_parameters">\r
                    <input id="showProfileParameters" type="checkbox" />\r
                    <label for="showProfileParameters"><span data-i18n="options_showProfileParameters"></span></label>\r
                </div>\r
                <div class="checkbox cli_autocomplete">\r
                    <input id="cliAutocomplete" type="checkbox" />\r
                    <label for="cliAutocomplete"><span data-i18n="options_cliAutocomplete"></span></label>\r
                </div>\r
                \r
                <div class="select">                    \r
                    <select id="languageOption">\r
                    </select>\r
                    <label for="languageOption" data-i18n="language"></label>\r
                </div>\r
            </div>\r
        </div>\r
\r
        <div class="options-section gui_box grey">\r
\r
            <div class="spacer_box settings">\r
                <div class="select">                    \r
                    <select id="map-provider-type">\r
                        <option value="osm">OpenStreetMap</option>\r
                        <option value="esri">Esri World Imagery</option>\r
                        <option value="mapproxy">MapProxy</option>\r
                    </select>       \r
                    <label for="map-provider-type" data-i18n="mapProvider"></label>             \r
                </div>\r
                <div class="number">                    \r
                    <input type="text" id="proxyurl" style="border: solid 1px black" />\r
                    <label for="proxyurl" data-i18n="proxyURL"></label>\r
                </div>\r
                <div class="number">                    \r
                    <input type="text" id="proxylayer" style="border: solid 1px black" />\r
                    <label for="proxylayer" data-i18n="proxyLayer"></label>\r
                </div>\r
            </div>\r
        </div>\r
\r
        <div class="options-section gui_box grey">\r
            <div class="gui_box_titlebar">\r
                <div class="spacer_box_title" data-i18n="options_render"></div>\r
            </div>\r
            <div class="spacer_box settings">\r
                <div class="select">\r
                    <select id="ui-unit-type">\r
                        <option value="none">None</option>\r
                        <option value="OSD">OSD</option>\r
                        <option value="imperial">Imperial</option>\r
                        <option value="metric">Metric</option>\r
                    </select>\r
                    <label for="ui-unit-type" data-i18n="options_unit_type"></label>\r
                </div>\r
            </div>\r
        </div>\r
        <div id="resetSitl" class="options-section gui_box grey">\r
            <div class="gui_box_titlebar">\r
                <div class="spacer_box_title" data-i18n="sitlDemoMode"></div>\r
            </div>\r
            <div class="spacer_box settings">\r
                <div class="default_btn" style="float: none; width: 200px;">\r
                    <a id="demoModeReset" href="#" i18n="sitlResetDemoModeData"></a>\r
                </div>\r
            </div>\r
        </div>\r
        <div class="options-section gui_box grey">\r
            <div class="gui_box_titlebar">\r
                <div class="spacer_box_title" data-i18n="maintenance"></div>\r
            </div>\r
            <div class="spacer_box settings">\r
                <div class="default_btn" style="float: none; width: 200px;">\r
                    <a id="maintenanceFlushSettingsCache" href="#" i18n="maintenanceFlushSettingsCache"></a>\r
                </div>\r
            </div>\r
        </div>\r
        <div class="options-section gui_box grey">\r
            <div class="gui_box_titlebar">\r
                <div class="spacer_box_title" data-i18n="gpsOptions"></div>\r
            </div>\r
\r
            <div class="spacer_box settings">\r
                <div class="number">\r
                    <input type="password" id="assistnow-api-key" style="border: solid 1px black" />                \r
                    <label for="assistnow-api-key" data-i18n="gpsOptionsAssistnowToken"></label>                    \r
                </div>\r
            </div>\r
        </div>\r
    </div>\r
</div>`;export{i as default};
