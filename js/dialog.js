const LAST_SAVE_DIRECTORY_KEY = 'lastSaveDirectory';

const dialog =  {
    showOpenDialog: async function (options) {
        return window.electronAPI.showOpenDialog(options);
    },
    showSaveDialog: async function (options) {
        const opts = options || {};

        // Get the last save directory from storage
        const lastDirectory = window.electronAPI.storeGet(LAST_SAVE_DIRECTORY_KEY, null);

        // If we have a last directory and no defaultPath is specified, use it
        if (lastDirectory && !opts.defaultPath) {
            opts.defaultPath = lastDirectory;
        }

        // Show the save dialog
        const result = await window.electronAPI.showSaveDialog(opts);

        // If user selected a file (didn't cancel), save the directory for next time
        if (result && result.filePath) {
            // Extract directory from the full file path
            // Get parent directory by removing the filename
            const lastSlash = Math.max(result.filePath.lastIndexOf('/'), result.filePath.lastIndexOf('\\'));
            if (lastSlash !== -1) {
                const directory = result.filePath.substring(0, lastSlash);
                window.electronAPI.storeSet(LAST_SAVE_DIRECTORY_KEY, directory);
            }
        }

        return result;
    },
    alert: function (message) {
        return window.electronAPI.alertDialog(message);
    },
    confirm: function (message) {
        return window.electronAPI.confirmDialog(message);
    }
};

export default dialog;