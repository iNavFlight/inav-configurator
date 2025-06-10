# INAV Configurator

INAV Configurator is a cross-platform configuration tool for the [INAV](https://github.com/iNavFlight/inav) flight control system.

Various types of aircraft are supported by the tool and by INAV, e.g. quadcopters, hexacopters, octocopters, and fixed-wing aircraft.

# Support

INAV Configurator comes `as is`, without any warranty and support from the authors. If you find a bug, please create an issue on [GitHub](https://github.com/iNavFlight/inav-configurator/issues).

The GitHub issue tracker is reserved for bugs and other technical problems. If you do not know how to set up
everything, the hardware is not working, or you have any other _support_ problem, please consult:

* [INAV Discord Server](https://discord.gg/peg2hhbYwN)
* [INAV Official on Facebook](https://www.facebook.com/groups/INAVOfficial)
* [RC Groups Support](https://www.rcgroups.com/forums/showthread.php?2495732-Cleanflight-iNav-(navigation-rewrite)-project)
* [INAV Official on Telegram](https://t.me/INAVFlight)
* [GitHub Discussions](https://github.com/iNavFlight/inav-configurator/discussions)

## Installation

 _INAV Configurator_ is distributed as a  _standalone_ application.

### Windows

1. Visit [release page](https://github.com/iNavFlight/inav-configurator/releases)
2. Download Configurator for Windows platform (ia32 or win64 is present)
3. Install
    * Extract ZIP archive and run the INAV Configurator app from the unpacked folder
    * OR just use the setup program `INAV-Configurator_win32_arch_x.y.z.exe`, **arch** is your computer architecture (ia32 (32bit) or x64 (64bit)), **x.y.z** is the INAV Configurator version number.

4.  Configurator is not signed, so you have to allow Windows to run untrusted applications. There might be a monit for it during the first run

### Linux

1. Visit [release page](https://github.com/iNavFlight/inav-configurator/releases)
2. Download Configurator for Linux platform (only linux64 is present)
   *  **.rpm** is the Fedora installation file. Just download and install using `sudo dnf localinstall /path/to/INAV-Configurator_linux_x64-x.y.z.rpm` or open it with a package manager (e.g. via Files)
   *  **.deb** is the Debian/Ubuntu installation file. Just download and install using `sudo apt install /path/to/INAV-Configurator_linux_x64_x.y.z.deb` or open it with a package manager (e.g. via the File Manager)
   *  **.zip** is a universal archive. Download and continue with these instructions to install
3. Change to the directory containing the downloaded **zip** file
4. download [this](https://raw.githubusercontent.com/iNavFlight/inav-configurator/master/assets/linux/inav-configurator.desktop) file to the same directory. Its filename should be `inav-configurator.desktop`.
5. Extract **zip** archive
```
unzip INAV-Configurator_linux_arch_x.y.z.zip -d /tmp/
```
  **arch** is your computer architecture (x64, armv7l, ...), **x.y.z** is the INAV Configurator version number.

6. If this is the first time installing INAV Configurator, create a home for its files
```
sudo mkdir /opt/inav
sudo chown $USER /opt/inav
```
7. Move the temporary files into their home 
```
mv /tmp/INAV\ Configurator /opt/inav/inav-configurator
```
8. Update the application icon.
```
sudo mkdir /opt/inav/inav-configurator/icon
sudo cp /opt/inav/inav-configurator/images/inav_icon_128.png /opt/inav/inav-configurator/icon
```
9. As a one-off, move the desktop file into the applications directory 
```
sudo mv inav-configurator.desktop /usr/share/applications/
```
10. Make the following files executable:
   * inav-configurator `chmod +x /opt/inav/inav-configurator/inav-configurator`
11. Run the INAV Configurator app from the unpacked folder `/opt/inav/inav-configurator/inav-configurator`

### Mac

1. Visit [release page](https://github.com/iNavFlight/inav-configurator/releases)
2. Download Configurator for the Mac platform
3. Install
    * Extract ZIP archive and run INAV Configurator
    * OR use the DMG package for installation

## Building and running INAV Configurator locally (for development)

For local development, the **node.js** build system is used.

1. Install node.js
1. From the project folder run `yarn install` and then `npm install`
1. To build the  and start the configurator:
    - Run `npm start`.

To build the App run `npm run make` to build for your platform.

Options:
* Architecture: --arch  - Allowed values are: "ia32", "x64", "armv7l", "arm64", "universal", or "mips64el". 

See [Electron Forge CLI Documentation](https://www.electronforge.io/cli#options-2) for details

Note: Not all architectures are available for all platforms. For example, ia32 (32bit) support is not available for Linux. 
Tested architectures:
- Windows: x64 and ia32
- Linux: x64 and armv7l
- MacOS: x64 and arm64

To build the setup program for windows, you have to install [WiX Toolset V3](https://github.com/wixtoolset/wix3/releases) and add the `bin` folder to you `PATH`, e.g.
```C:\Program Files (x86)\WiX Toolset v3.14\bin```

To build deb and rpm packages for Linux, you have to install the following packages: 
- Ubuntu/Debian: `dpkg, fakeroot, rpm, build-essential, libudev-dev`
- OpenSuse/Fedora: `dpkg, fakeroot, rpmbuild, systemd-devel, devel-basis (zypper install -t pattern devel_basis), zip`

Example (note the double -- ):
```npm run make -- --arch="x64"```

### Running with debug | Inspector

To be able to open Inspector, set environment variable `NODE_ENV` to `development` or set the flag directly when run `npm start`:

```NODE_ENV=development npm start``` or ```$env:NODE_ENV="development" | npm start``` for Windows PowerShell

Or use vscode and start a debug session `Debug Configurator` (Just hit F5!)

## Different map providers

INAV Configurator 2.1 allows you to choose between OpenStreetMap, Bing Maps (Aerial View), and MapProxy map providers.
INAV Configurator is shipped **WITHOUT** API key for Bing Maps. That means: every user who wants to use Bing Maps has to create their own account, agree to all _Terms and Conditions_ required by Bing Maps, and configure INAV Configurator by himself.

### How to choose a Map provider

1. Click **Settings** icon in the top-right corner of INAV Configurator
1. Choose a provider: OpenStreetMap, Bing, or MapProxy
1. In the case of Bing Maps, you have to provide your own, personal, generated by you, Bing Maps API key
1. For MapProxy, you need to provide a server URL and layer name to be used

### How to get the Bing Maps API key

> On May 21, 2024 Microsoft announced that Bing Maps for Enterprise is deprecated and will be retired. Starting from that date
> new users are unable to get api keys in Bing Maps Dev Center. 
> 
> Enterprise account customers can continue to use Bing Maps for Enterprise services until **June 30th, 2028**.
> 
> Free (Basic) account customers can continue to use Bing Maps for Enterprise services until **June 30th, 2025**.

1. Go to the Bing Maps Dev Center at [https://www.bingmapsportal.com/](https://www.bingmapsportal.com/).
    * If you have a Bing Maps account, sign in with the Microsoft account that you used to create the account or create a new one. For new accounts, follow the instructions in [Creating a Bing Maps Account](https://msdn.microsoft.com/library/gg650598.aspx).
1. Select **My keys** under **My Account**.
1. Select the option to create a new key.
1. Provide the following information to create a key:
    1. Application name: Required. The name of the application.
    1. Application URL: The URL of the application. This is an optional field that is useful in helping you remember the purpose of that key in the future.
    1. Key type: Required. Select the key type that you want to create. You can find descriptions of key and application types here.
    1. Application type: Required. Select the application type that best represents the application that will use this key. You can find descriptions of key and application types [here](https://www.microsoft.com/maps/create-a-bing-maps-key.aspx).
1. Click the **Create** button. The new key is displayed in the list of available keys. Use this key to authenticate your Bing Maps application as described in the documentation for the Bing Maps API you are using.

### How to set up a MapProxy server for offline caching and mission planning
1. Follow the process described in [MAPPROXY.md](MAPPROXY.md)
1. Test your MapProxy server in a web browser, eg: http://192.168.145.20/inavmapproxy/
1. Once you have a working MapProxy server choose MapProxy as your map provider
	1. Enter MapProxy service URL, eg: http://192.168.145.20/inavmapproxy/service?
	1. Enter MapProxy service layer (inav_layer if configured from MAPPROXY.md)
1. Once completed, you can zoom in on the area you will be flying in while connected to the internet in either the GPS or Mission Control tab to save the cache for offline use

## Font Customisation

INAV provides the font images so that custom fonts can be created for your personal preference. This is the case for both analogue and digital fonts. The resources can be found in the [osd](/resources/osd) folder. Within the **analogue** and **digital** subfolders, you will find information on compiling your own fonts. There is also an [INAV Character Map](/resources/osd/INAV%20Character%20Map.md) document. This contains previews of all the character images in the fonts and the appropriate variable names within the firmware and Configurator. There are tools for compiling the [analogue](https://github.com/fiam/max7456tool) and [digital](https://github.com/MrD-RC/hdosd-font-tool) fonts. New font submissions via pull requests are welcome.

## Notes

### WebGL

Make sure Settings -> System -> "User hardware acceleration when available" is checked to achieve the best performance

## Issue trackers

For INAV configurator issues raise them here

https://github.com/iNavFlight/inav-configurator/issues

For INAV firmware issues, raise them here

https://github.com/iNavFlight/inav/issues

## Developers

We accept clean and reasonable patches, submit them!
