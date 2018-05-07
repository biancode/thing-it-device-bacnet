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

import * as BACnet from 'bacnet-logic';

export class AnalogInputActorDevice extends ActorDevice {
    public readonly className: string = 'AnalogInputActorDevice';
    public state: IAnalogInputActorState;
    public config: IAnalogInputActorConfig;

    public flowManager: BACnetFlowManager;
    public serviceManager: BACnetServiceManager;

    private objectId: BACnet.Types.BACnetObjectId;

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
            ? BACnet.Enums.ObjectType[this.config.objectType]
            : BACnet.Enums.ObjectType.AnalogInput;

        if (!_.isNumber(objectType)) {
            throw new ApiError(`AnalogInputActorDevice - initDeviceParamsFromConfig: `
                + `Object Type must have the valid BACnet type`);
        }

        this.objectId = new BACnet.Types.BACnetObjectId({
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
        // Read Property Flow
        this.subManager.subscribe = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification))
            .filter(this.flowManager.isBACnetObject(this.objectId))
            .subscribe((resp) => {
                this.logDebug(`AnalogInputActorDevice - subscribeToProperty: `
                    + `Received notification`);

                const respServiceData: BACnet.Interfaces.UnconfirmedRequest.Read.COVNotification =
                    _.get(resp, 'layer.apdu.service', null);

                // Get list of properties
                const covProps = respServiceData.listOfValues;

                // Get instances of properties
                const presentValueProp = _.find(covProps, [ 'id', BACnet.Enums.PropertyId.presentValue ]);
                const statusFlagsProp = _.find(covProps, [ 'id', BACnet.Enums.PropertyId.statusFlags ]);
                // Get instances of property values
                const presentValue = presentValueProp.values[0] as BACnet.Types.BACnetEnumerated;
                const statusFlags = presentValueProp.values[0] as BACnet.Types.BACnetStatusFlags;

                this.state.presentValue = presentValue.value;
                this.state.outOfService = statusFlags.value.outOfService;
                this.state.alarmValue = statusFlags.value.inAlarm;

                this.logDebug(`AnalogInputActorDevice - subscribeToProperty: `
                    + `presentValue ${JSON.stringify(this.state.presentValue)}`);
                this.logDebug(`AnalogInputActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`AnalogInputActorDevice - subscribeToProperty: `
                    + `Analog Input COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read Property Flow
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty))
            .filter(this.flowManager.isBACnetObject(this.objectId));

        // Gets the `maxPresValue` property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.maxPresValue))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetReal>(resp);

                this.state.max = bacnetProperty.value;

                this.logger.logDebug(`AnalogInputActorDevice - subscribeToProperty: `
                    + `Max value for 'Present Value' property retrieved: ${this.state.max}`);
            });

        // Gets the `minPresValue` property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.minPresValue))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetReal>(resp);

                this.state.min = bacnetProperty.value;

                this.logger.logDebug(`AnalogInputActorDevice - subscribeToProperty: `
                    + `Min value for 'Present Value' property retrieved: ${this.state.min}`);
            });

        // Gets the `objectName` property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.objectName))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetCharacterString>(resp);

                this.state.objectName = bacnetProperty.value;

                this.logger.logDebug(`AnalogInputActorDevice - subscribeToProperty: `
                    + `Object Name retrieved: ${this.state.objectName}`);
            });

        // Gets the `description` property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.description))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetCharacterString>(resp);

                this.state.description = bacnetProperty.value;

                this.logger.logDebug(`AnalogInputActorDevice - subscribeToProperty: `
                    + `Object Description retrieved: ${this.state.description}`);
            });

        // Gets the `units` property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.units))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetEnumerated>(resp);

                const unit: string = BACnet.Enums.EngineeringUnits[bacnetProperty.value];
                this.state.unit = _.isNil(unit) ? 'none' : unit;

                this.logger.logDebug(`AnalogInputActorDevice - subscribeToProperty: `
                    + `Object Unit retrieved: ${this.state.unit}`);
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
