const path = require('path');
const fs = require('fs');

module.exports = {
  packagerConfig: {
    executableName: "inav-configurator",
    asar: false,
    icon: 'images/inav',
    ignore: [
      "^(\/\.vscode$)",
      "^(\/support$)",
      ".gitattributes",
      ".gitignore",
      "3D_model_creation.md",
      "LICENSE",
      "MAPPROXY.md",
      "package-lock.json",
      "README.md",
      "inav_icon_128.psd",
    ]
  },
  hooks: {
    // Uniform artifact file names
    postMake: async (config, makeResults) => {
      makeResults.forEach(result => {
        var baseName = `${result.packageJSON.productName.replace(' ', '-')}_${result.platform}_${result.arch}_${result.packageJSON.version}`;
        result.artifacts.forEach(artifact => {
          var artifactStr = artifact.toString();
          var newPath = path.join(path.dirname(artifactStr), baseName + path.extname(artifactStr));
          fs.renameSync(artifactStr, newPath);
          console.log('Artifact: ' + newPath);
        });
      });
    }
  },
  rebuildConfig: {},
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
        ui : {
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
