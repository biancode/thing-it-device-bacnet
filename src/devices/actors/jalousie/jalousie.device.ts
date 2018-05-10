import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

import * as Entities from '../../../core/entities';

import * as Errors from '../../../core/errors';

import { store } from '../../../redux';

export class JalousieActorDevice extends ActorDevice {
    public readonly className: string = 'JalousieActorDevice';
    public state: Interfaces.Actor.Jalousie.State;
    public config: Interfaces.Actor.Jalousie.Config;

    public positionFeedbackObjectId: BACnet.Types.BACnetObjectId;
    public positionModificationObjectId: BACnet.Types.BACnetObjectId;
    public rotationFeedbackObjectId: BACnet.Types.BACnetObjectId;
    public rotationModificationObjectId: BACnet.Types.BACnetObjectId;
    public actionObjectId: BACnet.Types.BACnetObjectId;

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
        this.positionFeedbackObjectId = this.getBACnetObjectId(
            this.config.positionFeedbackObjectId,
            this.config.positionFeedbackObjectType,
        );

        this.positionModificationObjectId = this.getBACnetObjectId(
            this.config.positionModificationObjectId,
            this.config.positionModificationObjectType,
        );

        this.rotationFeedbackObjectId = this.getBACnetObjectId(
            this.config.rotationFeedbackObjectId,
            this.config.rotationFeedbackObjectType,
        );

        this.rotationModificationObjectId = this.getBACnetObjectId(
            this.config.rotationModificationObjectId,
            this.config.rotationModificationObjectType,
        );

