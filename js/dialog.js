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
                    excludeAcceptAllOption: true,
                    multiple: false,
                }

                options.filters.forEach(filter => {
                    
                    let accept = {};
                    if (Array.isArray(filter.extensions) && filter.extensions.length >= 1) {
                        const type = filter.extensions[0];
                        filter.extensions.forEach(extension => {
                            accept[`text/${type}`] = [`.${extension}`]
                        });
                    }
                    
                    filePickerOptions.types.push({
                        description: filter.name,
                        accept: accept
                    })
                });

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
        return window.electronAPI.alertDialog(message);
    },
    confirm: function (message) {
        return window.electronAPI.confirmDialog(message);
    }
};

export default dialog;