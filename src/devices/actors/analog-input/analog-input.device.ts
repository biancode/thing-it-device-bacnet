import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import {
    IAnalogInputActorState,
    IAnalogInputActorConfig,
} from '../../../core/interfaces';

import {
    BACnetFlowManager,
    BACnetServiceManager,
} from '../../../core/managers';

import {
    ApiError,
} from '../../../core/errors';

import { store } from '../../../redux';

import {
    BACnetObjectType,
    BACnetPropertyId,
    BACnetServiceTypes,
    BACnetUnconfirmedService,
    BACnetConfirmedService,
} from '../../../core/bacnet/enums';

import * as BACnetTypes from '../../../core/bacnet/types';

export class AnalogInputActorDevice extends ActorDevice {
    public readonly className: string = 'AnalogInputActorDevice';
    public state: IAnalogInputActorState;
    public config: IAnalogInputActorConfig;

    public flowManager: BACnetFlowManager;
    public serviceManager: BACnetServiceManager;

    private objectId: BACnetTypes.BACnetObjectId;

    public async initDevice (): Promise<any> {
        await super.initDevice();

        this.initDeviceParamsFromConfig();

        this.flowManager = store.getState([ 'bacnet', 'flowManager' ]);
        this.serviceManager = store.getState([ 'bacnet', 'serviceManager' ]);

        this.subscribeToProperty();

        this.state.initialized = true;
        this.publishStateChange();
    }

    /**
     * Step 1. Creates and inits params of the BACnet Analog Input from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initDeviceParamsFromConfig (): void {
        const objectId = +this.config.objectId;

        if (this.config.objectId === '' || !_.isFinite(objectId)) {
            throw new ApiError(`AnalogInputActorDevice - initDeviceParamsFromConfig: `
                + `Object ID must have the valid 'number'`);
        }

        const objectType = this.config.objectType !== ''
            ? BACnetObjectType[this.config.objectType]
            : BACnetObjectType.AnalogInput;

        if (!_.isNumber(objectType)) {
            throw new ApiError(`AnalogInputActorDevice - initDeviceParamsFromConfig: `
                + `Object Type must have the valid BACnet type`);
        }

        this.objectId = new BACnetTypes.BACnetObjectId({
            type: objectType,
            instance: objectId,
        });
    }

    /**
     * Step 6. Creates `subscribtion` to the BACnet device properties.
     *
     * @return {void}
     */
    public subscribeToProperty (): void {
        const covNotification = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnetServiceTypes.UnconfirmedReqPDU))
            .filter(this.flowManager.isServiceChoice(BACnetUnconfirmedService.covNotification))
            .filter(this.flowManager.isBACnetObject(this.objectId))
            .subscribe(() => {
                // this.logger.logDebug('BACnetDeviceControllerDevice - subscribeToProperty: '
                //     + `Device properties were received`);
                // this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                //     + `BACnet Device details: ${JSON.stringify(this.state)}`);
                // this.publishStateChange();
            }, (error) => {
                // this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                //     + `Device properties were not received`);
                // this.publishStateChange();
            });
    }

    /**
     * TID API Methods
     */

    /**
     * Service Stub
     */
    public update (): Bluebird<void> {
        return Bluebird.resolve();
    }
}
