'use strict';

var helper = helper || {};

helper.groundstation = (function () {

    let publicScope = {},
        privateScope = {};

    privateScope.activated = false;
    privateScope.$gsViewport = null;

    publicScope.isActivated = function () {
        return privateScope.activated;
    };

    publicScope.activate = function ($viewport) {

        if (privateScope.activated) {
            return;
        }

        helper.interval.add('gsUpdateGui', privateScope.updateGui, 200);

        $viewport.find(".tab_container").hide();
        $viewport.find('#content').hide();
        $viewport.find('#status-bar').hide();

        privateScope.$gsViewport = $viewport.find('#view-groundstation');

        privateScope.$gsViewport.show();

        privateScope.activated = true;
        GUI.log(chrome.i18n.getMessage('gsActivated'));
    }

    publicScope.deactivate = function () {

        if (!privateScope.activated) {
            return;
        }

        helper.interval.remove('gsUpdateGui');

        privateScope.activated = false;
        GUI.log(chrome.i18n.getMessage('gsDeactivated'));
    }

    privateScope.updateGui = function () {
        console.log('updateGui');
    };

    return publicScope;
})();