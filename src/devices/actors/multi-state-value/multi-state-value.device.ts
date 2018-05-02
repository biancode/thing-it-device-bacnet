import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import {
    IMultiStateValueActorState,
    IMultiStateValueActorConfig,
} from '../../../core/interfaces';

export class MultiStateValueActorDevice extends ActorDevice {
    public readonly className: string = 'MultiStateValueActorDevice';
    public state: IMultiStateValueActorState;
    public config: IMultiStateValueActorConfig;

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
