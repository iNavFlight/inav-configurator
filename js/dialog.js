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

        buttons.forEach(({ label, value, primary }) => {
            $('<div class="inav-dialog__button"></div>')
                .toggleClass('inav-dialog__button--primary', !!primary)
                .text(label)
                .on('click', () => {
                    settle(value);
                    modal.close();
                })
                .appendTo($footer);
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
