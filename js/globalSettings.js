const UnitType = {
    none: "none",
    OSD: "OSD",
    imperial: "imperial",
    metric: "metric",
}

var globalSettings = {
    // Configurator rendering options
    // Used to depict how the units are displayed within the UI
    unitType: null,
    // Used to convert units within the UI
    osdUnits: null,
    // Map  
    mapProviderType: null,
    mapApiKey: null,
    proxyURL: null,
    proxyLayer: null,
    // Show colours for profiles
    showProfileParameters: null,
    // tree target for documents
    docsTreeLocation: 'master',
    configuratorTreeLocation: 'master',
    cliAutocomplete: true,
    assistnowApiKey: null,
    assistnowOfflineData: [],
    assistnowOfflineDate: 0,
    store: null,
    saveAssistnowData:  function() {
        this.store.set('assistnow_offline_data', this.assistnowOfflineData);
        this.store.set('assistnow_offline_date', this.assistnowOfflineDate);
    }
};

module.exports = { globalSettings, UnitType };