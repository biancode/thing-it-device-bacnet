// TODO: Stub of Q.fail method. Remove this line, when TIN promises will be changed.
(<any>Promise.prototype).fail = Promise.prototype.catch;

import { DeviceServer } from './device.server';

export class DeviceBase extends DeviceServer {
}
