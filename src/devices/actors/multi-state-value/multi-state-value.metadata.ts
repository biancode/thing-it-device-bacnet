import { ISlaveMetadata } from '../../../core/interfaces/metadata.interface';

import { actorState, actorConfigs } from '../actor.metadata';

export const MultiStateValueActorMetadata: ISlaveMetadata = {
    plugin: 'multi-state-value.actor',
    label: 'BacNet Multi State Value',
    role: 'actor',
    family: 'multiStateValue',
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
        ...actorConfigs,
    ],
};
