import {
    JalousieSimpleActorDevice,
    JalousieSimpleActorDiscovery,
} from '../devices/actors/jalousie-simple';

export {
    JalousieSimpleActorMetadata as metadata,
} from '../devices/actors/jalousie-simple';

export function create (options?: any) {
    const inst = new JalousieSimpleActorDevice(options);
    // --- settings
    return inst;
}

export function discovery (options?: any) {
    const inst = new JalousieSimpleActorDiscovery(options);
    // --- settings
    return inst;
}
