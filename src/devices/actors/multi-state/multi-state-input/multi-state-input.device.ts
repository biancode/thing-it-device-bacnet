import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'tid-bacnet-logic';

import { MultiStateActorDevice } from '../multi-state.device';

import * as Interfaces from '../../../../core/interfaces';

import * as Entities from '../../../../core/entities';

import * as Helpers from '../../../../core/helpers';

import * as Errors from '../../../../core/errors';

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
    public initParamsFromConfig (): void {
        this.objectId = Helpers.BACnet.getBACnetObjectId(
            this.config.objectId,
            this.config.objectType,
            BACnet.Enums.ObjectType.MultiStateInput,
        );
    }
}
