import * as _ from 'lodash';

/* Plugin Device Class */
import { CommonDevice } from '../common.device';

/* Interfaces */
import * as Interfaces from '../../core/interfaces/device.interface';

export class ControllerDevice extends CommonDevice {
    public state: Interfaces.Controller.Device.State;
    public config: Interfaces.Controller.Device.Config;

    public async initDevice (): Promise<any> {
        super.initDevice();
    }
}
