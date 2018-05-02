import { IMasterMetadata } from '../../../core/interfaces/metadata.interface';

import { controllerState, controllerConfig } from '../controller.metadata';

export const BACnetDeviceControllerMetadata: IMasterMetadata = {
    plugin: 'bacnet-device.controller',
    label: 'BACnet Device',
    family: 'bacnet',
    manufacturer: '',
    discoverable: true,
    tangible: true,
    additionalSoftware: [],
    actorTypes: [],
    sensorTypes: [],
    events: [
    ],
    services: [
        {
            id: 'update',
            label: 'Update',
        }
    ],
    state: [
        {
            id: 'name',
            label: 'Name',
            type: {
                id: 'string',
            },
            defaultValue: '',
        }, {
            id: 'description',
            label: 'Description',
            type: {
                id: 'string',
            },
            defaultValue: '',
        }, {
            id: 'vendor',
            label: 'Vendor',
            type: {
                id: 'string',
            },
            defaultValue: '',
        }, {
            id: 'model',
            label: 'Model',
            type: {
                id: 'string',
            },
            defaultValue: '',
        }, {
            id: 'softwareVersion',
            label: 'Software Version',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        ...controllerState,
    ],
    configuration: [
        {
            label: 'IP Address',
            id: 'ipAddress',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'IP Match Required',
            id: 'ipMatchRequired',
            type: {
                id: 'boolean',
            },
            defaultValue: '',
        },
        {
            label: 'URL',
            id: 'url',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'URL Lookup Required',
            id: 'urlLookupRequired',
            type: {
                id: 'boolean',
            },
            defaultValue: '',
        },
        {
            label: 'Port',
            id: 'port',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Device-ID',
            id: 'deviceId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Device-ID Match Required',
            id: 'deviceIdMatchRequired',
            type: {
                id: 'boolean',
            },
            defaultValue: '',
        },
        {
            label: 'Vendor-ID',
            id: 'vendorId',
            type: {
                id: 'integer',
            },
            defaultValue: '',
        },
        {
            label: 'Vendor-ID Match Required',
            id: 'vendorIdMatchRequired',
            type: {
                id: 'boolean',
            },
            defaultValue: '',
        },
        {
            label: 'Unicast WhoIs IP',
            id: 'unicastWhoIsIP',
            type: {
                id: 'string',
            },
            defaultValue: '',
        },
        {
            label: 'Priority',
            id: 'priority',
            type: {
                id: 'integer',
            },
            defaultValue: 16,
        },
        ...controllerConfig,
    ],
};
