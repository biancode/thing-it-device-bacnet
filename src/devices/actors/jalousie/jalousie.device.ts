import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import * as RxOp from 'rxjs/operators';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

import * as Entities from '../../../core/entities';

import * as Errors from '../../../core/errors';

import { store } from '../../../redux';

import * as Helpers from '../../../core/helpers';

export class JalousieActorDevice extends ActorDevice {
    public readonly className: string = 'JalousieActorDevice';
    public state: Interfaces.Actor.Jalousie.State;
    public config: Interfaces.Actor.Jalousie.Config;

    public positionFeedbackObjectId: BACnet.Types.BACnetObjectId;
    public positionModificationObjectId: BACnet.Types.BACnetObjectId;
    public rotationFeedbackObjectId: BACnet.Types.BACnetObjectId;
    public rotationModificationObjectId: BACnet.Types.BACnetObjectId;
    public actionObjectId: BACnet.Types.BACnetObjectId;

    /**
     * Creates and inits params of the BACnet Analog Input from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initParamsFromConfig (): void {
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
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)),
                RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)),
                RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.positionFeedbackObjectId)),
            )
            .subscribe((resp) => {
                const bacnetProperties = this
                    .getCOVNotificationValues<BACnet.Types.BACnetReal>(resp);

                this.state.position = bacnetProperties.presentValue.value;

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
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)),
                RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)),
                RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.rotationFeedbackObjectId)),
            )
            .subscribe((resp) => {
                const bacnetProperties = this
                    .getCOVNotificationValues<BACnet.Types.BACnetReal>(resp);

                this.state.rotation = bacnetProperties.presentValue.value;

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
