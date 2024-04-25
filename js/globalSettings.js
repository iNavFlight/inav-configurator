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
    cliAutocomplete: true,
};

module.exports = { globalSettings, UnitType };