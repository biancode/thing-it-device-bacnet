import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import * as RxOp from 'rxjs/operators';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

import * as Entities from '../../../core/entities';

import * as Errors from '../../../core/errors';

import { store } from '../../../redux';

export class HVACActorDevice extends ActorDevice {
    public readonly className: string = 'HVACActorDevice';
    public state: Interfaces.Actor.HVAC.State;
    public config: Interfaces.Actor.HVAC.Config;

    public setpointFeedbackObjectId: BACnet.Types.BACnetObjectId;
    public temperatureObjectId: BACnet.Types.BACnetObjectId;
    public setpointModificationObjectId: BACnet.Types.BACnetObjectId;

    /**
     * Creates unit params of the BACnet Object from plugin configuration.
     * Steps:
     * - creates `setpointFeedbackObjectId`.
     * - creates `temperatureObjectId`.
     * - creates `setpointModificationObjectId`.
     *
     * @return {void}
     */
    public initParamsFromConfig (): void {
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
            .pipe(
                RxOp.filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)),
                RxOp.filter(this.flowManager.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)),
                RxOp.filter(this.flowManager.isBACnetObject(this.setpointFeedbackObjectId)),
            )
            .subscribe((resp) => {
                const bacnetProperties = this
                    .getCOVNotificationValues<BACnet.Types.BACnetReal>(resp);

                this.state.setpoint = bacnetProperties.presentValue.value;

                this.logger.logDebug(`HVACActorDevice - subscribeToProperty: `
                    + `Setpoint ${JSON.stringify(this.state.setpoint)}`);
                this.logger.logDebug(`HVACActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`HVACActorDevice - subscribeToProperty: `
                    + `Setpoint COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read `Rotation` Property Flow
        this.subManager.subscribe = this.flowManager.getResponseFlow()
            .pipe(
                RxOp.filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)),
                RxOp.filter(this.flowManager.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)),
                RxOp.filter(this.flowManager.isBACnetObject(this.temperatureObjectId)),
            )
            .subscribe((resp) => {
                const bacnetProperties = this
                    .getCOVNotificationValues<BACnet.Types.BACnetReal>(resp);

                this.state.temperature = bacnetProperties.presentValue.value;

                this.logger.logDebug(`HVACActorDevice - subscribeToProperty: `
                    + `Temperature ${JSON.stringify(this.state.temperature)}`);
                this.logger.logDebug(`HVACActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`HVACActorDevice - subscribeToProperty: `
                    + `Temperature COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read Property Flow
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .pipe(
                RxOp.filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)),
                RxOp.filter(this.flowManager.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)),
            );

        // Gets the `presentValue` (setpoint) property
        this.subManager.subscribe = readPropertyFlow
            .pipe(
                RxOp.filter(this.flowManager.isBACnetObject(this.setpointFeedbackObjectId)),
                RxOp.filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)),
            )
            .subscribe((resp) => {
                const bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue<BACnet.Types.BACnetReal>(resp.layer);

                this.state.setpoint = bacnetProperty.value;

                this.logger.logDebug(`HVACActorDevice - subscribeToProperty: `
                    + `Setpoint: ${this.state.setpoint}`);
                this.publishStateChange();
            });

        // Gets the `presentValue` (temperature) property
        this.subManager.subscribe = readPropertyFlow
            .pipe(
                RxOp.filter(this.flowManager.isBACnetObject(this.temperatureObjectId)),
                RxOp.filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)),
            )
            .subscribe((resp) => {
                const bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue<BACnet.Types.BACnetReal>(resp.layer);

                this.state.temperature = bacnetProperty.value;

                this.logger.logDebug(`HVACActorDevice - subscribeToProperty: `
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
        await super.initProperties();

        // Gets the `presentValue|statusFlags` property for `setpoint`
        this.sendSubscribeCOV(this.setpointFeedbackObjectId);

        // Gets the `presentValue|statusFlags` property for `temperature`
        this.sendSubscribeCOV(this.temperatureObjectId);
    }

    /**
     * TID API Methods
     */

     /**
      * Sends the `writeProperty` request to set the setpoint of the `presentValue` property.
      *
      * @return {Promise<void>}
      */
     public setSetpointModification (newSetpoint: number): Bluebird<void> {
         this.logger.logDebug('HVACActorDevice - setSetpointModification: '
             + `Setting setpoint modification: ${newSetpoint}`);

         // Gets the `presentValue|statusFlags` property for `setpoint`
         this.sendWriteProperty(this.setpointModificationObjectId, BACnet.Enums.PropertyId.presentValue,
             [ new BACnet.Types.BACnetReal(newSetpoint) ]);

         return Bluebird.resolve();
     }

     /**
      * Sends the `readProperty` requests to get the values (temperature, setpoint)
      * of the `presentValue` property.
      *
      * @return {Bluebird<void>}
      */
     public update (): Bluebird<void> {
         this.logger.logDebug('HVACActorDevice - update: '
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
         this.logger.logDebug('HVACActorDevice - incrementSetpoint: '
             + `Increments the setpoint value...`);

         return this.setSetpointModification(1);
     }

     /**
      * Decrements the `setpoint` value.
      *
      * @return {Bluebird<void>}
      */
     public decrementSetpoint (): Bluebird<void> {
         this.logger.logDebug('HVACActorDevice - decrementSetpoint: '
             + `Decrements the setpoint value...`);

         return this.setSetpointModification(-1);
     }
}
