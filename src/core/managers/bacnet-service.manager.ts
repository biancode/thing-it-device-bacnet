import { OutputSocket } from '../sockets';

import { APIService } from '../services';
import * as APIBACnetServices from '../services/bacnet';

import {
    IBACnetServiceManagerConfig,
    IBACnetAddressInfo,
} from '../interfaces';

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
    public createAPIService (rinfo: IBACnetAddressInfo): APIService {
        const socket = this.config.server.getOutputSocket(rinfo);
        const apiService = new APIService();

        const confirmedReqService = new APIBACnetServices
            .APIConfirmedReqService(socket);
        apiService.confirmedReq = confirmedReqService;

        const unconfirmedReqService = new APIBACnetServices
            .APIUnconfirmedReqService(socket);
        apiService.unconfirmedReq = unconfirmedReqService;

        return apiService;
    }
}
