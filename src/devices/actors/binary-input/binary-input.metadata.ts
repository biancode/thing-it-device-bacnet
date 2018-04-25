import { ISlaveMetadata } from '../../../core/interfaces/metadata.interface';

import { actorState, actorConfigs } from '../actor.metadata';

export const BinaryInputActorMetadata: ISlaveMetadata = {
    plugin: 'binary-input.actor',
    label: 'BacNet Binary Input',
    role: 'actor',
    family: 'binaryInput',
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
                id: 'boolean',
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
