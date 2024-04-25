'use strict';

 var tabs = (function () {
    let self = {},
        $container;

    function onHeaderClick(event) {
        let $cT = $(event.currentTarget),
            attrFor = $cT.attr("for");

        $container.find('.subtab__header_label').removeClass("subtab__header_label--current");
        $cT.addClass("subtab__header_label--current");
        $container.find(".subtab__content--current").removeClass("subtab__content--current");
        $container.find("#" + attrFor).addClass("subtab__content--current");
    };

    self.init = function ($dom) {
        $container = $dom;

        $container.find(".subtab__header_label").on('click', onHeaderClick);
    };

    return self;

})();

module.exports = tabs;