import { ISlaveMetadata } from '../../../../core/interfaces/metadata.interface';

import {
    BinaryActorServices,
    BinaryActorStates,
    BinaryActorConfigs,
} from '../binary.metadata';

export const BinaryValueActorMetadata: ISlaveMetadata = {
    plugin: 'binary-value.actor',
    label: 'BacNet Binary Value',
    role: 'actor',
    family: 'binaryValue',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        ...BinaryActorServices,
        {
            id: 'on',
            label: 'On',
        },
        {
            id: 'off',
            label: 'Off',
        },
        {
            id: 'toggle',
            label: 'Toggle',
        },
    ],
    state: [
        ...BinaryActorStates,
    ],
    configuration: [
        ...BinaryActorConfigs,
        {
            label: 'Read-only',
            id: 'readonly',
            type: {
                id: 'boolean',
            },
            defaultValue: '',
        },
        {
            label: 'Write-only',
            id: 'writeonly',
            type: {
                id: 'boolean',
            },
            defaultValue: '',
        },
        /**
         * @deprecated
         */
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
