'use strict';

var helper = helper || {};

helper.groundstation = (function () {

    let publicScope = {},
        privateScope = {};

    privateScope.activated = false;
    privateScope.$viewport = null;
    privateScope.$gsViewport = null;

    publicScope.isActivated = function () {
        return privateScope.activated;
    };

    publicScope.activate = function ($viewport) {

        if (privateScope.activated) {
            return;
        }

        helper.interval.add('gsUpdateGui', privateScope.updateGui, 200);

        privateScope.$viewport = $viewport;

        privateScope.$viewport.find(".tab_container").hide();
        privateScope.$viewport.find('#content').hide();
        privateScope.$viewport.find('#status-bar').hide();
        privateScope.$viewport.find('#connectbutton a.connect_state').text(chrome.i18n.getMessage('disconnect')).addClass('active');

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

        if (privateScope.$viewport !== null) {
            privateScope.$viewport.find(".tab_container").show();
            privateScope.$viewport.find('#content').show();
            privateScope.$viewport.find('#status-bar').show();
        }

        if (privateScope.$gsViewport !== null) {
            privateScope.$gsViewport.hide();
        }

        privateScope.activated = false;
        GUI.log(chrome.i18n.getMessage('gsDeactivated'));
    }

    privateScope.updateGui = function () {
        console.log('updateGui');
    };

    return publicScope;
})();