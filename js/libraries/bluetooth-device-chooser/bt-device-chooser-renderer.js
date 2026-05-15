import './bt-device-chooser-style.css'

document.addEventListener("DOMContentLoaded", () => {
    // Store all discovered devices
    const devices = new Map();

    // Get DOM elements
    const searchInput = document.getElementById('search');
    const listElement = document.getElementById('list');
    const cancelElement = document.getElementById('cancel');

    // Render devices in sorted and filtered order
    function renderDevices() {
        const searchText = searchInput.value.toLowerCase().trim();

        // Get all devices except cancel button
        const existingDevices = Array.from(listElement.querySelectorAll('.item:not(#cancel)'));
        existingDevices.forEach(el => el.remove());

        // Sort devices alphabetically by name
        const sortedDevices = Array.from(devices.values()).sort((a, b) => {
            return a.deviceName.localeCompare(b.deviceName);
        });

        // Filter devices based on search text
        const filteredDevices = sortedDevices.filter(device => {
            if (!searchText) return true;
            const deviceText = `${device.deviceName} ${device.deviceId}`.toLowerCase();
            return deviceText.includes(searchText);
        });

        // Render filtered and sorted devices
        filteredDevices.forEach(device => {
            const item = document.createElement('div');
            item.className = 'item';
            item.id = device.deviceId;
            item.addEventListener('click', () => {
                window.electronAPI.deviceSelected(item.id);
                window.close();
            });
            const MAX_DEVICE_NAME_LENGTH = 45;
            const text = `${device.deviceName} (${device.deviceId})`;
            const displayText = text.length > MAX_DEVICE_NAME_LENGTH ? text.substring(0, MAX_DEVICE_NAME_LENGTH) : text;
            item.appendChild(document.createTextNode(displayText));

            // Insert before cancel button to keep it at the bottom
            listElement.insertBefore(item, cancelElement);
        });
    }

    // Handle search input changes
    searchInput.addEventListener('input', () => {
        renderDevices();
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
