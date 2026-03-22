import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputRoot = path.resolve('dist-web', 'firmware');
const repository = process.env.WEB_FIRMWARE_REPO || 'iNavFlight/inav';
const releaseCount = Math.max(1, Number.parseInt(process.env.WEB_FIRMWARE_RELEASES || '1', 10) || 1);
const targetFilter = new Set(
    (process.env.WEB_FIRMWARE_TARGETS || '')
        .split(',')
        .map(target => target.trim().toUpperCase())
        .filter(Boolean)
);

function parseFilename(filename) {
    const targetFromFilenameExpression = /inav_([\d.]+(?:-rc\d+)?)?_?([^.]+)\.(.*)/;
    const match = targetFromFilenameExpression.exec(filename);

    if (!match) {
        return null;
    }

    return {
        rawTarget: match[2],
        format: match[3],
    };
}

async function fetchJson(url) {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'INAV-Configurator-Web-Firmware-Mirror',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

async function downloadAsset(url) {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/octet-stream',
            'User-Agent': 'INAV-Configurator-Web-Firmware-Mirror',
        },
        redirect: 'follow',
    });

    if (!response.ok) {
        throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
    }

    return new Uint8Array(await response.arrayBuffer());
}

async function main() {
    await mkdir(outputRoot, { recursive: true });

    const releases = await fetchJson(`https://api.github.com/repos/${repository}/releases?per_page=${releaseCount}`);
    const manifest = {
        generatedAt: new Date().toISOString(),
        repository,
        releases: [],
        devReleases: [],
    };

    for (const release of releases) {
        if (release.prerelease) {
            continue;
        }

        const mirroredAssets = [];
        const releaseDir = path.join(outputRoot, release.tag_name);
        await mkdir(releaseDir, { recursive: true });

        for (const asset of release.assets || []) {
            const parsed = parseFilename(asset.name);

            if (!parsed || parsed.format !== 'hex') {
                continue;
            }

            if (targetFilter.size > 0 && !targetFilter.has(parsed.rawTarget.toUpperCase())) {
                continue;
            }

            const assetBytes = await downloadAsset(asset.browser_download_url);
            const relativePath = path.posix.join('firmware', release.tag_name, asset.name);
            await writeFile(path.join(releaseDir, asset.name), assetBytes);

            mirroredAssets.push({
                name: asset.name,
                size: asset.size,
                browser_download_url: relativePath,
            });
        }

        if (mirroredAssets.length === 0) {
            continue;
        }

        manifest.releases.push({
            tag_name: release.tag_name,
            name: release.name,
            html_url: release.html_url,
            body: release.body,
            published_at: release.published_at,
            prerelease: false,
            assets: mirroredAssets,
        });
    }

    await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`Prepared web firmware mirror with ${manifest.releases.length} release(s) in ${outputRoot}`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
