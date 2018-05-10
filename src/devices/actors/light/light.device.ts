import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

import * as Entities from '../../../core/entities';

import * as Errors from '../../../core/errors';

import { store } from '../../../redux';

export class LightActorDevice extends ActorDevice {
    public readonly className: string = 'LightActorDevice';
    public state: Interfaces.Actor.Light.State;
    public config: Interfaces.Actor.Light.Config;

    public levelFeedbackObjectId: BACnet.Types.BACnetObjectId;
    public levelModificationObjectId: BACnet.Types.BACnetObjectId;
    public lightActiveFeedbackObjectId: BACnet.Types.BACnetObjectId;
    public lightActiveModificationObjectId: BACnet.Types.BACnetObjectId;

    public lightStates: BACnet.Types.BACnetCharacterString[];

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
        this.levelFeedbackObjectId = this.getBACnetObjectId(
            this.config.levelFeedbackObjectId,
            this.config.levelFeedbackObjectType,
        );

        this.levelModificationObjectId = this.getBACnetObjectId(
            this.config.levelModificationObjectId,
            this.config.levelModificationObjectType,
        );

        this.lightActiveFeedbackObjectId = this.getBACnetObjectId(
            this.config.lightActiveFeedbackObjectId,
            this.config.lightActiveFeedbackObjectType,
        );

