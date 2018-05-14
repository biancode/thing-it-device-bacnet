export = {
    label: 'Disruptive-Technologies',
    id: 'dtplugin',
    autoDiscoveryDeviceTypes: [],
    devices: [
        {
            plugin: 'bacnet/bacnet-device.controller',
            class: 'Controller',
            id: 'bd-controller',
            label: 'BD Controller',
            sensors: [],
            services: [],
            configuration: {
                simulated: false,
            },
            actors: [
                {
                    id: 'asdfg123',
                    label: 'Binary Input Actor 1',
                    type: 'binary-input.actor',
                    logLevel: 'debug',
                    configuration: {
                        objectId: 0,
                    },
                },
            ],
        },
    ],
    services: [],
    eventProcessors: [],
    groups: [],
    jobs: [],
    data: [],
};
