import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import {
    IRoomControlActorState,
    IRoomControlActorConfig,
} from '../../../core/interfaces';

export class RoomControlActorDevice extends ActorDevice {
    public readonly className: string = 'RoomControlActorDevice';
    public state: IRoomControlActorState;
    public config: IRoomControlActorConfig;

    public async initDevice (): Promise<any> {
        await super.initDevice();

        this.state.initialized = true;
        this.publishStateChange();
    }

    /**
     * Service Stub
     */
    public incrementSetpoint (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public decrementSetpoint (presentValue: any): Bluebird<void> {
        return Bluebird.resolve();
    }
}
