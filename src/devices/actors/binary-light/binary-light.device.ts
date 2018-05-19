import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import * as RxOp from 'rxjs/operators';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

import * as Entities from '../../../core/entities';

import * as Helpers from '../../../core/helpers';

import * as Errors from '../../../core/errors';

export class BinaryLightActorDevice extends ActorDevice {
    public readonly className: string = 'BinaryLightActorDevice';
    public state: Interfaces.Actor.BinaryLight.State;
    public config: Interfaces.Actor.BinaryLight.Config;

    public objectId: BACnet.Types.BACnetObjectId;

    /**
     * Creates and inits params of the BACnet Analog Input from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initParamsFromConfig (): void {
        this.objectId = Helpers.BACnet.getBACnetObjectId(
            this.config.lightActiveObjectId,
            this.config.lightActiveObjectType,
        );
    }

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
                RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.objectId))
            )
            .subscribe((resp) => {
                const bacnetProperties = this
                    .getCOVNotificationValues<BACnet.Types.BACnetEnumerated>(resp);

                this.state.lightActive = bacnetProperties.presentValue.value === 1;

                this.logger.logDebug(`BinaryLightActorDevice - subscribeToProperty: `
                    + `presentValue ${JSON.stringify(this.state.lightActive)}`);
                this.logger.logDebug(`BinaryLightActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`BinaryLightActorDevice - subscribeToProperty: `
                    + `Analog Input COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read Property Flow
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)),
                RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)),
                RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.objectId)),
            )

        // Gets the `presentValue` property
        this.subManager.subscribe = readPropertyFlow
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)),
            )
            .subscribe((resp) => {
                const bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue<BACnet.Types.BACnetEnumerated>(resp.layer);

                this.state.lightActive = bacnetProperty.value === 1;

                this.logger.logDebug(`BinaryLightActorDevice - subscribeToProperty: `
                    + `Object Present Value retrieved: ${this.state.lightActive}`);
                this.publishStateChange();
            });
    }

    /**
     * Inits the BACnet object properties.
     *
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
        // Gets the `presentValue|statusFlags` property
        this.sendSubscribeCOV(this.objectId);
    }

    /**
     * Sends the `writeProperty` request to set the value of the `presentValue` property.
     *
     * @param  {number} presentValue - value of the `presentValue` property.
     * @return {Bluebird<void>}
     */
    public setLightActive (targetState: boolean): Bluebird<void> {
        this.logger.logDebug('BinaryLightActorDevice - setLightActive: Called setLightActive()');

        this.sendWriteProperty(this.objectId, BACnet.Enums.PropertyId.presentValue,
            [ new BACnet.Types.BACnetEnumerated(+targetState) ]);

        return Bluebird.resolve();
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
        this.logger.logDebug('BinaryLightActorDevice - update: Called update()');

        this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.presentValue);

        return Bluebird.resolve();
    }

    /**
     * Switches the value of the `presentValue` property.
     *
     * @return {Bluebird<void>}
     */
    public toggle (): Bluebird<void> {
        this.logger.logDebug('BinaryLightActorDevice - toggle: Called toggle()');

        if (this.state.lightActive) {
            this.off();
        } else {
            this.on();
        }

        return Bluebird.resolve();
    }

    /**
     * Sets `1` (true) value of the `presentValue` property.
     *
     * @return {Bluebird<void>}
     */
    public on (): Bluebird<void> {
        this.logger.logDebug('BinaryLightActorDevice - on: Called on()');

        this.setLightActive(true);
        return Bluebird.resolve();
    }

    /**
     * Sets `0` (false) value of the `presentValue` property.
     *
     * @return {Bluebird<void>}
     */
    public off (): Bluebird<void> {
        this.logger.logDebug('BinaryLightActorDevice - off: Called off()');

        this.setLightActive(false);
        return Bluebird.resolve();
    }
}
