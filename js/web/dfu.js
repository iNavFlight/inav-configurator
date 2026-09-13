import { usbDevices } from '../port_handler';

// getDevices() (used elsewhere for DFU detection) never prompts; this is
// the only way to get that first grant, and it must run from a user gesture.
const requestDfuPermission = async function () {
    const filterDevices = usbDevices.map(device => ({
        vendorId: device.vendorId,
        productId: device.productId,
    }));
    try {
        await navigator.usb.requestDevice({ filters: filterDevices });
    } catch (error) {
        console.log(error);
    }
};

export { requestDfuPermission };
