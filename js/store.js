const store = {
    get: (key, defaultValue) => {
        return window.electronAPI.storeGet(key, defaultValue);
    },
    set: (key, value) => {
        window.electronAPI.storeSet(key, value);
    }
}   

export default store;