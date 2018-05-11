import {
    ThermostatActorDevice,
    ThermostatActorDiscovery,
} from '../devices/actors/hvac/thermostat';

export {
    ThermostatActorMetadata as metadata,
} from '../devices/actors/hvac/thermostat';

export function create (options?: any) {
    const inst = new ThermostatActorDevice(options);
    // --- settings
    return inst;
}

export function discovery (options?: any) {
    const inst = new ThermostatActorDiscovery(options);
    // --- settings
    return inst;
}
