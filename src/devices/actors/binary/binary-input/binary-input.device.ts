import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import { BinaryActorDevice } from '../binary.device';

import * as Interfaces from '../../../../core/interfaces';

import * as Entities from '../../../../core/entities';

import * as Errors from '../../../../core/errors';

import { store } from '../../../../redux';

export class BinaryInputActorDevice extends BinaryActorDevice {
    public readonly className: string = 'BinaryInputActorDevice';
    public state: Interfaces.Actor.BinaryInput.State;
    public config: Interfaces.Actor.BinaryInput.Config;

    /**
     * Creates and inits params of the BACnet Binary Input from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initParamsFromConfig (): void {
        this.objectId = this.getBACnetObjectId(
            this.config.objectId,
            this.config.objectType,
            BACnet.Enums.ObjectType.BinaryInput,
        );
    }
}
