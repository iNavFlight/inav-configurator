'use strict';

TABS.programming = {};

TABS.programming.initialize = function (callback, scrollPosition) {
    let loadChainer = new MSPChainerClass(),
        saveChainer = new MSPChainerClass(),
        statusChainer = new MSPChainerClass();

    if (GUI.active_tab != 'programming') {
        GUI.active_tab = 'programming';
        googleAnalytics.sendAppView('Programming');
    }

    loadChainer.setChain([
        mspHelper.loadLogicConditions,
        mspHelper.loadGlobalVariablesStatus,
        mspHelper.loadProgrammingPidStatus,
        mspHelper.loadProgrammingPid
    ]);
    loadChainer.setExitPoint(loadHtml);
    loadChainer.execute();

    saveChainer.setChain([
        mspHelper.sendLogicConditions,
        mspHelper.sendProgrammingPid,
        mspHelper.saveToEeprom
    ]);
    
    statusChainer.setChain([
        mspHelper.loadLogicConditionsStatus,
        mspHelper.loadGlobalVariablesStatus,
        mspHelper.loadProgrammingPidStatus
    ]);
    statusChainer.setExitPoint(onStatusPullDone);

    function loadHtml() {
        GUI.load("./tabs/programming.html", processHtml);
    }

    function processHtml() {

        LOGIC_CONDITIONS.init($('#subtab-lc'));
        LOGIC_CONDITIONS.render();

        PROGRAMMING_PID.init($('#subtab-pid'));
        PROGRAMMING_PID.render();

        GLOBAL_VARIABLES_STATUS.init($(".gvar__container"));

        helper.tabs.init($('.tab-programming'));

        localize();

        $('#save-button').click(function () {
            saveChainer.execute();
            GUI.log(chrome.i18n.getMessage('programmingEepromSaved'));
        });

        helper.mspBalancedInterval.add('logic_conditions_pull', 100, 1, function () {
            statusChainer.execute();
        });

        renderCodeGroups();

        GUI.content_ready(callback);
    }

    function onStatusPullDone() {
        LOGIC_CONDITIONS.update(LOGIC_CONDITIONS_STATUS);
        GLOBAL_VARIABLES_STATUS.update($('.tab-programming'));
        PROGRAMMING_PID.update(PROGRAMMING_PID_STATUS);
    }
}

TABS.programming.cleanup = function (callback) {
    if (callback) callback();
};

function renderCodeGroups() {
    $(".programming-spacer-row").remove();

    let rows = $("#subtab-lc").find('tbody > tr');
    let currentCodeGroup = 0;

    for (let r = 0; r < rows.length; r++) {
        let $row = $(rows[r]);
        $row.children('td').css('background-color', '');

        let bgColor = normaliseColors($row.children('td:first').css('background-color'));
        bgColor[3] = 1; // colour as RGBA array, always fully opaque
        
        if (bgColor[0] == 0 && bgColor[1] == 0 && bgColor[2] == 0) {
            // No colour is being incorrectly returned as black, so correct this behaviour.
            bgColor[0] = 255;
            bgColor[1] = 255;
            bgColor[2] = 255;
        }
        
        let codeGroup = $row.find('.logic_element__codeGroup').val();
        
        if (currentCodeGroup != codeGroup) {
            if (r !== 0) {
                $('<tr class="programming-spacer-row first-programming-spacer-row"><td colspan="10"></td></tr><tr class="programming-spacer-row"><td colspan="10"></td></tr>').insertBefore($row);
            }
            currentCodeGroup = codeGroup;
        }

        let multiplier = 0;

        if (codeGroup != 0) {
            multiplier = Math.ceil(codeGroup / 3) * 10;

            if (codeGroup % 3 === 0) {

                bgColor[1] = bgColor[1] - multiplier;
                bgColor[2] = bgColor[2] - multiplier;
            } else if (codeGroup % 3 == 2) {
                bgColor[0] = bgColor[0] - multiplier;
                bgColor[2] = bgColor[2] - multiplier;
            } else {
                bgColor[0] = bgColor[0] - multiplier;
                bgColor[1] = bgColor[1] - multiplier;
            }

            $row.children('td').css('background-color', 'rgba(' + bgColor[0] + ', ' + bgColor[1] + ', ' + bgColor[2] + ', ' + bgColor[3] + ')');
        }
    }
}

function normaliseColors(color)
{
    if (color === '')
        return;
    if (color.toLowerCase() === 'transparent')
        return [255, 255, 255, 0];
    if (color[0] === '#')
    {
        if (color.length < 7)
        {
            // convert #RGB and #RGBA to #RRGGBB and #RRGGBBAA
            color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] + (color.length > 4 ? color[4] + color[4] : '');
        }
        return [parseInt(color.substr(1, 2), 16),
            parseInt(color.substr(3, 2), 16),
            parseInt(color.substr(5, 2), 16),
            color.length > 7 ? parseInt(color.substr(7, 2), 16)/255 : 1];
    }
    if (color.indexOf('rgb') === -1)
    {
        // convert named colors
        var temp_elem = document.body.appendChild(document.createElement('fictum')); // intentionally use unknown tag to lower chances of css rule override with !important
        var flag = 'rgb(1, 2, 3)'; // this flag tested on chrome 59, ff 53, ie9, ie10, ie11, edge 14
        temp_elem.style.color = flag;
        if (temp_elem.style.color !== flag)
            return; // color set failed - some monstrous css rule is probably taking over the color of our object
        temp_elem.style.color = color;
        if (temp_elem.style.color === flag || temp_elem.style.color === '')
            return; // color parse failed
        color = getComputedStyle(temp_elem).color;
        document.body.removeChild(temp_elem);
    }
    if (color.indexOf('rgb') === 0)
    {
        if (color.indexOf('rgba') === -1)
            color += ',1'; // convert 'rgb(R,G,B)' to 'rgb(R,G,B)A' which looks awful but will pass the regxep below
        return color.match(/[\.\d]+/g).map(function (a)
        {
            return +a
        });
    }
}