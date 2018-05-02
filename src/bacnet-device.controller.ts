import {
    BACnetDeviceControllerDevice,
    BACnetDeviceControllerDiscovery,
} from './devices/controllers/bacnet-device';

export {
    BACnetDeviceControllerMetadata as metadata,
} from './devices/controllers/bacnet-device';

export function create (options?: any) {
    const inst = new BACnetDeviceControllerDevice(options);
    // --- settings
    return inst;
}

export function discovery (options?: any) {
    const inst = new BACnetDeviceControllerDiscovery(options);
    // --- settings
    return inst;
}
