import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import { AnalogActorDevice } from '../analog.device';

import * as Interfaces from '../../../../core/interfaces';

import * as Entities from '../../../../core/entities';

import * as Errors from '../../../../core/errors';

import { store } from '../../../../redux';

export class AnalogInputActorDevice extends AnalogActorDevice {
    public readonly className: string = 'AnalogInputActorDevice';
    public state: Interfaces.Actor.AnalogInput.State;
    public config: Interfaces.Actor.AnalogInput.Config;

    /**
     * Creates and inits params of the BACnet Analog Input from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initParamsFromConfig (): void {
        this.objectId = this.getBACnetObjectId(
            this.config.objectId,
            this.config.objectType,
            BACnet.Enums.ObjectType.AnalogInput,
        );
    }
}
