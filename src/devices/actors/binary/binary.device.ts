import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import * as RxOp from 'rxjs/operators';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

import * as Entities from '../../../core/entities';

import * as Errors from '../../../core/errors';

import { store } from '../../../redux';

export class BinaryActorDevice extends ActorDevice {
    public readonly className: string = 'BinaryActorDevice';
    public state: Interfaces.Actor.Binary.State;
    public config: Interfaces.Actor.Binary.Config;

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
                RxOp.filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)),
                RxOp.filter(this.flowManager.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)),
                RxOp.filter(this.flowManager.isBACnetObject(this.objectId)),
            )
            .subscribe((resp) => {
                const bacnetProperties = this
                    .getCOVNotificationValues<BACnet.Types.BACnetEnumerated>(resp);

                this.state.presentValue = bacnetProperties.presentValue.value === 1;
                this.state.outOfService = bacnetProperties.statusFlags.value.outOfService;
                this.state.alarmValue = bacnetProperties.statusFlags.value.inAlarm;

                this.logger.logDebug(`BinaryActorDevice - subscribeToProperty: `
                    + `presentValue ${JSON.stringify(this.state.presentValue)}`);
                this.logger.logDebug(`BinaryActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`BinaryActorDevice - subscribeToProperty: `
                    + `Analog Input COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read Property Flow
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .pipe(
                RxOp.filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)),
                RxOp.filter(this.flowManager.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)),
                RxOp.filter(this.flowManager.isBACnetObject(this.objectId)),
            );

        // Gets the `objectName` property
        this.subManager.subscribe = readPropertyFlow
            .pipe(
                RxOp.filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.objectName)),
            )
            .subscribe((resp) => {
                const bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue<BACnet.Types.BACnetCharacterString>(resp.layer);

                this.state.objectName = bacnetProperty.value;

                this.logger.logDebug(`BinaryActorDevice - subscribeToProperty: `
                    + `Object Name retrieved: ${this.state.objectName}`);
                this.publishStateChange();
            });

        // Gets the `description` property
        this.subManager.subscribe = readPropertyFlow
            .pipe(
                RxOp.filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.description)),
            )
            .subscribe((resp) => {
                const bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue<BACnet.Types.BACnetCharacterString>(resp.layer);

                this.state.description = bacnetProperty.value;

                this.logger.logDebug(`BinaryActorDevice - subscribeToProperty: `
                    + `Object Description retrieved: ${this.state.description}`);
                this.publishStateChange();
            });

        // Gets the `presentValue` property
        this.subManager.subscribe = readPropertyFlow
            .pipe(
                RxOp.filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)),
            )
            .subscribe((resp) => {
                const bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue<BACnet.Types.BACnetEnumerated>(resp.layer);

                this.state.presentValue = bacnetProperty.value === 1;

                this.logger.logDebug(`BinaryActorDevice - subscribeToProperty: `
                    + `Object Present Value retrieved: ${this.state.presentValue}`);
                this.publishStateChange();
            });
    }

    /**
     * Inits the BACnet object properties.
     *
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
        // Gets the `objectName` property
        this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.objectName);

        // Gets the `description` property
        this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.description);

        // Gets the `presentValue|statusFlags` property
        this.sendSubscribeCOV(this.objectId);
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
        this.logger.logDebug('BinaryActorDevice - update: Called update()');

        this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.presentValue);

        return Bluebird.resolve();
    }
}
