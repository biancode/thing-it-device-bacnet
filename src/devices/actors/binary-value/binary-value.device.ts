import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import {
    IBinaryValueActorState,
    IBinaryValueActorConfig,
} from '../../../core/interfaces';

export class BinaryValueActorDevice extends ActorDevice {
    public readonly className: string = 'BinaryValueActorDevice';
    public state: IBinaryValueActorState;
    public config: IBinaryValueActorConfig;

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
    public toggle (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public on (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public off (): Bluebird<void> {
        return Bluebird.resolve();
    }
}
