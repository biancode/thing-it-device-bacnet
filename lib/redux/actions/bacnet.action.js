"use strict";

var store = require("../index").store;
var BACnetEvent = require("../events/bacnet.event");

function BACnetAction() {
}
/**
 *  Sets the instance of the BACnet Flow Manager to `redux` store.
 *
 * @static
 * @param  {BACnetFlowManager} manager - instance of the BACnet Flow Manager
 * @return {IAction}
 */
BACnetAction.setBACnetFlowManager = function (manager) {
    return store.dispatch({
        type: BACnetEvent.setBACnetFlowManager,
        payload: { manager: manager },
    });
};
/**
 *  Sets the instance of the BACnet Service Manager to `redux` store.
 *
 * @static
 * @param  {BACnetServiceManager} manager - instance of the BACnet Service Manager
 * @return {IAction}
 */
BACnetAction.setBACnetServiceManager = function (manager) {
    return store.dispatch({
        type: BACnetEvent.setBACnetServiceManager,
        payload: { manager: manager },
    });
};
/**
 *  Sets the instance of the BACnet Server to `redux` store.
 *
 * @static
 * @param  {ServerSocket} server - instance of the BACnet Server
 * @return {IAction}
 */
BACnetAction.setBACnetServer = function (server) {
    return store.dispatch({
        type: BACnetEvent.setBACnetServer,
        payload: { server: server },
    });
};
/**
 *  Sets the instance of the BACnet Server to `redux` store.
 *
 * @static
 * @return {IAction}
 */
BACnetAction.tickCOVTimer = function (covTimer) {
    return store.dispatch({
        type: BACnetEvent.tickCOVTimer,
        payload: { covTimer: covTimer },
    });
};

module.exports = BACnetAction;