        this.lightActiveModificationObjectId = this.getBACnetObjectId(
            this.config.lightActiveModificationObjectId,
            this.config.lightActiveModificationObjectType,
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
            .filter(this.flowManager.isBACnetObject(this.levelFeedbackObjectId))
            .subscribe((resp) => {
                this.logger.logDebug(`LightActorDevice - subscribeToProperty: `
                    + `Received notification`);

                const respServiceData: BACnet.Interfaces.UnconfirmedRequest.Read.COVNotification =
                    _.get(resp, 'layer.apdu.service', null);

                // Get list of properties
                const covProps = respServiceData.listOfValues;

                // Get instances of properties
                const presentValueProp = _.find(covProps, [ 'id', BACnet.Enums.PropertyId.presentValue ]);
                // Get instances of property values
                const presentValue = presentValueProp.values[0] as BACnet.Types.BACnetReal;

                this.state.dimmerLevel = presentValue.value;

                this.logger.logDebug(`LightActorDevice - subscribeToProperty: `
                    + `Dimmer Level ${JSON.stringify(this.state.dimmerLevel)}`);
                this.logger.logDebug(`LightActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`LightActorDevice - subscribeToProperty: `
                    + `Dimmer Level COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read `Rotation` Property Flow
        this.subManager.subscribe = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification))
            .filter(this.flowManager.isBACnetObject(this.lightActiveFeedbackObjectId))
            .subscribe((resp) => {
                this.logger.logDebug(`LightActorDevice - subscribeToProperty: `
                    + `Received notification`);

                const respServiceData: BACnet.Interfaces.UnconfirmedRequest.Read.COVNotification =
                    _.get(resp, 'layer.apdu.service', null);

                // Get list of properties
                const covProps = respServiceData.listOfValues;

                // Get instances of properties
                const presentValueProp = _.find(covProps, [ 'id', BACnet.Enums.PropertyId.presentValue ]);
                // Get instances of property values
                const presentValue = presentValueProp.values[0] as BACnet.Types.BACnetUnsignedInteger;
                this.setLightActive(presentValue);

                this.logger.logDebug(`LightActorDevice - subscribeToProperty: `
                    + `Light Active ${JSON.stringify(this.state.lightActive)}`);
                this.logger.logDebug(`LightActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`LightActorDevice - subscribeToProperty: `
                    + `Light Active COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read Property Flow
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty));

        // Gets the `stateText` (light states) property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetObject(this.lightActiveFeedbackObjectId))
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.stateText))
            .subscribe((resp) => {
                const respServiceData: BACnet.Interfaces.ComplexACK.Read.ReadProperty =
                    _.get(resp, 'layer.apdu.service', null);

                this.lightStates = respServiceData.prop.values as BACnet.Types.BACnetCharacterString[];

                this.publishStateChange();
                this.logger.logDebug(`LightActorDevice - subscribeToProperty: `
                    + `Light States: ${JSON.stringify(this.lightStates)}`);

                this.sendSubscribeCOV(this.lightActiveFeedbackObjectId);
            });

        // Gets the `presentValue` (light mode) property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetObject(this.lightActiveFeedbackObjectId))
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.presentValue))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetUnsignedInteger>(resp);

                this.setLightActive(bacnetProperty);

                this.publishStateChange();
                this.logger.logDebug(`LightActorDevice - subscribeToProperty: `
                    + `Light Active: ${this.state.lightActive}`);
            });

        // Gets the `presentValue` (dimmer level) property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetObject(this.levelFeedbackObjectId))
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.presentValue))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetReal>(resp);

                this.state.dimmerLevel = bacnetProperty.value;

                this.publishStateChange();
                this.logger.logDebug(`LightActorDevice - subscribeToProperty: `
                    + `Dimmer Level: ${this.state.dimmerLevel}`);
            });
    }

    /**
     * Inits the BACnet object properties.
     *
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
        // Gets the `StateText` property for `light state`
        this.sendReadProperty(this.lightActiveFeedbackObjectId, BACnet.Enums.PropertyId.stateText);

        // Gets the `presentValue|statusFlags` property for `dimmer level`
        this.sendSubscribeCOV(this.levelFeedbackObjectId);
    }

    /**
     * Sends the `writeProperty` request to set the Dimmer Level (`presentValue` property).
     *
     * @param  {number} dimmerLevel - dimmer level
     * @return {Bluebird<void>}
     */
    public setDimmerLevelModification (dimmerLevel: number): Bluebird<void> {
        this.logger.logDebug('LightActorDevice - setDimmerLevelModification: '
            + `Setting dimmer level modification ${dimmerLevel}`);

        this.sendWriteProperty(this.levelModificationObjectId, BACnet.Enums.PropertyId.presentValue,
            [ new BACnet.Types.BACnetReal(dimmerLevel) ]);

        return Bluebird.resolve();
    }

    /**
     * Sends the `writeProperty` request to set the Light Mode (`presentValue` property).
     *
     * @param  {number} lightMode - light mode
     * @return {Bluebird<void>}
     */
    public setLightActiveModification (lightMode: number): Bluebird<void> {
        this.logger.logDebug('LightActorDevice - setLightActiveModification: '
            + `Setting dimmer level modification ${lightMode}`);

        this.sendWriteProperty(this.lightActiveModificationObjectId, BACnet.Enums.PropertyId.presentValue,
            [ new BACnet.Types.BACnetUnsignedInteger(lightMode) ]);

        return Bluebird.resolve();
    }

    /**
     * Toggles the light mode.
     *
     * @return {Bluebird<void>}
     */
    public toggleLight (): Bluebird<void> {
        const lightModification = this.state.lightActive
            ? this.configuration.lightActiveModificationValueOff
            : this.configuration.lightActiveModificationValueOn;

        this.logger.logDebug('LightActorDevice - toggleLight: '
            + `Toggle light mode to the ${lightModification}`);

        this.setLightActiveModification(lightModification);
        return Bluebird.resolve();
    }

    /**
     * Changes the Dimmer Level.
     *
     * @param {{value:number}} param - light params
     * @return {Bluebird<void>}
     */
    public changeDimmer (param: { value: number }): Bluebird<void> {
        const paramValue: number = _.get(param, 'value', null);

        this.logger.logDebug('LightActorDevice - changeDimmer: '
            + `Dimmer Level: ${paramValue}`);

        if (!_.isNil(paramValue)) {
            throw new Errors.ApiError('LightActorDevice - changeDimmer: No value provided to change!');
        }

        this.setDimmerLevelModification(paramValue);

        return Bluebird.resolve();
    }

    /**
     * Sends the `readProperty` request to get new `presentValue` properties of the
     * Dimmer Level and Light Mode.
     *
     * @return {Bluebird<void>}
     */
    public update (): Bluebird<void> {
        this.logger.logDebug(`LightActorDevice - update: Updating...`);

        this.sendReadProperty(this.levelFeedbackObjectId, BACnet.Enums.PropertyId.presentValue);
        this.sendReadProperty(this.lightActiveFeedbackObjectId, BACnet.Enums.PropertyId.presentValue);

        return Bluebird.resolve();
    }

    /**
     * HELPERs
     */

    /**
     * Sets the `lightActive` state.
     *
     * @param  {BACnet.Types.BACnetUnsignedInteger} presentValue - BACnet present value
     * @return {void}
     */
    public setLightActive (presentValue: BACnet.Types.BACnetUnsignedInteger): void {
        const lightStateIndex = presentValue.value - 1;
        const lightStateProp = this.lightStates[lightStateIndex];

        this.state.lightState = lightStateProp.value;

        switch (this.state.lightState) {
            case 'ON':
                this.state.lightActive = true;
                break;
            case 'OFF':
                this.state.lightActive = false;
                break;
            default:
                this.state.lightActive = false;
                break;
        }
    }
}
