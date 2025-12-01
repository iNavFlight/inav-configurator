const r=`<div class="tab-firmware_flasher toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <div class="options gui_box">\r
            <div class="spacer">\r
                <table class="cf_table" style="margin-top: 10px;">\r
                    <tr>\r
                        <td><input class="target_search" placeholder="Search targets..." autocomplete="on"><br />\r
                            <select name="board" id="board_targets">\r
                                <option value="0">Loading ...</option>\r
                        </select></td>\r
                        <td><div class="default_btn narrow">\r
                            <a class="auto_select_target" href="#" i18n="firmwareFlasherButtonAutoSelect"></a>\r
                        </div> \r
                        <span class="autoselect_description description" i18n="firmwareFlasherOnlineSelectBoardDescription"></span></td>\r
                    </tr>\r
                    <tr>\r
                        <td><select name="firmware_version">\r
                                <option value="0">Loading ...</option>\r
                        </select></td>\r
                        <td><span class="description" i18n="firmwareFlasherOnlineSelectFirmwareVersionDescription"></span></td>\r
                    </tr>\r
                    <tr>\r
                        <td><label> <input class="updating toggle" type="checkbox" /> <span\r
                                i18n="firmwareFlasherNoReboot"></span>\r
                        </label></td>\r
                        <td><span class="description" i18n="firmwareFlasherNoRebootDescription"></span></td>\r
                    </tr>\r
                    <tr class="option flash_on_connect_wrapper">\r
                        <td><label> <input class="flash_on_connect toggle" type="checkbox" /> <span\r
                                i18n="firmwareFlasherFlashOnConnect"></span></label></td>\r
\r
                        <td><span class="description" i18n="firmwareFlasherFlashOnConnectDescription"></span></td>\r
                    </tr>\r
                    <tr class="option">\r
                        <td><label> <input class="erase_chip toggle" type="checkbox" /> <span\r
                                i18n="firmwareFlasherFullChipErase"></span>\r
                        </label></td>\r
                        <td><span class="description" i18n="firmwareFlasherFullChipEraseDescription"></span></td>\r
                    </tr>\r
                    <tr class="option manual_baud_rate">\r
                        <td><label> <input class="flash_manual_baud toggle" type="checkbox" /> <span\r
                                i18n="firmwareFlasherManualBaud"></span> <select id="flash_manual_baud_rate"\r
                                title="Baud Rate">\r
                                    <option value="921600">921600</option>\r
                                    <option value="460800">460800</option>\r
                                    <option value="256000" selected="selected">256000</option>\r
                                    <option value="230400">230400</option>\r
                                    <option value="115200">115200</option>\r
                                    <option value="57600">57600</option>\r
                                    <option value="38400">38400</option>\r
                                    <option value="28800">28800</option>\r
                                    <option value="19200">19200</option>\r
                            </select>\r
                        </label></td>\r
                        <td><span class="description" i18n="firmwareFlasherManualBaudDescription"></span></td>\r
                    </tr>\r
                    <tr class="option noboarder">\r
                        <td><label> <input class="show_development_releases toggle" type="checkbox" /> <span\r
                                i18n="firmwareFlasherShowDevelopmentReleases"></span>\r
                        </label></td>\r
                        <td><span class="description" i18n="firmwareFlasherShowDevelopmentReleasesDescription"></span></td>\r
                    </tr>\r
                </table>\r
            </div>\r
        </div>\r
        <div class="clear-both"></div>\r
        <div class="git_info">\r
            <div class="title" i18n="firmwareFlasherGithubInfoHead"></div>\r
            <p>\r
                <strong i18n="firmwareFlasherHash"></strong> <a i18n_title="firmwareFlasherUrl" class="hash" href="#"\r
                    target="_blank"></a><br /> <strong i18n="firmwareFlasherCommiter"></strong> <span class="committer"></span><br />\r
                <strong i18n="firmwareFlasherDate"></strong> <span class="date"></span><br /> <strong\r
                    i18n="firmwareFlasherMessage"></strong> <span class="message"></span>\r
            </p>\r
        </div>\r
        <div class="release_info gui_box">\r
            <div class="gui_box_titlebar darkgrey">\r
                <div class="spacer_box_title" style="text-align: center; color: white;"\r
                    i18n="firmwareFlasherReleaseSummaryHead"></div>\r
            </div>\r
            <div class="spacer" style="margin-bottom: 10px;">\r
                <strong i18n="firmwareFlasherReleaseTarget"></strong> <span class="target"></span><br /> <strong\r
                    i18n="firmwareFlasherReleaseName"></strong> <a i18n_title="firmwareFlasherReleaseUrl" class="name"\r
                    href="#" target="_blank"></a><br /> <strong i18n="firmwareFlasherReleaseFile"></strong> <a\r
                    i18n_title="firmwareFlasherReleaseFileUrl" class="file" href="#" target="_blank"></a><br /> <strong\r
                    i18n="firmwareFlasherReleaseDate"></strong> <span class="date"></span><br /> <strong\r
                    i18n="firmwareFlasherReleaseStatus"></strong> <span class="status"></span><br /> <strong\r
                    i18n="firmwareFlasherReleaseNotes"></strong>\r
                <div class=notes></div>\r
            </div>\r
        </div>\r
        <div class="gui_box gui_warning">\r
            <div class="gui_box_titlebar">\r
                <div class="spacer_box_title" style="text-align: center; color: white;"\r
                    i18n="firmwareFlasherWarningHead">\r
                </div>\r
            </div>\r
            <div class="spacer" style="margin-bottom: 10px;">\r
                <p i18n="firmwareFlasherWarningText"></p>\r
                <br />\r
                <p i18n="firmwareFlasherTargetWarning"></p>\r
            </div>\r
        </div>\r
        <div class="gui_box gui_note">\r
            <div class="gui_box_titlebar">\r
                <div class="spacer_box_title" style="text-align: center; color: black;"\r
                    i18n="firmwareFlasherRecoveryHead">\r
                </div>\r
            </div>\r
            <div class="spacer" style="margin-bottom: 10px;">\r
                <p i18n="firmwareFlasherRecoveryText"></p>\r
            </div>\r
        </div>\r
\r
        <div class="info"><a name="progressbar"></a>\r
            <progress class="progress" value="0" min="0" max="100"></progress>\r
            <span class="progressLabel" i18n="firmwareFlasherLoadFirmwareFile"></span>\r
        </div>\r
    </div>\r
    <div class="content_toolbar">\r
        <div class="btn">\r
            <a class="load_file" href="#" i18n="firmwareFlasherButtonLoadLocal"></a>\r
        </div>\r
        <div class="btn">\r
            <a class="load_remote_file disabled" href="#" i18n="firmwareFlasherButtonLoadOnline"></a>\r
        </div>\r
        <div class="btn">\r
            <a class="flash_firmware disabled" href="#progressbar" i18n="firmwareFlasherFlashFirmware"></a>\r
        </div>\r
    </div>\r
</div>\r
`;export{r as default};
