const i=`<div class="tab-sitl toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <div class="tab_title" data-i18n="tabSitl">SITL</div>\r
        <div class="note" style="margin-bottom: 20px;">\r
            <div class="note_spacer">\r
                <p data-i18n="sitlHelp"></p>\r
            </div>\r
        </div>\r
        <div class="leftWrapper">\r
            <div class="gui_box grey">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="sitlProfiles"></div>\r
                    <div class="helpicon cf_tip" data-i18n_title="sitlProfilesHelp"></div>\r
                </div>\r
                <div class="sitlProfile_box">\r
                    <div class="sitlProfile_select">\r
                        <select id="sitlProfile"></select>\r
                    </div>\r
                    <div class="default_btn sitlnarrow">\r
                        <a id="sitlProfileNew" href="#" i18n="sitlNew"></a>\r
                    </div>\r
                    <div class="default_btn sitlnarrow">\r
                        <a id="sitlProfileSave" href="#" i18n="sitlSave"></a>\r
                    </div>\r
                    <div class="default_btn sitlnarrow">\r
                        <a id="sitlProfileDelete" href="#" i18n="sitlDelete"></a>\r
                    </div>\r
                </div>\r
            </div>\r
            <div class="config-section gui_box grey">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="sitlOptions"></div>\r
                </div>\r
                <div class="spacer_box">\r
                    <div class="checkbox">\r
                        <input type="checkbox" id="sitlEnableSim" class="toggle" data-live="true">\r
                        <label for="enableSim"><span data-i18n="sitlEnableSim"></span></label>\r
                        <div class="helpicon cf_tip" data-i18n_title="sitlEnableSimulatorHelp"></div>\r
                    </div>\r
                    <div class="select">\r
                        <select id="simulator"></select>\r
                        <label for="simulator"> <span data-i18n="sitlSimulator"></span></label>\r
                    </div>\r
                    <div class="number">    \r
                        <input type="text" id="simIP" data-setting="simip" data-live="true" />\r
                        <label for="simIP" class="sitlNumber"><span data-i18n="sitlSimIP"></span></label>\r
                        <div class="helpicon cf_tip" data-i18n_title="sitlIpHelp"></div>\r
                    </div>\r
                    <div class="number">\r
                        <input type="number" id="simPort" data-setting-multiplier="1" step="1" min="1" max="64500" />\r
                        <label for="sitlPort" class="sitlNumber"><span data-i18n="sitlPort"></span></label>\r
                        <div class="helpicon cf_tip" data-i18n_title="sitlPortHelp"></div>\r
                    </div>\r
                    <div class="checkbox">\r
                        <input type="checkbox" id="sitlUseImu" class="sitlUseImu toggle" data-live="true">\r
                        <label for="sitlUseImu"><span data-i18n="sitlUseImu"></span></label>\r
                        <div class="helpicon cf_tip" data-i18n_title="sitlUseImuHelp"></div>\r
                    </div>\r
                </div>\r
            </div>\r
            <div class="gui_box grey">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="sitlLog"></div>\r
                </div>\r
                <div class="spacer_box">\r
                    <textarea readonly id="sitlLog" rows="25"></textarea>\r
                </div>\r
            </div>\r
        </div>\r
        <div class="rightWrapper">\r
            <div class="gui_box grey">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="sitlChannelMap"></div>\r
                </div>\r
                <div class="spacer_box">\r
                    <table id="channelMap-table" class="map-table">\r
                        <thead>\r
                            <tr>\r
                                <th style="width: 100px" data-i18n="sitlSimInput"></th>\r
                                <th style="width: 100px" data-i18n="sitlInavOutput"></th>\r
                            </tr>\r
                        </thead>\r
                        <tbody class="mapTableBody">\r
\r
                        </tbody>\r
                    </table>\r
                </div>\r
            </div>\r
            <div class="config-section gui_box grey">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="serialReceiver"></div>\r
                    <div class="helpicon cf_tip" data-i18n_title="sitlSerialReceiverHelp"></div>\r
                </div>\r
                <div class="spacer_box">\r
                    <div class="checkbox">\r
                        <input type="checkbox" id="serialReceiverEnable" class="toggle" data-live="true">\r
                        <label for="serialReceiverEnable"><span data-i18n="sitlSerialReceiverEnable"></span></label>\r
                    </div>\r
                    <span id="serialTcpOptions"> \r
                        <div class="select">\r
                            <select id="sitlSerialPort"></select>\r
                            <label for="sitlSerialPort"> <span data-i18n="sitlSerialPort"></span></label>\r
                        </div>\r
                        <div class="select">\r
                            <select id="sitlSerialUART">\r
                                <option value="1">UART1</option>\r
                                <option value="2">UART2</option>\r
                                <option value="3">UART3</option>\r
                                <option value="4">UART4</option>\r
                                <option value="5">UART5</option>\r
                                <option value="6">UART6</option>\r
                                <option value="7">UART7</option>\r
                                <option value="8">UART8</option>\r
                            </select>\r
                            <label for="sitlSerialUART"> <span data-i18n="sitlSerialUART"></span></label>\r
                        </div>\r
                        <div class="select">\r
                            <select id="serialProtocoll"></select>\r
                            <label for="serialProtocoll"> <span data-i18n="sitlSerialProtocoll"></span></label>\r
                        </div>\r
                        <div class="number">\r
                            <input type="number" id="sitlBaud" class="sitlBaud" data-setting-multiplier="1" step="1" min="1" max="921600" />\r
                            <label for="sitlBaud" class="sitlNumber"><span data-i18n="configurationGPSBaudrate"></span></label>\r
                        </div>\r
                        <div class="select">\r
                            <select id="serialStopbits">\r
                                <option value="None">None</option>\r
                                <option value="One">One</option>\r
                                <option value="Two">Two</option>\r
                            </select>\r
                            <label for="serialStopbits"> <span data-i18n="sitlSerialStopbits"></span></label>\r
                        </div>\r
                        <div class="select">\r
                            <select id="serialParity">\r
                                <option value="None">None</option>\r
                                <option value="Even">Even</option>\r
                                <option value="Odd">Odd</option>\r
                            </select>\r
                            <label for="serialParity"> <span data-i18n="sitlSerialParity"></span></label>\r
                        </div>\r
                    </span>\r
                </div>\r
            </div>\r
        </div>\r
    </div>\r
    <div class="content_toolbar" style="position: unset;">\r
        <div class="btn">\r
            <a class="sitlStop disabled" href="#" i18n="sitlStop"></a>\r
        </div>\r
        <div class="btn">\r
            <a class="sitlStart" href="#" i18n="sitlStart"></a>\r
        </div>\r
    </div>\r
</div>`;export{i as default};
