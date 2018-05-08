import { ISlaveMetadata } from '../../../core/interfaces/metadata.interface';

import { ActorStates, ActorConfigs } from '../actor.metadata';

export const BinaryLightActorMetadata: ISlaveMetadata = {
    plugin: 'binary-light.actor',
    label: 'BACnet Binary Light Control',
    role: 'actor',
    family: 'binaryLight',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        {
            id: 'toggle',
            label: 'Toggle',
        },
        {
            id: 'on',
            label: 'On',
        },
        {
            id: 'off',
            label: 'Off',
        },
        {
            id: 'update',
            label: 'Update',
        },
    ],
    state: [
        {
            id: 'lightActive',
            label: 'Light Active',
            type: {
                id: 'boolean',
            },
        },
        ...ActorStates,
    ],
    configuration: [
        {
            label: 'Light Active Object Id',
            id: 'lightActiveObjectId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Light Active Object Type',
            id: 'lightActiveObjectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        ...ActorConfigs,
    ],
};
