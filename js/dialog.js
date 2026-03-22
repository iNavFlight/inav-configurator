import platform from './platform';

const dialog =  {
    showOpenDialog: async function (options) {
        return platform.dialog.showOpenDialog(options);
    },
    showSaveDialog: async function (options) {
        return platform.dialog.showSaveDialog(options);
    },
    alert: function (message) {
        return platform.dialog.alert(message);
    },
    confirm: function (message) {
        return platform.dialog.confirm(message);
    }
};

export default dialog;
