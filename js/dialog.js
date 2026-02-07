import {bridge, Platform} from "./bridge";

const dialog =  {
    showOpenDialog: async function (options) {
        if (bridge.getPlatform() === Platform.Electron) {
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
       if (bridge.getPlatform() === Platform.Electron){
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
        return new Promise((resolve) => {
            const $dialog = $(".dialog-alert");
            const $title = $dialog.find(".dialog-title");
            const $content = $dialog.find(".dialog-message");
            const $buttonConfirm = $dialog.find(".dialog-button-ok");

            if (dialog.length === 0) {  
                resolve(false);
                return;
            }

            if (typeof message === "string") {
                message = {
                    text: message
                };
            }
    
            $title.html(message.title ? message.title : "INAV Configurator");
            $content.html(message.text);
            $buttonConfirm.off("click");

            $buttonConfirm.on("click", () => {
                $dialog[0].close();
                resolve();
            });

            $dialog[0].showModal();
        });
    },
    confirm: function (message) {
        
        return new Promise((resolve) => {
            const $dialog = $(".dialog-confirm");
            const $title = $dialog.find(".dialog-title");
            const $content = $dialog.find(".dialog-message");
            const $buttonConfirm = $dialog.find(".dialog-button-ok");
            const $buttonCancel = $dialog.find(".dialog-button-cancel");

            if (dialog.length === 0) {  
                resolve(false);
                return;
            }

            if (typeof message === "string") {
                message = {
                    text: message
                };
            }

            $title.html(message.title ? message.title : "INAV Configurator");
            $content.html(message.text);
            $buttonConfirm.off("click");

            $buttonConfirm.on("click", () => {
                $dialog[0].close();
                resolve(true);
            });

            $buttonCancel.off("click");

            $buttonCancel.on("click", () => {
                $dialog[0].close();
                resolve(false);
            });

            $dialog[0].showModal();
     });
    }
};

export default dialog;