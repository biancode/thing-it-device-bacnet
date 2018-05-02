import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import {
    IBinaryInputActorState,
    IBinaryInputActorConfig,
} from '../../../core/interfaces';

export class BinaryInputActorDevice extends ActorDevice {
    public readonly className: string = 'BinaryInputActorDevice';
    public state: IBinaryInputActorState;
    public config: IBinaryInputActorConfig;

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
