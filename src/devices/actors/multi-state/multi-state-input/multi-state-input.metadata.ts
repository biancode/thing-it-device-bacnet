import { ISlaveMetadata } from '../../../../core/interfaces/metadata.interface';

import {
    MultiStateActorServices,
    MultiStateActorStates,
    MultiStateActorConfigs,
} from '../multi-state.metadata';

export const MultiStateInputActorMetadata: ISlaveMetadata = {
    plugin: 'multi-state-input.actor',
    label: 'BacNet Multi State Input',
    role: 'actor',
    family: 'multiStateInput',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        ...MultiStateActorServices,
    ],
    state: [
        ...MultiStateActorStates,
    ],
    configuration: [
        ...MultiStateActorConfigs,
        {
            label: 'Object Identifier',
            id: 'objectId',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'Object Type',
            id: 'objectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'States',
            id: 'states',
            type: {
                id: 'enumeration',
            },
            defaultValue: { zero: 0, one: 1 },
        },
    ],
};
