import {
    BinaryValueActorDevice,
    BinaryValueActorDiscovery,
} from '../devices/actors/binary/binary-value';

export {
    BinaryValueActorMetadata as metadata,
} from '../devices/actors/binary/binary-value';

export function create (options?: any) {
    const inst = new BinaryValueActorDevice(options);
    // --- settings
    return inst;
}

export function discovery (options?: any) {
    const inst = new BinaryValueActorDiscovery(options);
    // --- settings
    return inst;
}
