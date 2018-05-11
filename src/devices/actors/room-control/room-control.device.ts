import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

import * as Entities from '../../../core/entities';

import * as Errors from '../../../core/errors';

import { store } from '../../../redux';

export class RoomControlActorDevice extends ActorDevice {
    public readonly className: string = 'RoomControlActorDevice';
    public state: Interfaces.Actor.RoomControl.State;
    public config: Interfaces.Actor.RoomControl.Config;

    public setpointFeedbackObjectId: BACnet.Types.BACnetObjectId;
    public temperatureObjectId: BACnet.Types.BACnetObjectId;
    public setpointModificationObjectId: BACnet.Types.BACnetObjectId;

    public async initDevice (): Promise<any> {
        await super.initDevice();

        // Creates and inits params of the BACnet Analog Input
        this.initDeviceParamsFromConfig();

        // Creates instances of the plugin componets
        await this.createPluginComponents();

        // Creates `subscribtion` to the BACnet object properties
        this.subscribeToProperty();

        // Inits the BACnet object properties
        this.initProperties();

        this.state.initialized = true;
        this.publishStateChange();
    }

    /**
     * Creates and inits params of the BACnet Analog Input from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initDeviceParamsFromConfig (): void {
        this.setpointFeedbackObjectId = this.getBACnetObjectId(
            this.config.setpointFeedbackObjectId,
            this.config.setpointFeedbackObjectType,
        );

        this.temperatureObjectId = this.getBACnetObjectId(
            this.config.temperatureObjectId,
            this.config.temperatureObjectType,
        );

        this.setpointModificationObjectId = this.getBACnetObjectId(
            this.config.setpointModificationObjectId,
            this.config.setpointModificationObjectType,
        );
    }

    /**
     * Creates `subscribtion` to the BACnet object properties.
     *
     * @return {void}
     */
    public subscribeToProperty (): void {
        // Read `Position` Property Flow
        this.subManager.subscribe = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification))
            .filter(this.flowManager.isBACnetObject(this.setpointFeedbackObjectId))
            .subscribe((resp) => {
                this.logger.logDebug(`RoomControlActorDevice - subscribeToProperty: `
                    + `Received notification`);

                const respServiceData: BACnet.Interfaces.UnconfirmedRequest.Read.COVNotification =
                    _.get(resp, 'layer.apdu.service', null);

                // Get list of properties
                const covProps = respServiceData.listOfValues;

                // Get instances of properties
                const presentValueProp = _.find(covProps, [ 'id', BACnet.Enums.PropertyId.presentValue ]);
                // Get instances of property values
                const presentValue = presentValueProp.values[0] as BACnet.Types.BACnetReal;

                this.state.setpoint = presentValue.value;

                this.logger.logDebug(`RoomControlActorDevice - subscribeToProperty: `
                    + `Setpoint ${JSON.stringify(this.state.setpoint)}`);
                this.logger.logDebug(`RoomControlActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`RoomControlActorDevice - subscribeToProperty: `
                    + `Setpoint COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read `Rotation` Property Flow
        this.subManager.subscribe = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification))
            .filter(this.flowManager.isBACnetObject(this.temperatureObjectId))
            .subscribe((resp) => {
                this.logger.logDebug(`RoomControlActorDevice - subscribeToProperty: `
                    + `Received notification`);

                const respServiceData: BACnet.Interfaces.UnconfirmedRequest.Read.COVNotification =
                    _.get(resp, 'layer.apdu.service', null);

                // Get list of properties
                const covProps = respServiceData.listOfValues;

                // Get instances of properties
                const presentValueProp = _.find(covProps, [ 'id', BACnet.Enums.PropertyId.presentValue ]);
                // Get instances of property values
                const presentValue = presentValueProp.values[0] as BACnet.Types.BACnetReal;

                this.state.temperature = presentValue.value;

                this.logger.logDebug(`RoomControlActorDevice - subscribeToProperty: `
                    + `Temperature ${JSON.stringify(this.state.temperature)}`);
                this.logger.logDebug(`RoomControlActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`RoomControlActorDevice - subscribeToProperty: `
                    + `Temperature COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read Property Flow
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty));

        // Gets the `presentValue` (setpoint) property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetObject(this.setpointFeedbackObjectId))
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.presentValue))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetReal>(resp);

                this.state.setpoint = bacnetProperty.value;

                this.logger.logDebug(`MultiStateActorDevice - subscribeToProperty: `
                    + `Setpoint: ${this.state.setpoint}`);
                this.publishStateChange();
            });

        // Gets the `presentValue` (temperature) property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetObject(this.temperatureObjectId))
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.presentValue))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetReal>(resp);

                this.state.temperature = bacnetProperty.value;

                this.logger.logDebug(`MultiStateActorDevice - subscribeToProperty: `
                    + `Temperature: ${this.state.setpoint}`);
                this.publishStateChange();
            });
    }

    /**
     * Inits the BACnet object properties.
     *
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
        // Gets the `presentValue|statusFlags` property for `setpoint`
        this.sendSubscribeCOV(this.setpointFeedbackObjectId);

        // Gets the `presentValue|statusFlags` property for `temperature`
        this.sendSubscribeCOV(this.temperatureObjectId);
    }

    /**
     * Inits the BACnet object properties.
     *
     * @return {Promise<void>}
     */
    public setSetpointModification (newSetpoint: number): Bluebird<void> {
        this.logger.logDebug('RoomControlActorDevice - setSetpointModification: '
            + `Setting setpoint modification: ${newSetpoint}`);

        // Gets the `presentValue|statusFlags` property for `setpoint`
        this.sendWriteProperty(this.setpointModificationObjectId, BACnet.Enums.PropertyId.presentValue,
            [ new BACnet.Types.BACnetReal(newSetpoint) ]);

        return Bluebird.resolve();
    }

    /**
     * Sends the `readProperty` request to get the value of the `presentValue` property.
     *
     * @return {Bluebird<void>}
     */
    public update (): Bluebird<void> {
        this.logger.logDebug('RoomControlActorDevice - update: '
            + `Called update()`);

        this.sendReadProperty(this.setpointFeedbackObjectId, BACnet.Enums.PropertyId.presentValue);

        this.sendReadProperty(this.temperatureObjectId, BACnet.Enums.PropertyId.presentValue);

        return Bluebird.resolve();
    }

    /**
     * Increments the `setpoint` value.
     *
     * @return {Bluebird<void>}
     */
    public incrementSetpoint (): Bluebird<void> {
        this.logger.logDebug('RoomControlActorDevice - incrementSetpoint: '
            + `Increments the setpoint value...`);

        return this.setSetpointModification(1);
    }

    /**
     * Decrements the `setpoint` value.
     *
     * @return {Bluebird<void>}
     */
    public decrementSetpoint (presentValue: any): Bluebird<void> {
        this.logger.logDebug('RoomControlActorDevice - decrementSetpoint: '
            + `Decrements the setpoint value...`);

        return this.setSetpointModification(-1);
    }
}
