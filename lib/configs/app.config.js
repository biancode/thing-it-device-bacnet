"use strict";
var Utils = require("../utils");
module.exports = {
    response: {
        iAm: {
            timeout: 30000,
        },
        readProperty: {
            timeout: 30000,
        },
    },
    manager: {
        flow: {},
        service: {
            covTimer: {
                lifetime: Utils.AppUtil.timeToMs(5, 'minute'),
                period: Utils.AppUtil.timeToMs(2.3, 'minute'),
            },
            dest: {
                address: '',
                port: 47808,
            },
        },
    },
    server: {
        port: 47808,
        sequence: {
            thread: 1,
            delay: 20,
        },
    },
};
