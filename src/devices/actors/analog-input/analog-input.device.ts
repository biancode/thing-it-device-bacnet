import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import {
    IAnalogInputActorState,
    IAnalogInputActorConfig,
} from '../../../core/interfaces';

export class AnalogInputActorDevice extends ActorDevice {
    public readonly className: string = 'AnalogInputActorDevice';
    public state: IAnalogInputActorState;
    public config: IAnalogInputActorConfig;

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
