import * as _ from 'lodash';
import * as Rx from 'rxjs';
import * as RxOp from 'rxjs/operators';

import { APIError } from '../errors';

import * as APIBACnetServices from './services';

import { APIService } from '../services';

import * as Interfaces from '../interfaces';

import { Logger } from '../utils';

import { BACnetAction } from '../../redux/actions';

import { COVTimer } from '../entities';

export class BACnetServiceManager {
    private config: Interfaces.ServiceManager.Config;
    private socket: Rx.Subject<Interfaces.Simulation.APINotification>;

    private sbCOVTimer: Rx.Subscription;

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
            this.socket.unsubscribe();
        } catch (error) {
            throw new APIError(`BACnetServiceManager - destroy: Socket ${error}`);
        }
        finally {
            this.socket = null;
        }

        try {
            this.sbCOVTimer.unsubscribe();
        } catch (error) {
            throw new APIError(`BACnetServiceManager - destroy: COVTimer ${error}`);
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

        this.socket = new Rx.Subject();

        const covTimerConfig = _.clone(this.config.covTimer);
        // Emits the first tick of the COV Timer
        this.tickCOVTimer(covTimerConfig);

        // Starts the COV Timer
        this.sbCOVTimer = Rx.timer(covTimerConfig.period, covTimerConfig.period)
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
        const socket = this.socket;

        // Create API Service
        const apiService = new APIService();

        // Create API Confirmed Request Service
        const confirmedReqService = new APIBACnetServices
            .APIConfirmedReqService(apiLogger, socket);
        apiService.confirmedReq = confirmedReqService as any;

        // Create API Unconfirmed Request Service
        const unconfirmedReqService = new APIBACnetServices
            .APIUnconfirmedReqService(apiLogger, socket);
        apiService.unconfirmedReq = unconfirmedReqService as any;

        return apiService;
    }
}
