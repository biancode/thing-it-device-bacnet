import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import {
    IMultiStateInputActorState,
    IMultiStateInputActorConfig,
} from '../../../core/interfaces';

export class MultiStateInputActorDevice extends ActorDevice {
    public readonly className: string = 'MultiStateInputActorDevice';
    public state: IMultiStateInputActorState;
    public config: IMultiStateInputActorConfig;

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
