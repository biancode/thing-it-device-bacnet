import { ISlaveMetadata } from '../../../core/interfaces/metadata.interface';

import { actorState, actorConfigs } from '../actor.metadata';

export const AnalogInputActorMetadata: ISlaveMetadata = {
    plugin: 'analog-input.actor',
    label: 'BacNet Analog Input',
    role: 'actor',
    family: 'analogInput',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        {
            id: 'update',
            label: 'Update',
        },
        {
            id: 'changeValue',
            label: 'changeValue',
        },
    ],
    state: [
        {
            id: 'presentValue',
            label: 'Present Value',
            type: {
                id: 'decimal',
            },
        },
        {
            id: 'alarmValue',
            label: 'Alarm Value',
            type: {
                id: 'boolean',
            },
        },
        {
            id: 'outOfService',
            label: 'Out of Service',
            type: {
                id: 'boolean',
            },
        },
        {
            id: 'min',
            label: 'Min',
            type: {
                id: 'float',
            },
        },
        {
            id: 'max',
            label: 'Max',
            type: {
                id: 'float',
            },
        },
        {
            label: 'Object Name',
            id: 'objectName',
            type: {
                id: 'string',
            },
            defaultValue: 'AnalogInput',
        },
        {
            label: 'Description',
            id: 'description',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'Unit',
            id: 'unit',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        ...actorState,
    ],
    configuration: [
        {
            label: 'Object Identifier',
            id: 'objectId',
            type: {
                id: 'string',
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
        /**
         * @deprecated
         */
        {
            label: 'Object Name',
            id: 'objectName',
            type: {
                id: 'string',
            },
            defaultValue: 'AnalogInput',
        },
        /**
         * @deprecated
         */
        {
            label: 'Description',
            id: 'description',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        /**
         * @deprecated
         */
        {
            label: 'Unit',
            id: 'unit',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        ...actorConfigs,
    ],
};
