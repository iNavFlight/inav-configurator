const t=`<div class="tab-configuration tab-programming toolbar_fixed_bottom">\r
    <div class="content_wrapper" id="programming-main-content">\r
\r
\r
        <div class="tab_title subtab__header">\r
            <span class="subtab__header_label subtab__header_label--current" for="subtab-lc" data-i18n="LogicConditions"></span>\r
            <span class="subtab__header_label" for="subtab-pid" data-i18n="PIDControllers"></span>\r
        </div>\r
\r
        <div class="gvar__container">\r
            <div class="gvar__wrapper">\r
                <div class="gvar__cell">\r
                    <h2>GVAR 0</h2>\r
                    <label class="gvar__value" data-gvar-index="0">0</label>\r
                </div>\r
            </div>\r
        </div>\r
\r
        <div id="subtab-lc" class="subtab__content subtab__content--current">\r
            <table class="mixer-table logic__table">\r
                <thead>\r
                    <tr>\r
                        <th data-i18n="logicActivator"></th>\r
                        <th style="width: 50px" data-i18n="logicId"></th>\r
                        <th style="width: 80px" data-i18n="logicEnabled"></th>\r
                        <th style="width: 120px" data-i18n="logicOperation"></th>\r
                        <th data-i18n="logicOperandA"></th>\r
                        <th data-i18n="logicOperandB"></th>\r
                        <th style="width: 40px" data-i18n="logicFlags"></th>\r
                        <th style="width: 50px" data-i18n="logicStatus"></th>\r
                    </tr>\r
                </thead>\r
                <tbody>\r
                </tbody>\r
            </table>\r
        </div>\r
\r
        <div id="subtab-pid" class="subtab__content">\r
            <table class="mixer-table pid__table">\r
                <thead>\r
                    <tr>\r
                        <th style="width: 50px" data-i18n="pidId"></th>\r
                        <th style="width: 80px" data-i18n="pidEnabled"></th>\r
                        <th data-i18n="pidSetpoint"></th>\r
                        <th data-i18n="pidMeasurement"></th>\r
                        <th style="width: 80px" data-i18n="pidP"></th>\r
                        <th style="width: 80px" data-i18n="pidI"></th>\r
                        <th style="width: 80px" data-i18n="pidD"></th>\r
                        <th style="width: 80px" data-i18n="pidFF"></th>\r
                        <th style="width: 80px" data-i18n="pidOutput"></th>\r
                    </tr>\r
                </thead>\r
                <tbody>\r
                </tbody>\r
            </table>\r
        </div>\r
    </div>\r
    <div class="content_toolbar">\r
        <div class="btn save_btn">\r
            <a id="save-button" class="save" href="#" data-i18n="save"></a>\r
        </div>\r
    </div>\r
</div>`;export{t as default};
