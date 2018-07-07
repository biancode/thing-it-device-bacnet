"use strict";
var _ = require("lodash");
var BACnetEvent = require("../events/bacnet.event");
var InitialState = {
    flowManager: null,
    serviceManager: null,
    bacnetServer: null,
    covTimer: null,
};
exports.InitialState = InitialState;

exports.Reducer = function (state, action) {
    if (_.isNil(state)) { state = InitialState; }
    switch (action.type) {
        case BACnetEvent.setBACnetFlowManager: {
            var flowManager = action.payload.manager;
            return _.assign({}, state, { flowManager: flowManager });
        }
        case BACnetEvent.setBACnetServiceManager: {
            var serviceManager = action.payload.manager;
            return _.assign({}, state, { serviceManager: serviceManager });
        }
        case BACnetEvent.setBACnetServer: {
            var bacnetServer = action.payload.server;
            return _.assign({}, state, { bacnetServer: bacnetServer });
        }
        case BACnetEvent.tickCOVTimer: {
            var covTimer = action.payload.covTimer;
            return _.assign({}, state, { covTimer: covTimer });
        }
    }
    return state;
};
