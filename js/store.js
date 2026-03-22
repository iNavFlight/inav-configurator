import platform from './platform';

const store = {
    get: (key, defaultValue) => {
        return platform.store.get(key, defaultValue);
    },
    set: (key, value) => {
        platform.store.set(key, value);
    },
    delete: (key) => {
        platform.store.delete(key);
    }
}

export default store;
