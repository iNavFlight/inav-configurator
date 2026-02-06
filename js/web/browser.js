import { registerSW } from 'virtual:pwa-register';
import bridge from '../bridge';
import i18n from '../localization';
import dialog from '../dialog';
import GUI from '../gui';

const browser = {

    checkModal: null,
    updateNotification: null,
    offlineNotification: null,

    registerSW: function() {
        const self = this;
        const updateSW = registerSW({
            onNeedRefresh() {
                dialog.confirm(i18n.getMessage('pwaUpdateNeedRefreshMessage')).then((result) => {
                    if (result) {
                        updateSW();
                    }
                });
            },
            onOfflineReady() {
                console.log('The application is ready to work offline.');
                GUI.log(i18n.getMessage('pwaOfflineReadyMessage'));
                
            }
        });
    },

    checkBrowserSupport: function() {
        const isSerialSupported = this.isSerialSupported();
        const isUsbSupported = this.isUsbSupported();
        const isBleSupported = this.isBleSupported();

        let content = i18n.getMessage('browserCheckNotificationDescription') + '<ul>';
        if (!isSerialSupported) {
            content += '<li> - ' + i18n.getMessage('browserNotSupportedSerial') + '</li>';
        }
        if (!isUsbSupported) {
            content += '<li> - ' + i18n.getMessage('browserNotSupportedUsb') + '</li>';
        }
        if (!isBleSupported) {
            content += '<li> - ' + i18n.getMessage('browserNotSupportedBle') + '</li>';
        }
        content += '</ul>';

        if (!this.isChromiumBased() || (!isSerialSupported && !isUsbSupported && !isBleSupported)) {
           dialog.alert({
                title: i18n.getMessage('browserNotSupportedNotificationTitle'),
                text: content
            });
        }
    },
    
    isChromiumBased: function() {   
        const ua = navigator.userAgent;
        return ua.indexOf('Chrome') > -1 || ua.indexOf('Edg') > -1 || ua.indexOf('OPR') > -1 || ua.indexOf('Electron') > -1;
    },

    getBrowserInfo: function() {
        let browserInfo = '';
        const ua = navigator.userAgent;
        
        if (bridge.isElectron) {
            const electronMatch = ua.match(/Electron\/([\d\.]+)/);
            browserInfo = 'Electron: <strong>' + (electronMatch ? electronMatch[1] : 'unknown') + '</strong>, ';
        } else if (ua.indexOf('Firefox') > -1) {
            const firefoxMatch = ua.match(/Firefox\/([\d\.]+)/);
            browserInfo = 'Firefox: <strong>' + (firefoxMatch ? firefoxMatch[1] : 'unknown') + '</strong>, ';
        } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
            const safariMatch = ua.match(/Version\/([\d\.]+)/);
            browserInfo = 'Safari: <strong>' + (safariMatch ? safariMatch[1] : 'unknown') + '</strong>, ';
        } else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) {
            const edgeMatch = ua.match(/Edg[e]?\/([\d\.]+)/);
            browserInfo = 'Edge: <strong>' + (edgeMatch ? edgeMatch[1] : 'unknown') + '</strong>, ';
        } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
            const operaMatch = ua.match(/OPR\/([\d\.]+)/);
            browserInfo = 'Opera: <strong>' + (operaMatch ? operaMatch[1] : 'unknown') + '</strong>, ';
        } else {
            // Fallback to Chrome
            const chromeMatch = ua.match(/Chrome\/([\d\.]+)/);
            browserInfo = 'Chrome: <strong>' + (chromeMatch ? chromeMatch[1] : 'unknown') + '</strong>, ';
        }
        
        return browserInfo;
    },

    isSerialSupported: function() {
        return 'serial' in navigator;
    },

    isUsbSupported: function() {
        return 'usb' in navigator;
    },

    isBleSupported: function() {
        return 'bluetooth' in navigator;
    }

};

export default browser;