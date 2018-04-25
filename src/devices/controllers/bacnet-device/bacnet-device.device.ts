import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ApiError } from '../../../core/errors';

/* Plugin devices */
import { ControllerDevice } from '../controller.device';

import {
    IBACnetDeviceControllerState,
    IBACnetDeviceControllerConfig
} from '../../../core/interfaces';

export class BACnetDeviceControllerDevice extends ControllerDevice {
    public state: IBACnetDeviceControllerState;
    public config: IBACnetDeviceControllerConfig;

    public start () {
        super.start();

        return this.initDevice();
    }

    /**
     * initDevice - inits the Philips controller.
     * - Method creates the API Light service and registrate created
     * service in "ServiceManager".
     *
     * @return {Promise<any>}
     */
    public async initDevice (): Promise<any> {
        await super.initDevice();

        this.state.initialized = true;
    }
}
