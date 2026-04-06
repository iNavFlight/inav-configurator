'use strict';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw'; // for L.GeometryUtil.geodesicArea
import 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';

import { GUI, TABS } from './../js/gui';
import i18n from './../js/localization';
import store from './../js/store';
import { globalSettings, UnitType } from './../js/globalSettings';
import JSZip from 'jszip';

// Fix Leaflet default marker icon paths (broken by bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
    iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
    shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

TABS.map_generator = {};

// ─── Tile math ──────────────────────────────────────────────────────────
function lon2tile(lon, zoom) {
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}

function lat2tile(lat, zoom) {
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
}

function calculateTiles(bounds, minZ, maxZ) {
    let total = 0;
    for (let z = minZ; z <= maxZ; z++) {
        const tz = z - 1; // UI shows 1-20, tile servers use 0-19
        total += (Math.abs(lon2tile(bounds.getWest(), tz) - lon2tile(bounds.getEast(), tz)) + 1) *
                 (Math.abs(lat2tile(bounds.getSouth(), tz) - lat2tile(bounds.getNorth(), tz)) + 1);
    }
    return total;
}

function buildTileList(bounds, minZ, maxZ) {
    const tiles = [];
    for (let z = minZ; z <= maxZ; z++) {
        const tz = z - 1; // UI shows 1-20, tile servers use 0-19
        const xMin = lon2tile(bounds.getWest(), tz);
        const xMax = lon2tile(bounds.getEast(), tz);
        const yMin = lat2tile(bounds.getNorth(), tz);
        const yMax = lat2tile(bounds.getSouth(), tz);
        for (let x = xMin; x <= xMax; x++) {
            for (let y = yMin; y <= yMax; y++) {
                tiles.push({ z, tz, x, y });
            }
        }
    }
    return tiles;
}

function addTileToZip(zip, pathArr, buf) {
    let folder = zip;
    for (let i = 0; i < pathArr.length - 1; i++) {
        folder = folder.folder(pathArr[i]);
    }
    folder.file(pathArr.at(-1), new Uint8Array(buf));
}

async function tileExistsOnSD(fullPath) {
    try {
        const result = await globalThis.electronAPI.readFile(fullPath, null);
        return result && !result.error && result.data && result.data.byteLength > 128;
    } catch (_) {
        // File doesn't exist
        return false;
    }
}

// ─── Unit formatting ────────────────────────────────────────────────────
function formatDistance(meters, unit) {
    switch (unit) {
        case 'km2':
        case 'ha':
            return meters >= 1000 ? (meters / 1000).toFixed(2) + ' km' : Math.round(meters) + ' m';
        case 'mi2':
        case 'acre': {
            const mi = meters / 1609.344;
            return mi >= 1 ? mi.toFixed(2) + ' mi' : Math.round(meters * 3.28084) + ' ft';
        }
        default:
            return meters >= 1000 ? (meters / 1000).toFixed(2) + ' km' : Math.round(meters) + ' m';
    }
}

function formatArea(sqMeters, unit) {
    if (sqMeters === 0) return '0.00 ' + unit;
    switch (unit) {
        case 'km2':  return (sqMeters / 1000000).toFixed(2) + ' km²';
        case 'mi2':  return (sqMeters / 2589988.11).toFixed(2) + ' mi²';
        case 'ha':   return (sqMeters / 10000).toFixed(2) + ' ha';
        case 'acre': return (sqMeters / 4046.86).toFixed(2) + ' acre';
        default:     return sqMeters.toFixed(0) + ' m²';
    }
}

// ─── Tile URL resolution ────────────────────────────────────────────────
// z here is already 0-based (tile server zoom)
function getTileUrl(provider, mapType, z, x, y) {
    if (provider === 'ESRI') {
        return mapType === 'Street'
            ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`
            : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    }
    if (provider === 'OSM') {
        return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    }
    // GOOGLE
    if (mapType === 'Satellite') return `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}`;
    if (mapType === 'Hybrid')    return `https://mt1.google.com/vt/lyrs=y&x=${x}&y=${y}&z=${z}`;
    return `https://mt1.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`;
}

// ─── Yaapu display name helper ──────────────────────────────────────────
function getYaapuMapName(mapType) {
    if (mapType === 'Satellite') return 'GoogleSatelliteMap';
    if (mapType === 'Hybrid') return 'GoogleHybridMap';
    return 'GoogleMap';
}

// ─── Output path building ───────────────────────────────────────────────
function getTilePath({ target, isZipMode, provider, mapType, z, x, y, subtarget }) {
    const displayZoom = z.toString();

    if (target === 'b14ckyy') {
        const base = isZipMode ? ['ethosmaps', 'maps'] : ['bitmaps', 'ethosmaps', 'maps'];
        if (provider === 'ESRI') {
            return [...base, provider, mapType, displayZoom, `${y}`, `${x}.jpg`];
        }
        return [...base, provider, mapType, displayZoom, `${x}`, `${y}.jpg`];
    }

    // Yaapu — always uses Google-style folder names regardless of provider
    const yaapuMapName = getYaapuMapName(mapType);

    if (isZipMode) {
        // ZIP path is the same for both ETHOS and EdgeTX
        return ['yaapu', 'maps', yaapuMapName, displayZoom, `${y}`, `s_${x}.png`];
    }
    // SD path differs: ETHOS uses /bitmaps/, EdgeTX uses /IMAGES/
    const base = subtarget === 'edgetx'
        ? ['IMAGES', 'yaapu', 'maps']
        : ['bitmaps', 'yaapu', 'maps'];
    return [...base, yaapuMapName, displayZoom, `${y}`, `s_${x}.png`];
}

// ─── Image loading with timeout ─────────────────────────────────────────
function loadImage(url, timeoutMs = 6000) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        let finished = false;
        const timer = setTimeout(() => {
            if (finished) return;
            finished = true;
            reject(new Error(`Image load timeout: ${url}`));
        }, timeoutMs);

        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            resolve(img);
        };
        img.onerror = () => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            reject(new Error(`Image load failed: ${url}`));
        };
        img.src = url;
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Canvas helpers ─────────────────────────────────────────────────────
function createWorkerCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    return { canvas, ctx: canvas.getContext('2d') };
}

function canvasToArrayBuffer(canvas, target) {
    const mimeType = (target === 'b14ckyy') ? 'image/jpeg' : 'image/png';
    const quality = (target === 'b14ckyy') ? 0.7 : undefined;
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (!blob) return reject(new Error('Canvas conversion failed'));
            blob.arrayBuffer().then(resolve).catch(reject);
        }, mimeType, quality);
    });
}

