import {
    AnalogInputActorDevice,
    AnalogInputActorDiscovery,
} from '../devices/actors/analog/analog-input';

export {
    AnalogInputActorMetadata as metadata,
} from '../devices/actors/analog/analog-input';

export function create (options?: any) {
    const inst = new AnalogInputActorDevice(options);
    // --- settings
    return inst;
}

export function discovery (options?: any) {
    const inst = new AnalogInputActorDiscovery(options);
    // --- settings
    return inst;
}
