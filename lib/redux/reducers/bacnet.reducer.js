"use strict";
var _ = require("lodash");
var BACnetEvent = require("../events/bacnet.event");
var InitialState = {};
exports.InitialState = InitialState;

exports.Reducer = function (state, action) {
    if (_.isNil(state)) { state = InitialState; }
    switch (action.type) {
        case BACnetEvent.setBACnetFlowManager: {
            var flowManager = action.payload.manager;
            var deviceId = action.payload.deviceId;
            return _.merge({}, state, { [deviceId]: {flowManager: flowManager} });
        }
        case BACnetEvent.setBACnetServiceManager: {
            var serviceManager = action.payload.manager;
            var deviceId = action.payload.deviceId;
            return _.merge({}, state, { [deviceId]: { serviceManager: serviceManager } });
        }
        case BACnetEvent.setBACnetServer: {
            var bacnetServer = action.payload.server;
            var deviceId = action.payload.deviceId;
            return _.merge({}, state, { [deviceId]: { bacnetServer: bacnetServer } });
        }
        case BACnetEvent.tickCOVTimer: {
            var covTimer = action.payload.covTimer;
            var deviceId = action.payload.deviceId;
            return _.merge({}, state, { [deviceId]: { covTimer: covTimer } });
        }
    }
    return state;
};
