import * as _ from 'lodash';

import { ApiError } from '../errors';

import * as APIBACnetServices from '../services/bacnet';

import { APIService } from '../services';

import {
    IBACnetServiceManagerConfig,
    IBACnetAddressInfo,
} from '../interfaces';

import { Logger } from '../utils';
import { ServerSocket } from '../sockets';

import { store } from '../../redux';

export class BACnetServiceManager {
    private config: IBACnetServiceManagerConfig;
    private server: ServerSocket;

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
        this.server = null;

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

        this.server = store.getState([ 'bacnet', 'bacnetServer' ]);
    }

    /**
     * Creates the API service. Method creates instance of the each BACnet API service.
     *
     * @param  {Logger} logger - instance of the logger
     * @return {APIService} - instance of the API service
     */
    public createAPIService (logger?: Logger): APIService {
        // Uses default logger if api logger is not provided
        const apiLogger = _.isNil(logger) ? this.logger : logger;

        // Creates output socket
        const socket = this.server.getOutputSocket(this.config.dest);

        // Create API Service
        const apiService = new APIService();

        // Create API Confirmed Request Service
        const confirmedReqService = new APIBACnetServices
            .APIConfirmedReqService(apiLogger, socket);
        apiService.confirmedReq = confirmedReqService;

        // Create API Unconfirmed Request Service
        const unconfirmedReqService = new APIBACnetServices
            .APIUnconfirmedReqService(apiLogger, socket);
        apiService.unconfirmedReq = unconfirmedReqService;

        return apiService;
    }
}
