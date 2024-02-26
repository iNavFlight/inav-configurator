module.exports = {
  packagerConfig: {
    asar: false,
    icon: 'images/inav'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        iconUrl: "https://raw.githubusercontent.com/iNavFlight/inav-configurator/master/images/inav.ico",
        loadingGif: "images/inav-installing.gif"
      },
    },
    
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32', 'darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: "images/inav_icon_128.png"
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: "images/inav_icon_128.png"
        }
      },
    },
  ],
};
