import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import { BinaryActorDevice } from '../binary.device';

import * as Interfaces from '../../../../core/interfaces';

import * as Entities from '../../../../core/entities';

import * as Errors from '../../../../core/errors';

import { store } from '../../../../redux';

export class BinaryValueActorDevice extends BinaryActorDevice {
    public readonly className: string = 'BinaryValueActorDevice';
    public state: Interfaces.Actor.BinaryValue.State;
    public config: Interfaces.Actor.BinaryValue.Config;

    /**
     * Creates and inits params of the BACnet Analog Value from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initDeviceParamsFromConfig (): void {
        const objectId = +this.config.objectId;

        if (this.config.objectId === '' || !_.isFinite(objectId)) {
            throw new Errors.ApiError(`BinaryValueActorDevice - initDeviceParamsFromConfig: `
                + `Object ID must have the valid 'number' value`);
        }

        const objectType = BACnet.Enums.ObjectType.BinaryValue;

        this.objectId = new BACnet.Types.BACnetObjectId({
            type: objectType,
            instance: objectId,
        });
    }

    /**
     * Sends the `writeProperty` request to set the value of the `presentValue` property.
     *
     * @param  {number} presentValue - value of the `presentValue` property.
     * @return {Bluebird<void>}
     */
    public setPresentValue (presentValue: boolean): Bluebird<void> {
        this.logger.logDebug('AnalogValueActorDevice - setPresentValue: Called setPresentValue()');

        this.apiService.confirmedReq.writeProperty({
            invokeId: 1,
            objId: this.objectId,
            prop: {
                id: new BACnet.Types
                    .BACnetEnumerated(BACnet.Enums.PropertyId.presentValue),
                values: [ new BACnet.Types.BACnetEnumerated(+presentValue) ]
            },
        });
        return Bluebird.resolve();
    }

    /**
     * TID API Methods
     */


    /**
     * Switches the value of the `presentValue` property.
     *
     * @return {Bluebird<void>}
     */
    public toggle (): Bluebird<void> {
        this.logger.logDebug('AnalogValueActorDevice - setPresentValue: Called toggle()');

        if (this.state.presentValue) {
            this.off();
        } else {
            this.on();
        }

        return Bluebird.resolve();
    }

    /**
     * Sends the `writeProperty` request to set `1` (true) value to the `presentValue` property.
     *
     * @return {Bluebird<void>}
     */
    public on (): Bluebird<void> {
        this.logger.logDebug('AnalogValueActorDevice - setPresentValue: Called on()');

        this.setPresentValue(true);
        return Bluebird.resolve();
    }

    /**
     * Sends the `writeProperty` request to set `0` (false) value to the `presentValue` property.
     *
     * @return {Bluebird<void>}
     */
    public off (): Bluebird<void> {
        this.logger.logDebug('AnalogValueActorDevice - setPresentValue: Called off()');

        this.setPresentValue(false);
        return Bluebird.resolve();
    }
}
