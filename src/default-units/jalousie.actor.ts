import {
    JalousieActorDevice,
    JalousieActorDiscovery,
} from '../devices/actors/jalousie';

export {
    JalousieActorMetadata as metadata,
} from '../devices/actors/jalousie';

export function create (options?: any) {
    const inst = new JalousieActorDevice(options);
    // --- settings
    return inst;
}

export function discovery (options?: any) {
    const inst = new JalousieActorDiscovery(options);
    // --- settings
    return inst;
}
