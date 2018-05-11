import { ISlaveMetadata } from '../../../../core/interfaces/metadata.interface';

import {
    HVACActorServices,
    HVACActorStates,
    HVACActorConfigs,
} from '../hvac.metadata';

export const ThermostatActorMetadata: ISlaveMetadata = {
    plugin: 'thermostat.actor',
    label: 'BACnet Thermostat',
    role: 'actor',
    family: 'thermostat',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        ...HVACActorServices,
    ],
    state: [
        ...HVACActorStates,
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
    ],
    configuration: [
        ...HVACActorConfigs,
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
    ],
};
