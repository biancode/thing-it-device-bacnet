import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import { BinaryActorDevice } from '../binary.device';

import * as Interfaces from '../../../../core/interfaces';

import * as Entities from '../../../../core/entities';

import * as Helpers from '../../../../core/helpers';

import * as Errors from '../../../../core/errors';

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
    public initParamsFromConfig (): void {
        this.objectId = Helpers.BACnet.getBACnetObjectId(
            this.config.objectId,
            BACnet.Enums.ObjectType.BinaryValue,
        );
    }

    /**
     * Sends the `writeProperty` request to set the value of the `presentValue` property.
     *
     * @param  {number} presentValue - value of the `presentValue` property.
     * @return {Bluebird<void>}
     */
    public setPresentValue (presentValue: boolean): Bluebird<void> {
        this.logger.logDebug('AnalogValueActorDevice - setPresentValue: Called setPresentValue()');

        this.sendWriteProperty(this.objectId, BACnet.Enums.PropertyId.presentValue,
            [ new BACnet.Types.BACnetEnumerated(+presentValue) ]);

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
     * Sets `1` (true) value of the `presentValue` property.
     *
     * @return {Bluebird<void>}
     */
    public on (): Bluebird<void> {
        this.logger.logDebug('AnalogValueActorDevice - setPresentValue: Called on()');

        this.setPresentValue(true);
        return Bluebird.resolve();
    }

    /**
     * Sets `0` (false) value of the `presentValue` property.
     *
     * @return {Bluebird<void>}
     */
    public off (): Bluebird<void> {
        this.logger.logDebug('AnalogValueActorDevice - setPresentValue: Called off()');

        this.setPresentValue(false);
        return Bluebird.resolve();
    }
}
