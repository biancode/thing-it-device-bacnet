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
    public initDeviceParamsFromConfig (): void {
        const objectId = +this.config.objectId;

        if (this.config.objectId === '' || !_.isFinite(objectId)) {
            throw new Errors.ApiError(`AnalogInputActorDevice - initDeviceParamsFromConfig: `
                + `Object ID must have the valid 'number' value`);
        }

        const objectType = BACnet.Enums.ObjectType.AnalogValue;

        this.objectId = new BACnet.Types.BACnetObjectId({
            type: objectType,
            instance: objectId,
        });
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
        this.logDebug('AnalogValueActorDevice - setPresentValue: Called setPresentValue()');

        this.apiService.confirmedReq.writeProperty({
            invokeId: 1,
            objId: this.objectId,
            prop: {
                id: new BACnet.Types
                    .BACnetEnumerated(BACnet.Enums.PropertyId.presentValue),
                values: [ new BACnet.Types.BACnetEnumerated(presentValue) ]
            },
        });
        return Bluebird.resolve();
    }

    /**
     * Calls the `setPresentValue` method to set the value of the `presentValue` property.
     *
     * @param  {any} parameters
     * @return {Bluebird<void>}
     */
    public changeValue (parameters): Bluebird<void> {
        this.logDebug('Change value requested with parameters: ', parameters);

        const presentValue = _.get(parameters, 'value');

        if (!_.isNumber(presentValue)) {
            throw new Errors.ApiError('AnalogValueActorDevice - changeValue: No value provided to change!');
        }

        this.setPresentValue(parameters.value);

        return Bluebird.resolve();
    }
}
