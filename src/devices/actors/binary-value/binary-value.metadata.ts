import { ISlaveMetadata } from '../../../core/interfaces/metadata.interface';

import { ActorStates, ActorConfigs } from '../actor.metadata';

export const BinaryValueActorMetadata: ISlaveMetadata = {
    plugin: 'binary-value.actor',
    label: 'BacNet Binary Value',
    role: 'actor',
    family: 'binaryValue',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        {
            id: 'on',
            label: 'On',
        },
        {
            id: 'off',
            label: 'Off',
        },
        {
            id: 'toggle',
            label: 'Toggle',
        },
        {
            id: 'update',
            label: 'Update',
        }
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
        ...ActorStates,
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
        ...ActorConfigs,
    ],
};
