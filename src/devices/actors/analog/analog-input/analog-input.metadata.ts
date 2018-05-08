import { ISlaveMetadata } from '../../../../core/interfaces/metadata.interface';

import {
    AnalogActorServices,
    AnalogActorStates,
    AnalogActorConfigs,
} from '../analog.metadata';

export const AnalogInputActorMetadata: ISlaveMetadata = {
    plugin: 'analog-input.actor',
    label: 'BacNet Analog Input',
    role: 'actor',
    family: 'analogInput',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        ...AnalogActorServices,
        /**
         * @deprecated
         */
        {
            id: 'changeValue',
            label: 'changeValue',
        },
    ],
    state: [
        ...AnalogActorStates,
    ],
    configuration: [
        ...AnalogActorConfigs,
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
