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
            var text = device.deviceName + ' (' + device.deviceId + ')';
            item.appendChild(document.createTextNode(text.length > 45 ? device.deviceName.substring(0, 45) : text.substring(0, 45)));
            document.getElementById('list').prepend(item);
        });
    });
    document.getElementById('cancel').addEventListener('click', () => {
        window.close();
    });
});
