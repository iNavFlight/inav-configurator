const r=`<div class="tab-configuration tab-mixer toolbar_fixed_bottom">\r
    <div class="content_wrapper" id="mixer-main-content">\r
        <div class="tab_title" data-i18n="tabMixer">Mixer</div>\r
        <!-- Top row -->\r
        <div>\r
            <div class="leftWrapper">\r
                <div class="platform-type gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="platformConfiguration"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <div class="select">\r
                            <select id="platform-type"></select>\r
                            <label for="platform-type">\r
                                <span data-i18n="platformType"></span>\r
                            </label>\r
                        </div>\r
                        <div class="radio">\r
                            <fieldset>\r
                            <legend>Motor direction</legend>\r
                            <label for="motor_direction_normal">\r
                                <input id="motor_direction_normal" name="motor_direction_inverted" type="radio"\r
                                        value="0" data-setting="motor_direction_inverted" class="left" />\r
                                <span data-i18n="motor_direction_inverted"></span>\r
                            </label><br class="clear-both"/>\r
\r
                            <label class="checkbox-inline">\r
                                <input id="motor_direction_inverted" name="motor_direction_inverted" type="radio"\r
                                        value="1" data-setting="motor_direction_inverted" class="left"/>\r
                                <span data-i18n="motor_direction_isInverted"></span>\r
                            </span></label>\r
\r
                            <div class="helpicon cf_tip" data-i18n_title="motor_direction_inverted_hint"></div>\r
                          </fieldset>\r
                        </div>\r
\r
\r
                        <div class="checkbox">\r
                            <input id="mixer_control_profile_linking" type="checkbox" class="toggle" data-setting="mixer_control_profile_linking" />\r
                            <label for="mixer_control_profile_linking"><span data-i18n="mixer_control_profile_linking"></span></label>\r
                            <div class="helpicon cf_tip" data-i18n_title="mixer_control_profile_linking_hint"></div>\r
                        </div>\r
                    </div>\r
                </div>\r
            \r
                <div class="platform-type gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="timerOutputs"></div>\r
                    </div>\r
                    <div class="spacer_box" id="timerOutputsList" style="padding: 0; width: calc(100% - 12px)"></div>\r
                </div>\r
\r
            </div>\r
            <div class="rightWrapper">\r
                <div class="platform-type gui_box grey">\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="mixerPresetTitle"></div>\r
                    </div>\r
                    <div class="spacer_box">\r
                        <div class="select position-relative">\r
                            <div class="mixerPreview" style="max-width: 175px">\r
                                <img src="./resources/motor_order/custom.svg" id="motor-mixer-preview-img"/>\r
                                <div class="motorNumber is-hidden" id="motorNumber1">1</div>\r
                                <div class="motorNumber is-hidden" id="motorNumber2">2</div>\r
                                <div class="motorNumber is-hidden" id="motorNumber3">3</div>\r
                                <div class="motorNumber is-hidden" id="motorNumber4">4</div>\r
                            </div>\r
                            <div class="half" style="width: calc(50% - 10px); margin-left: 10px;">\r
                                <select id="mixer-preset"></select>\r
                            </div>\r
\r
                            <div class="mixer-load-button">\r
                                <div id="needToUpdateMixerMessage" class="is-hidden" data-i18n="mixerNotLoaded"></div>\r
                                <div class="btn default_btn narrow red">\r
                                    <a id="load-and-apply-mixer-button" href="#" data-i18n="mixerLoadAndApplyPresetRules"></a>\r
                                </div>\r
                                <div class="btn default_btn narrow">\r
                                    <a id="load-mixer-button" href="#" data-i18n="mixerLoadPresetRules"></a>\r
                                </div>\r
                                <div class="btn default_btn narrow is-hidden">\r
                                    <a id="refresh-mixer-button" href="#" data-i18n="mixerRefreshCurrentRules"></a>\r
                                </div>\r
                            </div>\r
                        </div>\r
                    </div>\r
                </div>\r
                <div class="platform-type gui_box grey" id="mixer-wizard-gui_box" is-hidden>\r
                    <div class="gui_box_titlebar">\r
                        <div class="spacer_box_title" data-i18n="mixerWizard"></div>\r
                    </div>\r
                \r
                    <div class="spacer_box">\r
                        <div class="btn default_btn narrow green">\r
                            <a id="mixer-wizard" href="#" data-i18n="mixerWizard"></a>\r
                        </div>\r
                    </div>\r
                </div>\r
            </div>\r
        </div>\r
        <div class="clear-both"></div>\r
\r
        <div class="gui_box grey">\r
            <div class="gui_box_titlebar">\r
                <div class="spacer_box_title" data-i18n="mappingTableTitle"></div>\r
            </div>\r
            <table class="output-table">\r
                <tr id="output-row">\r
\r
                </tr>\r
                <tr id="function-row">\r
\r
                </tr>\r
            </table>\r
        </div>\r
\r
        <!-- middle row -->\r
        <div class="clear-both"></div>\r
        <!-- bottom row -->\r
        <div class="motor-mixer gui_box grey">\r
            <div class="gui_box_titlebar">\r
                <div class="spacer_box_title" data-i18n="motorMixer"></div>\r
            </div>\r
            <div class="spacer_box">\r
                <table id="motor-mix-table" class="mixer-table">\r
                    <thead>\r
                        <tr>\r
                            <th style="width: 75px" data-i18n="controlAxisMotor"></th>\r
                            <th data-i18n="controlAxisThrottle"></th>\r
                            <th data-i18n="controlAxisRoll"></th>\r
                            <th data-i18n="controlAxisPitch"></th>\r
                            <th data-i18n="controlAxisYaw"></th>\r
                            <th class="delete"></th>\r
                        </tr>\r
                    </thead>\r
                    <tbody>\r
\r
                    </tbody>\r
                </table>\r
                <div class="btn default_btn narrow pull-right green mixer_btn_add">\r
                    <a href="#" data-role="role-motor-add" data-i18n="servoMixerAdd"></a>\r
                </div>\r
            </div>\r
        </div>\r
        <div class="motor-mixer gui_box grey">\r
            <div class="gui_box_titlebar">\r
                <div class="spacer_box_title" data-i18n="servoMixer"></div>\r
            </div>\r
            <div class="spacer_box">\r
                <table id="servo-mix-table" class="mixer-table">\r
                    <thead>\r
                        <tr>\r
                            <th style="width: 75px" data-i18n="servo"></th>\r
                            <th data-i18n="input"></th>\r
                            <th data-i18n="fixedValue" class="mixer-fixed-value-col"></th>\r
                            <th data-i18n="weight"></th>\r
                            <th data-i18n="speed"></th>\r
                            <th data-i18n="active"></th>\r
                            <th class="delete"></th>\r
                        </tr>\r
                    </thead>\r
                    <tbody>\r
\r
                    </tbody>\r
                </table>\r
                <div class="btn default_btn narrow pull-right green mixer_btn_add">\r
                    <a href="#" data-role="role-servo-add" data-i18n="servoMixerAdd"></a>\r
                </div>\r
                <div class="btn default_btn narrow pull-left mixer_btn_logic">\r
                    <a href="#" data-role="role-logic-conditions-open" data-i18n="tabLogicConditions"></a>\r
                </div>\r
            </div>\r
        </div>\r
\r
        <div id="logic-wrapper" style="display: none">\r
            <div class="logic__background"></div>\r
            <div class="logic__content">\r
                <div class="tab_title" data-i18n="tabLogicConditions"></div>\r
                <div class="logic__content--wrapper">\r
                    <table class="mixer-table logic__table">\r
                        <thead>\r
                            <tr>\r
                                <th style="width: 50px" data-i18n="logicId"></th>\r
                                <th style="width: 80px" data-i18n="logicEnabled"></th>\r
                                <th style="width: 120px" data-i18n="logicOperation"></th>\r
                                <th data-i18n="logicOperandA"></th>\r
                                <th data-i18n="logicOperandB"></th>\r
                                <th data-i18n="logicActivator"></th>\r
                                <th data-i18n="logicFlags"></th>\r
                                <th data-i18n="logicStatus"></th>\r
                            </tr>\r
                        </thead>\r
                        <tbody>\r
                        </tbody>\r
                    </table>\r
                </div>\r
                <div class="logic__content--buttons content_toolbar">\r
                    <div class="btn save_btn">\r
                        <a href="#" class="logic__save" data-i18n="logicSave"></a>\r
                    </div>\r
                    <div class="btn save_btn red">\r
                        <a href="#" class="logic__close" data-i18n="logicClose"></a>\r
                    </div>\r
                </div>\r
            </div>\r
        </div>\r
    </div>\r
    <div id="mixerApplyContent" class="is-hidden">\r
        <div class="modal__content">\r
            <h1 class="modal__title modal__title--warning" data-i18n="presetsApplyHeader"></h1>\r
            <div class="modal__text" data-i18n="mixerApplyDescription"></div>\r
        </div>\r
        <div class="modal__buttons">\r
            <a id="execute-button" class="modal__button modal__button--main" data-i18n="mixerButtonSaveAndReboot"></a>\r
        </div>\r
    </div>\r
    <div id="mixerWizardContent" class="is-hidden">\r
        <div class="modal__content">\r
            <h1 class="modal__title modal__title--warning" data-i18n="mixerWizardModalTitle"></h1>\r
            <div class="modal__text">\r
                <p data-i18n="mixerWizardInfo"></p>\r
                <table style="margin-top: 1em;" class="mixer-table">\r
                    <thead>\r
                        <th data-i18n="mixerWizardMotorPosition"></th>\r
                        <th data-i18n="mixerWizardMotorIndex"></th>\r
                    </thead>\r
                    <tbody>\r
                        <tr>\r
                            <th data-i18n="motorWizard0"></th>\r
                            <td>\r
                                <select class="wizard-motor-select" data-motor="0">\r
                                    <option id="0" selected="selected">Motor #1</option>\r
                                    <option id="1">Motor #2</option>\r
                                    <option id="2">Motor #3</option>\r
                                    <option id="3">Motor #4</option>\r
                                </select>\r
                            </td>\r
                        </tr>\r
                        <tr>\r
                            <th data-i18n="motorWizard1"></th>\r
                            <td>\r
                                <select class="wizard-motor-select" data-motor="1">\r
                                    <option id="0">Motor #1</option>\r
                                    <option id="1" selected="selected">Motor #2</option>\r
                                    <option id="2">Motor #3</option>\r
                                    <option id="3">Motor #4</option>\r
                                </select>\r
                            </td>\r
                        </tr>\r
                        <tr>\r
                            <th data-i18n="motorWizard2"></th>\r
                            <td>\r
                                <select class="wizard-motor-select" data-motor="2">\r
                                    <option id="0">Motor #1</option>\r
                                    <option id="1">Motor #2</option>\r
                                    <option id="2" selected="selected">Motor #3</option>\r
                                    <option id="3">Motor #4</option>\r
                                </select>\r
                            </td>\r
                        </tr>\r
                        <tr>\r
                            <th data-i18n="motorWizard3"></th>\r
                            <td>\r
                                <select class="wizard-motor-select" data-motor="3">\r
                                    <option id="0">Motor #1</option>\r
                                    <option id="1">Motor #2</option>\r
                                    <option id="2">Motor #3</option>\r
                                    <option id="3" selected="selected">Motor #4</option>\r
                                </select>\r
                            </td>\r
                        </tr>\r
                    </tbody>\r
                </table>\r
            </div>\r
        </div>\r
\r
        <div class="modal__buttons--upbottom">\r
            <a id="wizard-execute-button" class="modal__button modal__button--main" data-i18n="mixerWizardModalApply"></a>\r
        </div>\r
    </div>\r
    <div class="content_toolbar">\r
        <div class="btn save_btn">\r
            <a id="save-button" class="save" href="#" data-i18n="configurationButtonSave"></a>\r
        </div>\r
    </div>\r
</div>\r
`;export{r as default};
