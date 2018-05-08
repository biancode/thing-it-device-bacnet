import { ISlaveMetadata } from '../../../../core/interfaces/metadata.interface';

import {
    BinaryActorServices,
    BinaryActorStates,
    BinaryActorConfigs,
} from '../binary.metadata';

export const BinaryInputActorMetadata: ISlaveMetadata = {
    plugin: 'binary-input.actor',
    label: 'BacNet Binary Input',
    role: 'actor',
    family: 'binaryInput',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        ...BinaryActorServices,
    ],
    state: [
        ...BinaryActorStates,
    ],
    configuration: [
        ...BinaryActorConfigs,
        {
            label: 'Object Type',
            id: 'objectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
    ],
};
