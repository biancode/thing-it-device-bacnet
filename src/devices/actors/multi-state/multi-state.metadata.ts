import { ISlaveMetadata } from '../../../core/interfaces/metadata.interface';

import { ActorStates, ActorConfigs } from '../actor.metadata';

export const MultiStateActorServices = [
    {
        id: 'update',
        label: 'Update',
    },
];

export const MultiStateActorStates = [
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
    {
        label: 'Object Name',
        id: 'objectName',
        type: {
            id: 'string',
        },
    },
    {
        label: 'Description',
        id: 'description',
        type: {
            id: 'string',
        },
    },
    ...ActorStates,
];

export const MultiStateActorConfigs = [
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
    ...ActorConfigs,
];
