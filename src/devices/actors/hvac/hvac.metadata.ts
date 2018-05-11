import { ISlaveMetadata } from '../../../core/interfaces/metadata.interface';

import { ActorStates, ActorConfigs } from '../actor.metadata';

export const HVACActorServices = [
    {
        id: 'incrementSetpoint',
        label: 'Increment Setpoint',
    },
    {
        id: 'decrementSetpoint',
        label: 'Decrement Setpoint',
    },
];

export const HVACActorStates = [
    {
        id: 'setpoint',
        label: 'Setpoint',
        type: {
            id: 'decimal',
        },
    },
    {
        id: 'temperature',
        label: 'Temperature',
        type: {
            id: 'decimal',
        },
    },
    ...ActorStates,
];

export const HVACActorConfigs = [
    {
        label: 'Setpoint Feedback Object Id',
        id: 'setpointFeedbackObjectId',
        type: {
            id: 'integer',
        },
        defaultValue: '',
    },
    {
        label: 'Setpoint Feedback Object Type',
        id: 'setpointFeedbackObjectType',
        type: {
            id: 'string',
        },
        defaultValue: '',
    },
    {
        label: 'Temperature Object Id',
        id: 'temperatureObjectId',
        type: {
            id: 'integer',
        },
        defaultValue: '',
    },
    {
        label: 'Temperature Object Type',
        id: 'temperatureObjectType',
        type: {
            id: 'string',
        },
        defaultValue: '',
    },
    {
        label: 'Setpoint Modification Object Id',
        id: 'setpointModificationObjectId',
        type: {
            id: 'integer',
        },
        defaultValue: '',
    },
    {
        label: 'Setpoint Modification Object Type',
        id: 'setpointModificationObjectType',
        type: {
            id: 'string',
        },
        defaultValue: '',
    },
    ...ActorConfigs,
];
