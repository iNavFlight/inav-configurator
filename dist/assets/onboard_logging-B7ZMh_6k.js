const a=`<!--suppress HtmlFormInputWithoutLabel -->\r
<div class="tab-onboard_logging toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <div class="tab_title" data-i18n="tabOnboardLogging"></div>\r
        <div class="require-blackbox-unsupported">\r
\r
            <div class="gui_box grey require-blackbox-config-supported">\r
                <div class="gui_box_titlebar">\r
                    <div class="spacer_box_title" data-i18n="blackboxConfiguration"></div>\r
                </div>\r
                <div class="spacer_box config-section">\r
                    <div class="note note_spacer mb1em">\r
                        <p data-i18n="blackboxNotSupported"></p>\r
                    </div>\r
                    <div class="checkbox">\r
                        <input type="checkbox" data-bit="19" class="feature toggle" name="BLACKBOX" title="BLACKBOX" id="feature-19-1">\r
                        <label for="feature-19-1">\r
                            <span data-i18n="featureBLACKBOX"></span>\r
                        </label>\r
                    </div>\r
                    <div class="line">\r
                        <a href="#" class="save-blackbox-feature regular-button" data-i18n="blackboxButtonSave"></a>\r
                    </div>\r
                </div>\r
            </div>\r
        </div>\r
        <div class="require-blackbox-supported">\r
            <div class="leftWrapper">\r
                <div class="config-section gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="blackboxConfiguration"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <div class="checkbox">\r
                            <input checked type="checkbox" data-bit="19" class="feature toggle" name="BLACKBOX" title="BLACKBOX" id="feature-19-2">\r
                            <label for="feature-19-2">\r
                                <span data-i18n="featureBLACKBOX"></span>\r
                            </label>\r
                        </div>\r
                        <div class="select line blackboxDevice">\r
                            <select name="blackbox_device">\r
                        </select>\r
                            <span i18n="onboardLoggingBlackbox"></span>\r
                        </div>\r
                        <div class="select line blackboxRate">\r
                            <select name="blackbox_rate">\r
                        </select>\r
                            <span i18n="onboardLoggingBlackboxRate"></span>\r
                        </div>\r
                    </div>\r
                </div>\r
            </div>\r
            <div class="rightWrapper">\r
                <div class="config-section gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="blackboxFields"></div>\r
                    </div>\r
                    <div id="blackBoxFlagsDiv" class="spacer_box config-section">\r
                    </div>\r
                </div>\r
            </div>\r
\r
            <div class="gui_box grey">\r
                <div class="gui_box_titlebar" align="left">\r
                    <div class="spacer_box_title" data-i18n="serialLogging">\r
                    </div>\r
                </div>\r
                <div class="spacer_box">\r
                    <p data-i18n="serialLoggingSupportedNote"></p>\r
                </div>\r
            </div>\r
\r
            <div class="gui_box grey require-dataflash-supported">\r
                <div class="gui_box_titlebar" align="left">\r
                    <div class="spacer_box_title" data-i18n="onboardLoggingFlashLogger">\r
                    </div>\r
                </div>\r
                <div class="spacer_box">\r
                    <div class="require-dataflash-supported">\r
                        <p data-i18n="dataflashNote"></p>\r
\r
                        <dialog class="dataflash-confirm-erase">\r
                            <h3 data-i18n="dataflashConfirmEraseTitle"></h3>\r
                            <div class="dataflash-confirm-erase-note" data-i18n="dataflashConfirmEraseNote"></div>\r
                            <div class="dataflash-erase-progress">\r
                                <div class="data-loading">\r
                                    <p data-i18n="dataflashEraseing"></p>\r
                                </div>\r
                            </div>\r
                            <div class="buttons">\r
                                <a href="#" class="erase-flash-confirm regular-button" data-i18n="dataflashButtonEraseConfirm"></a>\r
                                <a href="#" class="erase-flash-cancel regular-button" data-i18n="dataflashButtonEraseCancel"></a>\r
                            </div>\r
                        </dialog>\r
\r
                        <dialog class="dataflash-saving">\r
                            <h3 data-i18n="dataflashSavingTitle"></h3>\r
                            <div class="dataflash-saving-before">\r
                                <div data-i18n="dataflashSavingNote"></div>\r
                                <progress value="0" min="0" max="100"></progress>\r
                                <div class="buttons">\r
                                    <a href="#" class="save-flash-cancel regular-button" data-i18n="dataflashButtonSaveCancel"></a>\r
                                </div>\r
                            </div>\r
                            <div class="dataflash-saving-after">\r
                                <div data-i18n="dataflashSavingNoteAfter"></div>\r
                                <div class="buttons">\r
                                    <a href="#" class="save-flash-dismiss regular-button" data-i18n="dataflashButtonSaveDismiss"></a>\r
                                </div>\r
                            </div>\r
                        </dialog>\r
\r
                        <ul class="dataflash-contents">\r
                            <li class="dataflash-used">\r
                                <div class="legend"></div>\r
                            </li>\r
                            <li class="dataflash-free">\r
                                <div class="legend"></div>\r
                            </li>\r
                        </ul>\r
\r
                        <div>\r
                            <a class="regular-button erase-flash" href="#" data-i18n="dataflashButtonErase"></a>\r
                            <a class="regular-button save-flash" href="#" data-i18n="dataflashButtonSaveFile"></a>\r
                        </div>\r
                    </div>\r
\r
                    <p class="require-dataflash-not-present" data-i18n="dataflashNotPresentNote"></p>\r
                    <p class="require-dataflash-unsupported" data-i18n="dataflashFirmwareUpgradeRequired"></p>\r
                </div>\r
            </div>\r
            <div class="require-sdcard-supported">\r
                <div class="gui_box grey">\r
                    <div class="gui_box_titlebar" align="left">\r
                        <div class="spacer_box_title" data-i18n="OnboardSDCard">\r
                        </div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <div class="sdcard">\r
                            <div class="sdcard-icon"></div>\r
                            <div class="sdcard-status"></div>\r
                        </div>\r
\r
                        <p data-i18n="sdcardNote"></p>\r
\r
                        <div class="require-sdcard-ready">\r
                            <ul class="sdcard-contents">\r
                                <li class="sdcard-free">\r
                                    <div class="legend"></div>\r
                                </li>\r
                                <li class="sdcard-other">\r
                                    <div class="legend right"></div>\r
                                </li>\r
                            </ul><bbr />\r
                        </div>\r
                    </div>\r
                </div>\r
            </div>\r
        </div>\r
    </div>\r
    <div class="content_toolbar">\r
        <div class="btn save_btn">\r
            <a href="#" class="save-settings regular-button" data-i18n="blackboxButtonSave"></a>\r
        </div>\r
    </div>\r
</div>\r
`;export{a as default};
