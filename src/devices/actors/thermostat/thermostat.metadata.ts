import { ISlaveMetadata } from '../../../core/interfaces/metadata.interface';

import { actorState, actorConfigs } from '../actor.metadata';

export const ThermostatActorMetadata: ISlaveMetadata = {
    plugin: 'thermostat.actor',
    label: 'BACnet Thermostat',
    role: 'actor',
    family: 'thermostat',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        {
            id: 'incrementSetpoint',
            label: 'Increment Setpoint',
        },
        {
            id: 'decrementSetpoint',
            label: 'Decrement Setpoint',
        },
    ],
    state: [
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
        {
            id: 'mode',
            label: 'Mode',
            type: {
                id: 'string',
            },
        },
        {
            id: 'heatActive',
            label: 'Heat Active',
            type: {
                id: 'boolean',
            },
        },
        {
            id: 'coolActive',
            label: 'Cool Active',
            type: {
                id: 'boolean',
            },
        },
        ...actorState,
    ],
    configuration: [
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
            label: 'Mode Object Id',
            id: 'modeObjectId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Mode Object Type',
            id: 'modeObjectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        ...actorConfigs,
    ],
};
