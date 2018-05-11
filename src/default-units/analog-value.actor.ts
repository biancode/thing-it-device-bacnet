import {
    AnalogValueActorDevice,
    AnalogValueActorDiscovery,
} from '../devices/actors/analog/analog-value';

export {
    AnalogValueActorMetadata as metadata,
} from '../devices/actors/analog/analog-value';

export function create (options?: any) {
    const inst = new AnalogValueActorDevice(options);
    // --- settings
    return inst;
}

export function discovery (options?: any) {
    const inst = new AnalogValueActorDiscovery(options);
    // --- settings
    return inst;
}
