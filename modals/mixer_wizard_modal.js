'use strict';

var helper = helper || {};

const templateCache = {};

helper.setupModal = function ($trigger, templateId, title, model, onOpen, onClose) {
    if (!templateCache[templateId]) {
        templateCache[templateId] = $.templates(templateId);
        $.views.converters("i18n", chrome.i18n.getMessage, templateCache[templateId]);
    }

    const html = templateCache[templateId].render(model);

    return new jBox("Modal", {
        width: 480,
        height: 410,
        closeButton: "title",
        animation: false,
        attach: $trigger,
        title: title,
        content: html,
        onOpen,
        onClose
    });
};

helper.setupMixerWizard = function ($trigger, templateId, title) {
    const model = {
        mappings: [
            {
                positionText: "motorWizard0",
                positionIndex: 0,
                motorIndex: 0,
            },
            {
                positionText: "motorWizard1",
                positionIndex: 1,
                motorIndex: 1,
            },
            {
                positionText: "motorWizard2",
                positionIndex: 2,
                motorIndex: 2,
            },
            {
                positionText: "motorWizard3",
                positionIndex: 3,
                motorIndex: 3,
            }
        ]
    };

    const dropZoneSelector = ".drop-zone";
    const draggableSelector = "[draggable]";
    return helper.setupModal(
        $trigger,
        templateId,
        title,
        model,
        function () {
            const $container = this.container;

            $container.on("dragstart", draggableSelector, function (event) {
                const $target = $(event.target);

                const motorIndex = $target.attr("data-motor-index");
                event.originalEvent.dataTransfer.setData("text", motorIndex);
            });

            $container.on("dragenter", dropZoneSelector, function (event) {
                event.preventDefault();

                const $target = $(event.target);
                const $dropZone = $target.closest(dropZoneSelector);
                $dropZone.addClass("drop-active");
            });

            $container.on("dragleave", dropZoneSelector, function (event) {
                const $target = $(event.target);
                const $dropZone = $target.closest(dropZoneSelector);
                $dropZone.removeClass("drop-active");
            });

            $container.on("dragover", dropZoneSelector, function (event) {
                event.preventDefault();

                event.originalEvent.dataTransfer.dropEffect = 'move';
            });

            $container.on("drop", dropZoneSelector, function (event) {
                event.preventDefault();

                const $target = $(event.target);
                const $dropZone = $target.closest(dropZoneSelector);
                $dropZone.removeClass("drop-active");

                const motorIndex = event.originalEvent.dataTransfer.getData("text");
                event.originalEvent.dataTransfer.clearData();
                const $heldElement = $container.find(`${draggableSelector}[data-motor-index=${motorIndex}]`);
                const $heldElementOriginalDropZone = $heldElement.closest(dropZoneSelector);

                const $replacedElement = $dropZone.find(draggableSelector);

                $dropZone.append($heldElement);
                $heldElementOriginalDropZone.append($replacedElement);
            });
        },
        function () {
            const $container = this.container;
            $container.off();
        }
    );
};
