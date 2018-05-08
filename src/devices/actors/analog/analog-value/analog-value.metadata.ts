import { ISlaveMetadata } from '../../../../core/interfaces/metadata.interface';

import {
    AnalogActorServices,
    AnalogActorStates,
    AnalogActorConfigs,
} from '../analog.metadata';

export const AnalogValueActorMetadata: ISlaveMetadata = {
    plugin: 'analog-value.actor',
    label: 'BacNet Analog Value',
    role: 'actor',
    family: 'analogValue',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        ...AnalogActorServices,
        {
            id: 'setPresentValue',
            label: 'Set Present Value',
        },
        {
            id: 'changeValue',
            label: 'Change Value',
        },
    ],
    state: [
        ...AnalogActorStates,
    ],
    configuration: [
        ...AnalogActorConfigs,
        {
            label: 'Readable',
            id: 'readable',
            type: {
                id: 'boolean',
            },
            defaultValue: '',
        },
        {
            label: 'Writable',
            id: 'writable',
            type: {
                id: 'boolean',
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
        /**
         * @deprecated
         */
        {
            label: 'Minimum Value',
            id: 'minValue',
            type: {
                id: 'decimal',
            },
            defaultValue: 0,
        },
        /**
         * @deprecated
         */
        {
            label: 'Maximum Value',
            id: 'maxValue',
            type: {
                id: 'decimal',
            },
            defaultValue: 100,
        },
    ],
};
