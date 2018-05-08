import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

export class AnalogValueActorDevice extends ActorDevice {
    public readonly className: string = 'AnalogValueActorDevice';
    public state: Interfaces.Actor.AnalogValue.State;
    public config: Interfaces.Actor.AnalogValue.Config;

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
    public setPresentValue (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public changeValue (): Bluebird<void> {
        return Bluebird.resolve();
    }
}
