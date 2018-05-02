import * as _ from 'lodash';

import { ApiError } from '../errors';

import * as APIBACnetServices from '../services/bacnet';

import { APIService } from '../services';

import {
    IBACnetServiceManagerConfig,
    IBACnetAddressInfo,
} from '../interfaces';

import { Logger } from '../utils';

export class BACnetServiceManager {
    private config: IBACnetServiceManagerConfig;

    private _apiService: APIService;

    /**
     * Return instance of API Service
     *
     * @type {apiService}
     */
    public get apiService (): APIService {
        return this._apiService;
    }

    constructor (private logger: Logger) {
    }

    /**
     * Destroys the instance.
     * - removes config (sets `null`)
     * - destroys API Service
     *
     * @return {Promise<any>}
     */
    public async destroy (): Promise<any> {
        this.config = null;
        try {
            await this._apiService.destroy();
        } catch (error) {
            throw new ApiError(`BACnetServiceManager - destroy: ${error}`);
        }
        finally {
            this._apiService = null;
        }
    }

    /**
     * initService - sets service options, sets server socket, creates instance
     * of API service.
     *
     * @param  {IBACnetServiceManagerConfig} conifg - manager configuration
     * @return {void}
     */
    public initManager (config: IBACnetServiceManagerConfig): void {
        this.config = config;
    }

    /**
     * createAPIServices - creates the API service. Method creates instance of
     * each BACnet API service.
     *
     * @param  {IBACnetAddressInfo} rinfo - address of the BACnet Device
     * @return {APIService} - instance of the API service
     */
    public createAPIService (rinfo: IBACnetAddressInfo, logger?: Logger): APIService {
        const apiLogger = _.isNil(logger) ? this.logger : logger;

        const socket = this.config.server.getOutputSocket(rinfo);
        const apiService = new APIService();

        const confirmedReqService = new APIBACnetServices
            .APIConfirmedReqService(apiLogger, socket);
        apiService.confirmedReq = confirmedReqService;

        const unconfirmedReqService = new APIBACnetServices
            .APIUnconfirmedReqService(apiLogger, socket);
        apiService.unconfirmedReq = unconfirmedReqService;

        return apiService;
    }
}
