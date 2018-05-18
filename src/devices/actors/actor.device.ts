import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { APIError } from '../../core/errors';
import { CommonDevice } from '../common.device';

import {
    BACnetFlowManager,
    BACnetServiceManager,
} from '../../core/managers';

import {
    APIService,
} from '../../core/services';

/* Interfaces */
import * as Interfaces from '../../core/interfaces';

import * as Simulations from '../../core/simulations';

import { store } from '../../redux';

export class ActorDevice extends CommonDevice {
    public state: Interfaces.Actor.Device.State;
    public config: Interfaces.Actor.Device.Config;

    public flowManager: BACnetFlowManager;
    public serviceManager: BACnetServiceManager;
    public apiService: APIService;

    /**
     * initDevice - initializes the unit, sets initial states.
     *
     * @return {Promise<any>}
     */
    public async initDevice (): Promise<any> {
        await super.initDevice();

        // Creates and inits params of the Unit
        this.initParamsFromConfig();

        // Creates instances of the plugin componets
        await this.createPluginComponents();

        // Creates `subscribtion` to the BACnet object properties
        this.subscribeToProperty();

        // Inits the BACnet object properties
        this.initProperties();

        this.state.initialized = true;
        this.publishStateChange();
    }

    /**
     * Creates and inits params of the Unit from plugin configuration.
     *
     * @return {void}
     */
    public initParamsFromConfig (): void {
    }

    /**
     * Creates instances of the plugin componets.
     *
     * @return {Promise<void>}
     */
    public async createPluginComponents (): Promise<void> {
        if (!this.isSimulated()) {
            // Create and init BACnet Flow Manager
            this.flowManager = store.getState([ 'bacnet', 'flowManager' ]);
            // Create and init BACnet Service Manager
            this.serviceManager = store.getState([ 'bacnet', 'serviceManager' ]);
            // Creates instance of the API Service
            this.apiService = this.serviceManager.createAPIService(this.logger);
            return;
        }

        const simulationLogic = this.getSimulationLogic();

        // Create instance of the BACnet Flow Manager
        this.flowManager = simulationLogic.getFlowManager();
        // Create instance of the BACnet Service Manager
        this.serviceManager = simulationLogic.getServiceManager();
        // Creates instance of the API Service
        this.apiService = this.serviceManager.createAPIService();

        simulationLogic.startSimulation();
    }

    /**
     * Creates `subscribtion` to the BACnet object properties.
     *
     * @return {void}
     */
    public subscribeToProperty (): void {
    }

    /**
     * Inits the BACnet object properties.
     *
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
    }

    /**
     * Creates the instance of the simulation logic.
     *
     * @return {Simulations.BaseSimulation}
     */
    public getSimulationLogic (): Simulations.BaseSimulation {
        return null;
    }
}
