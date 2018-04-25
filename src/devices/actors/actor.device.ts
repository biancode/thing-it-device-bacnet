import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ServiceManager } from '../../managers/service.manager';
import { APIServiceBase } from '../../core/services/api.service.base';

import { ApiError } from '../../core/errors';
import { CommonDevice } from '../common.device';

/* Interfaces */
import { IActorState, IActorConfig } from '../../core/interfaces';

export class ActorDevice extends CommonDevice {
    protected serviceManager: ServiceManager;
    protected apiService: APIServiceBase;
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

    /**
     * setAPIService - sets the API service in internal "apiService" property.
     *
     * @param  {APIService} apiService
     * @return {void}
     */
    public setServiceManager (serviceManager: ServiceManager): void {
        this.serviceManager = serviceManager;
        this.setAPIService();
    }

    /**
     * setAPIService - sets the API service in internal "apiService" property.
     *
     * @param  {APIService} apiService
     * @return {void}
     */
    public setAPIService (): void {
    }
}
