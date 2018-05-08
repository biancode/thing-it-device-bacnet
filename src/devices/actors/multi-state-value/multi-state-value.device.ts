import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

export class MultiStateValueActorDevice extends ActorDevice {
    public readonly className: string = 'MultiStateValueActorDevice';
    public state: Interfaces.Actor.MultiStateValue.State;
    public config: Interfaces.Actor.MultiStateValue.Config;

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

    /**
     * Service Stub
     */
    public setPresentValue (presentValue: any): Bluebird<void> {
        return Bluebird.resolve();
    }
}
