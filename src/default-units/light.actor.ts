import {
    LightActorDevice,
    LightActorDiscovery,
} from '../devices/actors/light';

export {
    LightActorMetadata as metadata,
} from '../devices/actors/light';

export function create (options?: any) {
    const inst = new LightActorDevice(options);
    // --- settings
    return inst;
}

export function discovery (options?: any) {
    const inst = new LightActorDiscovery(options);
    // --- settings
    return inst;
}
