import {bridge, Platform} from "../bridge"

const resquestDfuPermission = async function()
{
    const filterDevices = bridge.bootloaderIds.map(bootloader => {
        return {
            vendorId: bootloader.vendorId,
            productId: bootloader.productId,
        }
    });
    try {
        await navigator.usb.requestDevice({filters: filterDevices});
    } catch (error) {
        console.log(error);
    }
}

export {resquestDfuPermission}
