
import {writeFile, readFile, mkdir, copyFile, access} from 'node:fs/promises'
import CONFIGURATOR from '../../js/data_storage';
import  os  from 'node:os';
import { app } from 'electron';
import path from 'path';
import extract from 'extract-zip';
import semver from 'semver';

const sitlTools = {
    
    getSitlReleases: async function name(devRelease, latest) {
        
        const response = await fetch(`https://api.github.com/repos/iNavFlight/inav${devRelease ? '-nightly' : ''}/releases?per_page=${latest ? '1' : '50'}`);
        if (!response.ok) {
            const message = (await response.json()).message;
            throw new Error(message || `GitHub Api Error: ${response.statusText}`);
            
        }
        const release = await response.json();
        const releases = release.filter(release => semver.gte(release.tag_name, CONFIGURATOR.minfirmwareVersionAccepted) && semver.lt(release.tag_name, CONFIGURATOR.maxFirmwareVersionAccepted));

        if (!release || releases.length == 0)
        {
            throw new Error("No SITL releases found")
        }
        
        var assets = [];
        releases.forEach(release => {
        
            if (!release.assets) {
                throw new Error("No assets found in releases for this version.")
            }

            const stitlResource = release.assets.find(asset => asset.name == 'sitl-resources.zip');

            if (stitlResource) {
                assets.push({
                    version: release.tag_name,
                    url: stitlResource.browser_download_url,
                    date: Date.parse(release.published_at),
                    nightly: release.prerelease && devRelease,
                    rc: release.prerelease && !devRelease
                });
            } else {
                throw new Error("No SITL asset found in releases for this version.")
            }
        });

        return assets;
    },

    fileExists: async function(path) {
        try {
            await access(path);
            return true;
        } catch {
            return false;
        }
    },
    
    // Fixme: Remove this when next major version is released and cygwin1.dll is included in release. 
    // Until then, we at least have working nightly builds.
    downloadCygwinDll: async function (path) {
        
        const responseDll = await fetch('https://raw.githubusercontent.com/Scavanger/cygwin-test/main/cygwin1.dll');

        if (!responseDll.ok) {
            throw new Error(`Failed to download cygwin1.dll: ${reponse.statusText}`);
        }
        const buffer = await responseDll.arrayBuffer();
        await writeFile(path, Buffer.from(buffer)); 
    },

    getCurretSITLVersion: async function () {
        const versionFilePath = path.join(app.getPath('userData'), 'sitl', 'version');
        let currentVersion = null;
        
        if (await this.fileExists(versionFilePath)) {
            currentVersion = await readFile(versionFilePath, 'utf8');
        } 

        return semver.valid(currentVersion);
    },

    downloadSitlBinary: async function (url, version) {

            const tempDir = (path.join(app.getPath('temp'), 'inav'));

            var currentVersion = await this.getCurretSITLVersion();
            if (currentVersion && semver.eq(currentVersion, version))  {
                throw new Error("This version is already installed.");
            }
                
            try {
                await mkdir(tempDir, { recursive: true });
            } catch (err) {
                throw new Error(`Failed to create temp directory: ${err.message}`);
            }
            const filePath = path.join(tempDir, 'sitl_resources.zip');

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    const message = (await response.json()).message;
                    throw new Error(`Failed to download SITL resouces: ` + message || `GitHub Api Error: ${response.statusText}}`);
                }
                const buffer = await response.arrayBuffer();
                await writeFile(filePath, Buffer.from(buffer));
            } catch (err) {
                throw new Error(`Failed to download SITL resources: ${err.message}`);
            }

            try {
                await extract(filePath, { dir: tempDir });
            } catch (err) {
                throw new Error(`Failed to extract SITL resources: ${err.message}`);
            }

            const arch = os.arch();
            const platform = os.platform();

            try {
                if (platform === 'win32' && arch === 'x64') {
                    await copyFile(path.join(tempDir, 'resources', 'sitl', 'windows', 'inav_SITL.exe'), path.join(app.getPath('userData'), 'sitl', 'inav_SITL.exe'));
                    
                    const cygwin1Path = path.join(tempDir, 'resources', 'sitl', 'windows', 'cygwin1.dll');
                    const installedCygwin1Path = path.join(app.getPath('userData'), 'sitl', 'cygwin1.dll');
                    
                    if (await this.fileExists(cygwin1Path)) {
                        await copyFile(cygwin1Path, installedCygwin1Path);
                    } else if (!await this.fileExists(installedCygwin1Path)) {  
                        await this.downloadCygwinDll(installedCygwin1Path); // <-- Fixme!
                    }
                    
                } else if (platform === 'linux' && arch === 'x64') {
                    await copyFile(path.join(tempDir, 'resources', 'sitl', 'linux', 'inav_SITL'), path.join(app.getPath('userData'), 'sitl', 'inav_SITL'));
                } else if (platform === 'linux' && arch === 'arm64') {
                    await copyFile(path.join(tempDir, 'resources', 'sitl', 'linux', 'arm64', 'inav_SITL'), path.join(app.getPath('userData'), 'sitl', 'inav_SITL'));
                } else if (platform === 'darwin' && (arch === 'x64' || arch === 'arm64')) {
                    await copyFile(path.join(tempDir, 'resources', 'sitl', 'macos', 'inav_SITL'), path.join(app.getPath('userData'), 'sitl', 'inav_SITL'));
                }
                await writeFile(path.join(app.getPath('userData'), 'sitl', 'version'), version);
            } catch (err) {
                throw new Error(`Failed to copy SITL binary: ${err.message}`);
            } 
    }
}

export default sitlTools;