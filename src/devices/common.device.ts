import * as requestPromise from 'request-promise';
import * as request from 'request';

import * as _ from 'lodash';

import { ApiError } from '../core/errors';

import { DeviceBase } from '../core/bases/device.base';

import { Logger } from '../core/utils';
import { ICommonState, ICommonConfig } from '../core/interfaces/device.interface';

export class CommonDevice extends DeviceBase {
    public config: ICommonConfig;
    public state: ICommonState;
    public isDestroyed: boolean;
    public logger: Logger;

    constructor (options: any) {
        super();
    }

    /**
     * start - starts the device.
     *
     */
    public async start (): Promise<any> {
        this.isDestroyed = false;
    }

    /**
    * stop - stops the sensor.
    *
    */
    public stop (): void {
        this.isDestroyed = true;
    }

    /**
     * initDevice - initializes the device, sets initial state.
     *
     */
    public async initDevice (): Promise<any> {
        // Init the default state
        this.setState(this.state);

        this.state.initialized = false;

        this.config = this.configuration;

        if (!this.config) {
            throw new ApiError('initDevice - Configuration is not defined!');
        }

        this.logger = this.createLogger();
    }

    /**
     * setState - sets a new device state.
     *
     * @param  {any} state - object this new state
     * @return {void}
     */
    public setState (state: any): void {
        this.state = _.isObjectLike(state) ? _.cloneDeep(state) : {};
    }

    /**
     * getState - returns the device state.
     *
     * @return {any}
     */
    public getState (): any {
        return this.state;
    }

    /**
     * createLogger - returns the device state.
     *
     * @return {any}
     */
    public createLogger (): Logger {
        return {
            logDebug: (message) => this.logDebug.bind(this)(message),
            logError: (message) => this.logError.bind(this)(message),
            logInfo: (message) => this.logInfo.bind(this)(message),
        };
    }
}
