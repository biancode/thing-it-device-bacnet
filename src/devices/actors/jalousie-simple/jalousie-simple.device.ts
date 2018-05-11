import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import { ActorDevice } from '../actor.device';

import * as Enums from '../../../core/enums';

import * as Interfaces from '../../../core/interfaces';

import * as Entities from '../../../core/entities';

import * as Errors from '../../../core/errors';

import { store } from '../../../redux';

export class JalousieSimpleActorDevice extends ActorDevice {
    public readonly className: string = 'JalousieSimpleActorDevice';
    public state: Interfaces.Actor.JalousieSimple.State;
    public config: Interfaces.Actor.JalousieSimple.Config;

    public motionDirectionObjectId: BACnet.Types.BACnetObjectId;
    public stopValueObjectId: BACnet.Types.BACnetObjectId;

    /**
     * Creates and inits params of the BACnet Analog Input from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initParamsFromConfig (): void {
        this.motionDirectionObjectId = this.getBACnetObjectId(
            this.config.motionDirectionObjectId,
            this.config.motionDirectionObjectType,
        );

        this.stopValueObjectId = this.getBACnetObjectId(
            this.config.stopValueObjectId,
            this.config.stopValueObjectType,
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
            .filter(this.flowManager.isBACnetObject(this.motionDirectionObjectId))
            .subscribe((resp) => {
                const bacnetProperties = this
                    .getCOVNotificationValues<BACnet.Types.BACnetEnumerated>(resp);

                this.state.motionDirection = bacnetProperties[0].value;

                this.logger.logDebug(`JalousieSimpleActorDevice - subscribeToProperty: `
                    + `Motion Direction ${JSON.stringify(this.state.motionDirection)}`);
                this.logger.logDebug(`JalousieSimpleActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`JalousieSimpleActorDevice - subscribeToProperty: `
                    + `Motion Direction COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read `Rotation` Property Flow
        this.subManager.subscribe = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification))
            .filter(this.flowManager.isBACnetObject(this.stopValueObjectId))
            .subscribe((resp) => {
                const bacnetProperties = this
                    .getCOVNotificationValues<BACnet.Types.BACnetEnumerated>(resp);

                this.state.stopValue = bacnetProperties[0].value === 1;

                this.logger.logDebug(`JalousieSimpleActorDevice - subscribeToProperty: `
                    + `Stop value ${JSON.stringify(this.state.stopValue)}`);
                this.logger.logDebug(`JalousieSimpleActorDevice - subscribeToProperty: `
                    + `State ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`JalousieSimpleActorDevice - subscribeToProperty: `
                    + `Stop value COV notification was not received ${error}`);
                this.publishStateChange();
            });

        // Read Property Flow
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU))
            .filter(this.flowManager.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty));

        // Gets the `presentValue` (position) property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetObject(this.motionDirectionObjectId))
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.presentValue))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetEnumerated>(resp);

                this.state.motionDirection = bacnetProperty.value;

                this.logger.logDebug(`JalousieSimpleActorDevice - subscribeToProperty: `
                    + `Motion direction: ${bacnetProperty.value}`);
            });

        // Gets the `presentValue` (rotation) property
        this.subManager.subscribe = readPropertyFlow
            .filter(this.flowManager.isBACnetObject(this.stopValueObjectId))
            .filter(this.flowManager.isBACnetProperty(BACnet.Enums.PropertyId.presentValue))
            .subscribe((resp) => {
                const bacnetProperty = this.getReadPropertyValue<BACnet.Types.BACnetEnumerated>(resp);

                this.state.stopValue = bacnetProperty.value === 1;

                this.logger.logDebug(`JalousieSimpleActorDevice - subscribeToProperty: `
                    + `Stop value: ${bacnetProperty.value}`);
            });
    }

    /**
     * Inits the BACnet object properties.
     *
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
        // Gets the `presentValue|statusFlags` property for `motionDirection`
        this.sendSubscribeCOV(this.motionDirectionObjectId);

        // Gets the `presentValue|statusFlags` property for `stopValue`
        this.sendSubscribeCOV(this.stopValueObjectId);
    }

    /**
     * Sets new direction of the motion.
     *
     * @param  {number} targetState - new motion direction
     * @return {Bluebird<void>}
     */
    public setMotion (targetState: number): Bluebird<void> {
        this.logger.logDebug('JalousieSimpleActorDevice - setMotion: '
            + `Modifying motion state ${targetState}`);

        if (this.state.motionDirection === targetState) {
            this.state.motionDirection = this.state.motionDirection === Enums.MotionDirection.Down
                ? Enums.MotionDirection.Up : Enums.MotionDirection.Down;
        } else {
            this.state.motionDirection = targetState;
        }

        this.publishStateChange();

        this.sendWriteProperty(this.motionDirectionObjectId, BACnet.Enums.PropertyId.presentValue,
            [ new BACnet.Types.BACnetEnumerated(this.state.motionDirection) ]);

        return Bluebird.resolve();
    }

