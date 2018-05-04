import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import {
    IAnalogInputActorState,
    IAnalogInputActorConfig,
} from '../../../core/interfaces';

import {
    BACnetFlowManager,
    BACnetServiceManager,
} from '../../../core/managers';

export class AnalogInputActorDevice extends ActorDevice {
    public readonly className: string = 'AnalogInputActorDevice';
    public state: IAnalogInputActorState;
    public config: IAnalogInputActorConfig;

    public flowManager: BACnetFlowManager;
    public serviceManager: BACnetServiceManager;
    public async initDevice (): Promise<any> {
        await super.initDevice();

        this.flowManager = store.getState([ 'bacnet', 'flowManager' ]);
        this.serviceManager = store.getState([ 'bacnet', 'serviceManager' ]);
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
