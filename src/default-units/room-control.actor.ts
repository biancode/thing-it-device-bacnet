import {
    RoomControlActorDevice,
    RoomControlActorDiscovery,
} from '../devices/actors/hvac/room-control';

export {
    RoomControlActorMetadata as metadata,
} from '../devices/actors/hvac/room-control';

export function create (options?: any) {
    const inst = new RoomControlActorDevice(options);
    // --- settings
    return inst;
}

export function discovery (options?: any) {
    const inst = new RoomControlActorDiscovery(options);
    // --- settings
    return inst;
}
