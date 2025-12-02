import bridge from "./bridge";

const dialog =  {
    showOpenDialog: async function (options) {
        if (bridge.isElectron) {
            const response = await window.electronAPI.showOpenDialog(options);
            return {
                canceled: response.canceled,
                files: response.filePaths,
                error: response.error
            }
        } else {
            try {
                let filePickerOptions = {
                    types: [],
                    multiple: false,
                    excludeAcceptAllOption: true,
                }

                let allOptions = true;
                options.filters.forEach(filter => {
                    
                    let accept = {};
                    if (Array.isArray(filter.extensions) && filter.extensions.length >= 1) {
                        const type = filter.extensions[0];
                        if (type != '*') {
                            filter.extensions.forEach(extension => {
                                accept[`text/${type}`] = [`.${extension}`]
                            });
                            allOptions = false;
                        }
                    }
                    
                    if (Object.keys(accept).length >= 1) {
                        filePickerOptions.types.push({
                            description: filter.name,
                            accept: accept
                        });
                    }
                });
                filePickerOptions.excludeAcceptAllOption = allOptions;

                const [fileHandle] = await window.showOpenFilePicker(filePickerOptions);
                const file = await fileHandle.getFile();
                return {
                    canceled: false,
                    files: [file],
                    error: undefined
                };
            } catch (error) {
                return {
                    canceled: true,
                    files: [],
                    error: error
                };
            }
        }
    },
    showSaveDialog: async function (options) {
       if (bridge.isElectron){
         return window.electronAPI.showSaveDialog(options);
       } else {
        // Just passthrou in PWA
        return {
            canceled: false,
            filePath: options.defaultPath
        };
       }
    },
    alert: function (message) {
        if (bridge.isElectron) {
            return window.electronAPI.alertDialog(message);
        } else {
            alert(message);
        }
    },
    confirm: function (message) {
        if (bridge.isElectron) {
            return window.electronAPI.confirmDialog(message);
        } else {
            return confirm(message);
        }
    }
};

export default dialog;