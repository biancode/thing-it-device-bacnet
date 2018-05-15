import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';

import { APIError } from '../errors';

import * as APIBACnetServices from '../services/bacnet';

import { APIService } from '../services';

import * as Interfaces from '../interfaces';

import { Logger } from '../utils';
import { ServerSocket } from '../sockets';

import { store } from '../../redux';
import { BACnetAction } from '../../redux/actions';

import { COVTimer } from '../entities';

export class BACnetServiceManager {
    private config: Interfaces.ServiceManager.Config;
    private server: ServerSocket;

    private sbCOVTimer: Subscription;

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
            this.sbCOVTimer.unsubscribe();
        } catch (error) {
            throw new APIError(`BACnetServiceManager - destroy: ${error}`);
        }
        finally {
            this.sbCOVTimer = null;
        }
    }

    /**
     * initService - sets service options, sets server socket, creates instance
     * of API service.
     *
     * @param  {Interfaces.ServiceManager.Config} conifg - manager configuration
     * @return {void}
     */
    public initManager (config: Interfaces.ServiceManager.Config): void {
        this.config = config;

        this.server = store.getState([ 'bacnet', 'bacnetServer' ]);

        const covTimerConfig = _.clone(this.config.covTimer);
        // Emits the first tick of the COV Timer
        this.tickCOVTimer(covTimerConfig);

        // Starts the COV Timer
        this.sbCOVTimer = Observable.timer(covTimerConfig.period, covTimerConfig.period)
            .subscribe(() => this.tickCOVTimer(covTimerConfig));
    }

    /**
     * Generates the instance of the COVTimer and emits redux `tick` event with
     * instance of the COVTimer.
     *
     * @param  {Interfaces.COVTimer.Config} covTimerConfig - config of the COVTimer
     * @return {void}
     */
    private tickCOVTimer (covTimerConfig: Interfaces.COVTimer.Config): void {
        const covTimer = new COVTimer();
        covTimer.init(covTimerConfig);
        BACnetAction.tickCOVTimer(covTimer);
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
        const socket = this.server.getOutputSocket(this.config.dest, apiLogger);

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
