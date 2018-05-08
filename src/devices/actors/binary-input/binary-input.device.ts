import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

export class BinaryInputActorDevice extends ActorDevice {
    public readonly className: string = 'BinaryInputActorDevice';
    public state: Interfaces.Actor.BinaryInput.State;
    public config: Interfaces.Actor.BinaryInput.Config;

    public async initDevice (): Promise<any> {
        await super.initDevice();

        this.state.initialized = true;
        this.publishStateChange();
    }

    /**
     * Service Stub
     */
    public update (): Bluebird<void> {
        return Bluebird.resolve();
    }
}
