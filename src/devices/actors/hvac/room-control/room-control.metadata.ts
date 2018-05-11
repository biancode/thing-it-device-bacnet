import { ISlaveMetadata } from '../../../../core/interfaces/metadata.interface';

import {
    HVACActorServices,
    HVACActorStates,
    HVACActorConfigs,
} from '../hvac.metadata';

export const RoomControlActorMetadata: ISlaveMetadata = {
    plugin: 'room-control.actor',
    label: 'BACnet Room Control',
    role: 'actor',
    family: 'roomControl',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        ...HVACActorServices,
    ],
    state: [
        ...HVACActorStates,
    ],
    configuration: [
        ...HVACActorConfigs,
    ],
};
