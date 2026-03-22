'use strict';

const browserWindow = globalThis.window;
const electronApi = browserWindow?.electronAPI;
const isElectron = electronApi !== undefined;
const hasSecureContext = globalThis.isSecureContext === true;
const selectedFiles = new Map();

function getNavigatorLocale() {
    if (typeof navigator === 'undefined') {
        return 'en';
    }

    return navigator.language || 'en';
}

function normalizeData(data) {
    if (data instanceof Uint8Array) {
        return data;
    }

    if (data instanceof ArrayBuffer) {
        return new Uint8Array(data);
    }

    if (Array.isArray(data)) {
        return new Uint8Array(data);
    }

    if (typeof data === 'string') {
        return new TextEncoder().encode(data);
    }

    return new TextEncoder().encode(String(data ?? ''));
}

function triggerDownload(filename, data) {
    const blob = new Blob([normalizeData(data)]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download.bin';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function browserOpenDialog(options = {}) {
    return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';

        if (options?.properties?.includes('multiSelections')) {
            input.multiple = true;
        }

        const accept = (options.filters || [])
            .flatMap(filter => filter.extensions || [])
            .map(extension => extension.startsWith('.') ? extension : `.${extension}`)
            .join(',');

        if (accept) {
            input.accept = accept;
        }

        input.addEventListener('change', () => {
            const files = Array.from(input.files || []);

            if (files.length === 0) {
                resolve({ canceled: true, filePaths: [] });
                return;
            }

            const filePaths = files.map((file, index) => {
                const pseudoPath = `browser-file://${Date.now()}-${index}-${file.name}`;
                selectedFiles.set(pseudoPath, file);
                return pseudoPath;
            });

            resolve({ canceled: false, filePaths, files });
        }, { once: true });

        input.click();
    });
}

async function browserReadFile(filename, encoding = 'utf8') {
    const file = selectedFiles.get(filename);

    if (!file) {
        return { error: new Error(`File not available in browser runtime: ${filename}`) };
    }

    try {
        if (encoding === null) {
            const buffer = await file.arrayBuffer();
            return { error: false, data: new Uint8Array(buffer) };
        }

        const data = await file.text();
        return { error: false, data };
    } catch (error) {
        return { error };
    }
}

const platform = {
    runtime: isElectron ? 'electron' : 'web',
    isElectron,
    isWeb: !isElectron,
    capabilities: {
        serial: isElectron || (typeof navigator !== 'undefined' && !!navigator.serial && hasSecureContext),
        ble: typeof navigator !== 'undefined' && !!navigator.bluetooth && hasSecureContext,
        usb: typeof navigator !== 'undefined' && !!navigator.usb && hasSecureContext,
        tcp: isElectron,
        udp: isElectron,
        sitl: isElectron,
        fileIo: isElectron,
        appendFile: isElectron,
    },
    app: {
        getVersion() {
            return isElectron ? electronApi.appGetVersion() : 'web-dev';
        },
        getLocale() {
            return isElectron ? electronApi.appGetLocale() : getNavigatorLocale();
        },
        getPath(name) {
            return isElectron ? electronApi.appGetPath(name) : '';
        }
    },
    store: {
        get(key, defaultValue) {
            if (isElectron) {
                return electronApi.storeGet(key, defaultValue);
            }

            try {
                const raw = browserWindow.localStorage.getItem(`inav:${key}`);
                return raw === null ? defaultValue : JSON.parse(raw);
            } catch (_error) {
                return defaultValue;
            }
        },
        set(key, value) {
            if (isElectron) {
                electronApi.storeSet(key, value);
                return;
            }

            browserWindow.localStorage.setItem(`inav:${key}`, JSON.stringify(value));
        },
        delete(key) {
            if (isElectron) {
                electronApi.storeDelete(key);
                return;
            }

            browserWindow.localStorage.removeItem(`inav:${key}`);
        }
    },
    dialog: {
        showOpenDialog(options) {
            if (isElectron) {
                return electronApi.showOpenDialog(options);
            }

            return browserOpenDialog(options);
        },
        showSaveDialog(options = {}) {
            if (isElectron) {
                return electronApi.showSaveDialog(options);
            }

            return Promise.resolve({
                canceled: false,
                filePath: options.defaultPath || 'download.bin'
            });
        },
        alert(message) {
            if (isElectron) {
                return electronApi.alertDialog(message);
            }

            globalThis.alert(message);
            return 0;
        },
        confirm(message) {
            if (isElectron) {
                return electronApi.confirmDialog(message);
            }

            return globalThis.confirm(message);
        }
    },
    files: {
        writeFile(filename, data) {
            if (isElectron) {
                return electronApi.writeFile(filename, data);
            }

            triggerDownload(filename, data);
            return Promise.resolve(false);
        },
        appendFile(filename, data) {
            if (isElectron) {
                return electronApi.appendFile(filename, data);
            }

            return Promise.reject(new Error(`appendFile is not supported in browser runtime for ${filename}`));
        },
        readFile(filename, encoding = 'utf8') {
            if (isElectron) {
                return electronApi.readFile(filename, encoding);
            }

            return browserReadFile(filename, encoding);
        },
        rm(path) {
            if (isElectron) {
                return electronApi.rm(path);
            }

            return Promise.resolve('rm is not supported in browser runtime');
        },
        chmod(path, mode) {
            if (isElectron) {
                return electronApi.chmod(path, mode);
            }

            return Promise.resolve('chmod is not supported in browser runtime');
        }
    }
};

export default platform;
