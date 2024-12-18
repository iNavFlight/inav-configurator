const dialog =  {
    showOpenDialog: async function (options) {
        return window.electronAPI.showOpenDialog(options);
    },
    showSaveDialog: async function (options) {
        return window.electronAPI.showSaveDialog(options);
    },
    alert: function (message) {
        return window.electronAPI.alertDialog(message);
    },
    confirm: function (message) {
        return window.electronAPI.confirmDialog(message);
    }
};

export default dialog;