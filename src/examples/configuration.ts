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
            ],
        },
    ],
    services: [],
    eventProcessors: [],
    groups: [],
    jobs: [],
    data: [],
};
