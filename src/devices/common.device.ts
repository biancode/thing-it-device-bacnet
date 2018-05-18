import { Subscription } from 'rxjs';

import * as _ from 'lodash';

import * as Errors from '../core/errors';

import { DeviceBase } from '../core/bases/device.base';

import * as Managers from '../core/managers';

import { APIService } from '../core/services';

import { Logger } from '../core/utils';

import * as Entities from '../core/entities';

import * as Interfaces from '../core/interfaces';

import * as BACnet from 'bacnet-logic';

import { store } from '../redux';

export class CommonDevice extends DeviceBase {
    public state: Interfaces.CommonDevice.State;
    public config: Interfaces.CommonDevice.Config;

    public isDestroyed: boolean;
    public logger: Logger;

    public covObjectIds: BACnet.Types.BACnetObjectId[];
    public subManager: Managers.SubscriptionManager;

    public flowManager: Managers.BACnetFlowManager;
    public serviceManager: Managers.BACnetServiceManager;
    public apiService: APIService;

    constructor (options: any) {
        super();
    }

    /**
     * start - starts the device.
     *
     */
    public async start (): Promise<any> {
        this.isDestroyed = false;

        this.covObjectIds = [];

        this.subManager = new Managers.SubscriptionManager();
        await this.subManager.initManager();
    }

    /**
    * stop - stops the sensor.
    *
    */
    public async stop (): Promise<void> {
        this.isDestroyed = true;

        // Sends the `unsubscribeCOV` request to the BACnet Device
        _.map(this.covObjectIds, (objectId) => {
            this.apiService.confirmedReq.unsubscribeCOV({
                invokeId: 1,
                objId: objectId,
                subProcessId: new BACnet.Types
                    .BACnetUnsignedInteger(0),
            });
        });

        this.subManager.destroy();
        this.subManager = null;
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
            throw new Errors.APIError('initDevice - Configuration is not defined!');
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
     * BACnet HELPERs
     */

    /**
     * Extracts the `presentValue` and `statusFlags` of the BACnet Object from
     * the BACnet `COVNotification` service.
     *
     * @template T {extends BACnet.Types.BACnetTypeBase}
     * @param  {IBACnetResponse} resp - response from BACnet Object (device)
     * @return {[T,BACnet.Types.BACnetStatusFlags]}
     */
    public getCOVNotificationValues <T extends BACnet.Types.BACnetTypeBase> (
            resp: Interfaces.FlowManager.Response): Interfaces.BACnet.COVNotificationResponse<T> {
        this.logger.logDebug(`CommonDevice - getCOVNotificationValues: `
            + `Received notification`);

        const respServiceData: BACnet.Interfaces.UnconfirmedRequest.Read.COVNotification =
            _.get(resp, 'layer.apdu.service', null);

        // Get list of properties
        const covProps = respServiceData.listOfValues;

        // Get instances of properties
        const presentValueProp = BACnet.Helpers.Layer.findPropById(covProps,
            BACnet.Enums.PropertyId.presentValue);
        const statusFlagsProp = BACnet.Helpers.Layer.findPropById(covProps,
            BACnet.Enums.PropertyId.statusFlags);

        // Get instances of property values
        const presentValue = presentValueProp.values[0] as T;
        const statusFlags = statusFlagsProp.values[0] as BACnet.Types.BACnetStatusFlags;

        return { presentValue, statusFlags };
    }

    /**
     * Returns the BACnet Object Identifier.
     *
     * @param  {string|number} objectType - instance of the BACnet object
     * @param  {string|BACnet.Enums.ObjectType} objectType - type of the BACnet object
     * @return {BACnet.Types.BACnetObjectId}
     */
    public getBACnetObjectId (objectId: string|number, objectType?: string|BACnet.Enums.ObjectType,
            defObjectType?: BACnet.Enums.ObjectType): BACnet.Types.BACnetObjectId {
        const bacnetObjectId = +objectId;

        if ((_.isString(objectId) && objectId === '') || !_.isFinite(bacnetObjectId)) {
            throw new Errors.APIError(`CommonDevice - getObjectId: `
                + `Object ID must have the valid 'number' value. Current value: ${objectId}`);
        }

        let bacnetObjectType: BACnet.Enums.ObjectType;
        if (_.isNumber(objectType)) {
            bacnetObjectType = objectType;
        } else {
            bacnetObjectType = !_.isNil(objectType) && objectType !== ''
                ? BACnet.Enums.ObjectType[objectType]
                : defObjectType;
        }

        if (!_.isNumber(bacnetObjectType)) {
            throw new Errors.APIError(`CommonDevice - getObjectId: `
                + `Object Type must have the valid BACnet type. Current type: ${objectType}`);
        }

        return new BACnet.Types.BACnetObjectId({
            type: bacnetObjectType,
            instance: bacnetObjectId,
        });
    }

    /**
     * Sends the `WriteProperty` confirmed request.
     *
     * @param  {BACnet.Types.BACnetObjectId} objectId - BACnet object identifier
     * @param  {BACnet.Enums.PropertyId} propId - BACnet property identifier
     * @param  {BACnet.Types.BACnetTypeBase[]} values - BACnet property values
     * @return {void}
     */
    public sendWriteProperty (objectId: BACnet.Types.BACnetObjectId,
            propId: BACnet.Enums.PropertyId, values: BACnet.Types.BACnetTypeBase[]): void {
        this.apiService.confirmedReq.writeProperty({
            invokeId: 1,
            objId: objectId,
            prop: {
                id: new BACnet.Types
                    .BACnetEnumerated(propId),
                values: values,
            },
        });
    }

    /**
     * Sends the `ReadProperty` confirmed request.
     *
     * @param  {BACnet.Types.BACnetObjectId} objectId - BACnet object identifier
     * @param  {BACnet.Enums.PropertyId} propId - BACnet property identifier
     * @return {void}
     */
    public sendReadProperty (objectId: BACnet.Types.BACnetObjectId,
            propId: BACnet.Enums.PropertyId): void {
        this.apiService.confirmedReq.readProperty({
            invokeId: 1,
            objId: objectId,
            prop: {
                id: new BACnet.Types.BACnetEnumerated(propId),
            },
        });
    }

    /**
     * Sends the `SubscribeCOV` confirmed request.
     *
     * @param  {BACnet.Types.BACnetObjectId} objectId - BACnet object identifier
     * @return {void}
     */
    public sendSubscribeCOV (objectId: BACnet.Types.BACnetObjectId): void {
        this.subManager.subscribe = store.select([ 'bacnet', 'covTimer' ])
            .subscribe((covTimer: Entities.COVTimer) => {
                this.apiService.confirmedReq.subscribeCOV({
                    invokeId: 1,
                    objId: objectId,
                    subProcessId: new BACnet.Types
                        .BACnetUnsignedInteger(0),
                    issConfNotif: new BACnet.Types
                        .BACnetBoolean(!!BACnet.Enums.COVNotificationType.Unconfirmed),
                    lifetime: new BACnet.Types
                        .BACnetUnsignedInteger(covTimer.config.lifetime),
                });
            });

        this.covObjectIds.push(objectId);
    }
}
