
const webLocalStorage = {
    get: function (key, defaultValue) {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                const json = JSON.parse(value);
                if ('value' in json){
                    return json.value;
                } else {
                    return defaultValue;
                }
            } catch (error) {
                console.warn(`Inavlid value in local storage: Key ${key} - ${error.message}`)
                return defaultValue;
            }
        } else {
            return defaultValue;
        }
    },

    set: function(key, value) {
        let storageObj = {};
        storageObj['value'] = value;
        try {
            localStorage.setItem(key, JSON.stringify(storageObj));
        } catch (error) {
            console.warn(`Unable to store key ${key} to local storage`);
        }
    },

    delete: function(key) {
        return localStorage.removeItem(key);
    }
}

export default webLocalStorage;