import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'tid-bacnet-logic';

import * as RxOp from 'rxjs/operators';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

import * as Entities from '../../../core/entities';

import * as Helpers from '../../../core/helpers';

import * as Errors from '../../../core/errors';

export class LightActorDevice extends ActorDevice {
    public readonly className: string = 'LightActorDevice';
    public state: Interfaces.Actor.Light.State;
    public config: Interfaces.Actor.Light.Config;

    public levelFeedbackObjectId: BACnet.Types.BACnetObjectId;
    public levelModificationObjectId: BACnet.Types.BACnetObjectId;
    public lightActiveFeedbackObjectId: BACnet.Types.BACnetObjectId;
    public lightActiveModificationObjectId: BACnet.Types.BACnetObjectId;

    public stateText: string[];

    /**
     * Creates and inits params of the BACnet Analog Input from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initParamsFromConfig (): void {
        this.levelFeedbackObjectId = Helpers.BACnet.getBACnetObjectId(
            this.config.levelFeedbackObjectId,
            this.config.levelFeedbackObjectType,
        );

        this.levelModificationObjectId = Helpers.BACnet.getBACnetObjectId(
            this.config.levelModificationObjectId,
            this.config.levelModificationObjectType,
        );

        this.lightActiveFeedbackObjectId = Helpers.BACnet.getBACnetObjectId(
            this.config.lightActiveFeedbackObjectId,
            this.config.lightActiveFeedbackObjectType,
        );

        this.lightActiveModificationObjectId = Helpers.BACnet.getBACnetObjectId(
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
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)),
                RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)),
                RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.levelFeedbackObjectId)),
            )
            .subscribe((resp) => {
                const bacnetProperties = this
                    .getCOVNotificationValues<BACnet.Types.BACnetReal>(resp);

                this.state.dimmerLevel = bacnetProperties.presentValue.value;

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
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)),
                RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)),
                RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.lightActiveFeedbackObjectId)),
            )
            .subscribe((resp) => {
                const bacnetProperties = this
                    .getCOVNotificationValues<BACnet.Types.BACnetUnsignedInteger>(resp);

                this.setLightActive(bacnetProperties.presentValue);

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
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)),
                RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)),
            );

        // Gets the `stateText` (light states) property
        this.subManager.subscribe = readPropertyFlow
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.lightActiveFeedbackObjectId)),
                RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.stateText)),
            )
            .subscribe((resp) => {
                const bacnetProperties = BACnet.Helpers.Layer
                    .getPropertyValues<BACnet.Types.BACnetCharacterString>(resp.layer);

                this.stateText = _.map(bacnetProperties, (stateTextItem) => {
                    return stateTextItem.value;
                });

                this.publishStateChange();
                this.logger.logDebug(`LightActorDevice - subscribeToProperty: `
                    + `Light States: ${JSON.stringify(this.stateText)}`);

                this.sendSubscribeCOV(this.lightActiveFeedbackObjectId);
            });

        // Gets the `presentValue` (light mode) property
        this.subManager.subscribe = readPropertyFlow
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.lightActiveFeedbackObjectId)),
                RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)),
            )
            .subscribe((resp) => {
                const bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue<BACnet.Types.BACnetUnsignedInteger>(resp.layer);

                this.setLightActive(bacnetProperty);

                this.publishStateChange();
                this.logger.logDebug(`LightActorDevice - subscribeToProperty: `
                    + `Light Active: ${this.state.lightActive}`);
            });

        // Gets the `presentValue` (dimmer level) property
        this.subManager.subscribe = readPropertyFlow
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.levelFeedbackObjectId)),
                RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)),
            )
            .subscribe((resp) => {
                const bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue<BACnet.Types.BACnetReal>(resp.layer);

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
            throw new Errors.APIError('LightActorDevice - changeDimmer: No value provided to change!');
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
        const lightState = this.stateText[lightStateIndex];

        this.state.lightState = lightState;

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
