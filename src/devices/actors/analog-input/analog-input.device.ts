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

import { ILayerUnconfirmedReqServiceCOVNotification } from '../../../core/bacnet/interfaces';

import * as Enums from '../../../core/bacnet/enums';

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
                + `Object ID must have the valid 'number' value`);
        }

        const objectType = this.config.objectType !== ''
            ? Enums.BACnetObjectType[this.config.objectType]
            : Enums.BACnetObjectType.AnalogInput;

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
     * Creates `subscribtion` to the BACnet object properties.
     *
     * @return {void}
     */
    public subscribeToProperty (): void {
        const covNotification = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(Enums.BACnetServiceTypes.UnconfirmedReqPDU))
            .filter(this.flowManager.isServiceChoice(Enums.BACnetUnconfirmedService.covNotification))
            .filter(this.flowManager.isBACnetObject(this.objectId))
            .subscribe((resp) => {
                this.logDebug(`AnalogInputActorDevice - initDeviceParamsFromConfig: `
                    + `Received notification`);

                const respServiceData: ILayerUnconfirmedReqServiceCOVNotification =
                    _.get(resp, 'layer.apdu.service', null);

                const covProps = respServiceData.listOfValues;

                const presentValueProp = _.find(covProps, [ 'id', Enums.BACnetPropertyId.presentValue ]);
                const statusFlagsProp = _.find(covProps, [ 'id', Enums.BACnetPropertyId.statusFlags ]);
                const presentValue = presentValueProp.values[0] as BACnetTypes.BACnetEnumerated;
                const statusFlags = presentValueProp.values[0] as BACnetTypes.BACnetStatusFlags;

                this.state.presentValue = presentValue.value;
                this.state.outOfService = statusFlags.value.outOfService;

                this.logDebug(`AnalogInputActorDevice - initDeviceParamsFromConfig: `
                    + `presentValue ${JSON.stringify(this.state.presentValue)}`);
                this.logDebug(`AnalogInputActorDevice - initDeviceParamsFromConfig: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`AnalogInputActorDevice - initDeviceParamsFromConfig: `
                    + `Analog Input COV notification was not received ${error}`);
                this.publishStateChange();
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
