import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import { MultiStateActorDevice } from '../multi-state.device';

import * as Interfaces from '../../../../core/interfaces';

import * as Entities from '../../../../core/entities';

import * as Errors from '../../../../core/errors';

import { store } from '../../../../redux';

export class MultiStateInputActorDevice extends MultiStateActorDevice {
    public readonly className: string = 'MultiStateInputActorDevice';
    public state: Interfaces.Actor.MultiStateInput.State;
    public config: Interfaces.Actor.MultiStateInput.Config;

    /**
     * Creates and inits params of the BACnet Analog Input from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initDeviceParamsFromConfig (): void {
        this.objectId = this.getBACnetObjectId(
            this.config.objectId,
            this.config.objectType,
            BACnet.Enums.ObjectType.MultiStateInput,
        );
    }
}
