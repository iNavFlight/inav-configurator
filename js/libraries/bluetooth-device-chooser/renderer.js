document.addEventListener("DOMContentLoaded", () => {
    window.electronAPI.bleScan(data => {
        data.forEach(device => {
            var dev = document.getElementById(device.deviceId)
            if (dev) {
                dev.parentElement.removeChild(dev);
            }
            var item = document.createElement('div');
            item.className = 'item'
            item.id = device.deviceId;
            item.addEventListener('click', () => {
                window.electronAPI.deviceSelected(item.id);
                window.close();
            });
            item.appendChild(document.createTextNode(device.deviceName + ' (' + device.deviceId + ')'));
            document.getElementById('list').prepend(item);
        });
    });
    document.getElementById('cancel').addEventListener('click', () => {
        window.close();
    });
});
