import {
    BinaryLightActorDevice,
    BinaryLightActorDiscovery,
} from '../devices/actors/binary-light';

export {
    BinaryLightActorMetadata as metadata,
} from '../devices/actors/binary-light';

export function create (options?: any) {
    const inst = new BinaryLightActorDevice(options);
    // --- settings
    return inst;
}

export function discovery (options?: any) {
    const inst = new BinaryLightActorDiscovery(options);
    // --- settings
    return inst;
}
