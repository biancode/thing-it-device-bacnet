import {
    MultiStateInputActorDevice,
    MultiStateInputActorDiscovery,
} from '../devices/actors/multi-state/multi-state-input';

export {
    MultiStateInputActorMetadata as metadata,
} from '../devices/actors/multi-state/multi-state-input';

export function create (options?: any) {
    const inst = new MultiStateInputActorDevice(options);
    // --- settings
    return inst;
}

export function discovery (options?: any) {
    const inst = new MultiStateInputActorDiscovery(options);
    // --- settings
    return inst;
}
