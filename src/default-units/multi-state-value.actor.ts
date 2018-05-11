import {
    MultiStateValueActorDevice,
    MultiStateValueActorDiscovery,
} from '../devices/actors/multi-state/multi-state-value';

export {
    MultiStateValueActorMetadata as metadata,
} from '../devices/actors/multi-state/multi-state-value';

export function create (options?: any) {
    const inst = new MultiStateValueActorDevice(options);
    // --- settings
    return inst;
}

export function discovery (options?: any) {
    const inst = new MultiStateValueActorDiscovery(options);
    // --- settings
    return inst;
}
