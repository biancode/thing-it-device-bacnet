import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'tid-bacnet-logic';

import * as RxOp from 'rxjs/operators';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

import * as Entities from '../../../core/entities';

import * as Helpers from '../../../core/helpers';

import * as Errors from '../../../core/errors';

export class MultiStateActorDevice extends ActorDevice {
    public readonly className: string = 'MultiStateActorDevice';
    public state: Interfaces.Actor.MultiState.State;
    public config: Interfaces.Actor.MultiState.Config;

    public objectId: BACnet.Types.BACnetObjectId;

    /**
     * Creates `subscribtion` to the BACnet object properties.
     *
     * @return {void}
     */
    public subscribeToProperty (): void {
        // Read Property Flow
        this.subManager.subscribe = this.flowManager.getResponseFlow()
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)),
                RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)),
                RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.objectId)),
            )
            .subscribe((resp) => {
                const bacnetProperties = this
                    .getCOVNotificationValues<BACnet.Types.BACnetUnsignedInteger>(resp);

                this.state.presentValue = bacnetProperties.presentValue.value;

                const lightStateIndex = bacnetProperties.presentValue.value - 1;
                this.state.presentValueText = this.state.stateText[lightStateIndex];

                this.state.outOfService = bacnetProperties.statusFlags.value.outOfService;
                this.state.alarmValue = bacnetProperties.statusFlags.value.inAlarm;

                this.logger.logDebug(`MultiStateActorDevice - subscribeToProperty: `
                    + `presentValue ${JSON.stringify(this.state.presentValue)}`);
                this.logger.logDebug(`MultiStateActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`MultiStateActorDevice - subscribeToProperty: `
                    + `Multi State Input COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read Property Flow
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)),
                RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)),
                RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.objectId)),
            );

        // Gets the `objectName` property
        this.subManager.subscribe = readPropertyFlow
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.objectName)),
            )
            .subscribe((resp) => {
                const bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue<BACnet.Types.BACnetCharacterString>(resp.layer);

                this.state.objectName = bacnetProperty.value;

                this.logger.logDebug(`MultiStateActorDevice - subscribeToProperty: `
                    + `Object Name retrieved: ${this.state.objectName}`);
                this.publishStateChange();
            });

        // Gets the `description` property
        this.subManager.subscribe = readPropertyFlow
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.description)),
            )
            .subscribe((resp) => {
                const bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue<BACnet.Types.BACnetCharacterString>(resp.layer);

                this.state.description = bacnetProperty.value;

                this.logger.logDebug(`MultiStateActorDevice - subscribeToProperty: `
                    + `Object Description retrieved: ${this.state.description}`);
                this.publishStateChange();
            });

        // Gets the `stateText` property
        this.subManager.subscribe = readPropertyFlow
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.stateText)),
            )
            .subscribe((resp) => {
                const bacnetProperties = BACnet.Helpers.Layer
                    .getPropertyValues<BACnet.Types.BACnetCharacterString>(resp.layer);

                this.state.stateText = _.map(bacnetProperties, (stateTextItem) => {
                    return stateTextItem.value;
                });

                this.logger.logDebug(`MultiStateActorDevice - subscribeToProperty: `
                    + `Actor States: ${JSON.stringify(this.state.stateText)}`);
                this.publishStateChange();

                // Gets the `presentValue|statusFlags` property
                this.sendSubscribeCOV(this.objectId);
            });
    }

    /**
     * Inits the BACnet object properties.
     *
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
        // Gets the `StateText` property for `light state`
        this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.stateText);

        // Gets the `objectName` property
        this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.objectName);

        // Gets the `description` property
        this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.description);
    }

    /**
     * TID API Methods
     */

    /**
     * Sends the `readProperty` request to get the value of the `presentValue` property.
     *
     * @return {Bluebird<void>}
     */
    public update (): Bluebird<void> {
        this.logger.logDebug('MultiStateActorDevice - update: Called update()');

        this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.presentValue);

        return Bluebird.resolve();
    }
}