        this.actionObjectId = this.getBACnetObjectId(
            this.config.actionObjectId,
            this.config.actionObjectType,
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
            .filter(this.flowManager.isBACnetObject(this.positionFeedbackObjectId))
            .subscribe((resp) => {
                this.logger.logDebug(`JalousieActorDevice - subscribeToProperty: `
                    + `Received notification`);

                const respServiceData: BACnet.Interfaces.UnconfirmedRequest.Read.COVNotification =
                    _.get(resp, 'layer.apdu.service', null);

                // Get list of properties
                const covProps = respServiceData.listOfValues;

                // Get instances of properties
                const presentValueProp = _.find(covProps, [ 'id', BACnet.Enums.PropertyId.presentValue ]);
                // Get instances of property values
                const presentValue = presentValueProp.values[0] as BACnet.Types.BACnetReal;

                this.state.position = presentValue.value;

                this.logger.logDebug(`JalousieActorDevice - subscribeToProperty: `
                    + `Position ${JSON.stringify(this.state.position)}`);
                this.logger.logDebug(`JalousieActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`JalousieActorDevice - subscribeToProperty: `
                    + `Position COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read `Rotation` Property Flow
        this.subManager.subscribe = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification))
            .filter(this.flowManager.isBACnetObject(this.rotationFeedbackObjectId))
            .subscribe((resp) => {
                this.logger.logDebug(`JalousieActorDevice - subscribeToProperty: `
                    + `Received notification`);

                const respServiceData: BACnet.Interfaces.UnconfirmedRequest.Read.COVNotification =
                    _.get(resp, 'layer.apdu.service', null);

                // Get list of properties
                const covProps = respServiceData.listOfValues;

                // Get instances of properties
                const presentValueProp = _.find(covProps, [ 'id', BACnet.Enums.PropertyId.presentValue ]);
                // Get instances of property values
                const presentValue = presentValueProp.values[0] as BACnet.Types.BACnetReal;

                this.state.rotation = presentValue.value;

                this.logger.logDebug(`JalousieActorDevice - subscribeToProperty: `
                    + `Rotation ${JSON.stringify(this.state.rotation)}`);
                this.logger.logDebug(`JalousieActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`JalousieActorDevice - subscribeToProperty: `
                    + `Rotation COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read Property Flow
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty));

        // Gets the `presentValue` (position) property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetObject(this.positionModificationObjectId))
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.presentValue))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetReal>(resp);
                this.logger.logDebug(`JalousieActorDevice - subscribeToProperty: `
                    + `Modified Position: ${bacnetProperty.value}`);
            });

        // Gets the `presentValue` (rotation) property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetObject(this.rotationModificationObjectId))
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.presentValue))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetReal>(resp);
                this.logger.logDebug(`JalousieActorDevice - subscribeToProperty: `
                    + `Modified Rotation: ${bacnetProperty.value}`);
            });

        // Gets the `presentValue` (action) property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetObject(this.rotationModificationObjectId))
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.presentValue))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetReal>(resp);
                this.logger.logDebug(`JalousieActorDevice - subscribeToProperty: `
                    + `Modified Action: ${bacnetProperty.value}`);
            });
    }

    /**
     * Inits the BACnet object properties.
     *
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
        // Gets the `presentValue|statusFlags` property for `position`
        this.sendSubscribeCOV(this.positionFeedbackObjectId);

        // Gets the `presentValue|statusFlags` property for `rotation`
        this.sendSubscribeCOV(this.rotationFeedbackObjectId);
    }

    /**
     * Sends the `writeProperty` request to set the value of the `presentValue` property.
     *
     * @param  {number} presentValue - value of the `presentValue` property.
     * @return {Bluebird<void>}
     */
    public setModification (position: number, rotation: number): Bluebird<void> {
        this.logger.logDebug('JalousieActorDevice - setModification: '
            + `Modifying position (${position}) and rotation (${rotation})`);

        this.sendWriteProperty(this.positionModificationObjectId, BACnet.Enums.PropertyId.presentValue,
            [ new BACnet.Types.BACnetReal(position) ]);

        this.sendWriteProperty(this.rotationModificationObjectId, BACnet.Enums.PropertyId.presentValue,
            [ new BACnet.Types.BACnetReal(rotation) ]);

        this.sendWriteProperty(this.actionObjectId, BACnet.Enums.PropertyId.presentValue,
            [ new BACnet.Types.BACnetUnsignedInteger(this.config.actionGoValue) ]);
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public raisePosition (): Bluebird<void> {
        const targetPosition = this.state.position - this.config.positionStepSize;
        this.logDebug('JalousieActorDevice - raisePosition: '
            + `Target Position ${targetPosition}`);

        this.setModification(targetPosition, this.config.rotationUpValue);
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public lowerPosition (): Bluebird<void> {
        const targetPosition = this.state.position + this.config.positionStepSize;
        this.logDebug('JalousieActorDevice - lowerPosition: '
            + `Target Position ${targetPosition}`);

        this.setModification(targetPosition, this.config.rotationDownValue);
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public positionUp (): Bluebird<void> {
        this.logDebug('JalousieActorDevice - positionUp: '
            + `Called positionUp()`);

        this.setModification(0, this.config.rotationUpValue);
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public positionDown (): Bluebird<void> {
        this.logDebug('JalousieActorDevice - positionDown: '
            + `Called positionUp()`);

        this.setModification(100, this.config.rotationDownValue);
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public incrementRotation (): Bluebird<void> {
        const targetRotation = this.state.rotation + this.config.rotationStepSize;
        this.logDebug('JalousieActorDevice - incrementRotation: '
            + `Target Rotation ${targetRotation}`);

        this.setModification(this.state.position, targetRotation);
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public decrementRotation (): Bluebird<void> {
        const targetRotation = this.state.rotation - this.config.rotationStepSize;
        this.logDebug('JalousieActorDevice - decrementRotation: '
            + `Target Rotation ${targetRotation}`);

        this.setModification(this.state.position, targetRotation);
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public stopMotion (): Bluebird<void> {
        this.sendWriteProperty(this.actionObjectId, BACnet.Enums.PropertyId.presentValue,
            [ new BACnet.Types.BACnetUnsignedInteger(this.config.actionStopValue) ]);
        return Bluebird.resolve();
    }
}
