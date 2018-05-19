import * as _ from 'lodash';

import { BACnetFlowManager } from './flow.manager.simulation';
import { BACnetServiceManager } from './service.manager.simulation';

import * as Utils from '../utils';

import * as Managers from '../managers';

import * as Configs from '../configs';

/**
 * Implements base simulation logic and provides base simulation interface.
 *
 * @class
 * @abstract
 */
export abstract class BaseSimulation {

    constructor (private logger: Utils.Logger) {
    }

    /**
     * Starts the simulation logic for specific device.
     *
     * @abstract
     * @return {void}
     */
    public abstract startSimulation (): void;

    /**
     * Stops the simulation logic for specific device. Default steps:
     *
     * @return {void}
     */
    public stopSimulation (): void {
    }

    /**
     * Factory. Creates the instance of the `flow` manager.
     *
     * @return {Managers.BACnetFlowManager} - instance of the `flow` manager
     */
    public getFlowManager (): Managers.BACnetFlowManager {
        const flowManager = new BACnetFlowManager(this.logger);

        const managerConfgig = _.cloneDeep(Configs.AppConfig.manager.flow);
        flowManager.initManager(managerConfgig);

        return flowManager as any as Managers.BACnetFlowManager;
    }

    /**
     * Factory. Creates the instance of the `service` manager.
     *
     * @return {Managers.BACnetServiceManager} - instance of the `service` manager
     */
    public getServiceManager (): Managers.BACnetServiceManager {
        const serviceManager = new BACnetServiceManager(this.logger);

        const managerConfgig = _.cloneDeep(Configs.AppConfig.manager.service);
        serviceManager.initManager(managerConfgig);

        return serviceManager as any as Managers.BACnetServiceManager;
    }
}
