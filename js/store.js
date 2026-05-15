const store = {
    get: (key, defaultValue) => {
        return window.electronAPI.storeGet(key, defaultValue);
    },
    set: (key, value) => {
        window.electronAPI.storeSet(key, value);
    },
    delete: (key) => {
        window.electronAPI.storeDelete(key);
    }
}   

export default store;