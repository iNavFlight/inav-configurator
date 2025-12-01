const r=`<!--suppress HtmlFormInputWithoutLabel -->\r
<div class="tab-ports toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <div class="tab_title" data-i18n="tabPorts">Ports</div>\r
        <div class="require-support">\r
            <div class="note spacebottom">\r
                <div class="note_spacer">\r
                    <p data-i18n="portsHelp"></p>\r
                </div>\r
            </div>\r
            <table class="ports spacebottom">\r
                <thead>\r
                    <tr>\r
                        <td i18n="portsIdentifier"></td>\r
                        <td i18n="portsConfiguration"></td>\r
                        <td i18n="portsTelemetryOut"></td>\r
                        <td i18n="portsSerialRx"></td>\r
                        <td data-i18n="portColumnSensors"></td>\r
                        <td class='peripherls-column' i18n="portsPeripherals"></td>\r
                    </tr>\r
                </thead>\r
                <tbody>\r
                </tbody>\r
            </table>\r
            <div class="clear-both"></div>\r
        </div>\r
        <div class="note require-upgrade">\r
            <div class="note_spacer">\r
                <p data-i18n="portsFirmwareUpgradeRequired"></p>\r
            </div>\r
        </div>\r
    </div>\r
    <div class="content_toolbar">\r
        <div class="btn save_btn">\r
            <a class="save" href="#" data-i18n="configurationButtonSave"></a>\r
        </div>\r
    </div>\r
</div>\r
<div id="tab-ports-templates">\r
    <table class="ports">\r
        <thead>\r
        </thead>\r
        <tbody>\r
            <tr class="portConfiguration">\r
                <td class="identifierCell">\r
                    <p><div class="identifier"/> <div class="softSerialWarning"><img src="./images/icons/cf_icon_armed_active.svg" height="16" width="16" data-i18n_title="softSerialWarning"/></div></p>\r
                </td>\r
                <td class="functionsCell-data"><select class="msp_baudrate">\r
                        \r
                </select></td>\r
                <td class="functionsCell-telemetry"><select class="telemetry_baudrate">\r
                        <!-- list generated here -->\r
                </select></td>\r
                <td class="functionsCell-rx"></td>\r
                <td class="functionsCell-sensors"><select class="sensors_baudrate">\r
                        <!-- list generated here -->\r
                </select></td>\r
                <td class="functionsCell-peripherals"><select class="peripherals_baudrate">\r
                        <!-- list generated here -->r\r
                </select></td>\r
            </tr>\r
        </tbody>\r
    </table>\r
</div>\r
\r
<div id="mspWarningContent" class="is-hidden">\r
    <p data-i18n="portsMSPWarning"></p>\r
</div>\r
\r
`;export{r as default};
