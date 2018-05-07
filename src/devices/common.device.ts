import { Subscription } from 'rxjs';

import * as _ from 'lodash';

import { ApiError } from '../core/errors';

import { DeviceBase } from '../core/bases/device.base';
import { SubscriptionManager } from '../core/managers';

import { Logger } from '../core/utils';
import { ICommonState, ICommonConfig, IBACnetResponse } from '../core/interfaces';

import * as BACnet from 'bacnet-logic';

export class CommonDevice extends DeviceBase {
    public config: ICommonConfig;
    public state: ICommonState;
    public isDestroyed: boolean;
    public logger: Logger;
    public subManager: SubscriptionManager;

    constructor (options: any) {
        super();
    }

    /**
     * start - starts the device.
     *
     */
    public async start (): Promise<any> {
        this.isDestroyed = false;

        this.subManager = new SubscriptionManager();
        await this.subManager.initManager();
    }

    /**
    * stop - stops the sensor.
    *
    */
    public stop (): void {
        this.isDestroyed = true;

        this.subManager.destroy();
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

    /**
     * Extracts the value of the property from BACnet `ReadProperty` service.
     *
     * @template T {extends BACnet.Types.BACnetTypeBase}
     * @param  {IBACnetResponse} resp - response from BACnet Object (device)
     * @return {T}
     */
    public getReadPropertyValue <T extends BACnet.Types.BACnetTypeBase> (
            resp: IBACnetResponse): T {
        const respServiceData: BACnet.Interfaces.ComplexACK.Read.ReadProperty =
            _.get(resp, 'layer.apdu.service', null);

        const bacnetProperty = respServiceData.prop.values[0] as T;
        return bacnetProperty;
    }
}
