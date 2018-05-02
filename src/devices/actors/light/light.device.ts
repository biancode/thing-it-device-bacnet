import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import {
    ILightActorState,
    ILightActorConfig,
} from '../../../core/interfaces';

export class LightActorDevice extends ActorDevice {
    public readonly className: string = 'LightActorDevice';
    public state: ILightActorState;
    public config: ILightActorConfig;

    public async initDevice (): Promise<any> {
        await super.initDevice();

        this.state.initialized = true;
        this.publishStateChange();
    }

    /**
     * Service Stub
     */
    public toggleLight (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public changeDimmer (params: any): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public update (): Bluebird<void> {
        return Bluebird.resolve();
    }
}
