const path = require('path');
const fs = require('fs');
const spawn = require('child_process');

module.exports = {
  packagerConfig: {
    executableName: "inav-configurator",
    asar: false,
    icon: 'images/inav',
    /*
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
      */
  },
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        devContentSecurityPolicy: `default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;`,
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './index.html',
              js: './js/configurator_main.js',
              name: 'main window',
              preload: {
                js: './js/main/preload.js',
              },
            },
            {
              html: './js/libraries/bluetooth-device-chooser/index.html',
              js: './js/libraries/bluetooth-device-chooser/renderer.js',
              name: 'bt device chooser',
              preload: {
                js: './js/libraries/bluetooth-device-chooser/preload.js',
              }
            }
          ],
        },
      },
    },
  ],
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
    },
    packageAfterPrune: async (_, buildPath, __, platform) => {
      const commands = [
        "install",
        "--no-package-lock",
        "--no-save",
        "serialport",
      ];

      return new Promise((resolve, reject) => {
        const oldPckgJson = path.join(buildPath, "package.json");
        const newPckgJson = path.join(buildPath, "_package.json");

        fs.renameSync(oldPckgJson, newPckgJson);

        const npmInstall = spawn("npm", commands, {
          cwd: buildPath,
          stdio: "inherit",
          shell: true,
        });

        npmInstall.on("close", (code) => {
          if (code === 0) {
            fs.renameSync(newPckgJson, oldPckgJson);

            /**
             * On windows code signing fails for ARM binaries etc.,
             * we remove them here
             */
            if (platform === "win32") {
              const problematicPaths = [
                "android-arm",
                "android-arm64",
                "darwin-x64+arm64",
                "linux-arm",
                "linux-arm64",
                "linux-x64",
              ];

              problematicPaths.forEach((binaryFolder) => {
                fs.rmSync(
                  path.join(
                    buildPath,
                    "node_modules",
                    "@serialport",
                    "bindings-cpp",
                    "prebuilds",
                    binaryFolder
                  ),
                  { recursive: true, force: true }
                );
              });
            }

            resolve();
          } else {
            reject(new Error("process finished with error code " + code));
          }
        });

        npmInstall.on("error", (error) => {
          reject(error);
        });
      });
    },
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
