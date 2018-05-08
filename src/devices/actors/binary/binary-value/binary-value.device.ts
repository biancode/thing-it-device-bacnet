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
     * Service Stub
     */
    public toggle (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public on (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public off (): Bluebird<void> {
        return Bluebird.resolve();
    }
}
