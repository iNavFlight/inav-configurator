const n=`<div class="tab-adjustments toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <div class="tab_title" i18n="tabAdjustments"></div>\r
        <div class="note spacebottom">\r
            <div class="note_spacer">\r
                <p i18n="adjustmentsHelp"></p>\r
                <p i18n="adjustmentsExamples"></p>\r
                <ul>\r
                    <li i18n="adjustmentsExample1"></li>\r
                    <li i18n="adjustmentsExample2"></li>\r
                </ul>\r
            </div>\r
        </div>\r
\r
        <table class="adjustments">\r
            <thead>\r
                <tr>\r
                    <td class="column-enable" i18n="adjustmentsColumnEnable"></td>\r
                    <td i18n="adjustmentsColumnWhenChannel"></td>\r
                    <td i18n="adjustmentsColumnIsInRange"></td>\r
                    <td i18n="adjustmentsColumnThenApplyFunction"></td>\r
                    <td i18n="adjustmentsColumnUsingSlot"></td>\r
                    <td i18n="adjustmentsColumnViaChannel"></td>\r
                </tr>\r
            </thead>\r
            <tbody>\r
            </tbody>\r
        </table>\r
    </div>\r
    <div class="content_toolbar">\r
        <div class="btn save_btn">\r
            <a class="save" href="#" i18n="adjustmentsSave"></a>\r
        </div>\r
    </div>\r
</div>\r
\r
<div id="tab-adjustments-templates">\r
    <table class="adjustments">\r
        <tbody>\r
            <tr class="adjustment">\r
                <td class="info">\r
                    <div class="enabling">\r
                        <input type="checkbox" class="enable toggle" />\r
                    </div>\r
                </td>\r
                <td class="channelInfo">\r
                    <div>\r
                        <select class="channel">\r
                            <option value=""></option>\r
                        </select>\r
                    </div>\r
                    <div class="limits">\r
                        <p class="lowerLimit">\r
                            <span i18n="adjustmentsMin"></span>: <span class="lowerLimitValue"></span>\r
                        </p>\r
                        <p class="upperLimit">\r
                            <span i18n="adjustmentsMax"></span>: <span class="upperLimitValue"></span>\r
                        </p>\r
                    </div>\r
                </td>\r
                <td class="range">\r
                    <div class="channel-slider">\r
                        <div class="marker"></div>\r
                    </div>\r
                </td>\r
                <td class="functionSelection"><select class="function">\r
                        <option value="0" i18n="adjustmentsFunction0"></option>   <!-- No Changes-->\r
                        <optgroup i18n_label="adjustmentsGroupRates">\r
                            <option value="1" i18n="adjustmentsFunction1"></option>   <!-- RC Rate -->\r
                            <option value="2" i18n="adjustmentsFunction2"></option>   <!-- RC Pitch/Roll Expo -->\r
                            <option value="25" i18n="adjustmentsFunction25"></option> <!-- RC Yaw Expo -->\r
                            <option value="3" i18n="adjustmentsFunction3"></option>   <!-- Throttle Expo -->\r
                            <option value="4" i18n="adjustmentsFunction4"></option>   <!-- Pitch & Roll Rate -->\r
                            <option value="23" i18n="adjustmentsFunction23"></option> <!-- Pitch Rate -->\r
                            <option value="24" i18n="adjustmentsFunction24"></option> <!-- Roll Rate -->\r
                            <option value="5" i18n="adjustmentsFunction5"></option>   <!-- Yaw Rate -->\r
                            <option value="28" i18n="adjustmentsFunction28"></option> <!-- Manual Pitch/Roll Rate-->\r
                            <option value="30" i18n="adjustmentsFunction30"></option> <!-- Manual Pitch Rate -->\r
                            <option value="29" i18n="adjustmentsFunction29"></option> <!-- Manual Roll Rate-->\r
                            <option value="31" i18n="adjustmentsFunction31"></option> <!-- Manual Yaw Rate -->\r
                            <option value="26" i18n="adjustmentsFunction26"></option> <!-- Manual RC Pitch/Roll Expo -->\r
                            <option value="27" i18n="adjustmentsFunction27"></option> <!-- Manual RC Yaw Expo -->\r
                        </optgroup>\r
\r
                        <optgroup i18n_label="adjustmentsGroupPIDTuning">\r
                            <option value="6" i18n="adjustmentsFunction6"></option>   <!-- Pitch & Roll P -->\r
                            <option value="7" i18n="adjustmentsFunction7"></option>   <!-- Pitch & Roll I -->\r
                            <option value="8" i18n="adjustmentsFunction8"></option>   <!-- Pitch & Roll D -->\r
                            <option value="9" i18n="adjustmentsFunction9"></option>   <!-- Pitch & Roll CD/FF -->\r
                            <option value="10" i18n="adjustmentsFunction10"></option> <!-- Pitch P -->\r
                            <option value="11" i18n="adjustmentsFunction11"></option> <!-- Pitch I -->\r
                            <option value="12" i18n="adjustmentsFunction12"></option> <!-- Pitch D -->\r
                            <option value="13" i18n="adjustmentsFunction13"></option> <!-- Pitch CD/FF -->\r
                            <option value="14" i18n="adjustmentsFunction14"></option> <!-- Roll P -->\r
                            <option value="15" i18n="adjustmentsFunction15"></option> <!-- Roll I -->\r
                            <option value="16" i18n="adjustmentsFunction16"></option> <!-- Roll D -->\r
                            <option value="17" i18n="adjustmentsFunction17"></option> <!-- Roll CD/FF -->\r
                            <option value="18" i18n="adjustmentsFunction18"></option> <!-- Yaw P -->\r
                            <option value="19" i18n="adjustmentsFunction19"></option> <!-- Yaw I -->\r
                            <option value="20" i18n="adjustmentsFunction20"></option> <!-- Yaw D -->\r
                            <option value="21" i18n="adjustmentsFunction21"></option> <!-- Yaw CD/FF -->\r
                            <option value="54" i18n="adjustmentsFunction54"></option> <!-- TPA -->\r
                            <option value="55" i18n="adjustmentsFunction55"></option> <!-- TPA Breakpoint -->\r
                            <option value="57" i18n="adjustmentsFunction57"></option> <!-- FW TPA Time Const -->\r
                        </optgroup>\r
\r
                        <optgroup i18n_label="adjustmentsGroupNavigationFlight">\r
                            <option value="34" i18n="adjustmentsFunction34"></option> <!-- Board Roll-->\r
                            <option value="35" i18n="adjustmentsFunction35"></option> <!-- Board Pitch-->\r
                            <option value="58" i18n="adjustmentsFunction58"></option> <!-- FW Level Trim -->\r
                            <option value="32" i18n="adjustmentsFunction32"></option> <!-- FW Cruise Throttle -->\r
                            <option value="33" i18n="adjustmentsFunction33"></option> <!-- FW Pitch to Throttle -->\r
                            <option value="52" i18n="adjustmentsFunction52"></option> <!-- FW min thr down pitch -->\r
                            <option value="56" i18n="adjustmentsFunction56"></option> <!-- Control Smoothness -->\r
\r
                            <option value="36" i18n="adjustmentsFunction36"></option> <!-- Level P -->\r
                            <option value="37" i18n="adjustmentsFunction37"></option> <!-- Level I -->\r
                            <option value="38" i18n="adjustmentsFunction38"></option> <!-- Level D -->\r
                            <option value="39" i18n="adjustmentsFunction39"></option> <!-- POS XY P -->\r
                            <option value="40" i18n="adjustmentsFunction40"></option> <!-- POS XY I -->\r
                            <option value="41" i18n="adjustmentsFunction41"></option> <!-- POS XY D-->\r
                            <option value="42" i18n="adjustmentsFunction42"></option> <!-- POS Z P -->\r
                            <option value="43" i18n="adjustmentsFunction43"></option> <!-- POS Z I -->\r
                            <option value="44" i18n="adjustmentsFunction44"></option> <!-- POS Z D -->\r
                            <option value="45" i18n="adjustmentsFunction45"></option> <!-- Heading P -->\r
                            <option value="46" i18n="adjustmentsFunction46"></option> <!-- VEL XY P -->\r
                            <option value="47" i18n="adjustmentsFunction47"></option> <!-- VEL XY I -->\r
                            <option value="48" i18n="adjustmentsFunction48"></option> <!-- VEL XY D -->\r
                            <option value="49" i18n="adjustmentsFunction49"></option> <!-- VEL Z P -->\r
                            <option value="50" i18n="adjustmentsFunction50"></option> <!-- VEL Z I -->\r
                            <option value="51" i18n="adjustmentsFunction51"></option> <!-- VEL Z D -->\r
                            <option value="60" i18n="adjustmentsFunction60"></option> <!-- FW Alt Cont Response -->\r
                        </optgroup>\r
\r
                        <optgroup i18n_label="adjustmentsGroupMisc">\r
                            <option value="53" i18n="adjustmentsFunction53"></option> <!-- VTX Power -->\r
                            <option value="59" i18n="adjustmentsFunction59"></option> <!-- WP Mission Index -->\r
                        </optgroup>\r
                    </select></td>\r
                <td class="adjustmentSlot"><select class="slot">\r
                        <option value="0" i18n="adjustmentsSlot0"></option>\r
                        <option value="1" i18n="adjustmentsSlot1"></option>\r
                        <option value="2" i18n="adjustmentsSlot2"></option>\r
                        <option value="3" i18n="adjustmentsSlot3"></option>\r
                </select></td>\r
                <td class="functionSwitchChannel"><select class="channel">\r
                        <option value=""></option>\r
                </select></td>\r
            </tr>\r
        </tbody>\r
    </table>\r
</div>\r
`;export{n as default};
