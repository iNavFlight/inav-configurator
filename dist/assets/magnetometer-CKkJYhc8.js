const n=`<div class="tab-magnetometer toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <div class="tab_title" data-i18n="tabMAGNETOMETER">Magnetometer</div>\r
        <div class="note spacebottom">\r
            <div class="note_spacer">\r
                <p i18n="magnetometerHelp"></p>\r
            </div>\r
        </div>\r
        <div class="cf_column tab-magnetometer-left-wrapper">\r
            <div class="model-and-info">\r
                <div id="interactive_block">\r
                    <div id="canvas_wrapper">\r
                        <canvas id="canvas"></canvas>\r
                            <div class="attitude_info">\r
                            <dl>\r
                                <dt>Heading:</dt>\r
                                <dd class="heading">&nbsp;</dd>\r
                                <dt>Pitch:</dt>\r
                                <dd class="pitch">&nbsp;</dd>\r
                                <dt>Roll:</dt>\r
                                <dd class="roll">&nbsp;</dd>\r
                            </dl>\r
                        </div>\r
                        <div class="attitude_note1" >(Values according to <b>saved</b> settings)</div>\r
                        <div class="attitude_note2" >(North: 0, East: 90, South: 180, West: 270)</div>\r
                    </div>\r
                </div>\r
            </div>\r
        </div>\r
        <div class="cf_column tab-magnetometer-right-wrapper">\r
            <div class="config-section gui_box grey">\r
                <div class="spacer_box">\r
                    <div id="board-alignment-info" class="info-box">\r
                        <span data-i18n="boardInfo"></span>\r
                    </div>\r
\r
                    <table class="axis-table">\r
                        <thead>\r
                            <tr>\r
                                <td style="width: 5%; padding-bottom: 10px;">\r
                                    <p class="table-title">\r
                                        <span data-i18n="axisTableTitleAxis"></span>\r
                                    </p>\r
                                </td>\r
                                <td style="width: 90%; padding-bottom: 10px;">\r
                                    <p class="table-title">\r
                                        <span style="font-weight:normal;">align_board_roll, align_board_pitch, align_board_yaw</span>\r
                                    </p>\r
                                </td>\r
                                <td style="width: 5%; padding-bottom: 10px;">\r
                                    <a class="table-title">\r
                                        <span data-i18n="axisTableTitleValue"></span>\r
                                    </a>\r
\r
                                </td>\r
                            </tr>\r
                        </thead>\r
                        <tbody>\r
                            <tr>\r
                                <td class="info">\r
                                    <p class="title" data-i18n="configurationSensorAlignmentMagRoll"></p>\r
                                </td>\r
                                <td>\r
                                    <div id="board_roll_slider" class="slider"></div>\r
                                </td>\r
                                <td>\r
                                    <input type="number" id="boardAlignRoll" class="tab-magnetometer" data-setting="tz_offset" data-setting-multiplier="1" step="1" min="-180" max="360" />\r
                                </td>\r
                            </tr>\r
                            <tr>\r
                                <td class="info">\r
                                    <p class="title" data-i18n="configurationSensorAlignmentMagPitch" style="margin: 5px"></p>\r
                                </td>\r
                                <td>\r
                                    <div id="board_pitch_slider" class="slider"></div>\r
                                </td>\r
                                <td>\r
                                    <input type="number" id="boardAlignPitch" class="tab-magnetometer" data-setting="tz_offset" data-setting-multiplier="1" step="1" min="-180" max="360" />\r
                                </td>\r
                            </tr>\r
                            <tr>\r
                                <td class="info">\r
                                    <p class="title" data-i18n="configurationSensorAlignmentMagYaw"></p>\r
                                </td>\r
                                <td>\r
                                    <div id="board_yaw_slider" class="slider"></div>\r
                                </td>\r
                                <td>\r
                                    <input type="number" id="boardAlignYaw" class="tab-magnetometer" data-setting="tz_offset" data-setting-multiplier="1" step="1" min="-180" max="360" />\r
                                </td>\r
                            </tr>\r
                        </tbody>\r
                    </table>\r
                    <div class="cli-box">\r
                        <span class="cli-settings-title">CLI:&nbsp;</span><span id="cli_settings_fc"></span>\r
                    </div>\r
                </div>\r
            </div>\r
\r
            <div class="config-section gui_box grey">\r
                <div class="spacer_box">\r
                    <div id="alignment-info" class="info-box">\r
                        <span data-i18n="magnetometerInfo"></span>\r
                    </div>\r
                    <div class="select" style="display: flex; justify-content: left;">\r
                        <select id="magalign" class="magalign" style="width: 210px; flex-grow: 0; flex-shrink: 0">\r
                            <option value="0">Default</option>\r
                            <!-- list generated here -->\r
                        </select>\r
                        <label for="magalign" data-i18n="magnetometerOrientationPreset"></label>\r
                    </div>\r
                    <div class="select" style="display: flex; justify-content: left;">\r
                        <select id="element_to_show" style="width: 210px; flex-grow: 0; flex-shrink: 0">\r
                            <option value="0" selected data-i18n="magnetometerAxes"></option>\r
                            <option value="1">AK8963C</option>\r
                            <option value="2">AK8963N</option>\r
                            <option value="3">AK8975</option>\r
                            <option value="4">AK8975C</option>\r
                            <option value="5">BN-880</option>\r
                            <option value="6">DIATONE Mamba M10 PRO</option>\r
                            <option value="7">FLYWOO GOKU M10 PRO V3</option>\r
                            <option value="8">FOXEER-M10Q-120</option>\r
                            <option value="9">FOXEER-M10Q-180</option>\r
                            <option value="10">FOXEER-M10Q-250</option>\r
                            <option value="11">GEPRC GEP-M10-DQ</option>\r
                            <option value="12">GY-271</option>\r
                            <option value="13">GY-273</option>\r
                            <option value="14">HGLRC-M100-5883</option>\r
                            <option value="15">HMC5833</option>\r
                            <option value="16">HOLYBRO Micro M9N IST8310</option>\r
                            <option value="17">HOLYBRO Micro M10 IST8310</option>\r
                            <option value="18">IST8308</option>\r
                            <option value="19">IST8310</option>\r
                            <option value="20">LIS3MDL</option>\r
                            <option value="21">MAG3110</option>\r
                            <option value="22">MATEK M8Q-5833</option>\r
                            <option value="23">MATEK M9N-5833</option>\r
                            <option value="24">MATEK M10Q-5833</option>\r
                            <option value="25">MLX90393</option>\r
                            <option value="26">MP9250</option>\r
                            <option value="27">QMC5833</option>\r
                            <option value="28">SPEEDYEBEE BZ-251</option>\r
                            <option value="29">WS-M181</option>\r
                            <!-- list generated here -->\r
                        </select>\r
                        <label for="element_to_show" data-i18n="magnetometerElementToShow"></label>\r
                    </div>\r
\r
                    <table class="axis-table">\r
                        <thead>\r
                            <tr>\r
                                <td style="width: 5%; padding-bottom: 10px;">\r
                                    <p class="table-title">\r
                                        <span data-i18n="axisTableTitleAxis"></span>\r
                                    </p>\r
                                </td>\r
                                <td style="width: 90%; padding-bottom: 10px;">\r
                                    <p class="table-title">\r
                                        <span id="align_mag_xxx">align_mag_roll, align_mag_pitch, align_mag_yaw</span>\r
                                    </p>\r
                                </td>\r
                                <td style="width: 5%; padding-bottom: 10px;">\r
                                    <a class="table-title">\r
                                        <span data-i18n="axisTableTitleValue"></span>\r
                                    </a>\r
\r
                                </td>\r
                            </tr>\r
                        </thead>\r
                        <tbody>\r
                            <tr>\r
                                <td class="info">\r
                                    <p class="title" data-i18n="configurationSensorAlignmentMagRoll"></p>\r
                                </td>\r
                                <td>\r
                                    <div id="roll_slider" class="slider"></div>\r
                                </td>\r
                                <td>\r
                                    <input type="number" id="alignRoll" class="tab-magnetometer" data-setting="tz_offset" data-setting-multiplier="1" step="1" min="-180" max="360" />\r
                                </td>\r
                            </tr>\r
                            <tr>\r
                                <td class="info">\r
                                    <p class="title" data-i18n="configurationSensorAlignmentMagPitch" style="margin: 5px"></p>\r
                                </td>\r
                                <td>\r
                                    <div id="pitch_slider" class="slider"></div>\r
                                </td>\r
                                <td>\r
                                    <input type="number" id="alignPitch" class="tab-magnetometer" data-setting="tz_offset" data-setting-multiplier="1" step="1" min="-180" max="360" />\r
                                </td>\r
                            </tr>\r
                            <tr>\r
                                <td class="info">\r
                                    <p class="title" data-i18n="configurationSensorAlignmentMagYaw"></p>\r
                                </td>\r
                                <td>\r
                                    <div id="yaw_slider" class="slider"></div>\r
                                </td>\r
                                <td>\r
                                    <input type="number" id="alignYaw" class="tab-magnetometer" data-setting="tz_offset" data-setting-multiplier="1" step="1" min="-180" max="360" />\r
                                </td>\r
                            </tr>\r
                        </tbody>\r
                    </table>\r
                    <div class="cli-box">\r
                        <span class="cli-settings-title">CLI:&nbsp;</span><span id="cli_settings_mag"></span>\r
                    </div>\r
                    <div class="cli-box" style="font-style:normal;">\r
                        <span id="comment_sensor_mag_preset" data-i18n="configurationSensorMagPreset"></span>\r
                        <span id="comment_sensor_mag_angles" data-i18n="configurationSensorMagAngles"></span>\r
                    </div>\r
                </div>\r
            </div>\r
        </div>\r
        <div class="clear-both"></div>\r
    </div>\r
    <div class="content_toolbar supported hide">\r
        <div class="btn save_btn">\r
            <a class="save" href="#" data-i18n="configurationButtonSave"></a>\r
        </div>\r
    </div>\r
\r
</div>\r
\r
<div id="tab-auxiliary-templates">\r
    <table class="modes">\r
        <tbody>\r
            <tr class="mode">\r
                <td class="info">\r
                    <p class="name"></p>\r
                    <div class="buttons">\r
                        <a class="addRange" href="#" i18n="auxiliaryAddRange"></a>\r
                    </div>\r
                </td>\r
                <td class="ranges"></td>\r
            </tr>\r
        </tbody>\r
    </table>\r
    <div class="range">\r
        <div class="channelInfo">\r
            <select class="channel">\r
                <option value=""></option>\r
            </select>\r
            <div class="limits">\r
                <p class="lowerLimit">\r
                    <span i18n="auxiliaryMin"></span>: <span class="lowerLimitValue"></span>\r
                </p>\r
                <p class="upperLimit">\r
                    <span i18n="auxiliaryMax"></span>: <span class="upperLimitValue"></span>\r
                </p>\r
            </div>\r
        </div>\r
        <div class="channel-slider pips-channel-range">\r
            <div class="marker"></div>\r
        </div>\r
        <div class="delete">\r
            <a class="deleteRange" href="#">&nbsp;</a>\r
        </div>\r
    </div>\r
    <table>\r
        <tr class="modeSection">\r
            <td colspan="2">\r
                <div class="modeSectionArea">\r
                    <p class="modeSectionName"></p>\r
                </div>\r
            </td>\r
        </tr>\r
    </table>\r
</div>`;export{n as default};
