import $ from 'jquery';
import jBox from 'jbox';
import i18n from './localization';
import '../src/css/dialog.css';

function createDialog(message, buttons) {
    return new Promise((resolve) => {
        let resolved = false;
        const settle = (value) => {
            if (!resolved) {
                resolved = true;
                resolve(value);
            }
        };

        const $footer = $('<div class="inav-dialog__footer"></div>');
        let modal;
        let $primaryButton;

        buttons.forEach(({ label, value, primary }) => {
            const $button = $('<button type="button" class="inav-dialog__button"></button>')
                .toggleClass('inav-dialog__button--primary', !!primary)
                .text(label)
                .on('click', () => {
                    settle(value);
                    modal.close();
                })
                .appendTo($footer);
            if (primary) {
                $primaryButton = $button;
            }
        });

        const $content = $('<div></div>')
            .append($('<div class="inav-dialog__message"></div>').text(message))
            .append($footer);

        modal = new jBox('Modal', {
            addClass: 'inav-dialog',
            animation: 'zoomIn',
            closeOnClick: false,
            closeOnEsc: true,
            closeButton: false,
            overlay: true,
            content: $content,
            // onOpen fires before the open animation finishes, while the wrapper is
            // still display:none — focusing anything has no visible effect yet.
            // onOpenComplete fires once the wrapper is actually visible.
            onOpenComplete: () => {
                $primaryButton && $primaryButton.trigger('focus');
            },
            onCloseComplete: () => {
                settle(buttons[0].value);
                modal.destroy();
            },
        });

        modal.open();
    });
}

const dialog = {
    showOpenDialog: async function (options) {
        return window.electronAPI.showOpenDialog(options);
    },
    showSaveDialog: async function (options) {
        return window.electronAPI.showSaveDialog(options);
    },
    alert: function (message) {
        return createDialog(message, [
            { label: i18n.getMessage('OK'), value: undefined, primary: true },
        ]);
    },
    confirm: function (message) {
        return createDialog(message, [
            { label: i18n.getMessage('dialogCancel'), value: false },
            { label: i18n.getMessage('OK'), value: true, primary: true },
        ]);
    },
};

export default dialog;
