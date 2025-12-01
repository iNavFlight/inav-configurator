const n=`<div class="tab-led-strip toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <div class="tab_title" i18n="tabLedStrip"></div>\r
        <div class="note spacebottom">\r
            <div class="note_spacer">\r
                <p i18n="ledStripHelp"></p>\r
            </div>\r
        </div>\r
        <div class="mainGrid"></div>\r
        <div class="gridSections">\r
            <div class="block"></div>\r
            <div class="block"></div>\r
            <div class="block"></div>\r
            <div class="block"></div>\r
            <div class="block"></div>\r
            <div class="block"></div>\r
            <div class="block"></div>\r
            <div class="block"></div>\r
            <div class="block"></div>\r
            <div class="block"></div>\r
            <div class="block"></div>\r
            <div class="block"></div>\r
            <div class="block"></div>\r
            <div class="block"></div>\r
            <div class="block"></div>\r
            <div class="block"></div>\r
        </div>\r
        <div class="colorDefineSliders">\r
            <div class="" i18n="ledStripColorSetupTitle"></div>\r
            <div class="colorDefineSliderContainer">\r
                <Label class="colorDefineSliderLabel" i18n="ledStripH"></Label>\r
                <input class="sliderHSV" type="range" min="0" max="359" value="0">\r
                <Label class="colorDefineSliderValue Hvalue">0</Label>\r
            </div>\r
            <div class="colorDefineSliderContainer">\r
                <Label class="colorDefineSliderLabel" i18n="ledStripS"></Label>\r
                <input class="sliderHSV" type="range" min="0" max="255" value="0">\r
                <Label class="colorDefineSliderValue Svalue">0</Label>\r
            </div>\r
            <div class="colorDefineSliderContainer">\r
                <Label class="colorDefineSliderLabel" i18n="ledStripV"></Label>\r
                <input class="sliderHSV" type="range" min="0" max="255" value="0">\r
                <Label class="colorDefineSliderValue Vvalue">0</Label>\r
            </div>\r
        </div>\r
        <div class="controls">\r
            <div class="wires-remaining">\r
                <div></div>\r
                <span i18n="ledStripRemainingText"></span>\r
            </div>\r
            <button class="funcClear" i18n="ledStripClearSelectedButton"></button>\r
            <button class="funcClearAll" i18n="ledStripClearAllButton"></button>\r
\r
            <div class="section" i18n="ledStripFunctionSection"></div>\r
\r
\r
            <div class="select">\r
                <span class="color_section" i18n="ledStripFunctionTitle"></span>\r
                <select class="functionSelect">\r
                    <option value="" i18n="ledStripFunctionNoneOption"></option>\r
                    <option value="function-c" class="" i18n="ledStripFunctionColorOption"></option>\r
                    <option value="function-f" class="" i18n="ledStripFunctionModesOption"></option>\r
                    <option value="function-a" class="" i18n="ledStripFunctionArmOption"></option>\r
                    <option value="function-l" class="extra_functions20" i18n="ledStripFunctionBatteryOption"></option>\r
                    <option value="function-s" class="extra_functions20" i18n="ledStripFunctionRSSIOption"></option>\r
                    <option value="function-g" class="extra_functions20" i18n="ledStripFunctionGPSOption"></option>\r
                    <option value="function-r" class="" i18n="ledStripFunctionRingOption"></option>\r
                    <option value="function-h" class="" i18n="ledStripFunctionChannelOption"></option>\r
                </select>\r
            </div>\r
\r
\r
            <div class="modifiers">\r
                <span class="color_section" i18n="ledStripColorModifierTitle"></span>\r
                <div class="checkbox">\r
                    <input type="checkbox" name="ThrottleHue" class="toggle function-t" />\r
                    <label> <span i18n="ledStripThrottleText"></span></label>\r
                </div>\r
                <div class="checkbox extra_functions20">\r
                    <input type="checkbox" name="LarsonScanner" class="toggle function-o" />\r
                    <label> <span i18n="ledStripLarsonscannerText"></span></label>\r
                </div>\r
            </div>\r
\r
            <div class="blinkers extra_functions20">\r
                <span class="color_section" i18n="ledStripBlinkTitle"></span>\r
                <div class="checkbox blinkOverlay">\r
                    <input type="checkbox" name="blink" class="toggle function-b" />\r
                    <label> <span i18n="ledStripBlinkAlwaysOverlay"></span></label>\r
                </div>\r
                <div class="checkbox landingBlinkOverlay">\r
                    <input type="checkbox" name="landingBlink" class="toggle function-n" />\r
                    <label> <span i18n="ledStripBlinkLandingOverlay"></span></label>\r
                </div>\r
                <span class="color_section" i18n="ledStripStrobeText"></span>\r
                <div class="checkbox strobeOverlay">\r
                    <input type="checkbox" name="strobe" class="toggle function-e" />\r
                    <label> <span i18n="ledStripEnableStrobeLightEffectText"></span></label>\r
                </div>\r
            </div>\r
\r
            <div class="overlays">\r
                <span class="color_section" i18n="ledStripOverlayTitle"></span>\r
                <div class="checkbox warningOverlay">\r
                    <input type="checkbox" name="Warnings" class="toggle function-w" />\r
                    <label> <span i18n="ledStripWarningsOverlay"></span></label>\r
                </div>\r
                <div class="checkbox indicatorOverlay">\r
                    <input type="checkbox" name="Indicator" class="toggle function-i" />\r
                    <label> <span i18n="ledStripIndecatorOverlay"></span></label>\r
                </div>\r
            </div>\r
\r
            <div class="channel_info">\r
                <span class="color_section" i18n="ledStripSelectChannelFromColorList"></span>\r
            </div>\r
\r
            <div class="mode_colors">\r
                <div class="section" i18n="ledStripModeColorsTitle"></div>\r
\r
                <select id="ledStripModeColorsModeSelect" class="modeSelect">\r
                    <option value="0" i18n="ledStripModeColorsModeOrientation"></option>\r
                    <option value="1" i18n="ledStripModeColorsModeHeadfree"></option>\r
                    <option value="2" i18n="ledStripModeColorsModeHorizon"></option>\r
                    <option value="3" i18n="ledStripModeColorsModeAngle"></option>\r
                    <option value="4" i18n="ledStripModeColorsModeMag"></option>\r
                    <option value="5" i18n="ledStripModeColorsModeBaro"></option>\r
                </select>\r
\r
                <button class="mode_color-0-0 dir-n" i18n="ledStripDirN"></button>\r
                <button class="mode_color-0-1 dir-e" i18n="ledStripDirE"></button>\r
                <button class="mode_color-0-2 dir-s" i18n="ledStripDirS"></button>\r
                <button class="mode_color-0-3 dir-w" i18n="ledStripDirW"></button>\r
                <button class="mode_color-0-4 dir-u" i18n="ledStripDirU"></button>\r
                <button class="mode_color-0-5 dir-d" i18n="ledStripDirD"></button>\r
            </div>\r
\r
            <div class="section" i18n="ledStripModesOrientationTitle"></div>\r
            <div class="directions">\r
                <button class="dir-n" i18n="ledStripDirN"></button>\r
                <button class="dir-e" i18n="ledStripDirE"></button>\r
                <button class="dir-s" i18n="ledStripDirS"></button>\r
                <button class="dir-w" i18n="ledStripDirW"></button>\r
                <button class="dir-u" i18n="ledStripDirU"></button>\r
                <button class="dir-d" i18n="ledStripDirD"></button>\r
            </div>\r
\r
            <div class="colors">\r
                <button class="color-0" i18n_title="colorBlack">0</button>\r
                <button class="color-1" i18n_title="colorWhite">1</button>\r
                <button class="color-2" i18n_title="colorRed">2</button>\r
                <button class="color-3" i18n_title="colorOrange">3</button>\r
                <button class="color-4" i18n_title="colorYellow">4</button>\r
                <button class="color-5" i18n_title="colorLimeGreen">5</button>\r
                <button class="color-6" i18n_title="colorGreen">6</button>\r
                <button class="color-7" i18n_title="colorMintGreen">7</button>\r
                <button class="color-8" i18n_title="colorCyan">8</button>\r
                <button class="color-9" i18n_title="colorLightBlue">9</button>\r
                <button class="color-10" i18n_title="colorBlue">10</button>\r
                <button class="color-11" i18n_title="colorDarkViolet">11</button>\r
                <button class="color-12" i18n_title="colorMagenta">12</button>\r
                <button class="color-13" i18n_title="colorDeepPink">13</button>\r
                <button class="color-14" i18n_title="colorBlack">14</button>\r
                <button class="color-15" i18n_title="colorBlack">15</button>\r
            </div>\r
\r
            <div class="special_colors mode_colors">\r
                <div class="section" i18n="ledStripModesSpecialColorsTitle"></div>\r
                <button class="mode_color-6-0" i18n_title="colorGreen" i18n="ledStripModeColorsModeDisarmed"></button>\r
                <button class="mode_color-6-1" i18n_title="colorBlue" i18n="ledStripModeColorsModeArmed"></button>\r
                <button class="mode_color-6-2" i18n_title="colorWhite" i18n="ledStripModeColorsModeAnimation"></button>\r
                <!-- button class="mode_color-6-3" i18n_title="colorBlack">Background</button -->\r
                <button class="mode_color-6-4" i18n_title="colorBlack" i18n="ledStripModeColorsModeBlinkBg"></button>\r
                <button class="mode_color-6-5" i18n_title="colorRed" i18n="ledStripModeColorsModeGPSNoSats"></button>\r
                <button class="mode_color-6-6" i18n_title="colorOrange" i18n="ledStripModeColorsModeGPSNoLock"></button>\r
                <button class="mode_color-6-7" i18n_title="colorGreen" i18n="ledStripModeColorsModeGPSLocked"></button>\r
            </div>\r
\r
            <div class="section" i18n="ledStripWiring"></div>\r
            <div class="wiringMode">\r
                <button class="funcWire w100" i18n="ledStripWiringMode"></button>\r
            </div>\r
            <div class="wiringControls">\r
                <button class="funcWireClearSelect w50" i18n="ledStripWiringClearControl"></button>\r
                <button class="funcWireClear w50" i18n="ledStripWiringClearAllControl"></button>\r
            </div>\r
            <p i18n="ledStripWiringMessage"></p>\r
        </div>\r
\r
        <div class="colorControls">\r
\r
        </div>\r
\r
        <div class="clear-both"></div>\r
    </div>\r
    <div class="content_toolbar">\r
        <div class="btn save_btn">\r
            <a class="save" href="#" i18n="ledStripButtonSave"></a>\r
        </div>\r
    </div>\r
</div>`;export{n as default};
