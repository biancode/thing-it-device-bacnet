import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import { AnalogActorDevice } from '../analog.device';

import * as Interfaces from '../../../../core/interfaces';

import * as Entities from '../../../../core/entities';

import * as Errors from '../../../../core/errors';

import { store } from '../../../../redux';

export class AnalogValueActorDevice extends AnalogActorDevice {
    public readonly className: string = 'AnalogValueActorDevice';
    public state: Interfaces.Actor.AnalogValue.State;
    public config: Interfaces.Actor.AnalogValue.Config;

    /**
     * Creates and inits params of the BACnet Analog Value from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initParamsFromConfig (): void {
        this.objectId = this.getBACnetObjectId(
            this.config.objectId,
            BACnet.Enums.ObjectType.AnalogValue,
        );
    }

    /**
     * TID API Methods
     */


    /**
     * Sends the `writeProperty` request to set the value of the `presentValue` property.
     *
     * @param  {number} presentValue - value of the `presentValue` property.
     * @return {Bluebird<void>}
     */
    public setPresentValue (presentValue: number): Bluebird<void> {
        this.logger.logDebug('AnalogValueActorDevice - setPresentValue: Called setPresentValue()');

        this.sendWriteProperty(this.objectId, BACnet.Enums.PropertyId.presentValue,
            [ new BACnet.Types.BACnetReal(presentValue) ]);

        return Bluebird.resolve();
    }

    /**
     * Calls the `setPresentValue` method to set the value of the `presentValue` property.
     *
     * @param  {any} parameters
     * @return {Bluebird<void>}
     */
    public changeValue (parameters): Bluebird<void> {
        this.logger.logDebug('Change value requested with parameters: ', parameters);

        const presentValue = _.get(parameters, 'value');

        if (!_.isNumber(presentValue)) {
            throw new Errors.APIError('AnalogValueActorDevice - changeValue: No value provided to change!');
        }

        this.setPresentValue(parameters.value);

        return Bluebird.resolve();
    }
}