    /**
     * Toggles the `stopValue` state.
     *
     * @return {Bluebird<void>}
     */
    public stopMotion (): Bluebird<void> {
        this.logger.logDebug('JalousieSimpleActorDevice - stopMotion: '
            + `Toggling stop value`);

        let targetValue: boolean = !this.state.stopValue;

        this.setStopMotion(targetValue);

        return Bluebird.resolve();
    }

    /**
     * Sets the `stopValue` state.
     *
     * @param  {boolean} targetState - new stop value
     * @return {Bluebird<void>}
     */
    public setStopMotion (targetState: boolean): Bluebird<void> {
        this.logger.logDebug('JalousieSimpleActorDevice - stopMotion: '
            + `Setting stop motion value ${targetState}`);

        this.state.stopValue = !!targetState;
        this.publishStateChange();

        this.sendWriteProperty(this.stopValueObjectId, BACnet.Enums.PropertyId.presentValue,
            [ new BACnet.Types.BACnetEnumerated(+this.state.stopValue) ]);

        return Bluebird.resolve();
    }

    /**
     * Starts the step of `raise` operation.
     *
     * @return {Bluebird<void>}
     */
    public raisePosition (): Bluebird<void> {
        this.logger.logDebug('JalousieSimpleActorDevice - lowerPosition: '
            + `Raise Position...`);

        return this.positionUp()
            .delay(this.config.stepDuration * 1000)
            .then(() => this.stopMotion());
    }

    /**
     * Starts the step of `lower` operation.
     *
     * @return {Bluebird<void>}
     */
    public lowerPosition (): Bluebird<void> {
        this.logger.logDebug('JalousieSimpleActorDevice - lowerPosition: '
            + `Lower Position...`);

        return this.positionDown()
            .delay(this.config.stepDuration * 1000)
            .then(() => this.stopMotion());
    }

    /**
     * Sets the `UP` motion direction.
     *
     * @return {Bluebird<void>}
     */
    public positionUp (): Bluebird<void> {
        this.logger.logDebug('JalousieSimpleActorDevice - positionUp: '
            + `Set Position Up...`);

        return this.setMotion(Enums.MotionDirection.Up);
    }

    /**
     * Sets the `DOWN` motion direction.
     *
     * @return {Bluebird<void>}
     */
    public positionDown (): Bluebird<void> {
        this.logger.logDebug('JalousieSimpleActorDevice - positionDown: '
            + `Set Position Down...`);

        return this.setMotion(Enums.MotionDirection.Down);
    }

    /**
     * Sets the `UP` motion direction (fixed delay).
     *
     * @return {Bluebird<void>}
     */
    public openBlade (): Bluebird<void> {
        this.logger.logDebug('JalousieSimpleActorDevice - openBlade: '
            + `Open blade...`);

        return this.positionUp()
            .delay(1000)
            .then(() => this.stopMotion());
    }

    /**
     * Sets the `DOWN` motion direction (fixed delay).
     *
     * @return {Bluebird<void>}
     */
    public closeBlade (): Bluebird<void> {
        this.logger.logDebug('JalousieSimpleActorDevice - closeBlade: '
            + `Close blade...`);

        return this.positionDown()
            .delay(1000)
            .then(() => this.stopMotion());
    }

    /**
     * Sends the `ReadProperty` request to update the motion direction and stop value params.
     *
     * @return {Bluebird<void>}
     */
    public update (): Bluebird<void> {
        this.logger.logDebug('JalousieSimpleActorDevice - update: '
            + `Updating values...`);

        this.sendReadProperty(this.motionDirectionObjectId, BACnet.Enums.PropertyId.presentValue);
        this.sendReadProperty(this.stopValueObjectId, BACnet.Enums.PropertyId.presentValue);
        return Bluebird.resolve();
    }
}
