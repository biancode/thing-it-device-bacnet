import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

export class MultiStateInputActorDevice extends ActorDevice {
    public readonly className: string = 'MultiStateInputActorDevice';
    public state: Interfaces.Actor.MultiStateInput.State;
    public config: Interfaces.Actor.MultiStateInput.Config;

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