// ─── Tile fetch + resize ────────────────────────────────────────────────
async function fetchResizedTile(provider, mapType, z, x, y, canvas, ctx, target) {
    // Check local cache first
    const cached = await tileCache.get(provider, mapType, z, x, y);
    if (cached) return cached;

    const img = await loadImage(getTileUrl(provider, mapType, z, x, y));
    ctx.clearRect(0, 0, 100, 100);
    ctx.drawImage(img, 0, 0, 256, 256, 0, 0, 100, 100);

    // ESRI Hybrid: overlay transportation labels
    if (provider === 'ESRI' && mapType === 'Hybrid') {
        try {
            const labelUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/${z}/${y}/${x}`;
            const labelImg = await loadImage(labelUrl);
            ctx.drawImage(labelImg, 0, 0, 256, 256, 0, 0, 100, 100);
        } catch (_) { /* overlay is non-critical, continue without labels */ }
    }

    const buf = await canvasToArrayBuffer(canvas, target);
    if (buf.byteLength < 128) {
        throw new Error('Generated tile too small — likely corrupt');
    }

    // Write to local cache
    tileCache.put(provider, mapType, z, x, y, buf);

    return buf;
}

/* Retry transient tile download failures before declaring a tile lost.
 * Fast-fails (under 1.5s) indicate server rejection (e.g. 403 rate-limit),
 * so retries are skipped to avoid hammering the provider. */
async function fetchResizedTileWithRetry(provider, mapType, z, x, y, canvas, ctx, target) {
    const maxRetries = 2;
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const t0 = Date.now();
        try {
            return await fetchResizedTile(provider, mapType, z, x, y, canvas, ctx, target);
        } catch (err) {
            lastError = err;
            const elapsed = Date.now() - t0;
            if (elapsed < 1500) break;
            if (attempt < maxRetries) {
                await sleep(300 * (attempt + 1));
            }
        }
    }
    throw lastError || new Error('Tile fetch failed');
}

// ─── Ensure directory tree exists via electronAPI ───────────────────────
async function ensureDir(basePath, pathSegments) {
    let current = basePath;
    for (const segment of pathSegments) {
        current = current + '/' + segment;
        // writeFile will create parent dirs, but we build the full path
    }
    return current;
}

// ─── Tile cache ─────────────────────────────────────────────────────────
const tileCache = {
    basePath: null,
    enabled: true,
    trackedSizeBytes: 0,
    writeCount: 0,

    init() {
        const userData = globalThis.electronAPI.appGetPath('userData');
        this.basePath = userData + '/map_tiles';
        this.enabled = store.get('mapgen_cache_enabled', true);
        this.trackedSizeBytes = store.get('mapgen_cache_size_bytes', 0);
    },

    getCachePath(provider, mapType, z, x, y) {
        return `${this.basePath}/${provider}/${mapType}/${z}/${x}/${y}.jpg`;
    },

    async get(provider, mapType, z, x, y) {
        if (!this.enabled || !this.basePath) return null;
        try {
            const path = this.getCachePath(provider, mapType, z, x, y);
            const result = await globalThis.electronAPI.readFile(path, null);
            if (result && !result.error && result.data && result.data.byteLength > 128) {
                return result.data;
            }
        } catch (_) {
            // Cache miss — tile not in local cache
        }
        return null;
    },

    async put(provider, mapType, z, x, y, buf) {
        if (!this.enabled || !this.basePath) return;
        // Check max cache size
        const maxBytes = (store.get('mapgen_cache_max_mb', 500)) * 1024 * 1024;
        if (this.trackedSizeBytes >= maxBytes) return;
        try {
            const path = this.getCachePath(provider, mapType, z, x, y);
            await globalThis.electronAPI.writeFile(path, new Uint8Array(buf));
            this.trackedSizeBytes += buf.byteLength;
            // Persist every 50 tiles to avoid constant writes
            if (++this.writeCount % 50 === 0) {
                store.set('mapgen_cache_size_bytes', this.trackedSizeBytes);
            }
        } catch (err) {
            console.warn('Cache write failed:', err.message);
        }
    },

    persistSize() {
        store.set('mapgen_cache_size_bytes', this.trackedSizeBytes);
    },

    getFormattedSize() {
        const mb = this.trackedSizeBytes / (1024 * 1024);
        return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
    },

    async clear() {
        if (!this.basePath) return;
        try {
            await globalThis.electronAPI.rm(this.basePath);
            this.trackedSizeBytes = 0;
            store.set('mapgen_cache_size_bytes', 0);
        } catch (err) {
            console.warn('Cache clear failed:', err.message);
        }
    },
};

// ─── SRTM HGT → DAT conversion engine ──────────────────────────────────
const SRTM_BASE_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/skadi';
const SRTM_GRID = 3601;
const TERRAIN_SPACING = 30;
const TERRAIN_BLK_SIZE_X = 28;
const TERRAIN_BLK_SIZE_Y = 32;
const TERRAIN_BLK_SPACE_X = 24;
const TERRAIN_BLK_SPACE_Y = 28;
const TERRAIN_IO_BLOCK = 2048;
const TERRAIN_IO_DATA = 1821;
const LOCATION_SCALING_FACTOR_F32 = Math.fround(0.011131884502145034);
const LOCATION_SCALING_FACTOR_INV_F32 = Math.fround(89.83204953368922);

function crc16xmodem(data, len) {
    let crc = 0;
    for (let i = 0; i < len; i++) {
        crc ^= data[i] << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
            crc &= 0xFFFF;
        }
    }
    return crc;
}

function lonScale(latDeg) {
    return Math.max(Math.fround(Math.cos(Math.fround(latDeg * Math.PI / 180))), 0.01);
}

function addOffset(latE7, lonE7, ofsNorth, ofsEast) {
    const dlat = Math.trunc(ofsNorth * LOCATION_SCALING_FACTOR_INV_F32);
    const ls = lonScale((latE7 + dlat * 0.5) * 1e-7);
    const dlng = Math.trunc((ofsEast * LOCATION_SCALING_FACTOR_INV_F32) / ls);
    return [latE7 + dlat, lonE7 + dlng];
}

function eastBlocks(latE7, lonE7) {
    const r = addOffset(latE7, lonE7 + 10000000, 0, 2 * TERRAIN_SPACING * TERRAIN_BLK_SIZE_Y);
    const dlng = r[1] - lonE7;
    const eastDist = dlng * LOCATION_SCALING_FACTOR_F32 * lonScale((latE7 + r[0]) * 0.5 * 1e-7);
    return Math.floor(eastDist / (TERRAIN_SPACING * TERRAIN_BLK_SPACE_Y));
}

function makeHgtView(hgtData) {
    const hgtBuf = (hgtData.buffer && hgtData.buffer.byteLength === hgtData.length)
        ? hgtData.buffer : hgtData.buffer.slice(hgtData.byteOffset, hgtData.byteOffset + hgtData.byteLength);
    return new DataView(hgtBuf);
}

function hgtElevation(hgtCache, degLat, degLon, lat, lon) {
    let tileLat = Math.floor(lat);
    let tileLon = Math.floor(lon);
    let key = tileLat + '_' + tileLon;
    let hgtView = hgtCache[key];
    if (!hgtView) {
        key = degLat + '_' + degLon;
        hgtView = hgtCache[key];
        if (!hgtView) return 0;
        tileLat = degLat;
        tileLon = degLon;
    }
    const fracLat = Math.max(0, Math.min(1, lat - tileLat));
    const fracLon = Math.max(0, Math.min(1, lon - tileLon));
    const rowF = (1 - fracLat) * 3600;
    const colF = fracLon * 3600;
    const r0 = Math.max(0, Math.min(3599, Math.floor(rowF)));
    const c0 = Math.max(0, Math.min(3599, Math.floor(colF)));
    const r1 = Math.min(3600, r0 + 1);
    const c1 = Math.min(3600, c0 + 1);
    const dr = Math.max(0, Math.min(1, rowF - r0));
    const dc = Math.max(0, Math.min(1, colF - c0));
    function getH(r, c) {
        const v = hgtView.getInt16((r * SRTM_GRID + c) * 2, false);
        return v === -32768 ? 0 : v;
    }
    const alt = Math.trunc(
        getH(r0, c0) * (1 - dr) * (1 - dc) +
        getH(r0, c1) * (1 - dr) * dc +
        getH(r1, c0) * dr * (1 - dc) +
        getH(r1, c1) * dr * dc
    );
    return alt < 0 ? 0 : alt;
}

function srtmTileName(lat, lon) {
    const lp = lat >= 0 ? 'N' : 'S';
    const lnp = lon >= 0 ? 'E' : 'W';
    return lp + String(Math.abs(lat)).padStart(2, '0') + lnp + String(Math.abs(lon)).padStart(3, '0');
}

function srtmUrl(lat, lon) {
    const name = srtmTileName(lat, lon);
    return SRTM_BASE_URL + '/' + name.substring(0, 3) + '/' + name + '.hgt.gz';
}

function estimateDatSizeMB(lat) {
    const baseLat = Math.floor(Math.abs(lat)) * (lat >= 0 ? 1 : -1) * 10000000;
    const baseLon = 0;
    let numX = 0;
    while (addOffset(baseLat, baseLon, numX * TERRAIN_BLK_SPACE_X * TERRAIN_SPACING, 0)[0] * 1e-7 - baseLat * 1e-7 < 1.0) numX++;
    const numY = eastBlocks(baseLat, baseLon);
    return (numX * numY * TERRAIN_IO_BLOCK) / 1048576;
}

function packTerrainBlock(latE7, lonE7, spacing, heights, idxX, idxY, lonDeg, latDeg) {
    const buf = new ArrayBuffer(TERRAIN_IO_BLOCK);
    const v = new DataView(buf);
    const u8 = new Uint8Array(buf);
    v.setBigUint64(0, 0x00FFFFFFFFFFFFFFn, true);
    v.setInt32(8, latE7, true);
    v.setInt32(12, lonE7, true);
    v.setUint16(16, 0, true);
    v.setUint16(18, 1, true);
    v.setUint16(20, spacing, true);
    let off = 22;
    for (let x = 0; x < TERRAIN_BLK_SIZE_X; x++) {
        for (let y = 0; y < TERRAIN_BLK_SIZE_Y; y++) {
            v.setInt16(off, heights[x * TERRAIN_BLK_SIZE_Y + y], true);
            off += 2;
        }
    }
    v.setUint16(1814, idxX, true);
    v.setUint16(1816, idxY, true);
    v.setInt16(1818, lonDeg, true);
    v.setInt8(1820, latDeg);
    v.setUint8(1821, 1);
    const crc = crc16xmodem(u8, TERRAIN_IO_DATA);
    v.setUint16(16, crc, true);
    return u8;
}

async function createDatFromHgt(degLat, degLon, hgtCache, progressCb) {
    const baseLat = degLat * 10000000;
    const baseLon = degLon * 10000000;
    let numX = 0;
    while (addOffset(baseLat, baseLon, numX * TERRAIN_BLK_SPACE_X * TERRAIN_SPACING, 0)[0] * 1e-7 - degLat < 1.0) numX++;
    const numY = eastBlocks(baseLat, baseLon);
    const totalBlocks = numX * numY;
    const output = new Uint8Array(totalBlocks * TERRAIN_IO_BLOCK);
    let blockNum = 0;
    for (let ix = 0; ix < numX; ix++) {
        for (let iy = 0; iy < numY; iy++) {
            const blk = addOffset(baseLat, baseLon,
                ix * TERRAIN_BLK_SPACE_X * TERRAIN_SPACING,
                iy * TERRAIN_BLK_SPACE_Y * TERRAIN_SPACING);
            const latE7 = blk[0];
            const lonE7 = blk[1];
            const heights = new Int16Array(TERRAIN_BLK_SIZE_X * TERRAIN_BLK_SIZE_Y);
            for (let gx = 0; gx < TERRAIN_BLK_SIZE_X; gx++) {
                for (let gy = 0; gy < TERRAIN_BLK_SIZE_Y; gy++) {
                    const pt = addOffset(baseLat, baseLon,
                        (ix * TERRAIN_BLK_SPACE_X + gx) * TERRAIN_SPACING,
                        (iy * TERRAIN_BLK_SPACE_Y + gy) * TERRAIN_SPACING);
                    heights[gx * TERRAIN_BLK_SIZE_Y + gy] = hgtElevation(hgtCache, degLat, degLon, pt[0] * 1e-7, pt[1] * 1e-7);
                }
            }
            const block = packTerrainBlock(latE7, lonE7, TERRAIN_SPACING, heights, ix, iy, degLon, degLat);
            output.set(block, blockNum * TERRAIN_IO_BLOCK);
            blockNum++;
            if (blockNum % 200 === 0) {
                if (progressCb) progressCb(blockNum, totalBlocks);
                await new Promise(r => setTimeout(r, 0));
            }
        }
    }
    if (progressCb) progressCb(totalBlocks, totalBlocks);
    return output;
}

async function decompressGz(arrayBuffer) {
    const ds = new DecompressionStream('gzip');
    const blob = new Blob([arrayBuffer]);
    const decompressed = blob.stream().pipeThrough(ds);
    const reader = decompressed.getReader();
    const chunks = [];
    while (true) {
        const result = await reader.read();
        if (result.done) break;
        chunks.push(result.value);
    }
    const totalLen = chunks.reduce((s, c) => s + c.length, 0);
    const data = new Uint8Array(totalLen);
    let off = 0;
    for (const chunk of chunks) { data.set(chunk, off); off += chunk.length; }
    return data;
}

async function fetchSrtmTile(lat, lon, statusCb) {
    const url = srtmUrl(lat, lon);
    if (statusCb) statusCb('connecting');
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    if (statusCb) statusCb('downloading');
    const gz = await resp.arrayBuffer();
    if (statusCb) statusCb('decompressing');
    return await decompressGz(gz);
}

function terrainDatFilename(lat, lon) {
    const latPrefix = lat >= 0 ? 'N' : 'S';
    const lonPrefix = lon >= 0 ? 'E' : 'W';
    const latStr = String(Math.abs(lat)).padStart(2, '0');
    const lonStr = String(Math.abs(lon)).padStart(3, '0');
    return latPrefix + latStr + lonPrefix + lonStr + '.DAT';
}

function getTerrainDegreeTiles(bounds) {
    const tiles = [];
    const latMin = Math.floor(bounds.getSouth());
    const latMax = Math.floor(bounds.getNorth());
    const lonMin = Math.floor(bounds.getWest());
    const lonMax = Math.floor(bounds.getEast());
    for (let lat = latMin; lat <= latMax; lat++) {
        for (let lon = lonMin; lon <= lonMax; lon++) {
            tiles.push({ lat, lon });
        }
    }
    return tiles;
}

// ─── IndexedDB HGT cache (persist downloaded SRTM tiles for resume/reuse) ──
const hgtDb = {
    _instance: null,

    open() {
        if (this._instance) return Promise.resolve(this._instance);
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('terrainHgtCache', 1);
            req.onupgradeneeded = e => e.target.result.createObjectStore('hgt');
            req.onsuccess = e => { this._instance = e.target.result; resolve(this._instance); };
            req.onerror = () => reject(req.error);
        });
    },

    async get(key) {
        try {
            const db = await this.open();
            return new Promise(resolve => {
                const req = db.transaction('hgt', 'readonly').objectStore('hgt').get(key);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            });
        } catch (_) { return null; }
    },

    async put(key, data) {
        try {
            const db = await this.open();
            return new Promise(resolve => {
                const tx = db.transaction('hgt', 'readwrite');
                tx.objectStore('hgt').put(data, key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            });
        } catch (_) { /* ignore */ }
    },

    async cachedSet() {
        try {
            const db = await this.open();
            return new Promise(resolve => {
                const req = db.transaction('hgt', 'readonly').objectStore('hgt').getAllKeys();
                req.onsuccess = () => resolve(new Set(req.result));
                req.onerror = () => resolve(new Set());
            });
        } catch (_) { return new Set(); }
    },

    async clear() {
        try {
            const db = await this.open();
            return new Promise(resolve => {
                const tx = db.transaction('hgt', 'readwrite');
                tx.objectStore('hgt').clear();
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            });
        } catch (_) { /* ignore */ }
    },
};

// ─── Tab lifecycle ──────────────────────────────────────────────────────
TABS.map_generator.initialize = function (callback) {
    if (GUI.active_tab !== 'map_generator') {
        GUI.active_tab = 'map_generator';
    }

    loadHtml();

    async function loadHtml() {
        const { default: html } = await import('./map_generator.html?raw');
        GUI.load(html, process_html);
    }

    function process_html() {
        i18n.localize();

        // ── State ───────────────────────────────────────────────────
        let map = null;
        let currentLayer = null;
        let drawnItems = null;
        let sideLabels = { width: null, height: null };
        let sdPath = store.get('mapgen_sd_path', null);
        let syncAborted = false;
        const TILE_CONCURRENCY = 4;
        let terrainGridLayer = null;
        let liveAltEnabled = false;
        let liveAltCache = {};
        let preTerrainZoom = null;

        // ── Initialize tile cache ───────────────────────────────────
        tileCache.init();

        // ── Populate zoom selectors, respecting per-provider max zoom ──
        const PROVIDER_MAX_ZOOM = { OSM: 19, ESRI: 20, GOOGLE: 20 };
        const minZSelect = $('#mapgen_min_zoom');
        const maxZSelect = $('#mapgen_max_zoom');
        function rebuildZoomSelectors(maxZ) {
            const prevMin = parseInt(minZSelect.val()) || 8, prevMax = parseInt(maxZSelect.val()) || 14;
            minZSelect.empty(); maxZSelect.empty();
            for (let i = 1; i <= maxZ; i++) {
                minZSelect.append(new Option(i, i));
                maxZSelect.append(new Option(i, i));
            }
            minZSelect.val(Math.min(prevMin, maxZ));
            maxZSelect.val(Math.min(prevMax, maxZ));
        }
        rebuildZoomSelectors(20);

        // ── Restore settings (only if user explicitly saved) ────────
        const settingsSaved = store.get('mapgen_settings_saved', false);
        const savedTarget    = settingsSaved ? store.get('mapgen_target', 'b14ckyy') : 'b14ckyy';
        const savedSubtarget = settingsSaved ? store.get('mapgen_subtarget', 'ethos') : 'ethos';
        const savedProvider  = settingsSaved ? store.get('mapgen_provider', 'OSM') : 'OSM';
        const savedProject   = settingsSaved ? store.get('mapgen_project_name', 'MyLocalField') : 'MyLocalField';
        const savedMinZoom   = settingsSaved ? store.get('mapgen_min_zoom', 8) : 8;
        const savedMaxZoom   = settingsSaved ? store.get('mapgen_max_zoom', 14) : 14;
        const defaultUnit    = globalSettings.unitType === UnitType.imperial ? 'mi2' : 'km2';
        const savedUnit      = settingsSaved ? store.get('mapgen_area_unit', defaultUnit) : defaultUnit;
        const savedCenter    = settingsSaved ? store.get('mapgen_last_center', [42.6977, 23.3219]) : [42.6977, 23.3219];
        const savedZoom      = settingsSaved ? store.get('mapgen_last_zoom', 12) : 12;

        $('#mapgen_subtarget').val(savedSubtarget);
        $('#mapgen_target').val(savedTarget);
        $('#mapgen_provider').val(savedProvider);
        $('#mapgen_project_name').val(savedProject);
        $('#mapgen_min_zoom').val(savedMinZoom);
        $('#mapgen_max_zoom').val(savedMaxZoom);
        $('#mapgen_area_unit').val(savedUnit);

        // ── SD path display ─────────────────────────────────────────
        function updateSdDisplay() {
            if (sdPath) {
                $('#mapgen_sd_path').text(sdPath).addClass('linked');
                $('#mapgen_link_sd').text(i18n.getMessage('mapgenChangeSd') || 'Change SD Folder');
                $('#mapgen_eject_sd').show();
            } else {
                $('#mapgen_sd_path').text(i18n.getMessage('mapgenNoSdLinked') || 'No SD card folder selected').removeClass('linked');
                $('#mapgen_link_sd').text(i18n.getMessage('mapgenLinkSD') || 'Select SD Card Folder');
                $('#mapgen_eject_sd').hide();
            }
        }
        updateSdDisplay();

        // ── Provider-dependent map type options ─────────────────────
        function syncMapOptions() {
            const provider = $('#mapgen_provider').val();
            const target   = $('#mapgen_target').val();
            const typeSelect = $('#mapgen_maptype');

            typeSelect.empty();
            if (provider === 'OSM') {
                typeSelect.append(new Option('Street', 'Street', true, true));
            } else {
                typeSelect.append(new Option('Satellite', 'Satellite'));
                typeSelect.append(new Option('Street', 'Street', true, true));
                typeSelect.append(new Option('Hybrid', 'Hybrid'));
            }

            // Restore saved map type if still valid
            const savedMapType = store.get('mapgen_map_type', 'Street');
            if (typeSelect.find(`option[value="${savedMapType}"]`).length) {
                typeSelect.val(savedMapType);
            }

            // Warnings
            $('#mapgen_google_warning').toggle(provider === 'GOOGLE');

            // Show/hide Yaapu sub-target selector
            $('#mapgen_subtarget_wrapper').toggleClass('mapgen-subtarget-hidden', target !== 'yaapu');

            if (target === 'yaapu' && provider !== 'GOOGLE') {
                $('#mapgen_yaapu_warning')
                    .text(`Provider "${provider}" will be mapped to Google-style folder names for Yaapu.`)
                    .show();
            } else {
                $('#mapgen_yaapu_warning').hide();
            }

            rebuildZoomSelectors(PROVIDER_MAX_ZOOM[provider] || 20);
            updateTerrainMode();
        }
        syncMapOptions();

        // ── Initialize Leaflet map ──────────────────────────────────
        map = L.map('mapgen_map', {
            zoomControl: true,
            doubleClickZoom: false,
            scrollWheelZoom: true,
        }).setView(savedCenter, savedZoom);

        // Tile layers
        const osmAttr  = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        const esriAttr = '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Sources: Esri, Maxar, Earthstar Geographics';
        const googleAttr = 'Map data &copy; <a href="https://www.google.com/intl/en/help/terms_maps/">Google</a>';

        const osmLayer       = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20, attribution: osmAttr });
        const esriSatellite  = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20, crossOrigin: true, attribution: esriAttr });
        const esriStreet     = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20, crossOrigin: true, attribution: esriAttr });
        const esriLabels     = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20, crossOrigin: true, pane: 'shadowPane' });
        const googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { maxZoom: 20, attribution: googleAttr });
        const googleStreet   = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { maxZoom: 20, attribution: googleAttr });
        const googleHybrid   = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 20, attribution: googleAttr });

        currentLayer = osmLayer;
        currentLayer.addTo(map);

        function switchMapLayer() {
            const provider = $('#mapgen_provider').val();
            const type = $('#mapgen_maptype').val();

            if (currentLayer) map.removeLayer(currentLayer);
            if (map.hasLayer(esriLabels)) map.removeLayer(esriLabels);

            const layerMap = {
                'Satellite_ESRI': esriSatellite,
                'Satellite_GOOGLE': googleSatellite,
                'Hybrid_ESRI': esriSatellite,
                'Hybrid_GOOGLE': googleHybrid,
                'Street_OSM': osmLayer,
                'Street_ESRI': esriStreet,
                'Street_GOOGLE': googleStreet,
            };
            currentLayer = layerMap[`${type}_${provider}`] || osmLayer;

            if (type === 'Hybrid' && provider === 'ESRI') {
                esriLabels.addTo(map);
            }

            currentLayer.addTo(map);
        }

        // Restore saved map type after syncMapOptions populated the dropdown
        const restoredMapType = store.get('mapgen_map_type', 'Street');
        if ($('#mapgen_maptype').find(`option[value="${restoredMapType}"]`).length) {
            $('#mapgen_maptype').val(restoredMapType);
        }
        switchMapLayer();

        // ── Leaflet controls ────────────────────────────────────────
        // Search / geocoder
        L.Control.geocoder({
            defaultMarkGeocode: false,
            position: 'topleft',
            placeholder: 'Search...',
        }).on('markgeocode', e => map.fitBounds(e.geocode.bbox)).addTo(map);

        // Scale — store reference so we can swap metric/imperial
        let scaleControl = L.control.scale({ imperial: false, metric: true, position: 'bottomleft' });
        scaleControl.addTo(map);

        function refreshScale() {
            const unit = $('#mapgen_area_unit').val() || 'km2';
            const useImperial = (unit === 'mi2' || unit === 'acre');
            map.removeControl(scaleControl);
            scaleControl = L.control.scale({
                imperial: useImperial,
                metric: !useImperial,
                position: 'bottomleft',
            });
            scaleControl.addTo(map);
        }

        // Rectangle drawing layer
        drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        // ── Custom drag-to-draw rectangle (hold left mouse) ─────────
        let isDrawing = false;
        let drawStartLatLng = null;
        let drawRect = null;
        const rectStyle = { color: '#ff0000', weight: 2, fillOpacity: 0.1 };

        function startDraw(e) {
            if (e.originalEvent.button !== 0) return; // only left mouse
            isDrawing = true;
            drawStartLatLng = e.latlng;
            map.dragging.disable();
        }

        function moveDraw(e) {
            if (!isDrawing || !drawStartLatLng) return;
            const bounds = L.latLngBounds(drawStartLatLng, e.latlng);
            if (drawRect) {
                drawRect.setBounds(bounds);
            } else {
                drawRect = L.rectangle(bounds, rectStyle).addTo(map);
            }
        }

        function endDraw(e) {
            if (!isDrawing) return;
            isDrawing = false;
            map.dragging.enable();

            if (!drawStartLatLng) return;
            const bounds = L.latLngBounds(drawStartLatLng, e.latlng);

            // Only accept if the rectangle has meaningful size
            if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
                if (drawRect) { map.removeLayer(drawRect); drawRect = null; }
                drawStartLatLng = null;
                return;
            }

            // Remove temp preview rect
            if (drawRect) { map.removeLayer(drawRect); drawRect = null; }
            drawStartLatLng = null;

            // Create final rectangle
            drawnItems.clearLayers();
            if (sideLabels.width) {
                map.removeLayer(sideLabels.width);
                map.removeLayer(sideLabels.height);
                sideLabels = { width: null, height: null };
            }
            const rect = L.rectangle(bounds, rectStyle);
            drawnItems.addLayer(rect);
            updateSideLabels(rect);
            if (isTerrainMode()) {
                updateTerrainGrid();
                updateTerrainStatus();
            }
        }

        function enableDrawMode() {
            map.on('mousedown', startDraw);
            map.on('mousemove', moveDraw);
            map.on('mouseup', endDraw);
            map.getContainer().style.cursor = 'crosshair';
            drawModeActive = true;
        }

        function disableDrawMode() {
            map.off('mousedown', startDraw);
            map.off('mousemove', moveDraw);
            map.off('mouseup', endDraw);
            if (drawRect) { map.removeLayer(drawRect); drawRect = null; }
            isDrawing = false;
            drawStartLatLng = null;
            map.dragging.enable();
            map.getContainer().style.cursor = '';
            drawModeActive = false;
        }

        let drawModeActive = false;
        let editMode = false;
        function onLayerEdit() { triggerUpdate(); }
        function onEditMouseMove() {
            if (editMode && drawnItems.getLayers().length > 0) {
                updateSideLabels(drawnItems.getLayers()[0]);
            }
        }
        function disableEditMode() {
            if (!editMode) return;
            editMode = false;
            map.off('mousemove', onEditMouseMove);
            $('#mapgen_edit_btn').css({ backgroundColor: '', color: '' });
            drawnItems.eachLayer(l => {
                l.off('edit', onLayerEdit);
                if (l.editing) l.editing.disable();
            });
            triggerUpdate();
        }

        // Do NOT start in draw mode — user picks it manually

        // ── Toolbar click handlers ──────────────────────────────────
        function handleDrawClick(e) {
            L.DomEvent.preventDefault(e);
            const drawBtn = document.getElementById('mapgen_draw_btn');
            if (drawModeActive) {
                disableDrawMode();
                drawBtn.style.backgroundColor = '';
                drawBtn.style.color = '';
            } else {
                enableDrawMode();
                drawBtn.style.backgroundColor = '#87b025';
                drawBtn.style.color = '#fff';
            }
        }

        function handleEditClick(e) {
            L.DomEvent.preventDefault(e);
            const editBtn = document.getElementById('mapgen_edit_btn');
            if (editMode) {
                disableEditMode();
            } else {
                if (drawnItems.getLayers().length === 0) return;
                editMode = true;
                if (drawModeActive) {
                    disableDrawMode();
                    $('#mapgen_draw_btn').css({ backgroundColor: '', color: '' });
                }
                editBtn.style.backgroundColor = '#87b025';
                editBtn.style.color = '#fff';
                drawnItems.eachLayer(l => {
                    if (l.editing) l.editing.enable();
                    l.on('edit', onLayerEdit);
                });
                map.on('mousemove', onEditMouseMove);
            }
        }

        function handleDeleteClick(e) {
            L.DomEvent.preventDefault(e);
            drawnItems.clearLayers();
            if (sideLabels.width) {
                map.removeLayer(sideLabels.width);
                map.removeLayer(sideLabels.height);
                sideLabels = { width: null, height: null };
            }
            $('#mapgen_status').text(i18n.getMessage('mapgenStatusDefault') || 'Draw a rectangle on the map to select your area.');
            if (isTerrainMode()) updateTerrainGrid();
        }

        function handleMeasureClick(e) {
            L.DomEvent.preventDefault(e);
            const measureBtn = document.getElementById('mapgen_measure_btn');
            if (measureActive) {
                disengageMeasure();
            } else {
                measureActive = true;
                if (drawModeActive) {
                    disableDrawMode();
                    $('#mapgen_draw_btn').css({ backgroundColor: '', color: '' });
                }
                measureStart = map.getCenter();
                $('#mapgen_measure_popup').text('0m / 0ft').show();
                map.on('move', onMapMove);
                measureBtn.style.backgroundColor = '#87b025';
                measureBtn.style.color = '#fff';
            }
        }

        function handleFullscreenClick(e) {
            L.DomEvent.preventDefault(e);
            const sidebar = document.querySelector('.mapgen-sidebar');
            const fsBtn = e.target;
            if (sidebar.style.display === 'none') {
                sidebar.style.display = '';
                fsBtn.innerHTML = '⛶';
            } else {
                sidebar.style.display = 'none';
                fsBtn.innerHTML = '⧉';
            }
            setTimeout(() => map.invalidateSize(), 100);
        }

        // ── Left toolbar: Draw + Edit layer buttons ─────────────────
        const LeftToolbar = L.Control.extend({
            options: { position: 'topleft' },
            onAdd: function () {
                const container = L.DomUtil.create('div', 'leaflet-bar');

                const drawBtn = L.DomUtil.create('a', 'mapgen-toolbar-btn', container);
                drawBtn.innerHTML = '⬜';
                drawBtn.href = '#';
                drawBtn.title = 'Draw rectangle (hold left mouse to drag)';
                drawBtn.id = 'mapgen_draw_btn';
                L.DomEvent.disableClickPropagation(drawBtn);
                L.DomEvent.on(drawBtn, 'click', handleDrawClick);

                const editBtn = L.DomUtil.create('a', 'mapgen-toolbar-btn', container);
                editBtn.innerHTML = '✎';
                editBtn.href = '#';
                editBtn.title = 'Edit / move drawn rectangle';
                editBtn.id = 'mapgen_edit_btn';
                L.DomEvent.disableClickPropagation(editBtn);
                L.DomEvent.on(editBtn, 'click', handleEditClick);

                const delBtn = L.DomUtil.create('a', 'mapgen-toolbar-btn', container);
                delBtn.innerHTML = '🗑';
                delBtn.href = '#';
                delBtn.title = 'Delete drawn rectangle';
                L.DomEvent.disableClickPropagation(delBtn);
                L.DomEvent.on(delBtn, 'click', handleDeleteClick);

                return container;
            },
        });
        new LeftToolbar().addTo(map);

        // ── Measure state (outer scope for contextmenu access) ────
        let measureActive = false;
        let measureStart = null;
        let measureLine = null;

        function clearMeasure() {
            measureStart = null;
            if (measureLine) { map.removeLayer(measureLine); measureLine = null; }
            $('#mapgen_measure_popup').hide().text('');
        }

        function onMapMove() {
            if (!measureActive || !measureStart) return;
            const currentCenter = map.getCenter();
            const distM = measureStart.distanceTo(currentCenter);
            const combined = `${Math.round(distM)}m / ${Math.round(distM * 3.28084)}ft`;
            $('#mapgen_measure_popup').text(combined).show();
            if (measureLine) map.removeLayer(measureLine);
            measureLine = L.polyline([measureStart, currentCenter], {
                color: '#87b025', weight: 3, dashArray: '5,5',
            }).addTo(map);
        }

        function disengageMeasure() {
            if (!measureActive) return;
            measureActive = false;
            map.off('move', onMapMove);
            clearMeasure();
            const btn = document.getElementById('mapgen_measure_btn');
            if (btn) { btn.style.backgroundColor = ''; btn.style.color = ''; }
        }

        // ── Right toolbar: Measure + Fullscreen ─────────────────────
        const RightToolbar = L.Control.extend({
            options: { position: 'topright' },
            onAdd: function () {
                const container = L.DomUtil.create('div', 'leaflet-bar mapgen-right-toolbar');

                const measureBtn = L.DomUtil.create('a', 'mapgen-toolbar-btn', container);
                measureBtn.innerHTML = '📏';
                measureBtn.href = '#';
                measureBtn.title = 'Measure distance (click points, click button again to clear)';
                measureBtn.id = 'mapgen_measure_btn';
                L.DomEvent.disableClickPropagation(measureBtn);
                L.DomEvent.on(measureBtn, 'click', handleMeasureClick);

                const fsBtn = L.DomUtil.create('a', 'mapgen-toolbar-btn mapgen-fullscreen-btn', container);
                fsBtn.innerHTML = '⛶';
                fsBtn.href = '#';
                fsBtn.title = 'Toggle fullscreen map';
                L.DomEvent.disableClickPropagation(fsBtn);
                L.DomEvent.on(fsBtn, 'click', handleFullscreenClick);

                return container;
            },
        });
        new RightToolbar().addTo(map);

        // Override Leaflet Draw area formatter to respect selected unit
        L.GeometryUtil.readableArea = function (area) {
            const unit = $('#mapgen_area_unit').val() || 'km2';
            return formatArea(area, unit);
        };

        // ── Side labels & status ────────────────────────────────────
        function updateSideLabels(layer) {
            const unit = $('#mapgen_area_unit').val();
            const latlngs = layer.getLatLngs()[0];
            const bounds = layer.getBounds();
            const minZ = Number.parseInt($('#mapgen_min_zoom').val(), 10);
            const maxZ = Number.parseInt($('#mapgen_max_zoom').val(), 10);
            const area = L.GeometryUtil.geodesicArea(latlngs);
            const tiles = calculateTiles(bounds, minZ, maxZ);

            const wM = latlngs[0].distanceTo(latlngs[1]);
            const hM = latlngs[1].distanceTo(latlngs[2]);
            const wS = formatDistance(wM, unit);
            const hS = formatDistance(hM, unit);

            const midT = L.latLng((latlngs[0].lat + latlngs[1].lat) / 2, (latlngs[0].lng + latlngs[1].lng) / 2);
            const midL = L.latLng((latlngs[1].lat + latlngs[2].lat) / 2, (latlngs[1].lng + latlngs[2].lng) / 2);

            if (sideLabels.width) {
                sideLabels.width.setLatLng(midT).setIcon(L.divIcon({ className: 'mapgen-side-label', html: wS }));
                sideLabels.height.setLatLng(midL).setIcon(L.divIcon({ className: 'mapgen-side-label', html: hS }));
            } else {
                sideLabels.width  = L.marker(midT, { icon: L.divIcon({ className: 'mapgen-side-label', html: wS }) }).addTo(map);
                sideLabels.height = L.marker(midL, { icon: L.divIcon({ className: 'mapgen-side-label', html: hS }) }).addTo(map);
            }

            // In terrain mode, updateTerrainStatus() sets the status area
            if (isTerrainMode()) return;

            const maxZoomTiles = calculateTiles(bounds, maxZ, maxZ);
            let statusHtml =
                `<span class="mapgen-area">Area: ${formatArea(area, unit)}</span><br>` +
                `<span class="mapgen-tiles">Total Tiles (100x100 PNG): ${tiles.toLocaleString()}</span>`;
            if (maxZoomTiles < 64) {
                statusHtml += `<br><span style="color:#c62828;">&#9888;&#65039; Low tile coverage at max zoom (${maxZoomTiles} tiles). Consider increasing max zoom.</span>`;
            }
            $('#mapgen_status').html(statusHtml);
        }

        function triggerUpdate() {
            if (drawnItems.getLayers().length > 0) {
                updateSideLabels(drawnItems.getLayers()[0]);
                if (isTerrainMode()) updateTerrainStatus();
            }
            $('#mapgen_zoom_display').text('Zoom: ' + map.getZoom());
        }

        // ── Map events ──────────────────────────────────────────────

        map.on('zoomend moveend', () => {
            triggerUpdate();
            if (isTerrainMode()) updateTerrainGrid();
        });

        map.on('mousemove', e => {
            $('#mapgen_coords_output').text(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`);
            if (liveAltEnabled) {
                const alt = getAltFromCache(e.latlng.lat, e.latlng.lng);
                $('#mapgen_alt_output').text(alt !== null ? 'Alt: ' + alt + 'm' : 'Alt: \u2014');
            }
        });

        map.on('zoomend', () => {
            $('#mapgen_zoom_display').text('Zoom: ' + map.getZoom());
        });

        // Map position is now saved only via the Save Settings button

        // Right-click: disengage measure, edit mode, delete rectangle, or disengage draw mode
        map.on('contextmenu', (e) => {
            L.DomEvent.stop(e);
            // If measure tool is active, disengage it first
            if (measureActive) {
                disengageMeasure();
                return;
            }
            // If edit mode is active, disengage it
            if (editMode) {
                disableEditMode();
                return;
            }
            // If there's a drawn rectangle, delete it first
            if (drawnItems.getLayers().length > 0) {
                drawnItems.clearLayers();
                if (sideLabels.width) {
                    map.removeLayer(sideLabels.width);
                    map.removeLayer(sideLabels.height);
                    sideLabels = { width: null, height: null };
                }
                $('#mapgen_status').text(i18n.getMessage('mapgenStatusDefault') || 'Draw a rectangle on the map to select your area.');
                if (isTerrainMode()) updateTerrainGrid();
                return; // stop here — next right-click will disengage
            }
            // No rectangle → disengage draw mode if active
            if (drawModeActive) {
                disableDrawMode();
                $('#mapgen_draw_btn').css({ backgroundColor: '', color: '' });
            }
        });

        // ── Settings persistence ────────────────────────────────────
        function saveSettings() {
            store.set('mapgen_target', $('#mapgen_target').val());
            store.set('mapgen_subtarget', $('#mapgen_subtarget').val());
            store.set('mapgen_provider', $('#mapgen_provider').val());
            store.set('mapgen_map_type', $('#mapgen_maptype').val());
            store.set('mapgen_project_name', $('#mapgen_project_name').val());
            store.set('mapgen_min_zoom', Number.parseInt($('#mapgen_min_zoom').val(), 10));
            store.set('mapgen_max_zoom', Number.parseInt($('#mapgen_max_zoom').val(), 10));
            store.set('mapgen_area_unit', $('#mapgen_area_unit').val());
            const c = map.getCenter();
            store.set('mapgen_last_center', [c.lat, c.lng]);
            store.set('mapgen_last_zoom', map.getZoom());
            store.set('mapgen_settings_saved', true);
        }

        function restoreDefaults() {
            store.delete('mapgen_settings_saved');
            store.delete('mapgen_target');
            store.delete('mapgen_subtarget');
            store.delete('mapgen_provider');
            store.delete('mapgen_map_type');
            store.delete('mapgen_project_name');
            store.delete('mapgen_min_zoom');
            store.delete('mapgen_max_zoom');
            store.delete('mapgen_area_unit');
            store.delete('mapgen_last_center');
            store.delete('mapgen_last_zoom');
            // Reset UI to defaults
            $('#mapgen_target').val('b14ckyy');
            $('#mapgen_subtarget').val('ethos');
            $('#mapgen_provider').val('OSM');
            $('#mapgen_project_name').val('MyLocalField');
            $('#mapgen_min_zoom').val(8);
            $('#mapgen_max_zoom').val(14);
            $('#mapgen_area_unit').val(globalSettings.unitType === UnitType.imperial ? 'mi2' : 'km2');
            syncMapOptions();
            switchMapLayer();
            map.setView([42.6977, 23.3219], 12);
            triggerUpdate();
            refreshScale();
        }

        // ── Control event bindings ──────────────────────────────────
        $('#mapgen_target').on('change', () => { syncMapOptions(); triggerUpdate(); });
        $('#mapgen_provider').on('change', () => { syncMapOptions(); switchMapLayer(); });
        $('#mapgen_maptype').on('change', () => { switchMapLayer(); });
        $('#mapgen_min_zoom, #mapgen_max_zoom').on('change', () => { triggerUpdate(); });
        $('#mapgen_area_unit').on('change', () => { triggerUpdate(); refreshScale(); });

        // ── Save / Restore buttons ──────────────────────────────────
        $('#mapgen_save_settings_btn a').on('click', (e) => {
            e.preventDefault();
            saveSettings();
        });
        $('#mapgen_restore_settings_btn a').on('click', (e) => {
            e.preventDefault();
            restoreDefaults();
        });

        // ── SD card linking ─────────────────────────────────────────
        $('#mapgen_link_sd').on('click', async () => {
            const result = await globalThis.electronAPI.showOpenDialog({
                title: 'Select SD Card Root Folder',
                properties: ['openDirectory'],
            });
            if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
                sdPath = result.filePaths[0];
                store.set('mapgen_sd_path', sdPath);
                updateSdDisplay();
            }
        });

        $('#mapgen_eject_sd').on('click', async () => {
            if (!sdPath) return;
            // Extract drive letter from path (e.g. "D:\..." → "D")
            const driveLetter = sdPath.match(/^([a-zA-Z]):/);
            if (!driveLetter) {
                $('#mapgen_status').text('Cannot determine drive letter from SD path.');
                return;
            }
            const err = await globalThis.electronAPI.ejectDrive(driveLetter[1]);
            if (err) {
                // Drive likely already ejected or not found — clear the link
                sdPath = '';
                store.set('mapgen_sd_path', '');
                updateSdDisplay();
                $('#mapgen_status').text('SD card unlinked. (Drive may already be ejected.)');
            } else {
                sdPath = '';
                store.set('mapgen_sd_path', '');
                updateSdDisplay();
                $('#mapgen_status').text('SD card ejected safely.');
            }
        });

        // ── Tile cache UI ───────────────────────────────────────────
        function updateCacheSizeDisplay() {
            $('#mapgen_cache_size').text(tileCache.getFormattedSize());
        }

        // Restore saved cache settings
        $('#mapgen_cache_enabled').prop('checked', tileCache.enabled);
        $('#mapgen_cache_max').val(store.get('mapgen_cache_max_mb', 500));
        updateCacheSizeDisplay();

        $('#mapgen_cache_enabled').on('change', function () {
            tileCache.enabled = $(this).is(':checked');
            store.set('mapgen_cache_enabled', tileCache.enabled);
        });

        $('#mapgen_cache_max').on('change', function () {
            store.set('mapgen_cache_max_mb', Number.parseInt($(this).val(), 10));
        });

        $('#mapgen_clear_cache').on('click', async () => {
            if (!globalThis.electronAPI.confirmDialog('Clear all cached map tiles and HGT data?')) return;
            await tileCache.clear();
            await hgtDb.clear();
            liveAltCache = {};
            updateCacheSizeDisplay();
            updateHgtCacheInfo();
        });

        // ── Sync pipeline ───────────────────────────────────────────
        function showModal() { $('#mapgen_sync_overlay').addClass('open'); }
        function hideModal() { $('#mapgen_sync_overlay').removeClass('open'); }

        function updateProgress(processed, total, startTime, failedCount) {
            const progress = total > 0 ? (processed / total * 100) : 100;
            $('#mapgen_progress_fill').css('width', progress + '%');
            if (processed <= 0) {
                $('#mapgen_download_status').text(`Syncing: 0 / ${total}`);
                return;
            }
            const elapsed = Date.now() - startTime;
            const avgPerTile = elapsed / processed;
            const remainingMs = Math.max(0, (total - processed) * avgPerTile);
            const mins = Math.floor(remainingMs / 60000);
            const secs = Math.ceil((remainingMs % 60000) / 1000);
            const failSuffix = failedCount > 0 ? ` | Failed: ${failedCount}` : '';
            $('#mapgen_download_status').text(`Syncing: ${processed} / ${total}${failSuffix} (${mins}:${secs.toString().padStart(2, '0')} remaining)`);
        }

        function buildExamplePath(target, zipMode, provider, mapType, displayMapType, subtarget) {
            if (target === 'b14ckyy') {
                const base = zipMode ? 'ethosmaps/maps' : '/bitmaps/ethosmaps/maps';
                return provider === 'ESRI'
                    ? `${base}/${provider}/${mapType}/[Z]/[Y]/[X].jpg`
                    : `${base}/${provider}/${mapType}/[Z]/[X]/[Y].jpg`;
            }
            let base = 'yaapu/maps';
            if (!zipMode) {
                base = subtarget === 'edgetx' ? '/IMAGES/yaapu/maps' : '/bitmaps/yaapu/maps';
            }
            return `${base}/${displayMapType}/[Z]/[Y]/s_[X].png`;
        }

        function buildTargetLabel(target, subtarget) {
            if (target === 'b14ckyy') return 'b14ckyy ETHOS';
            return `Yaapu ${subtarget === 'edgetx' ? 'EdgeTX' : 'ETHOS'}`;
        }

        let isZipMode = false;

        function showSyncModal(zipMode) {
            const layer = drawnItems.getLayers()[0];
            const projectName = $('#mapgen_project_name').val().trim();

            if (!projectName) {
                $('#mapgen_status').text('Error: Please enter a Project Folder Name.');
                $('#mapgen_project_name').focus();
                return;
            }
            if (!layer) {
                $('#mapgen_status').text('Error: Please draw a rectangle to select an area for sync.');
                return;
            }
            if (!zipMode && !sdPath) {
                $('#mapgen_status').text('Error: Please select an SD card folder first.');
                return;
            }

            isZipMode = zipMode;
            syncAborted = false;

            // Build summary
            const target   = $('#mapgen_target').val();
            const subtarget = $('#mapgen_subtarget').val();
            const provider = $('#mapgen_provider').val();
            const mapType  = $('#mapgen_maptype').val();
            const bounds   = layer.getBounds();
            const minZ     = Number.parseInt($('#mapgen_min_zoom').val(), 10);
            const maxZ     = Number.parseInt($('#mapgen_max_zoom').val(), 10);
            const unit     = $('#mapgen_area_unit').val();
            const areaVal  = formatArea(L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]), unit);
            const tileCount = calculateTiles(bounds, minZ, maxZ);

            // Display name for Yaapu target
            const displayMapType = target === 'yaapu' ? getYaapuMapName(mapType) : mapType;

            // Example path
            const examplePath = buildExamplePath(target, zipMode, provider, mapType, displayMapType, subtarget);

            const targetLabel = buildTargetLabel(target, subtarget);
            const modeLabel = zipMode ? 'ZIP Export' : 'SD Card Sync';

            let infoHtml = `
                <div class="mapgen-info-row"><span>Mode:</span><span>${modeLabel}</span></div>
                <div class="mapgen-info-row"><span>Target:</span><span>${targetLabel}</span></div>
                <div class="mapgen-info-row"><span>Total Tiles:</span><span>${tileCount.toLocaleString()}</span></div>
                <div class="mapgen-info-row"><span>Project:</span><span>${$('<span>').text(projectName).html()}</span></div>
                <div class="mapgen-info-row"><span>Zoom:</span><span>${minZ} – ${maxZ}</span></div>
                <div class="mapgen-info-row"><span>Area:</span><span>${areaVal}</span></div>
            `;
            if (!zipMode) {
                infoHtml += `<div class="mapgen-info-row"><span>SD Path:</span><span style="font-size:11px;">${$('<span>').text(sdPath).html()}</span></div>`;
            }
            infoHtml += `<div class="mapgen-info-row"><span>Example:</span><span style="font-size:10px;">${examplePath}</span></div>`;

            $('#mapgen_sync_info').html(infoHtml);
            $('#mapgen_modal_header').text(zipMode ? 'Export as ZIP' : 'Syncing to SD Card');

            $('#mapgen_progress_section').hide();
            $('#mapgen_modal_actions').show();
            $('#mapgen_modal_confirm').show().text(zipMode ? 'Export ZIP' : (i18n.getMessage('mapgenConfirmSync') || 'Confirm Sync'));
            $('#mapgen_modal_cancel').text('Cancel');
            showModal();
        }

        $('#mapgen_sync_btn').on('click', () => {
            if (isTerrainMode()) {
                showTerrainSyncModal();
            } else {
                showSyncModal(false);
            }
        });
        $('#mapgen_zip_btn').on('click', () => {
            if (isTerrainMode()) {
                showTerrainSyncModal();
            } else {
                showSyncModal(true);
            }
        });

        $('#mapgen_modal_cancel').on('click', (e) => {
            e.preventDefault();
            syncAborted = true;
            hideModal();
        });

        $('#mapgen_modal_confirm').on('click', async (e) => {
            e.preventDefault();
            if (isTerrainMode()) {
                await terrainGenerateAndSync();
            } else {
                await runSync();
            }
        });

        async function runSync() {
            syncAborted = false;

            const target   = $('#mapgen_target').val();
            const subtarget = $('#mapgen_subtarget').val();
            const provider = $('#mapgen_provider').val();
            const mapType  = $('#mapgen_maptype').val();
            const layer    = drawnItems.getLayers()[0];
            const bounds   = layer.getBounds();
            const minZ     = Number.parseInt($('#mapgen_min_zoom').val(), 10);
            const maxZ     = Number.parseInt($('#mapgen_max_zoom').val(), 10);
            const forceOverwrite = $('#mapgen_overwrite').is(':checked');

            const zip = isZipMode ? new JSZip() : null;
            const tiles = buildTileList(bounds, minZ, maxZ);

            const total = tiles.length;
            let processed = 0;
            let failedCount = 0;
            const startTime = Date.now();

            // Switch to progress view
            $('#mapgen_modal_confirm').hide();
            $('#mapgen_modal_cancel').text('Abort');
            $('#mapgen_progress_section').show();
            $('#mapgen_progress_fill').css('width', '0%');
            updateProgress(0, total, startTime, 0);

            let nextTileIndex = 0, consecutiveErrors = 0;
            const failedTiles = [];
            const workerCount = Math.max(1, Math.min(TILE_CONCURRENCY, tiles.length));

            const workers = Array.from({ length: workerCount }, async () => {
                const { canvas, ctx } = createWorkerCanvas();
                while (!syncAborted) {
                    if (consecutiveErrors >= 5) await sleep(1500);
                    else if (consecutiveErrors >= 2) await sleep(500);
                    const currentIndex = nextTileIndex++;
                    if (currentIndex >= tiles.length) break;

                    const { z, tz, x, y } = tiles[currentIndex];
                    try {
                        const pathArr = getTilePath({ target, isZipMode, provider, mapType, z, x, y, subtarget });

                        if (isZipMode) {
                            const buf = await fetchResizedTileWithRetry(provider, mapType, tz, x, y, canvas, ctx, target);
                            addTileToZip(zip, pathArr, buf);
                        } else {
                            const fullPath = sdPath + '/' + pathArr.join('/');

                            if (!forceOverwrite && await tileExistsOnSD(fullPath)) {
                                processed++;
                                updateProgress(processed, total, startTime, failedCount);
                                continue;
                            }

                            const buf = await fetchResizedTileWithRetry(provider, mapType, tz, x, y, canvas, ctx, target);
                            await globalThis.electronAPI.writeFile(fullPath, new Uint8Array(buf));
                        }
                        consecutiveErrors = 0;
                    } catch (err) {
                        failedCount++;
                        consecutiveErrors++;
                        failedTiles.push({ z, tz, x, y });
                        console.warn(`Tile failed z${z} x${x} y${y}:`, err.message);
                    } finally {
                        processed++;
                        updateProgress(processed, total, startTime, failedCount);
                    }
                }
            });

            await Promise.all(workers);

            /* Auto-retry failed tiles after cooldown — rate limits likely expired by now. */
            if (failedTiles.length > 0 && !syncAborted) {
                const retryCount = failedTiles.length;
                console.log(`Retrying ${retryCount} failed tile(s) after cooldown...`);
                $('#mapgen_download_status').text('Cooling down before retry...');
                await sleep(3000);

                let retryRecovered = 0, retryIndex = 0;
                const retryWorkers = Array.from({ length: Math.max(1, Math.min(2, retryCount)) }, async () => {
                    const { canvas, ctx } = createWorkerCanvas();
                    while (!syncAborted) {
                        const ci = retryIndex++;
                        if (ci >= failedTiles.length) break;
                        await sleep(400);

                        const { z, tz, x, y } = failedTiles[ci];
                        try {
                            const pathArr = getTilePath({ target, isZipMode, provider, mapType, z, x, y, subtarget });
                            if (isZipMode) {
                                const buf = await fetchResizedTileWithRetry(provider, mapType, tz, x, y, canvas, ctx, target);
                                addTileToZip(zip, pathArr, buf);
                            } else {
                                const fullPath = sdPath + '/' + pathArr.join('/');
                                const buf = await fetchResizedTileWithRetry(provider, mapType, tz, x, y, canvas, ctx, target);
                                await globalThis.electronAPI.writeFile(fullPath, new Uint8Array(buf));
                            }
                            retryRecovered++;
                            failedCount--;
                            console.log(`Recovered: z${z} x${x} y${y}`);
                        } catch (e) {
                            console.warn(`Retry failed: z${z} x${x} y${y}`);
                        }
                        $('#mapgen_download_status').text(`Retrying: ${ci + 1} / ${retryCount} (recovered: ${retryRecovered})`);
                    }
                });
                await Promise.all(retryWorkers);
                if (retryRecovered > 0) console.log(`Retry recovered ${retryRecovered} of ${retryCount} tile(s).`);
            }

            tileCache.persistSize();
            updateCacheSizeDisplay();

            if (syncAborted) return;

            if (isZipMode && zip) {
                await saveZipToFile(zip, target, subtarget);
            }

            // Show completion
            updateProgress(total, total, startTime, failedCount);

            if (failedCount > 0) {
                $('#mapgen_download_status').text(`Completed with ${failedCount} failed tile(s). Retry with Force Overwrite.`);
            } else {
                const modeMsg = isZipMode ? 'ZIP exported successfully!' : 'All tiles exported to SD successfully.';
                $('#mapgen_download_status').text(`Sync complete! ${modeMsg}`);
            }

            $('#mapgen_modal_cancel').text('Close');
        }

        async function saveZipToFile(zip, target, subtarget) {
            $('#mapgen_download_status').text('Generating ZIP file...');
            try {
                const blob = await zip.generateAsync({ type: 'arraybuffer' });
                const zipName = target === 'yaapu' ? `EthosMaps_yaapu_${subtarget}.zip` : `EthosMaps_${target}.zip`;
                const result = await globalThis.electronAPI.showSaveDialog({
                    title: 'Save Map Tiles ZIP',
                    defaultPath: zipName,
                    filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
                });
                if (!result.canceled && result.filePath) {
                    await globalThis.electronAPI.writeFile(result.filePath, new Uint8Array(blob));
                }
            } catch (err) {
                console.error('ZIP save failed:', err);
                $('#mapgen_download_status').text('Error: ZIP generation failed.');
            }
        }

        // Force map to recalculate size after DOM insertion
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 200);

        // ── Terrain helper functions ────────────────────────────────
        function isTerrainMode() {
            return $('#mapgen_target').val() === 'terrain';
        }

        function getTargetCategory() {
            return isTerrainMode() ? 'fc' : 'radio';
        }

        function updateTerrainGrid() {
            if (terrainGridLayer) {
                map.removeLayer(terrainGridLayer);
                terrainGridLayer = null;
            }
            if (!isTerrainMode()) return;

            terrainGridLayer = L.layerGroup();
            const mapBounds = map.getBounds();
            const latMin = Math.floor(mapBounds.getSouth()) - 1;
            const latMax = Math.ceil(mapBounds.getNorth()) + 1;
            const lonMin = Math.floor(mapBounds.getWest()) - 1;
            const lonMax = Math.ceil(mapBounds.getEast()) + 1;

            for (let lat = latMin; lat <= latMax; lat++) {
                L.polyline([[lat, lonMin - 1], [lat, lonMax + 1]], {
                    color: '#ff6600', weight: 1, opacity: 0.5, dashArray: '6,4', interactive: false,
                }).addTo(terrainGridLayer);
            }
            for (let lon = lonMin; lon <= lonMax; lon++) {
                L.polyline([[latMin - 1, lon], [latMax + 1, lon]], {
                    color: '#ff6600', weight: 1, opacity: 0.5, dashArray: '6,4', interactive: false,
                }).addTo(terrainGridLayer);
            }

            const selLayer = drawnItems.getLayers()[0];
            if (selLayer) {
                const sb = selLayer.getBounds();
                const sLatMin = Math.floor(sb.getSouth());
                const sLatMax = Math.floor(sb.getNorth());
                const sLonMin = Math.floor(sb.getWest());
                const sLonMax = Math.floor(sb.getEast());
                const selLats = new Set();
                const selLons = new Set();
                for (let lat = sLatMin; lat <= sLatMax + 1; lat++) selLats.add(lat);
                for (let lon = sLonMin; lon <= sLonMax + 1; lon++) selLons.add(lon);
                const solidStyle = { color: '#ff6600', weight: 2.5, opacity: 0.9, interactive: false };
                selLats.forEach(lat => {
                    L.polyline([[lat, sLonMin], [lat, sLonMax + 1]], solidStyle).addTo(terrainGridLayer);
                });
                selLons.forEach(lon => {
                    L.polyline([[sLatMin, lon], [sLatMax + 1, lon]], solidStyle).addTo(terrainGridLayer);
                });
            }

            const zoom = map.getZoom();
            if (zoom >= 6) {
                const lbl = zoom >= 8 ? { fs: 11, pad: '2px 5px', w: 80, h: 16, bg: 0.8 }
                          : zoom >= 7 ? { fs: 10, pad: '2px 4px', w: 74, h: 14, bg: 0.7 }
                                       : { fs: 9, pad: '1px 3px', w: 64, h: 13, bg: 0.55 };
                for (let lat = latMin; lat < latMax; lat++) {
                    for (let lon = lonMin; lon < lonMax; lon++) {
                        if (lat >= -90 && lat < 90 && lon >= -180 && lon < 180) {
                            L.marker([lat + 0.5, lon + 0.5], {
                                icon: L.divIcon({
                                    className: 'terrain-grid-label',
                                    html: `<span style="font-size:${lbl.fs}px;padding:${lbl.pad};background:rgba(255,102,0,${lbl.bg})">${terrainDatFilename(lat, lon)}</span>`,
                                    iconSize: [lbl.w, lbl.h],
                                    iconAnchor: [lbl.w / 2, lbl.h / 2],
                                }),
                                interactive: false,
                            }).addTo(terrainGridLayer);
                        }
                    }
                }
            }

            terrainGridLayer.addTo(map);
        }

        function updateTerrainStatus() {
            if (!isTerrainMode()) return;
            const layer = drawnItems.getLayers()[0];
            if (!layer) {
                $('#mapgen_status').html('<span style="color:#ffb300;">Draw a rectangle to select terrain area...</span>');
                return;
            }
            const bounds = layer.getBounds();
            const latlngs = layer.getLatLngs()[0];
            const area = L.GeometryUtil.geodesicArea(latlngs);
            const unit = $('#mapgen_area_unit').val();
            const tiles = getTerrainDegreeTiles(bounds);
            const estSizeMB = tiles.reduce((s, t) => s + estimateDatSizeMB(t.lat), 0).toFixed(0);
            const fileList = tiles.map(t => terrainDatFilename(t.lat, t.lon));
            const midLat = (bounds.getNorth() + bounds.getSouth()) / 2;
            const tileKmNS = 111.0;
            const tileKmEW = 111.0 * Math.cos(midLat * Math.PI / 180);
            const gridAreaSqM = tiles.length * tileKmNS * tileKmEW * 1e6;

            let statusHtml =
                `<span class="mapgen-area">Selected Area: ${formatArea(area, unit)}</span><br>` +
                `<span class="mapgen-area">Grid Coverage: ${tiles.length} tile(s) \u00b7 ${formatArea(gridAreaSqM, unit)}</span><br>` +
                `<span class="mapgen-tiles">Est. Size: ~${estSizeMB} MB</span><br>` +
                `<span style="color:#888; font-size:11px;">${fileList.join(', ')}</span>`;
            if (bounds.getNorth() > 60 || bounds.getSouth() < -56) {
                statusHtml += '<br><span style="color:#c62828; font-size:11px;">&#9888;&#65039; Selection extends beyond SRTM coverage (60\u00b0N to 56\u00b0S). Tiles outside this range will have no elevation data.</span>';
            }
            $('#mapgen_status').html(statusHtml);
        }

        function updateTerrainMode() {
            if (!map) return; // called before map init from syncMapOptions
            const isTerrain = isTerrainMode();

            // SRTM attribution
            const srtmAttr = 'Elevation data: <a href="https://www.usgs.gov/centers/eros/science/usgs-eros-archive-digital-elevation-shuttle-radar-topography-mission-srtm-1">NASA SRTM</a>';
            if (isTerrain) {
                map.attributionControl.addAttribution(srtmAttr);
            } else {
                map.attributionControl.removeAttribution(srtmAttr);
            }

            // Zoom to terrain-friendly level
            if (isTerrain && preTerrainZoom === null) {
                preTerrainZoom = map.getZoom();
                map.setZoom(8);
            } else if (!isTerrain && preTerrainZoom !== null) {
                map.setZoom(preTerrainZoom);
                preTerrainZoom = null;
            }

            // Hide tile-specific controls in terrain mode
            // Provider, map type, project name, zoom row — always visible when not terrain
            $('#mapgen_provider').closest('.select').toggle(!isTerrain);
            $('#mapgen_maptype').closest('.select').toggle(!isTerrain);
            $('#mapgen_project_name').closest('.number').toggle(!isTerrain);
            $('.mapgen-zoom-row').toggle(!isTerrain);
            // Warnings and subtarget: only force-hide in terrain mode
            // syncMapOptions() handles their conditional visibility otherwise
            if (isTerrain) {
                $('#mapgen_subtarget_wrapper').addClass('mapgen-subtarget-hidden');
                $('#mapgen_google_warning').hide();
                $('#mapgen_yaapu_warning').hide();
            }
            // Hints
            $('#mapgen_hint_tiles').toggle(!isTerrain);
            $('#mapgen_hint_terrain').toggle(isTerrain);
            // Terrain altitude controls
            $('#mapgen_terrain_alt_row').toggle(isTerrain);
            if (!isTerrain) {
                $('#mapgen_terrain_alt_toggle').prop('checked', false);
                toggleLiveAlt();
            }
            // Force OSM in terrain mode
            if (isTerrain) {
                if (currentLayer) map.removeLayer(currentLayer);
                if (map.hasLayer(esriLabels)) map.removeLayer(esriLabels);
                currentLayer = osmLayer;
                currentLayer.addTo(map);
            } else {
                switchMapLayer();
            }
            // SD card label
            updateSdLabel();

            updateTerrainGrid();
            if (drawnItems.getLayers().length > 0) {
                updateSideLabels(drawnItems.getLayers()[0]);
            }
            if (isTerrain) {
                updateTerrainStatus();
                updateHgtCacheInfo();
            } else {
                $('#mapgen_clear_hgt_cache').hide();
            }
        }

        function updateSdLabel() {
            const isFc = getTargetCategory() === 'fc';
            if (sdPath) {
                const label = isFc ? 'Change FC SD Folder' : (i18n.getMessage('mapgenChangeSd') || 'Change SD Folder');
                $('#mapgen_link_sd').text(label);
            } else {
                const label = isFc ? 'Select FC SD Card Folder' : (i18n.getMessage('mapgenLinkSD') || 'Select SD Card Folder');
                $('#mapgen_link_sd').text(label);
            }
        }

        // ── Live altitude readout ───────────────────────────────────
        function toggleLiveAlt() {
            liveAltEnabled = $('#mapgen_terrain_alt_toggle').is(':checked');
            $('#mapgen_alt_output').toggle(liveAltEnabled);
            $('#mapgen_terrain_alt_hint').toggle(liveAltEnabled);
            if (!liveAltEnabled) $('#mapgen_alt_output').text('Alt: \u2014');
        }

        function getAltFromCache(lat, lon) {
            const tileLat = Math.floor(lat);
            const tileLon = Math.floor(lon);
            const key = tileLat + '_' + tileLon;
            const hgtView = liveAltCache[key];
            if (!hgtView) return null;
            const fracLat = Math.max(0, Math.min(1, lat - tileLat));
            const fracLon = Math.max(0, Math.min(1, lon - tileLon));
            const row = Math.max(0, Math.min(3600, Math.round((1 - fracLat) * 3600)));
            const col = Math.max(0, Math.min(3600, Math.round(fracLon * 3600)));
            const v = hgtView.getInt16((row * 3601 + col) * 2, false);
            if (v === -32768) return 0;
            return v < 0 ? 0 : v;
        }

        $('#mapgen_terrain_alt_toggle').on('change', toggleLiveAlt);

        // ── HGT cache UI ────────────────────────────────────────────
        async function updateHgtCacheInfo() {
            try {
                const cached = await hgtDb.cachedSet();
                if (cached.size > 0 && isTerrainMode()) {
                    $('#mapgen_clear_hgt_cache').text(`Clear HGT Cache (${cached.size} tile${cached.size > 1 ? 's' : ''}, ~${cached.size * 25} MB)`).show();
                } else {
                    $('#mapgen_clear_hgt_cache').hide();
                }
            } catch (_) {
                $('#mapgen_clear_hgt_cache').hide();
            }
        }

        $('#mapgen_clear_hgt_cache').on('click', async () => {
            const cached = await hgtDb.cachedSet();
            if (cached.size === 0) return;
            if (!globalThis.electronAPI.confirmDialog(`Clear ${cached.size} cached HGT tile(s) (~${cached.size * 25} MB)?`)) return;
            await hgtDb.clear();
            liveAltCache = {};
            updateHgtCacheInfo();
        });

        // ── Terrain sync pipeline ───────────────────────────────────
        async function showTerrainSyncModal() {
            const layer = drawnItems.getLayers()[0];
            if (!layer) {
                $('#mapgen_status').text('Error: Please draw a rectangle to select terrain area.');
                return;
            }

            syncAborted = false;
            const bounds = layer.getBounds();
            const tiles = getTerrainDegreeTiles(bounds);
            const fileList = tiles.map(t => terrainDatFilename(t.lat, t.lon));
            const totalSizeMB = tiles.reduce((s, t) => s + estimateDatSizeMB(t.lat), 0).toFixed(0);

            // Compute all unique HGT keys needed (primaries + neighbors)
            const hgtKeysSet = new Set();
            tiles.forEach(t => {
                hgtKeysSet.add(t.lat + '_' + t.lon);
                hgtKeysSet.add(t.lat + '_' + (t.lon + 1));
                hgtKeysSet.add((t.lat + 1) + '_' + t.lon);
                hgtKeysSet.add((t.lat + 1) + '_' + (t.lon + 1));
            });
            const totalHgt = hgtKeysSet.size;
            const cachedSetKeys = await hgtDb.cachedSet();
            let cachedCount = 0;
            hgtKeysSet.forEach(k => { if (cachedSetKeys.has(k)) cachedCount++; });

            const hgtSizeMB = (tiles.length * 13).toFixed(0);
            const cacheInfo = cachedCount > 0
                ? (cachedCount === totalHgt
                    ? `<span style="color:#87b025;">All ${totalHgt} HGT tiles cached \u2014 no download needed</span>`
                    : `${cachedCount} of ${totalHgt} HGT tiles cached`)
                : `~${hgtSizeMB} MB compressed`;

            const hasSD = !!sdPath;
            let infoHtml = `
                <div class="mapgen-info-row"><span>Target:</span><span>INAV Terrain (SRTM1 30m)</span></div>
                <div class="mapgen-info-row"><span>Terrain Files:</span><span>${tiles.length} .DAT file(s)</span></div>
                <div class="mapgen-info-row"><span>Est. Output:</span><span>~${totalSizeMB} MB</span></div>
                <div class="mapgen-info-row"><span>SRTM Download:</span><span>${cacheInfo}</span></div>
                <div class="mapgen-info-row"><span>Files:</span><span style="font-size:10px;">${fileList.join(', ')}</span></div>
            `;
            if (hasSD) {
                infoHtml += `<div class="mapgen-info-row"><span>SD Path:</span><span style="font-size:11px;">${$('<span>').text(sdPath).html()}</span></div>`;
                infoHtml += `<div style="margin:6px 0; font-size:11px; color:#888;">\u26a0\ufe0f FREESPAC.E will be auto-deleted from SD card during sync. INAV will recreate it on next boot.</div>`;
            } else {
                infoHtml += `<div style="margin:6px 0; font-size:11px; color:#888;">\u26a0\ufe0f Delete FREESPAC.E from the SD card before copying. INAV will recreate it on next boot.</div>`;
            }
            infoHtml += `<div style="font-size:12px; color:#888; line-height:1.5;">Source: NASA SRTM 30m elevation data (public domain)</div>`;

            $('#mapgen_sync_info').html(infoHtml);
            $('#mapgen_modal_header').text('INAV Terrain Generator');
            $('#mapgen_progress_section').hide();
            $('#mapgen_modal_actions').show();
            $('#mapgen_modal_confirm').show().text(hasSD ? 'Generate & Sync' : 'Generate & Download ZIP');
            $('#mapgen_modal_cancel').text('Cancel');
            showModal();
        }

        async function terrainGenerateAndSync() {
            const layer = drawnItems.getLayers()[0];
            if (!layer) return;

            syncAborted = false;
            const bounds = layer.getBounds();
            const tiles = getTerrainDegreeTiles(bounds);
            const totalTiles = tiles.length;
            let completed = 0;
            const datFiles = [];
            const hgtCache = {};
            const startTime = Date.now();
            const hasSD = !!sdPath;
            const forceOverwrite = $('#mapgen_overwrite').is(':checked');

            // Switch to progress view
            $('#mapgen_modal_header').text('Generating Terrain Files...');
            $('#mapgen_modal_confirm').hide();
            $('#mapgen_modal_cancel').text('Abort');
            $('#mapgen_progress_section').show();
            $('#mapgen_progress_fill').css('width', '0%');
            $('#mapgen_download_status').text('Starting...');

            for (let ti = 0; ti < tiles.length && !syncAborted; ti++) {
                const tile = tiles[ti];
                const name = srtmTileName(tile.lat, tile.lon);
                const prefix = `Tile ${completed + 1}/${totalTiles}: `;
                const primaryKey = tile.lat + '_' + tile.lon;

                // Download or use cached HGT data
                if (!hgtCache[primaryKey]) {
                    const cachedBuf = await hgtDb.get(primaryKey);
                    if (cachedBuf) {
                        hgtCache[primaryKey] = makeHgtView(new Uint8Array(cachedBuf));
                        $('#mapgen_download_status').text(prefix + '\u2705 Cached ' + name);
                    } else {
                        $('#mapgen_download_status').text(prefix + '\u2b07\ufe0f Connecting to SRTM server...');
                        try {
                            const hgtData = await fetchSrtmTile(tile.lat, tile.lon, stage => {
                                const msg = stage === 'connecting' ? '\u2b07\ufe0f Connecting to SRTM server...'
                                    : stage === 'downloading' ? `\u2b07\ufe0f Downloading ${name}.hgt.gz...`
                                    : `\ud83d\udce6 Decompressing ${name}...`;
                                $('#mapgen_download_status').text(prefix + msg);
                            });
                            hgtCache[primaryKey] = makeHgtView(hgtData);
                            hgtDb.put(primaryKey, hgtData.buffer || hgtData);
                            $('#mapgen_download_status').text(prefix + `\u2705 Downloaded ${name} (${(hgtData.length / 1048576).toFixed(1)} MB)`);
                        } catch (e) {
                            console.warn(`SRTM fetch failed for ${name}:`, e.message);
                            $('#mapgen_download_status').text(`Failed to download ${name}. Continuing...`);
                        }
                    }
                }

                // Fetch neighbor tiles for interpolation at edges
                const neighbors = [[tile.lat, tile.lon + 1], [tile.lat + 1, tile.lon], [tile.lat + 1, tile.lon + 1]];
                for (const [nLat, nLon] of neighbors) {
                    const nKey = nLat + '_' + nLon;
                    if (!hgtCache[nKey]) {
                        const cachedN = await hgtDb.get(nKey);
                        if (cachedN) {
                            hgtCache[nKey] = makeHgtView(new Uint8Array(cachedN));
                        } else {
                            try {
                                const nData = await fetchSrtmTile(nLat, nLon);
                                hgtCache[nKey] = makeHgtView(nData);
                                hgtDb.put(nKey, nData.buffer || nData);
                            } catch (_) { /* adjacent tile not available */ }
                        }
                    }
                }

                // Convert HGT → DAT
                $('#mapgen_download_status').text(prefix + `\u2699\ufe0f Converting ${name} to .DAT...`);
                try {
                    const datData = await createDatFromHgt(tile.lat, tile.lon, hgtCache, (done, total) => {
                        const pct = ((completed + done / total) / totalTiles * 100).toFixed(0);
                        $('#mapgen_progress_fill').css('width', pct + '%');
                        $('#mapgen_download_status').text(prefix + `\u2699\ufe0f Converting ${name} (${Math.round(done / total * 100)}%)`);
                    });
                    datFiles.push({ name: terrainDatFilename(tile.lat, tile.lon), data: datData });
                    $('#mapgen_download_status').text(prefix + `\u2705 ${terrainDatFilename(tile.lat, tile.lon)} (${(datData.length / 1048576).toFixed(1)} MB)`);
                } catch (e) {
                    console.warn(`Conversion failed for ${name}:`, e.message);
                }
                completed++;
            }

            // Share downloaded HGT tiles with live altitude readout
            Object.keys(hgtCache).forEach(k => { liveAltCache[k] = hgtCache[k]; });
            updateHgtCacheInfo();

            if (syncAborted || datFiles.length === 0) {
                if (datFiles.length === 0) {
                    $('#mapgen_download_status').text('No files generated.');
                    $('#mapgen_modal_cancel').text('Close');
                    $('#mapgen_modal_confirm').hide();
                }
                return;
            }

            // Write to SD or download as ZIP
            if (hasSD) {
                await writeTerrainToSD(datFiles, forceOverwrite);
            } else {
                await downloadTerrainZip(datFiles);
            }
        }

        async function writeTerrainToSD(datFiles, forceOverwrite) {
            $('#mapgen_modal_header').text('Writing to SD Card...');
            $('#mapgen_download_status').text('Writing to SD card: 0 / ' + datFiles.length + '...');
            $('#mapgen_progress_fill').css('width', '0%');

            // Try to delete FREESPAC.E
            try {
                await globalThis.electronAPI.rm(sdPath + '/FREESPAC.E');
            } catch (_) { /* OK */ }

            const startTime = Date.now();
            const total = datFiles.length;
            let processed = 0;
            let failedCount = 0;
            let skipped = 0;
            const totalBytes = datFiles.reduce((s, f) => s + f.data.length, 0);
            let writtenBytes = 0;

            for (let i = 0; i < datFiles.length && !syncAborted; i++) {
                const df = datFiles[i];
                const fullPath = sdPath + '/' + df.name;
                try {
                    if (!forceOverwrite) {
                        const exists = await tileExistsOnSD(fullPath);
                        if (exists) {
                            skipped++;
                            writtenBytes += df.data.length;
                            processed++;
                            const pct = totalBytes > 0 ? (writtenBytes / totalBytes * 100) : 0;
                            $('#mapgen_progress_fill').css('width', pct.toFixed(0) + '%');
                            $('#mapgen_download_status').text(`Skipped (exists): ${df.name}`);
                            continue;
                        }
                    }
                    await globalThis.electronAPI.writeFile(fullPath, df.data);
                    writtenBytes += df.data.length;
                    const pct = totalBytes > 0 ? (writtenBytes / totalBytes * 100) : 0;
                    $('#mapgen_progress_fill').css('width', pct.toFixed(0) + '%');
                    const elapsed = Date.now() - startTime;
                    if (writtenBytes > 0 && elapsed > 500) {
                        const remainMs = Math.max(0, elapsed / writtenBytes * (totalBytes - writtenBytes));
                        const mins = Math.floor(remainMs / 60000);
                        const secs = Math.ceil((remainMs % 60000) / 1000);
                        const speed = (writtenBytes / 1024 / (elapsed / 1000)).toFixed(0);
                        $('#mapgen_download_status').text(`Writing ${df.name}... ${pct.toFixed(0)}% (${speed} KB/s, ${mins}:${secs.toString().padStart(2, '0')} remaining)`);
                    }
                } catch (e) {
                    failedCount++;
                    console.warn(`Failed: ${df.name}: ${e.message}`);
                }
                processed++;
            }

            if (syncAborted) return;
            showTerrainComplete(total, failedCount, skipped, true);
        }

        async function downloadTerrainZip(datFiles) {
            $('#mapgen_download_status').text('Creating ZIP...');
            $('#mapgen_progress_fill').css('width', '0%');

            const zip = new JSZip();
            for (const df of datFiles) {
                zip.file(df.name, df.data);
            }

            const blob = await zip.generateAsync({ type: 'arraybuffer' });
            const result = await globalThis.electronAPI.showSaveDialog({
                title: 'Save Terrain Files ZIP',
                defaultPath: 'INAV_Terrain_SRTM.zip',
                filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
            });
            if (!result.canceled && result.filePath) {
                await globalThis.electronAPI.writeFile(result.filePath, new Uint8Array(blob));
            }
            showTerrainComplete(datFiles.length, 0, 0, false);
        }

        function showTerrainComplete(total, failedCount, skipped, isSD) {
            skipped = skipped || 0;
            if (failedCount > 0) {
                $('#mapgen_download_status').text(`Done with ${failedCount} error(s).${skipped > 0 ? ` ${skipped} skipped (already existed).` : ''}`);
            } else {
                const written = total - skipped;
                let summary = `${written} .DAT file(s) written`;
                if (skipped > 0) summary += `, ${skipped} skipped (already existed)`;

                const title = isSD ? 'Terrain Sync Complete!' : 'Terrain Generation Complete!';
                const msg = isSD ? 'All terrain files synced to SD card!' : 'All terrain files generated!';
                $('#mapgen_modal_header').text(title);
                $('#mapgen_sync_info').html(`
                    <div class="mapgen-info-row"><span>Files:</span><span>${summary}</span></div>
                    <div style="margin:18px 0; text-align:center; color:#87b025; font-size:16px; font-weight:bold;">${msg}</div>
                    <div style="text-align:center; color:#888; font-size:12px;">Enable terrain in INAV CLI:<br><code style="color:#ffb300;">set terrain_enabled = ON</code> then <code style="color:#ffb300;">save</code></div>
                `);
                $('#mapgen_progress_section').hide();
                $('#mapgen_download_status').text(`${isSD ? 'Sync' : 'Export'} complete! ${summary}`);
            }
            $('#mapgen_modal_actions').show();
            $('#mapgen_modal_confirm').hide();
            $('#mapgen_modal_cancel').text('Close');
        }

        GUI.content_ready(callback);
    }
};

TABS.map_generator.cleanup = function (callback) {
    if (callback) callback();
};
