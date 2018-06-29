import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { APIError } from '../../core/errors';
import { CommonDevice } from '../common.device';

import {
    BACnetFlowManager,
    BACnetServiceManager,
    SubscriptionManager
} from '../../core/managers';

import {
    APIService,
} from '../../core/services';

/* Interfaces */
import * as Interfaces from '../../core/interfaces';

import { store } from '../../redux';

export class ActorDevice extends CommonDevice {
    public state: Interfaces.Actor.Device.State;
    public config: Interfaces.Actor.Device.Config;

    public flowManager: BACnetFlowManager;
    public serviceManager: BACnetServiceManager;
    public apiService: APIService;

    /**
     * start - initializes default state of the actor.
     *
     * @return {Promise<any>}
     */
    public async start (): Promise<any> {
        await super.start();

        // Init the default state
        this.setState(this.state);
    }

    /**
     * initSubManager - initializes actor subscription manager and
     * covObjectIds array.
     *
     * @return {Promise<any>}
     */
    public async initSubManager(): Promise<any> {
        this.covObjectIds = [];

        this.subManager = new SubscriptionManager();
        await this.subManager.initManager();
    }
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
        /* Create and init BACnet Flow Manager */
        this.flowManager = store.getState([ 'bacnet', 'flowManager' ]);
        /* Create and init BACnet Service Manager */
        this.serviceManager = store.getState([ 'bacnet', 'serviceManager' ]);
        // Creates instance of the API Service
        this.apiService = this.serviceManager.createAPIService(this.logger);
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
}
