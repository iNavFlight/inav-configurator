import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  packagerConfig: {
    executableName: "inav-configurator",
    asar: false,
    icon: 'images/inav',
    extraResource: [
      'resources/public/sitl'
    ],
  },
  rebuildConfig: {},
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'js/main/main.js',
            config: 'vite.main.config.js',
          },
          {
            entry: 'js/main/preload.js',
            config: 'vite.preload.config.js',
          },
          {
            entry: 'js/libraries/bluetooth-device-chooser/bt-device-chooser-preload.js',
            config: 'vite.preload.config.js',
          },
        ],
        renderer: [
          {
            name: 'bt_device_chooser',
            config: 'vite.bt-dc-renderer.config.js',
          },
          {
            name: 'main_window',
            config: 'vite.main-renderer.config.js',
          },
        ],
      },
    },
  ],
  hooks: {
    // Remove SITL binaries for other platforms/architectures to reduce package size
    postPackage: async (forgeConfig, options) => {
      for (const outputPath of options.outputPaths) {
        const sitlPath = path.join(outputPath, 'resources', 'sitl');
        if (!fs.existsSync(sitlPath)) continue;

        if (options.platform === 'win32') {
          fs.rmSync(path.join(sitlPath, 'linux'), { recursive: true, force: true });
          fs.rmSync(path.join(sitlPath, 'macos'), { recursive: true, force: true });
        } else if (options.platform === 'darwin') {
          fs.rmSync(path.join(sitlPath, 'linux'), { recursive: true, force: true });
          fs.rmSync(path.join(sitlPath, 'windows'), { recursive: true, force: true });
        } else if (options.platform === 'linux') {
          fs.rmSync(path.join(sitlPath, 'macos'), { recursive: true, force: true });
          fs.rmSync(path.join(sitlPath, 'windows'), { recursive: true, force: true });
          // Remove wrong architecture
          if (options.arch === 'x64') {
            fs.rmSync(path.join(sitlPath, 'linux', 'arm64'), { recursive: true, force: true });
          } else if (options.arch === 'arm64') {
            // Move arm64 binary to linux root and remove x64
            const arm64Binary = path.join(sitlPath, 'linux', 'arm64', 'inav_SITL');
            const destBinary = path.join(sitlPath, 'linux', 'inav_SITL');
            if (fs.existsSync(arm64Binary)) {
              fs.rmSync(destBinary, { force: true });
              fs.renameSync(arm64Binary, destBinary);
              fs.rmSync(path.join(sitlPath, 'linux', 'arm64'), { recursive: true, force: true });
            }
          }
        }
      }
    },
    // Uniform artifact file names
    postMake: async (config, makeResults) => {
      makeResults.forEach(result => {
        var baseName = `${result.packageJSON.productName.replace(' ', '-')}_${result.platform}_${result.arch}_${result.packageJSON.version}`;
        result.artifacts.forEach(artifact => {
          var artifactStr = artifact.toString();
          var newPath = path.join(path.dirname(artifactStr), baseName + path.extname(artifactStr));
          newPath = newPath.replace('Configurator_win32_ia32', 'Configurator_Win32');
          newPath = newPath.replace('Configurator_win32_x64', 'Configurator_Win64');
          newPath = newPath.replace('Configurator_darwin', 'Configurator_MacOS');
          fs.renameSync(artifactStr, newPath);
          console.log('Artifact: ' + newPath);
        });
      });
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-wix',
      config: {
        name: "INAV Configurator",
        shortName: "INAV",
        exe: "inav-configurator",
        description: "Configurator for the open source flight controller software INAV.",
        programFilesFolderName: "inav-configurator",
        shortcutFolderName: "INAV",
        manufacturer: "The INAV open source project",
        appUserModelId: "com.inav.configurator",
        icon: path.join(__dirname, "./assets/windows/inav_installer_icon.ico"),
        upgradeCode: "13606ff3-b0bc-4dde-8fac-805bc8aed2f8",
        ui: {
          enabled: false,
          chooseDirectory: true,
          images: {
            background: path.join(__dirname, "./assets/windows/background.jpg"),
            banner: path.join(__dirname, "./assets/windows/banner.jpg")
          }
        },
        // Standard WiX template appends the unsightly "(Machine - WSI)" to the name, so use our own template
        beforeCreate: (msiCreator) => {
          return new Promise((resolve, reject) => {
            fs.readFile(path.join(__dirname,"./assets/windows/wix.xml"), "utf8" , (err, content) => {
                if (err) {
                    reject (err);
                }
                msiCreator.wixTemplate = content;
                resolve();
            });
          });
        }
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: "INAV Configurator",
        title: "INAV-Configurator",  // Volume name without spaces to avoid hdiutil detach issues
        background: "./assets/osx/dmg-background.png",
        icon: "./images/inav.icns"
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32', 'linux', 'darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: "inav-configurator",
          productName: "INAV Configurator",
          categories: ["Utility"],
          icon: "./assets/linux/icon/inav_icon_128.png",
          description: "Configurator for the open source flight controller software INAV.",
          homepage: "https://github.com/inavflight/",

        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          name: "inav-configurator",
          productName: "INAV Configurator",
          license: "GPL-3.0",
          categories: ["Utility"],
          icon: "./assets/linux/icon/inav_icon_128.png",
          description: "Configurator for the open source flight controller software INAV.",
          homepage: "https://github.com/inavflight/",
        }
      },
    },
  ],
};
