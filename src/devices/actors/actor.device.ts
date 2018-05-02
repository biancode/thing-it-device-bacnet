import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ApiError } from '../../core/errors';
import { CommonDevice } from '../common.device';

/* Interfaces */
import { IActorState, IActorConfig } from '../../core/interfaces';

export class ActorDevice extends CommonDevice {
    public config: IActorConfig;
    public state: IActorState;

    /**
     * initDevice - initializes the sensor, sets initial states.
     *
     * @return {Promise<any>}
     */
    public async initDevice (): Promise<any> {
        await super.initDevice();
    }
}
