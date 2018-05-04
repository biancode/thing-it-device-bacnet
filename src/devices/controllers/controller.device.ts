import * as _ from 'lodash';

/* Plugin Device Class */
import { CommonDevice } from '../common.device';

/* Interfaces */
import { IControllerState, IControllerConfig } from '../../core/interfaces/device.interface';

export class ControllerDevice extends CommonDevice {
    public configuration: IControllerConfig;
    public state: IControllerState;

    public async initDevice (): Promise<any> {
        super.initDevice();
    }
}
