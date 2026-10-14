import './bt-device-chooser-style.css'

document.addEventListener("DOMContentLoaded", () => {
    const MAX_DEVICE_NAME_LENGTH = 45;
    const KNOWN_DEVICES_KEY = 'btKnownDevices';

    // Store all discovered devices (Map preserves discovery order)
    const devices = new Map();
    // Track the DOM row created for each device so we can update it in place
    const deviceElements = new Map();

    // Get DOM elements
    const searchInput = document.getElementById('search');
    const listElement = document.getElementById('list');
    const cancelElement = document.getElementById('cancel');

    // Devices connected before are pinned at the top, sorted by name, so the
    // usual device is always in the same spot. Other devices follow below
    // the divider in discovery order.
    const knownSection = document.createElement('div');
    const divider = document.createElement('hr');
    divider.className = 'divider';
    const newSection = document.createElement('div');
    listElement.insertBefore(knownSection, cancelElement);
    listElement.insertBefore(divider, cancelElement);
    listElement.insertBefore(newSection, cancelElement);

    // deviceId -> last known name, persisted across sessions
    function loadKnownDevices() {
        try {
            return JSON.parse(localStorage.getItem(KNOWN_DEVICES_KEY)) || {};
        } catch {
            return {};
        }
    }

    function rememberDevice(device) {
        const known = loadKnownDevices();
        known[device.deviceId] = device.deviceName || known[device.deviceId] || '';
        try {
            localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(known));
        } catch {
            // Storage unavailable: the device just won't be pinned next time
        }
    }

    const knownDevices = loadKnownDevices();

    // Sort key for pinned rows: the stored name, so a row does not move when
    // the device's name resolves late during the scan
    function knownSortKey(deviceId) {
        return `${knownDevices[deviceId] || ''} ${deviceId}`.toLowerCase();
    }

    function insertKnownRow(item, deviceId) {
        const key = knownSortKey(deviceId);
        const next = Array.from(knownSection.children)
            .find(el => knownSortKey(el.id).localeCompare(key) > 0);
        knownSection.insertBefore(item, next || null);
    }

    function hasVisibleRow(section) {
        return Array.from(section.children).some(el => el.style.display !== 'none');
    }

    function deviceLabel(device) {
        const text = `${device.deviceName} (${device.deviceId})`;
        return text.length > MAX_DEVICE_NAME_LENGTH ? text.substring(0, MAX_DEVICE_NAME_LENGTH) : text;
    }

    // Show/hide rows according to the search text, without moving or recreating them
    function applyFilter() {
        const searchText = searchInput.value.toLowerCase().trim();
        devices.forEach((device, deviceId) => {
            const el = deviceElements.get(deviceId);
            if (!el) {
                return;
            }
            const deviceText = `${device.deviceName} ${device.deviceId}`.toLowerCase();
            const visible = !searchText || deviceText.includes(searchText);
            el.style.display = visible ? '' : 'none';
        });
        divider.style.display = hasVisibleRow(knownSection) && hasVisibleRow(newSection) ? '' : 'none';
    }

    // Render incrementally: existing rows stay put, known devices are placed
    // in their sorted slot, new devices are appended at the bottom of their
    // section, resolved names update in place.
    function renderDevices() {
        devices.forEach((device, deviceId) => {
            let item = deviceElements.get(deviceId);
            if (!item) {
                item = document.createElement('div');
                item.className = 'item';
                item.id = device.deviceId;
                item.addEventListener('click', () => {
                    rememberDevice(devices.get(deviceId));
                    window.electronAPI.deviceSelected(item.id);
                    window.close();
                });
                deviceElements.set(deviceId, item);
                if (Object.hasOwn(knownDevices, deviceId)) {
                    insertKnownRow(item, deviceId);
                } else {
                    newSection.appendChild(item);
                }
            }
            // Update label in place (name may have resolved from empty)
            item.textContent = deviceLabel(device);
        });

        applyFilter();
    }

    // Handle search input changes
    searchInput.addEventListener('input', () => {
        applyFilter();
    });

    // Handle device scan updates
    window.electronAPI.bleScan(data => {
        data.forEach(device => {
            devices.set(device.deviceId, device);
        });
        renderDevices();
    });

    // Handle cancel button
    cancelElement.addEventListener('click', () => {
        window.close();
    });

    // Initial render (in case devices were already discovered)
    renderDevices();
});
