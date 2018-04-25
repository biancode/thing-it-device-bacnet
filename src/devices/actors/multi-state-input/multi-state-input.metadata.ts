import { ISlaveMetadata } from '../../../core/interfaces/metadata.interface';

import { actorState, actorConfigs } from '../actor.metadata';

export const MultiStateInputActorMetadata: ISlaveMetadata = {
    plugin: 'multi-state-input.actor',
    label: 'BacNet Multi State Input',
    role: 'actor',
    family: 'multiStateInput',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        {
            id: 'update',
            label: 'Update',
        },
    ],
    state: [
        {
            id: 'presentValue',
            label: 'Present Value',
            type: {
                id: 'integer',
            },
        },
        {
            id: 'presentValueText',
            label: 'Present Value Text',
            type: {
                id: 'string',
            },
        },
        {
            id: 'stateText',
            label: 'State Text',
            type: {
                id: 'Object',
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
        {
            label: 'Object Name',
            id: 'objectName',
            type: {
                id: 'string',
            },
            defaultValue: '',
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
            label: 'States',
            id: 'states',
            type: {
                id: 'enumeration',
            },
            defaultValue: { zero: 0, one: 1 },
        },
        ...actorConfigs,
    ],
};
