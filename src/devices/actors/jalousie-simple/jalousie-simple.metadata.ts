import { ISlaveMetadata } from '../../../core/interfaces/metadata.interface';

import { ActorStates, ActorConfigs } from '../actor.metadata';

export const JalousieSimpleActorMetadata: ISlaveMetadata = {
    plugin: 'jalousie-simple.actor',
    label: 'BACnet Jalousie Simple Control',
    role: 'actor',
    family: 'jalousieSimple',
    deviceTypes: [ 'bacnet/bacnet-device.controller' ],
    events: [
    ],
    services: [
        {
            id: 'raisePosition',
            label: 'Raise Position',
        },
        {
            id: 'lowerPosition',
            label: 'Lower Position',
        },
        {
            id: 'positionUp',
            label: 'Position Up',
        },
        {
            id: 'positionDown',
            label: 'Position Down',
        },
        {
            id: 'openBlade',
            label: 'Open Blade',
        },
        {
            id: 'closeBlade',
            label: 'Close Blade',
        },
        {
            id: 'stopMotion',
            label: 'Stop Motion',
        },
        {
            id: 'update',
            label: 'Update',
        },
    ],
    state: [
        {
            id: 'motionDirection',
            label: 'Motion Direction',
            type: {
                id: 'int',
            },
        },
        {
            id: 'stopValue',
            label: 'Stop Value',
            type: {
                id: 'boolean',
            },
        },
        ...ActorStates,
    ],
    configuration: [
        {
            label: 'Motion Direction Object Id',
            id: 'motionDirectionObjectId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Motion Direction Object Type',
            id: 'motionDirectionObjectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'Stop Value Object Id',
            id: 'stopValueObjectId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Stop Value Object Type',
            id: 'stopValueObjectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'Step Duration (s)',
            id: 'stepDuration',
            type: {
                id: 'integer',
            },
            defaultValue: '5',
        },
        ...ActorConfigs,
    ],
};
