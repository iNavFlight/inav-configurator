const a=`<div class="tab-calibration toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <!-- should be the first DIV on each tab -->\r
        <div class="cf_column full spacerbottom">\r
            <div class="tab_title" data-i18n="tabCalibration">Calibration</div>\r
            <div class="cf_column threefourth_left">\r
                <div class="spacer_right">\r
                    <div class="gui_box grey">\r
                        <div class="gui_box_titlebar">\r
                            <div class="spacer_box_title" data-i18n="calibrationHead1"></div>\r
                        </div>\r
                        <div class="spacer_box">\r
                            <div class="calibHeader">\r
                                <div class="twothird">\r
                                    <div class="note" data-i18n="NoteCalibration"></div>\r
                                </div>\r
                                <div class="third_right">\r
                                    <div class="default_btn">\r
                                        <div id="calib_btn">\r
                                            <a id="calibrate-start-button" class="calibrate" href="#" data-i18n="AccBtn"></a>\r
                                        </div>\r
                                    </div>\r
                                </div>\r
                            </div>\r
                            <div data-step="1" class="tile step1 finished">\r
                                <div class="steptitle" data-i18n="stepTitle1"></div>\r
                                <div class="indicator"></div>\r
                            </div>\r
                            <div data-step="2" class="tile step2 active">\r
                                <div class="steptitle" data-i18n="stepTitle2"></div>\r
                                <div class="indicator"></div>\r
                            </div>\r
                            <div data-step="3" class="tile step3">\r
                                <div class="steptitle" data-i18n="stepTitle3"></div>\r
                                <div class="indicator"></div>\r
                            </div>\r
                            <div data-step="4" class="tile step4">\r
                                <div class="steptitle" data-i18n="stepTitle4"></div>\r
                                <div class="indicator"></div>\r
                            </div>\r
                            <div data-step="5" class="tile step5">\r
                                <div class="steptitle" data-i18n="stepTitle5"></div>\r
                                <div class="indicator"></div>\r
                            </div>\r
                            <div data-step="6" class="tile step6">\r
                                <div class="steptitle" data-i18n="stepTitle6"></div>\r
                                <div class="indicator"></div>\r
                            </div>\r
                            <div class="gui_box grey" id="accPosAll">\r
                                <div class="gui_box_titlebar">\r
                                    <div class="spacer_box_title" data-i18n="calibrationHead2"></div>\r
                                </div>\r
                                <div class="spacer_box">\r
                                    <table class="cf_table acc">\r
                                        <tr>\r
                                            <td data-i18n="accZero"></td>\r
                                            <td><label for="accZeroX"><span>X</span></label><input readonly disabled type="number" name="accZeroX" min="-32768" max="32767"></td>\r
                                            <td><label for="accZeroY"><span>Y</span></label><input readonly disabled type="number" name="accZeroY" min="-32768" max="32767"></td>\r
                                            <td><label for="accZeroZ"><span>Z</span></label><input readonly disabled type="number" name="accZeroZ" min="-32768" max="32767"></td>\r
                                        </tr>\r
                                        <tr>\r
                                            <td data-i18n="accGain"></td>\r
                                            <td><label for="accGainX"><span>X</span></label><input readonly disabled type="number" name="accGainX" min="1" max="8192"></td>\r
                                            <td><label for="accGainY"><span>Y</span></label><input readonly disabled type="number" name="accGainY" min="1" max="8192"></td>\r
                                            <td><label for="accGainZ"><span>Z</span></label><input readonly disabled type="number" name="accGainZ" min="1" max="8192"></td>\r
                                        </tr>\r
                                    </table>\r
                                </div>\r
                            </div>\r
                        </div>\r
                    </div>\r
                </div>\r
            </div>\r
            <div class="cf_column fourth">\r
                <div class="gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="calibrationHead4"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <span data-i18n="MagCalText">text</span>\r
                        <div class="default_btn">\r
                            <div id="mag_btn">\r
                                <a class="calibratemag" href="#" data-i18n="MagBtn"></a>\r
                            </div>\r
                        </div>\r
                        <table id="mag-calibrated-data" class="cf_table">\r
                            <tr>\r
                                <td><label for="MagX" data-i18n="MagXText"><span></span></label></td>\r
                                <td><input readonly disabled type="number" name="MagX" min="-32768" max="32767"></td>\r
                            </tr>\r
                            <tr>\r
                                <td><label for="MagY" data-i18n="MagYText"><span></span></label></td>\r
                                <td><input readonly disabled type="number" name="MagY" min="-32768" max="32767"></td>\r
                            </tr>\r
                            <tr>\r
                                <td><label for="MagZ" data-i18n="MagZText"><span></span></label></td>\r
                                <td><input readonly disabled type="number" name="MagZ" min="-32768" max="32767"></td>\r
                            </tr>\r
                            <tr>\r
                                <td><label for="MagGainX" data-i18n="MagGainXText"><span></span></label></td>\r
                                <td><input readonly disabled type="number" name="MagGainX" min="-32768" max="32767"></td>\r
                            </tr>\r
                            <tr>\r
                                <td><label for="MagGainY" data-i18n="MagGainYText"><span></span></label></td>\r
                                <td><input readonly disabled type="number" name="MagGainY" min="-32768" max="32767"></td>\r
                            </tr>\r
                            <tr>\r
                                <td><label for="MagGainZ" data-i18n="MagGainZText"><span></span></label></td>\r
                                <td><input readonly disabled type="number" name="MagGainZ" min="-32768" max="32767"></td>\r
                            </tr>\r
                        </table>\r
                    </div>\r
                </div>\r
                <div class="gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="calibrationHead5"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <span data-i18n="OpflowCalText">text</span>\r
                        <div class="default_btn">\r
                            <div id="opflow_btn">\r
                                <a class="calibrateopflow" href="#" data-i18n="OpflowCalBtn"></a>\r
                            </div>\r
                        </div>\r
                        <table id="opflow-calibrated-data" class="cf_table">\r
                            <tr>\r
                                <td><label for="OpflowScale"><span data-i18n="OpflowScaleText"></span></label></td>\r
                                <td><input type="number" name="OpflowScale" min="0" max="10000"></td>\r
                            </tr>\r
                        </table>\r
                    </div>\r
                </div>\r
            </div>\r
        </div>\r
    </div>\r
    <div class="content_toolbar">\r
        <div class="btn save_btn">\r
            <a id="calibrateButtonSave" class="save" href="#" data-i18n="configurationButtonSave"></a>\r
        </div>\r
    </div>\r
</div>\r
<div id="modal-acc-calibration-start" class="is-hidden">\r
    <div class="modal__content">\r
        <h1 class="modal__title" data-i18n="accCalibrationStartTitle"></h1>\r
        <div class="modal__text" data-i18n="accCalibrationStartBody"></div>\r
    </div>\r
    <div class="modal__buttons">\r
        <a id="modal-start-button" class="modal__button modal__button--main" data-i18n="OK"></a>\r
    </div>\r
</div>\r
<div id="modal-acc-calibration-stop" class="is-hidden">\r
    <div class="modal__content">\r
        <h1 class="modal__title" data-i18n="accCalibrationStopTitle"></h1>\r
        <div class="modal__text" data-i18n="accCalibrationStopBody"></div>\r
    </div>\r
    <div class="modal__buttons">\r
        <a id="modal-stop-button" class="modal__button modal__button--main" data-i18n="OK"></a>\r
    </div>\r
</div>\r
\r
<div id="modal-acc-processing" class="is-hidden">\r
    <div class="modal__content">\r
        <h1 class="modal__title modal__title--center" data-i18n="accCalibrationProcessing"></h1>\r
    </div>\r
</div>\r
\r
<div id="modal-compass-processing" class="is-hidden">\r
    <div class="modal__content">\r
        <h1 class="modal__title modal__title--center" data-i18n="accCalibrationProcessing"></h1>\r
        <div class="modal-compass-countdown modal__text"></div>\r
    </div>\r
</div>\r
\r
<div id="modal-opflow-processing" class="is-hidden">\r
    <div class="modal__content">\r
        <h1 class="modal__title modal__title--center" data-i18n="accCalibrationProcessing"></h1>\r
        <div id="modal-opflow-countdown" class="modal__text"></div>\r
    </div>\r
</div>\r
`;export{a as default};
