import './bt-device-chooser-style.css'

document.addEventListener("DOMContentLoaded", () => {
    const MAX_DEVICE_NAME_LENGTH = 45;

    // Store all discovered devices (Map preserves discovery order)
    const devices = new Map();
    // Track the DOM row created for each device so we can update it in place
    const deviceElements = new Map();

    // Get DOM elements
    const searchInput = document.getElementById('search');
    const listElement = document.getElementById('list');
    const cancelElement = document.getElementById('cancel');

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
    }

    // Render incrementally in discovery order: existing rows stay put, new
    // devices are appended at the bottom, resolved names update in place.
    function renderDevices() {
        devices.forEach((device, deviceId) => {
            let item = deviceElements.get(deviceId);
            if (!item) {
                item = document.createElement('div');
                item.className = 'item';
                item.id = device.deviceId;
                item.addEventListener('click', () => {
                    window.electronAPI.deviceSelected(item.id);
                    window.close();
                });
                deviceElements.set(deviceId, item);
                // Insert before cancel button to keep it at the bottom
                listElement.insertBefore(item, cancelElement);
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
