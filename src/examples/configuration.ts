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
                // {
                //     id: 'asdfg123',
                //     label: 'Binary Input Actor 1',
                //     type: 'binary-input.actor',
                //     logLevel: 'debug',
                //     configuration: {
                //         objectId: 0,
                //     },
                // },
                // {
                //     id: 'asdfg123',
                //     label: 'Binary Value Actor 1',
                //     type: 'binary-value.actor',
                //     logLevel: 'debug',
                //     configuration: {
                //         objectId: 0,
                //     },
                // },
                // {
                //     id: 'asdfg123',
                //     label: 'Binary Light Actor 1',
                //     type: 'binary-light.actor',
                //     logLevel: 'debug',
                //     configuration: {
                //         lightActiveObjectId: 9,
                //         lightActiveObjectType: `BinaryValue`,
                //     },
                // },
                // {
                //     id: 'asdfg123',
                //     label: 'Analog Input Actor 1',
                //     type: 'analog-input.actor',
                //     logLevel: 'debug',
                //     configuration: {
                //         objectId: 0,
                //     },
                // },
                // {
                //     id: 'asdfg123',
                //     label: 'Analog Value Actor 1',
                //     type: 'analog-value.actor',
                //     logLevel: 'debug',
                //     configuration: {
                //         objectId: 0,
                //     },
                // },
                // {
                //     id: 'asdfg123',
                //     label: 'Multi State Value Actor 1',
                //     type: 'multi-state-value.actor',
                //     logLevel: 'debug',
                //     configuration: {
                //         objectId: 0,
                //     },
                // },
                // {
                //     id: 'asdfg123',
                //     label: 'Multi State Input Actor 1',
                //     type: 'multi-state-input.actor',
                //     logLevel: 'debug',
                //     configuration: {
                //         objectId: 0,
                //     },
                // },
                // {
                //     id: 'asdfg123',
                //     label: 'Light Actor 1',
                //     type: 'light.actor',
                //     logLevel: 'debug',
                //     configuration: {
                //         'levelFeedbackObjectId': 43,
                //         'levelFeedbackObjectType': 'AnalogValue',
                //         'levelModificationObjectId': 38,
                //         'levelModificationObjectType': 'AnalogValue',
                //         'lightActiveFeedbackObjectId': 15,
                //         'lightActiveFeedbackObjectType': 'MultiStateValue',
                //         'lightActiveModificationObjectId': 14,
                //         'lightActiveModificationObjectType': 'MultiStateValue',
                //         'lightActiveModificationValueOn': 2,
                //         'lightActiveModificationValueOff': 1,
                //     },
                // },
            ],
        },
    ],
    services: [],
    eventProcessors: [],
    groups: [],
    jobs: [],
    data: [],
};
