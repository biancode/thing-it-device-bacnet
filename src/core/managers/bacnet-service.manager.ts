import { OutputSocket } from '../sockets';

import { APIService } from '../services';
import * as APIBACnetServices from '../services/bacnet';

import { IBACnetServiceManagerConfig } from '../interfaces';

export class BACnetServiceManager {
    private config: IBACnetServiceManagerConfig;

    private _apiService: APIService;

    /**
     * Return instance of API Service
     *
     * @type {apiService}
     */
    public apiService (): APIService {
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

        this._apiService = this.createAPIService(config.socket);
    }

    /**
     * createAPIServices - creates the API service. Method creates instance of
     * the each BACnet API service.
     *
     * @param  {OutputSocket} socket - instance of the OutputSocket
     * @return {APIService} - instance of the API service
     */
    private createAPIService (socket: OutputSocket): APIService {
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
