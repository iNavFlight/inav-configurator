const n=`<div class="tab-auxiliary toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <div class="tab_title" i18n="tabAuxiliary">tabAuxiliary</div>\r
        <div class="note spacebottom">\r
            <div class="note_spacer">\r
                <p i18n="auxiliaryHelp"></p>\r
            </div>\r
        </div>\r
        <div class="toolbox">\r
            <form>\r
                <input type="checkbox" id="switch-toggle-unused" name="switch-toggle-unused" class="toggle" />\r
                <span i18n="auxiliaryToggleUnused"></span>\r
            </form>\r
        </div>\r
        <table class="modes">\r
            <tbody>\r
            </tbody>\r
        </table>\r
    </div>\r
    <div class="content_toolbar">\r
        <div class="btn save_btn">\r
            <a class="save" href="#" i18n="auxiliaryButtonSave"></a>\r
        </div>\r
    </div>\r
    <div class="acroEnabled">\r
        <span i18n="auxiliaryAcroEnabled"></span>\r
    </div>\r
</div>\r
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
        <div class="channel-slider">\r
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
