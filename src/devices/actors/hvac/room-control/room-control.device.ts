import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'bacnet-logic';

import { HVACActorDevice } from '../hvac.device';

import * as Interfaces from '../../../../core/interfaces';

import * as Entities from '../../../../core/entities';

import * as Errors from '../../../../core/errors';

import { store } from '../../../../redux';

export class RoomControlActorDevice extends HVACActorDevice {
    public readonly className: string = 'RoomControlActorDevice';
    public state: Interfaces.Actor.RoomControl.State;
    public config: Interfaces.Actor.RoomControl.Config;
}
