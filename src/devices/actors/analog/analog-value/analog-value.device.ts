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
     * Creates and inits params of the BACnet Analog Input from plugin configuration.
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
     * Service Stub
     */
    public update (): Bluebird<void> {
        this.apiService.confirmedReq.readProperty({
            invokeId: 1,
            objId: this.objectId,
            prop: {
                id: new BACnet.Types
                    .BACnetEnumerated(BACnet.Enums.PropertyId.presentValue),
            },
        });
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public setPresentValue (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public changeValue (): Bluebird<void> {
        return Bluebird.resolve();
    }
}
