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
    /**
     * Device configuration
     */
    public config: any;

    public subManager: Managers.SubscriptionManager;

    public flowManager: BACnetFlowManager;
    public serviceManager: BACnetServiceManager;

    constructor (private logger: Utils.Logger) {
    }

    /**
     * Inits the instance of simulation class. Default steps:
     * - saves the device configuration;
     * - creates an instance of the subscribtion manager;
     * - calls the `initParamsFromConfig` method;
     *
     * @return {void}
     */
    public async init (config: any): Promise<void> {
        this.config = config;

        this.subManager = new Managers.SubscriptionManager();
        this.subManager.initManager();

        this.initParamsFromConfig();
    }

    /**
     * Destroys the instance of simulation class. Default steps:
     * - destroys the subscribtion manager;
     *
     * @return {void}
     */
    public async destroy (): Promise<void> {
        this.subManager.destroy();
        this.subManager = null;
    }

    /**
     * Factory. Creates the instance of the `flow` manager.
     *
     * @return {Managers.BACnetFlowManager} - instance of the `flow` manager
     */
    public getFlowManager (): Managers.BACnetFlowManager {
        this.flowManager = new BACnetFlowManager(this.logger);

        const managerConfgig = _.cloneDeep(Configs.AppConfig.manager.flow);
        this.flowManager.initManager(managerConfgig);

        return this.flowManager as any as Managers.BACnetFlowManager;
    }

    /**
     * Factory. Creates the instance of the `service` manager.
     *
     * @return {Managers.BACnetServiceManager} - instance of the `service` manager
     */
    public getServiceManager (): Managers.BACnetServiceManager {
        this.serviceManager = new BACnetServiceManager(this.logger);

        const managerConfgig = _.cloneDeep(Configs.AppConfig.manager.service);
        this.serviceManager.initManager(managerConfgig);

        return this.serviceManager as any as Managers.BACnetServiceManager;
    }

    /**
     * Inits the simulation configuration from device configuration.
     *
     * @return {void}
     */
    public abstract async initParamsFromConfig (): Promise<void>;

    /**
     * Starts the simulation logic for specific device.
     *
     * @return {void}
     */
    public abstract async startSimulation (): Promise<void>;

    /**
     * Stops the simulation logic for specific device.
     *
     * @return {void}
     */
    public abstract async stopSimulation (): Promise<void>;
}
