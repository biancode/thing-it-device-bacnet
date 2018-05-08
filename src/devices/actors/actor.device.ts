import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ApiError } from '../../core/errors';
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

import { store } from '../../redux';

export class ActorDevice extends CommonDevice {
    public state: Interfaces.Actor.Device.State;
    public config: Interfaces.Actor.Device.Config;

    public flowManager: BACnetFlowManager;
    public serviceManager: BACnetServiceManager;
    public apiService: APIService;

    /**
     * initDevice - initializes the sensor, sets initial states.
     *
     * @return {Promise<any>}
     */
    public async initDevice (): Promise<any> {
        await super.initDevice();
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
        this.apiService = this.serviceManager.createAPIService();
    }
}
