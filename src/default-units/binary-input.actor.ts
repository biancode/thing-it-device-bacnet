import {
    BinaryInputActorDevice,
    BinaryInputActorDiscovery,
} from '../devices/actors/binary/binary-input';

export {
    BinaryInputActorMetadata as metadata,
} from '../devices/actors/binary/binary-input';

export function create (options?: any) {
    const inst = new BinaryInputActorDevice(options);
    // --- settings
    return inst;
}

export function discovery (options?: any) {
    const inst = new BinaryInputActorDiscovery(options);
    // --- settings
    return inst;
}
