import { ISlaveMetadata } from '../../../core/interfaces/metadata.interface';

import { actorState, actorConfigs } from '../actor.metadata';

export const AnalogValueActorMetadata: ISlaveMetadata = {
    plugin: 'analog-value.actor',
    label: 'BacNet Analog Value',
    role: 'actor',
    family: 'analogValue',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        {
            id: 'update',
            label: 'Update',
        },
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
            defaultValue: '',
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
        ...actorConfigs,
    ],
};
