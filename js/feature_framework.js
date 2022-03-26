/*global mspHelper,FEATURES,bit_clear,bit_set*/
'use strict';

var helper = helper || {};

/*
Helper to work with FEATURES via MSP

Usage:

1. Reset everything
helper.features.reset();

2. Push feature bits you want to set 
helper.features.set(5);

3. Push feature bits you want to unset
helper.features.set(8);

4. Execute and provide a callback that will be executed after MSP is done
helper.features.execute(function () {
//Do things crap over here
});

*/
helper.features = (function() {

    let publicScope = {},
        privateScope = {};

    let toSet = [],
        toUnset = [],
        exitPoint;

    publicScope.reset = function () {
        toSet = [];
        toUnset = [];
    };

    publicScope.set = function (bit) {
        toSet.push(bit);
    };

    publicScope.unset = function (bit) {
        toUnset.push(bit);
    };

    publicScope.updateUI = function ($container, values) {
        $container.find('[data-bit].feature').each(function () {
            let $this = $(this);
            $this.prop('checked', bit_check(values, $this.attr("data-bit")));
        });
    };

    publicScope.fromUI = function ($container) {

        $container.find('[data-bit].feature').each(function () {
            let $this = $(this);
            if ($this.is(":checked")) {
                publicScope.set($this.attr("data-bit"));
            } else {
                publicScope.unset($this.attr("data-bit"));
            }
        });

    };

    publicScope.execute = function(callback) {
        exitPoint = callback;
        mspHelper.loadFeatures(privateScope.setBits);
    };

    privateScope.setBits = function () {

        for (const bit of toSet) {
            FEATURES = bit_set(FEATURES, bit);
        }

        for (const bit of toUnset) {
            FEATURES = bit_clear(FEATURES, bit);
        }

        mspHelper.saveFeatures(exitPoint);
    }

    return publicScope;
})();