import { ISlaveMetadata } from '../../../core/interfaces/metadata.interface';

import { ActorStates, ActorConfigs } from '../actor.metadata';

export const JalousieActorMetadata: ISlaveMetadata = {
    plugin: 'jalousie.actor',
    label: 'BACnet Jalousie Control',
    role: 'actor',
    family: 'jalousie',
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
            id: 'incrementRotation',
            label: 'Increment Rotation',
        },
        {
            id: 'decrementRotation',
            label: 'Decrement Rotation',
        },
        {
            id: 'stopMotion',
            label: 'Stop Motion',
        },
    ],
    state: [
        {
            id: 'position',
            label: 'position',
            type: {
                id: 'decimal',
            },
        },
        {
            id: 'rotation',
            label: 'rotation',
            type: {
                id: 'decimal',
            },
        },
        ...ActorStates,
    ],
    configuration: [
        {
            label: 'Position Feedback Object Id',
            id: 'positionFeedbackObjectId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Position Feedback Object Type',
            id: 'positionFeedbackObjectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'Position Modification Object Id',
            id: 'positionModificationObjectId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Position Modification Object Type',
            id: 'positionModificationObjectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'Position Step Size',
            id: 'positionStepSize',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Rotation Feedback Object Id',
            id: 'rotationFeedbackObjectId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Rotation Feedback Object Type',
            id: 'rotationFeedbackObjectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'Rotation Modification Object Id',
            id: 'rotationModificationObjectId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Rotation Modification Object Type',
            id: 'rotationModificationObjectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'Rotation Up Value',
            id: 'rotationUpValue',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Rotation Down Value',
            id: 'rotationDownValue',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Rotation Step Size',
            id: 'rotationStepSize',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Action Object Id',
            id: 'actionObjectId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Action Object Type',
            id: 'actionObjectType',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'Action Go Value',
            id: 'actionGoValue',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Action Stop Value',
            id: 'actionStopValue',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        ...ActorConfigs,
    ],
};
