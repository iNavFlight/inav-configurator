const n=`<div class="tab-logging toolbar_fixed_bottom">\r
    <div class="content_wrapper">\r
        <div class="tab_title" i18n="tabLogging"></div>\r
        <div class="note">\r
            <div class="note_spacer">\r
                <p i18n="loggingNote"></p>\r
            </div>\r
        </div>\r
        <div class="properties">\r
            <dl>\r
                <dt>\r
                    <label><input type="checkbox" name="MSP_RAW_IMU" /> MSP_RAW_IMU</label>\r
                </dt>\r
                <dd>9 columns (accel[x, y, z], gyro[x, y, z], mag[x, y, z])</dd>\r
                <dt>\r
                    <label><input type="checkbox" name="MSP_ATTITUDE" /> MSP_ATTITUDE</label>\r
                </dt>\r
                <dd>3 columns (x, y, z)</dd>\r
                <dt>\r
                    <label><input type="checkbox" name="MSP_ALTITUDE" /> MSP_ALTITUDE</label>\r
                </dt>\r
                <dd>one column</dd>\r
                <dt>\r
                    <label><input type="checkbox" name="MSP_RAW_GPS" /> MSP_RAW_GPS</label>\r
                </dt>\r
                <dd>7 columns</dd>\r
                <dt>\r
                    <label><input type="checkbox" name="MSP_ANALOG" /> MSP_ANALOG</label>\r
                </dt>\r
                <dd>4 columns</dd>\r
                <dt>\r
                    <label><input type="checkbox" name="MSP_RC" /> MSP_RC</label>\r
                </dt>\r
                <dd>8 columns by default</dd>\r
                <dt>\r
                    <label><input type="checkbox" name="MSP_MOTOR" /> MSP_MOTOR</label>\r
                </dt>\r
                <dd>8 columns by default</dd>\r
                <dt>\r
                    <label><input type="checkbox" name="MSP_DEBUG" /> MSP_DEBUG</label>\r
                </dt>\r
                <dd>4 columns</dd>\r
            </dl>\r
        </div>\r
        <select class="speed" name="speed">\r
            <option value="10">10 ms</option>\r
            <option value="20">20 ms</option>\r
            <option value="30">30 ms</option>\r
            <option value="40">40 ms</option>\r
            <option value="50">50 ms</option>\r
            <option value="100" selected="selected">100 ms</option>\r
            <option value="250">250 ms</option>\r
            <option value="500">500 ms</option>\r
            <option value="1000">1000 ms</option>\r
            <option value="2000">2000 ms</option>\r
            <option value="5000">5000 ms</option>\r
        </select>\r
        <div class="info">\r
            <dl>\r
                <dt i18n="loggingSamplesSaved"></dt>\r
                <dd class="samples">0</dd>\r
                <dt i18n="loggingLogSize"></dt>\r
                <dd class="size">0 Bytes</dd>\r
            </dl>\r
        </div>\r
    </div>\r
    <div class="content_toolbar">\r
        <div class="btn back_btn">\r
            <a class="back" href="#" i18n="loggingBack"></a>\r
        </div>\r
        <div class="btn logging_btn">\r
            <a class="logging" href="#" i18n="loggingStart"></a>\r
        </div>\r
        <div class="btn file_btn">\r
            <a class="log_file" href="#" i18n="loggingButtonLogFile"></a>\r
        </div>\r
    </div>\r
</div>\r
`;export{n as default};
