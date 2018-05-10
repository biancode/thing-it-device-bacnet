import { ISlaveMetadata } from '../../../core/interfaces/metadata.interface';

import { ActorStates, ActorConfigs } from '../actor.metadata';

export const LightActorMetadata: ISlaveMetadata = {
    plugin: 'light.actor',
    label: 'Light actor',
    role: 'actor',
    family: 'light',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        {
            id: 'toggleLight',
            label: 'Toggle Light',
        },
        {
            id: 'changeDimmer',
            label: 'Change Dimmer',
        },
        {
            id: 'update',
            label: 'Update',
        },
    ],
    state: [
        {
            id: 'lightActive',
            label: 'Light Active',
            type: {
                id: 'boolean',
            },
        },
        {
            id: 'dimmerLevel',
            label: 'Dimmer Level',
            type: {
                id: 'decimal',
            },
        },
        {
            id: 'lightState',
            label: 'Light State',
            type: {
                id: 'string',
            },
        },
        ...ActorStates,
    ],
    configuration: [
        {
            label: 'Level Feedback Object Id',
            id: 'levelFeedbackObjectId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Level Feedback Object Type',
            id: 'levelFeedbackObjectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'Level Modification Object Id',
            id: 'levelModificationObjectId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Level Modification Object Type',
            id: 'levelModificationObjectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'Light Active Feedback Object Id',
            id: 'lightActiveFeedbackObjectId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Light Active Feedback Object Type',
            id: 'lightActiveFeedbackObjectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'Light Active Modification Object Id',
            id: 'lightActiveModificationObjectId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Light Active Modification Object Type',
            id: 'lightActiveModificationObjectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'Light Active Modification Value On',
            id: 'lightActiveModificationValueOn',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Light Active Modification Value Off',
            id: 'lightActiveModificationValueOff',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        ...ActorConfigs,
    ],
};
