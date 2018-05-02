import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import {
    IBinaryLightActorState,
    IBinaryLightActorConfig,
} from '../../../core/interfaces';

export class BinaryLightActorDevice extends ActorDevice {
    public readonly className: string = 'BinaryLightActorDevice';
    public state: IBinaryLightActorState;
    public config: IBinaryLightActorConfig;

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
