# INAV Configurator

INAV Configurator is a crossplatform configuration tool for the [INAV](https://github.com/iNavFlight/inav) flight control system.

It runs as an app within Google Chrome and allows you to configure the INAV software running on any supported INAV target.

Various types of aircraft are supported by the tool and by INAV, e.g. quadcopters, hexacopters, octocopters and fixed-wing aircraft.

[![available in the Chrome web store](https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_206x58.png)](https://chrome.google.com/webstore/detail/inav-configurator/fmaidjmgkdkpafmbnmigkpdnpdhopgel)

## Build system

For local development, **node.js** build system is used.

1. Install node.js
1. From project folder run `npm install`
1. To rebuild JS and CSS use ` ./node_modules/gulp/bin/gulp.js`

## Authors

Konstantin Sharlaimov/DigitalEntity - maintainer of the INAV firmware and configurator.

INAV Configurator was originally a [fork](#credits) of Cleanflight Configurator with support for INAV instead of Cleanflight.

This configurator is the only configurator with support for INAV specific features. It will likely require that you run the latest firmware on the flight controller.
If you are experiencing any problems please make sure you are running the [latest firmware version](https://github.com/iNavFlight/inav/releases).

## Installation

### Via chrome webstore

1. Visit [Chrome web store](https://chrome.google.com/webstore/detail/inav-configurator/fmaidjmgkdkpafmbnmigkpdnpdhopgel)
2. Click **+ Free**

Please note - the application will automatically update itself when new versions are released.  Please ensure you maintain configuration backups as described in the INAV documentation.

### Alternative way

1. Clone the repo to any local directory or download it as zip
2. Start Chromium or Google Chrome and go to tools -> extension
3. Check the "Developer mode" checkbox
4. Click on load unpacked extension and point it to the INAV Configurator directory (for example D:/inav-configurator)

## How to use

You can find the INAV Configurator icon in your application tab "Apps"

## Notes

### WebGL

Make sure Settings -> System -> "User hardware acceleration when available" is checked to achieve the best performance

### Linux users

1. Dont forget to add your user into dialout group "sudo usermod -aG dialout YOUR_USERNAME" for serial access
2. If you have 3D model animation problems, enable "Override software rendering list" in Chrome flags chrome://flags/#ignore-gpu-blacklist

## Support

If you need help your please use the multiwii or rcgroups forums or visit the IRC channel before raising issues in the issue trackers.

### Issue trackers

For INAV configurator issues raise them here

https://github.com/iNavFlight/inav-configurator/issues

For INAV firmware issues raise them here

https://github.com/iNavFlight/inav/issues

## Technical details

This branch uses NW.js to pack Crome app into single package with node.js and chromium

```
npm install
./node_modules/nw-builder/bin/nwbuild -p win32 ./
```

## Developers

We accept clean and reasonable patches, submit them!

## Credits

ctn - primary author and maintainer of Baseflight Configurator.
Hydra - author and maintainer of Cleanflight Configurator from which this project was forked.
